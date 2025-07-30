import { test, expect } from "@playwright/test";

test.describe("Simple Tests", () => {
  test("should load the application", async ({ page }) => {
    await page.goto("/");

    // 페이지가 로드되었는지 확인
    await expect(page).toHaveTitle(/JMT/);

    // 대시보드가 표시되는지 확인
    await expect(page.locator("h1, h2")).toContainText(/대시보드|투자/);
  });

  test("should show navigation menu", async ({ page }) => {
    await page.goto("/");

    // 사이드바 메뉴 항목들 확인
    await expect(page.locator("text=대시보드")).toBeVisible();
    await expect(page.locator("text=주식 추이")).toBeVisible();
    await expect(page.locator("text=사용자 메뉴얼")).toBeVisible();
  });

  test("should navigate to flowchart page", async ({ page }) => {
    await page.goto("/");

    // 주식 추이 확인 클릭
    await page.locator("text=주식 추이").click();

    // URL 확인
    await expect(page).toHaveURL(/flowchart/);
  });

  test("should navigate to manual page", async ({ page }) => {
    await page.goto("/");

    // 사용자 메뉴얼 클릭
    await page.locator("text=사용자 메뉴얼").click();

    // URL 확인
    await expect(page).toHaveURL(/manual/);
  });
});
