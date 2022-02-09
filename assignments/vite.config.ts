import { resolve } from 'path';

const { defineConfig } = require('vite')

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        nested: resolve(__dirname, 'assignment1/index.html'),
      },
    },
  },
});
