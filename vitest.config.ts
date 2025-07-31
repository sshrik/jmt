import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 테스트 환경 설정
    environment: "node",

    // vitest로 실행할 테스트 파일들만 포함
    include: ["tests/**/*.test.ts", "src/**/*.test.ts", "src/**/*.spec.ts"],

    // E2E 테스트 제외
    exclude: [
      "node_modules/**",
      "dist/**",
      "e2e/**", // Playwright E2E 테스트 제외
      "**/*.d.ts",
    ],

    // 글로벌 설정
    globals: true,

    // 리포터 설정
    reporters: ["verbose"],
  },
});
