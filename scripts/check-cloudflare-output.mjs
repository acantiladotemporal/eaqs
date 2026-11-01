import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const redirect = JSON.parse(readFileSync(resolve(root, '.wrangler/deploy/config.json'), 'utf8'));
const configPath = resolve(root, '.wrangler/deploy', redirect.configPath);
const config = JSON.parse(readFileSync(configPath, 'utf8'));
assert.equal(config.name, 'eaqs');
assert.ok(config.compatibility_flags.includes('nodejs_compat'));
assert.ok(existsSync(resolve(dirname(configPath), config.main)), 'Missing Worker entry');
for (const name of ['LEGAL_READY', 'SEO_INDEXING_ENABLED', 'NEWSLETTER_MARKETING_ENABLED']) assert.equal(config.vars[name], 'false', `${name} must remain closed`);
for (const name of ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY']) assert.equal(config.vars[name], '', `Backend not ready: ${name}`);
for (const binding of ['kv_namespaces', 'r2_buckets', 'd1_databases', 'services']) assert.equal(config[binding]?.length || 0, 0, `Unexpected resource provisioning: ${binding}`);
const assets = resolve(dirname(configPath), config.assets.directory);
for (const path of ['images/brand-logo.png', 'fonts/fonts.css', 'fonts/dm-sans-latin.woff2', 'fonts/dm-serif-latin.woff2', 'og-image.png', 'favicon.svg']) assert.ok(existsSync(resolve(assets, path)), `Missing asset: ${path}`);
function inspect(folder) {
  for (const item of readdirSync(folder, { withFileTypes: true })) {
    assert.ok(!/^(?:\.env(?:\.|$)|\.dev\.vars|pb_data$|pb_migrations$|pocketbase|work$|img$)/i.test(item.name), `Local data in deployment: ${item.name}`);
    if (item.isDirectory()) inspect(resolve(folder, item.name));
  }
}
inspect(resolve(root, 'dist'));
console.log('Cloudflare artifact checked: entry, assets, Node compatibility, closed backend and no extra storage provisioning.');
