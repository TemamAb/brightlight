import { Router } from "express";
import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const router = Router();

router.get("/autodetect", (req, res) => {
  try {
    const parsed: Record<string, string> = {};
    
    // Strategy: Check multiple paths for config persistence (.env or .env-data.md)
    // We check both the CWD and the likely root directory in this monorepo
    const possiblePaths = [
      join(process.cwd(), '.env-data.md'),
      join(process.cwd(), '../../.env-data.md'),
      join(process.cwd(), '.env'),
      join(process.cwd(), '../../.env')
    ];

    let content = '';
    for (const p of possiblePaths) {
      try {
        content = readFileSync(p, 'utf8');
        break;
      } catch (e) { continue; }
    }

    try {
      if (content) {
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          const separator = trimmed.includes('=') ? '=' : (trimmed.includes(':') ? ':' : null);
          if (separator) {
            const [key, ...valueParts] = trimmed.split(separator);
            const keyClean = key.trim().toUpperCase();
            const value = valueParts.join(separator).trim().replace(/^["']|["']$/g, '');
            if (keyClean && value) parsed[keyClean] = value;
          }
        }
      }
    } catch (e) { /* fallback to process.env */ }

    const mask = (val?: string) => val ? `****${val.slice(-4)}` : '';

    // Mask sensitive values for frontend
    const response = {
      pimlicoApiKey: mask(parsed.PIMLICO_API_KEY || process.env.PIMLICO_API_KEY),
      openaiApiKey: mask(parsed.OPENAI_API_KEY || process.env.OPENAI_API_KEY),
      rpcEndpoint: parsed.RPC_ENDPOINT || process.env.RPC_ENDPOINT || '',
      chainId: parsed.CHAIN_ID || process.env.CHAIN_ID || '8453',
      privateKey: (parsed.PRIVATE_KEY || process.env.PRIVATE_KEY) ? '****[HIDDEN]' : '',
      walletAddress: parsed.WALLET_ADDRESS || process.env.WALLET_ADDRESS || '',
      status: 'detected',
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    res.status(404).json({ status: 'not-found', error: ' .env-data.md not found or unreadable' });
  }
});

export default router;
