// Prepare a reversible, local-only history without the retired PocketBase runtime.
// Does not move the current checkout or write to GitHub. Run after committing reviewed files.
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const work = resolve(root, 'work');
const git = (args, cwd = root) => execFileSync('git', ['-c', `safe.directory=${cwd.replaceAll('\\', '/').replace(/\/$/, '')}`, ...args], { cwd, encoding: 'utf8' }).trim();
if (git(['status', '--porcelain'])) throw new Error('Commit the reviewed release before preparing history.');
const sourceHead = git(['rev-parse', 'HEAD']);
const sourceTree = git(['rev-parse', 'HEAD^{tree}']);
const sourceBranch = git(['branch', '--show-current']);
if (!sourceBranch) throw new Error('A named source branch is required.');
const stamp = Date.now();
const destination = resolve(work, `history-clean-${stamp}.git`);
const backup = resolve(work, `history-before-clean-${stamp}.bundle`);
for (const path of [destination, backup]) if (!path.startsWith(work + sep) || existsSync(path)) throw new Error('Unsafe or existing preparation path.');
mkdirSync(work, { recursive: true });
git(['bundle', 'create', backup, '--all']);
git(['init', '--bare', destination]);

const excluded = ['pb_data', 'pb_migrations', 'pocketbase.exe', 'dev-server.log', '.env', '.env.local', '.env.production', '.env.production.local', '.env.development', '.env.development.local'];
const exporter = spawn('git', ['-c', `safe.directory=${root.replaceAll('\\', '/').replace(/\/$/, '')}`, 'fast-export', '--all', '--signed-tags=strip', '--', '.', ...excluded.map(path => `:(exclude)${path}`)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
const importer = spawn('git', ['-C', destination, 'fast-import', '--quiet'], { cwd: root, stdio: ['pipe', 'ignore', 'pipe'] });
let exportError = '', importError = '';
exporter.stderr.on('data', data => { exportError += data; });
importer.stderr.on('data', data => { importError += data; });
const completion = child => new Promise((resolveStatus, reject) => { child.once('error', reject); child.once('close', code => resolveStatus(code)); });
const exported = completion(exporter), imported = completion(importer);
await pipeline(exporter.stdout, importer.stdin);
const codes = await Promise.all([exported, imported]);
if (codes.some(code => code !== 0)) throw new Error(`History preparation failed (${codes.join(',')}); inspect local Git diagnostics. ${exportError.slice(0,200)} ${importError.slice(0,200)}`);
const cleanHead = git(['rev-parse', `refs/heads/${sourceBranch}`], destination);
if (git(['rev-parse', `${cleanHead}^{tree}`], destination) !== sourceTree) throw new Error('Release tree changed during filtering. Nothing has been published.');
git(['update-ref', 'refs/heads/main', cleanHead], destination);
const objects = git(['rev-list', '--objects', '--all'], destination).split('\n');
const forbidden = / (?:pb_data\/|pb_migrations\/|pocketbase\.exe$|dev-server\.log$|\.env(?:$|\.(?!example$)))/;
if (objects.some(line => forbidden.test(line))) throw new Error('Historical runtime files remain reachable; nothing has been published.');
const plan = { sourceHead, sourceBranch, sanitizedHead: cleanHead, sanitizedRepository: destination, backupPath: backup, commitsAfter: Number(git(['rev-list', '--count', '--all'], destination)), retiredRuntimeObjectsAfter: 0, targetBranch: 'main', preparedAt: new Date().toISOString() };
writeFileSync(resolve(work, 'history-plan.json'), JSON.stringify(plan, null, 2) + '\n');
console.log(JSON.stringify(plan));
