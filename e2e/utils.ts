import type { Page, Locator } from "@playwright/test";

/**
 * 안정적인 페이지 로딩을 위한 유틸리티 함수들
 */

// 페이지가 완전히 로드될 때까지 대기
export async function waitForPageLoad(
  page: Page,
  timeout = 30000
): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout });
  await page.waitForLoadState("domcontentloaded", { timeout });
}

// 요소가 나타날 때까지 대기 (재시도 포함)
export async function waitForElement(
  page: Page,
  selector: string,
  timeout = 10000
): Promise<void> {
  await page.waitForSelector(selector, {
    timeout,
    state: "visible",
  });
}

// 텍스트 요소가 나타날 때까지 대기
export async function waitForText(
  page: Page,
  text: string,
  timeout = 10000
): Promise<void> {
  await page.waitForFunction(
    (searchText) => document.body.textContent?.includes(searchText),
    text,
    { timeout }
  );
}

// 안정적인 클릭 (요소가 보일 때까지 대기 후 클릭)
export async function safeClick(
  page: Page,
  selector: string | Locator,
  timeout = 10000
): Promise<void> {
  if (typeof selector === "string") {
    await waitForElement(page, selector, timeout);
    await page.click(selector);
  } else {
    await selector.click({ timeout });
  }
}

// 안정적인 폼 입력
export async function safeFill(
  page: Page,
  selector: string,
  value: string,
  timeout = 10000
): Promise<void> {
  await waitForElement(page, selector, timeout);
  await page.fill(selector, value);
}

// 개발 서버 상태 확인
export async function checkServerHealth(page: Page): Promise<boolean> {
  try {
    const response = await page.goto("/", {
      waitUntil: "networkidle",
      timeout: 10000,
    });
    return response?.ok() ?? false;
  } catch (error) {
    console.error("Server health check failed:", error);
    return false;
  }
}

// 브라우저 정보 로깅 (디버깅용)
export async function logBrowserInfo(page: Page): Promise<void> {
  const userAgent = await page.evaluate(() => navigator.userAgent);
  const viewport = page.viewportSize();
  console.log(`Browser: ${userAgent}`);
  console.log(`Viewport: ${viewport?.width}x${viewport?.height}`);
}
