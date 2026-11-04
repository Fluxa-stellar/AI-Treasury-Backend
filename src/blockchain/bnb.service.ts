import { Injectable } from '@nestjs/common';
import { isAddress, getAddress, verifyMessage } from 'viem';

@Injectable()
export class BnbService {
  normalizeAddress(address: string): string {
    if (!address || !isAddress(address)) {
      throw new Error(`Invalid EVM address: ${address}`);
    }
    return getAddress(address).toLowerCase();
  }

  toChecksumAddress(address: string): `0x${string}` {
    if (!address || !isAddress(address)) {
      throw new Error(`Invalid EVM address: ${address}`);
    }
    return getAddress(address) as `0x${string}`;
  }

  isValidAddress(address: string): boolean {
    return isAddress(address);
  }

  async verifySignature(params: {
    address: `0x${string}`;
    message: string;
    signature: `0x${string}`;
  }): Promise<boolean> {
    return verifyMessage(params);
  }
}

