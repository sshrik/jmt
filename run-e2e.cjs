#!/usr/bin/env node

// Playwright E2E 테스트를 실행하는 헬퍼 스크립트

const { spawn } = require("child_process");
const path = require("path");

// 현재 개발 서버 포트 확인
const ports = [5173, 5174, 5175, 5176, 5177];

async function findRunningPort() {
  const fetch = (await import("node-fetch")).default;

  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}`, {
        timeout: 1000,
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) {
        console.log(`✅ Found dev server running on port ${port}`);
        return port;
      }
    } catch (error) {
      // Port not available, continue
    }
  }
  return null;
}

async function runTests() {
  const port = await findRunningPort();

  if (!port) {
    console.error('❌ No dev server found! Please run "yarn dev" first.');
    console.log("💡 Try running in another terminal:");
    console.log("   yarn dev");
    process.exit(1);
  }

  // playwright.config.ts 업데이트
  const fs = require("fs");
  const configPath = "playwright.config.ts";
  let config = fs.readFileSync(configPath, "utf8");
  config = config.replace(
    /baseURL: ['"]http:\/\/127\.0\.0\.1:\d+['"],/,
    `baseURL: 'http://127.0.0.1:${port}',`
  );
  config = config.replace(
    /url: ['"]http:\/\/127\.0\.0\.1:\d+['"],/,
    `url: 'http://127.0.0.1:${port}',`
  );
  fs.writeFileSync(configPath, config);

  console.log(`🚀 Running Playwright tests against http://localhost:${port}`);

  // Playwright 실행
  const args = process.argv.slice(2);
  const playwrightCmd = spawn("npx", ["playwright", "test", ...args], {
    stdio: "inherit",
    shell: true,
  });

  playwrightCmd.on("close", (code) => {
    if (code === 0) {
      console.log("✅ All tests passed!");
    } else {
      console.log(`❌ Tests failed with code ${code}`);
    }
    process.exit(code);
  });
}

runTests().catch(console.error);
