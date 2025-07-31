#!/usr/bin/env node

// E2E 테스트 환경 체크 스크립트
const { spawn } = require("child_process");
const path = require("path");

console.log("🔍 E2E 테스트 환경 체크 중...\n");

// 1. Playwright 버전 확인
console.log("1. Playwright 버전:");
const playwrightVersion = spawn("npx", ["playwright", "--version"], {
  stdio: "inherit",
  cwd: process.cwd(),
});

playwrightVersion.on("close", (code) => {
  if (code === 0) {
    console.log("✅ Playwright 설치 확인\n");

    // 2. 간단한 테스트 실행
    console.log("2. 간단한 E2E 테스트 실행:");
    const testRun = spawn("yarn", ["test:e2e:fast"], {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    testRun.on("close", (testCode) => {
      if (testCode === 0) {
        console.log("\n✅ E2E 테스트 성공!");
        console.log("\n🎯 사용 가능한 명령어:");
        console.log("  yarn test:e2e:cli  - CLI 전용 출력");
        console.log("  yarn test:e2e:fast - 빠른 테스트 (Chrome만)");
        console.log("  yarn test:e2e       - 전체 테스트");
      } else {
        console.log("\n❌ E2E 테스트 실패");
      }
    });
  } else {
    console.log("❌ Playwright 설치 실패");
  }
});
