import { test, expect } from "@playwright/test";

test.describe("Navigation Tests", () => {
  test("should navigate to main dashboard", async ({ page }) => {
    await page.goto("/");

    // 대시보드 제목 확인
    await expect(page.locator("h1")).toContainText("대시보드");

    // 사이드바 메뉴 항목들 확인
    await expect(page.locator("text=대시보드")).toBeVisible();
    await expect(page.locator("text=주식 추이 확인")).toBeVisible();
    await expect(page.locator("text=사용자 메뉴얼")).toBeVisible();
  });

  test("should navigate to stock trends page", async ({ page }) => {
    await page.goto("/");

    // 주식 추이 확인 클릭
    await page.locator("text=주식 추이 확인").click();

    // URL 확인
    await expect(page).toHaveURL("/flowchart");

    // 페이지 제목 확인
    await expect(page.locator("h1")).toContainText("주식 추이 확인");
  });

  test("should navigate to user manual", async ({ page }) => {
    await page.goto("/");

    // 사용자 메뉴얼 클릭
    await page.locator("text=사용자 메뉴얼").click();

    // URL 확인
    await expect(page).toHaveURL("/manual");

    // 페이지 제목 확인
    await expect(page.locator("h1")).toContainText("사용자 메뉴얼");
  });

  test("should show create project button", async ({ page }) => {
    await page.goto("/");

    // 새 프로젝트 생성 버튼 확인
    await expect(page.locator("text=새 프로젝트 생성")).toBeVisible();
  });
});
