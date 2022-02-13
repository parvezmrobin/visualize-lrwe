import { resolve } from 'path';

const { defineConfig } = require('vite');

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        nested: resolve(__dirname, 'assignment1/index.html'),
      },
    },
    target: [
      // default: "chrome87", "edge88", "es2019", "firefox78", "safari13.1"
      'chrome89',
      'edge89',
      'esnext',
      'firefox89',
      'safari15',
    ],
  },
});
