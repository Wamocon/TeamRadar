import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary', 'json'],
      reportsDirectory: './coverage',
      include: [
        'src/stores/**/*.ts',
        'src/lib/**/*.ts',
        'src/types/**/*.ts',
      ],
      exclude: [
        'src/lib/supabase/client.ts',
        'src/lib/supabase/server.ts',
        'src/lib/actions/**',  // Server Actions – erfordern Integration-Tests mit echter DB
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
