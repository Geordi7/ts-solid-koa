import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [
    /* 
    Uncomment the following line to enable solid-devtools.
    For more info see https://github.com/thetarnav/solid-devtools/tree/main/packages/extension#readme
    */
    // devtools(),
    solidPlugin(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/s/': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    target: 'esnext',
  },
});
