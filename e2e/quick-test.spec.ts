import { test, expect } from "@playwright/test";

test.describe("Quick Test", () => {
  test("should load homepage", async ({ page }) => {
    await page.goto("/");

    // 페이지가 로드되었는지 확인
    await expect(page).toHaveTitle(/JMT/);

    // 대시보드 확인
    await expect(page.locator("h1, h2")).toContainText(/대시보드|투자/);
  });
});
