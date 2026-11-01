import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Build the Worker without downloading cloud credentials or changing the local .env.
const packageUrl = new URL('../node_modules/astro/package.json', import.meta.url);
const astroPackage = JSON.parse(readFileSync(packageUrl, 'utf8'));
const cli = fileURLToPath(new URL(astroPackage.bin.astro, packageUrl));
const result = spawnSync(process.execPath, [cli, 'build'], {
  cwd: fileURLToPath(new URL('..', import.meta.url)),
  env: { ...process.env, EAQS_BUILD_TARGET: 'cloudflare', ASTRO_TELEMETRY_DISABLED: '1' },
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
