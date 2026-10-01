import { defineConfig } from 'vitest/config';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');
const fixture = path.join(root, 'docs/testing/p1-contract-double.ts');
// Exact aliases replace only the absent P1 foundation in isolated contract tests.
export default defineConfig({
  root,
  resolve: { alias: [
    { find: /^@\/lib\/server\/(models|errors|http|handler)$/, replacement: fixture },
    { find: /^@\/lib\/server\/services\/(ledger|settings|notification|property)\.service$/, replacement: fixture },
    { find: /^\.\/(ledger|settings|notification|property)\.service$/, replacement: fixture },
    { find: '@', replacement: root },
  ] },
  test: { environment: 'node', globals: true, include: ['lib/server/services/__tests__/payout.test.ts', 'docs/testing/p2.integration.test.ts'], testTimeout: 30000, hookTimeout: 30000, fileParallelism: false },
});
