import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    include: ['./tests/**/*.spec.ts'],
    globals: true,
    watch: false,
    environment: 'node',
    setupFiles: ['./tests/vitest.setup.ts']
  },
  plugins: []
});
