import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '$lib': path.resolve(__dirname, 'src/lib'),
      '$objectCreation': path.resolve(__dirname, 'src/lib/examples/object-creation'),
      '$importExamples': path.resolve(__dirname, 'src/lib/examples/importing-3d-models'),
      'threeInstance': path.resolve(__dirname, 'src/threeInstance')
    }
  }
})
