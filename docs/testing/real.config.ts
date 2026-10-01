import { defineConfig } from 'vitest/config';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');
export default defineConfig({
  root,
  resolve: { alias: { '@': root } },
  test: {
    environment: 'node', globals: true, fileParallelism: false,
    include: ['docs/testing/p2.integration.test.ts'],
    setupFiles: ['docs/testing/environment.ts'],
    testTimeout: 60000, hookTimeout: 60000,
  },
});
