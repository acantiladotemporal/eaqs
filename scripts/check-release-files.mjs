import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const git = args => execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, ...args], { cwd: root, encoding: 'utf8' });
const files = [...new Set(git(['ls-files', '-co', '--exclude-standard', '-z']).split('\0').filter(Boolean))].filter(path => existsSync(resolve(root, path)) && statSync(resolve(root, path)).isFile());
const blockedPath = /(^|\/)(?:\.codex|img|work|pb_data|pb_migrations|\.vercel|\.wrangler)(\/|$)|(^|\/)pocketbase[^/]*$|\.(?:db(?:-.+)?|sqlite\w*|log|pem|key)$|(^|\/)\.dev\.vars/;
const secretPatterns = [/\b(?:sk_live_|sk_test_|sb_secret_)[A-Za-z0-9_-]{20,}\b/, /\bgh[pousr]_[A-Za-z0-9]{30,}\b/, /\bre_[A-Za-z0-9_]{24,}\b/, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/];
const findings = [];
for (const path of files) {
  if (blockedPath.test(path) || (/(^|\/)\.env/.test(path) && path !== '.env.example')) { findings.push(`${path}: excluded runtime or local file`); continue; }
  const bytes = readFileSync(resolve(root, path));
  if (bytes.includes(0)) continue;
  const text = bytes.toString('utf8');
  if (secretPatterns.some(pattern => pattern.test(text))) findings.push(`${path}: possible credential (value withheld)`);
  for (const match of text.matchAll(/\beyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+\b/g)) {
    try { if (JSON.parse(Buffer.from(match[1], 'base64url').toString()).role === 'service_role') findings.push(`${path}: privileged JWT (value withheld)`); } catch {}
  }
}
if (findings.length) { console.error(findings.join('\n')); process.exitCode = 1; }
else console.log(`${files.length} release files checked; no local data, historical databases or detected credentials. This scan is not proof that no secret exists.`);
