import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import vue from '@astrojs/vue';

export default defineConfig({
  // Asegúrate de que tailwind() esté aquí dentro
  integrations: [tailwind(), react(), vue()],
});