import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { verifyMessage, isAddress, getAddress } from 'viem';
import { PrismaService } from '../prisma/prisma.service.js';
import { BnbService } from '../blockchain/bnb.service.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private bnbService: BnbService,
  ) {}

  async generateNonce(rawAddress: string) {
    if (!isAddress(rawAddress)) {
      throw new BadRequestException('Invalid EVM address');
    }

    const address = this.bnbService.normalizeAddress(rawAddress);
    const nonce = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.authNonce.create({
      data: {
        address,
        nonce,
        expiresAt,
        used: false,
      },
    });

    const domain = this.configService.get<string>('frontendUrl', 'http://localhost:3000');
    const message = [
      'Welcome to AI Treasury Agent!',
      '',
      'Please sign this message to verify wallet ownership.',
      '',
      `Address: ${getAddress(address)}`,
      `Nonce: ${nonce}`,
      `Domain: ${domain}`,
      `Issued At: ${new Date().toISOString()}`,
      `Expires At: ${expiresAt.toISOString()}`,
    ].join('\n');

    return {
      address: getAddress(address),
      nonce,
      expiresAt: expiresAt.toISOString(),
      message,
    };
  }

  async verifySignature(rawAddress: string, signature: string, message: string) {
    if (!isAddress(rawAddress)) {
      throw new BadRequestException('Invalid EVM address');
    }

    const address = this.bnbService.normalizeAddress(rawAddress);

    // 1. Extract nonce from the message
    const nonceMatch = message.match(/Nonce:\s*([a-fA-F0-9]+)/);
    if (!nonceMatch) {
      throw new BadRequestException('Invalid message format: nonce missing');
    }
    const nonce = nonceMatch[1];

    // 2. Validate nonce in database
    const nonceRecord = await this.prisma.authNonce.findUnique({
      where: { nonce },
    });

    if (!nonceRecord) {
      throw new UnauthorizedException('Authentication nonce not found');
    }

    if (nonceRecord.used) {
      throw new UnauthorizedException('Nonce has already been used. Please request a new one.');
    }

    if (nonceRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Nonce has expired. Please request a new one.');
    }

    if (nonceRecord.address.toLowerCase() !== address.toLowerCase()) {
      throw new UnauthorizedException('Nonce was not issued for this address');
    }

    // 3. Verify signature cryptographically using viem
    let isValid = false;
    try {
      isValid = await verifyMessage({
        address: getAddress(address) as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });
    } catch (err) {
      this.logger.error(`Cryptographic verification error: ${err.message}`);
      throw new UnauthorizedException('Invalid cryptographic signature');
    }

    if (!isValid) {
      throw new UnauthorizedException('Signature verification failed');
    }

    // 4. Mark nonce as used
    await this.prisma.authNonce.update({
      where: { id: nonceRecord.id },
      data: { used: true },
    });

    // 5. Find or create user & wallet
    const chainId = this.configService.get<number>('bnbChainId', 97);

    let wallet = await this.prisma.wallet.findUnique({
      where: { address },
      include: { user: true },
    });

    let user;
    if (!wallet) {
      user = await this.prisma.user.create({
        data: {
          name: `User ${address.slice(0, 6)}...${address.slice(-4)}`,
          wallets: {
            create: {
              address,
              chainId,
              isPrimary: true,
              isActive: true,
            },
          },
        },
        include: {
          wallets: true,
        },
      });
      wallet = user.wallets[0];
    } else {
      user = wallet.user;
    }

    if (!wallet) {
      throw new UnauthorizedException('Failed to initialize wallet account');
    }

    // 6. Issue JWT
    const payload = {
      sub: user.id,
      address,
      walletId: wallet.id,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        wallet: {
          id: wallet.id,
          address: getAddress(wallet.address),
          chainId: wallet.chainId,
          isPrimary: wallet.isPrimary,
        },
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: true,
        treasuries: {
          select: {
            id: true,
            name: true,
            contractAddress: true,
            chainId: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
