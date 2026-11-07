// Compile AevumAgentVault.sol using soljson without mutating node_modules
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOLJSON_URL = 'https://binaries.soliditylang.org/bin/soljson-v0.8.20+commit.a1b79de6.js';
const CACHE_FILE = path.join(__dirname, 'soljson-v0.8.20.cjs');

async function downloadSoljson() {
  if (fs.existsSync(CACHE_FILE)) {
    return;
  }
  const oldJs = path.join(__dirname, 'soljson-v0.8.20.js');
  if (fs.existsSync(oldJs)) {
    fs.renameSync(oldJs, CACHE_FILE);
    return;
  }

  console.log('[Compiler] Downloading soljson-v0.8.20...');
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(CACHE_FILE);
    https.get(SOLJSON_URL, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(CACHE_FILE, () => {});
      reject(err);
    });
  });
}

async function main() {
  await downloadSoljson();

  console.log('[Compiler] Loading soljson...');
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  const soljson = require(CACHE_FILE);

  const compile = soljson.cwrap('solidity_compile', 'string', ['string', 'number']);

  const contractPath = path.resolve(__dirname, '../contracts/src/AevumAgentVault.sol');
  const contractSource = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'AevumAgentVault.sol': {
        content: contractSource,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object'],
        },
      },
    },
  };

  console.log('[Compiler] Compiling AevumAgentVault.sol...');
  const outputRaw = compile(JSON.stringify(input), 0);
  const output = JSON.parse(outputRaw);

  if (output.errors) {
    let hasError = false;
    for (const error of output.errors) {
      console.log(error.formattedMessage);
      if (error.severity === 'error') hasError = true;
    }
    if (hasError) {
      throw new Error('Solidity compilation failed.');
    }
  }

  const contractOutput = output.contracts['AevumAgentVault.sol']['AevumAgentVault'];
  const bytecode = '0x' + contractOutput.evm.bytecode.object;
  const abi = contractOutput.abi;

  const outDir = path.resolve(__dirname, '../src/blockchain/abis');
  const outJsonPath = path.join(outDir, 'AevumAgentVault.json');

  fs.writeFileSync(
    outJsonPath,
    JSON.stringify(
      {
        contractName: 'AevumAgentVault',
        abi,
        bytecode,
      },
      null,
      2
    )
  );

  console.log(`[Compiler] Success! Artifact written to ${outJsonPath}`);
  console.log(`[Compiler] Bytecode size: ${(bytecode.length - 2) / 2} bytes`);
}

main().catch((err) => {
  console.error('[Compiler Error]:', err);
  process.exit(1);
});
