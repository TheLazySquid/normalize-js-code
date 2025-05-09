// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from "path";

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],
  base: "normalize-js-code",
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: [
        {
          find: "normalize-js-code",
          replacement: resolve("..", "lib")
        }
      ]
    }
  }
});