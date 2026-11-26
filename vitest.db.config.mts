import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// 로컬 Supabase 가 필요한 테스트 (RLS, DB 함수). `supabase start` 뒤 `npm run test:db`
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    include: ["tests/db/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
