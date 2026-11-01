import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import cloudflare from '@astrojs/cloudflare';
const deploymentTarget = process.env.EAQS_BUILD_TARGET || 'node';
if (!['node', 'cloudflare'].includes(deploymentTarget)) throw new Error('EAQS_BUILD_TARGET debe ser node o cloudflare.');
export default defineConfig({
  site: 'https://www.elarbolquesuena.com',
  output: 'server',
  devToolbar: { enabled: false },
  adapter: deploymentTarget === 'cloudflare' ? cloudflare({ imageService: 'passthrough', prerenderEnvironment: 'node' }) : node({ mode: 'standalone', bodySizeLimit: 11_000_000 }),
  // Authentication uses Supabase cookies; Astro sessions and a separate KV store are unnecessary.
  session: false,
  security: {
    checkOrigin: true,
    allowedDomains: [
      { hostname: 'www.elarbolquesuena.com', protocol: 'https' },
      { hostname: 'elarbolquesuena.com', protocol: 'https' },
      { hostname: '127.0.0.1', protocol: 'http' },
      { hostname: 'localhost', protocol: 'http' },
    ],
  },
});
