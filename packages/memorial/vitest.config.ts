import { defineConfig } from 'vitest/config';

/**
 * Vitest config for the memorial SPA. jsdom environment for component tests,
 * with the repo-standard 60% coverage gate.
 *
 * @returns Vitest config
 */
export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
        'src/main.tsx',
        'vitest.config.ts',
        'vitest.setup.ts',
        'eslint.config.mjs',
      ],
      include: ['src/**/*.{ts,tsx}'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
});
