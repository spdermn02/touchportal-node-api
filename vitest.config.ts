import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    include: ['./src/**/*.spec.ts'],
    globals: true,
    watch: false,
    environment: 'node'
  },
  plugins: []
});
