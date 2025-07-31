import { test, expect } from "@playwright/test";
import { waitForPageLoad, checkServerHealth, safeClick } from "./utils";

test.describe("네비게이션", () => {
  test.beforeEach(async ({ page }) => {
    await checkServerHealth(page);
    await page.goto("/");
    await waitForPageLoad(page);
  });

  test("사이드바 메뉴 표시", async ({ page }) => {
    const sidebar = page.locator(".mantine-AppShell-navbar");

    // 메인 메뉴들 확인
    await expect(sidebar.locator("text=대시보드")).toBeVisible();
    await expect(sidebar.locator("text=프로젝트")).toBeVisible();

    // 분석 도구 메뉴들 확인
    await expect(sidebar.locator("text=주식 추이 확인")).toBeVisible();
    await expect(sidebar.locator("text=백테스트")).toBeVisible();

    // 도움말 메뉴 확인
    await expect(sidebar.locator("text=사용자 메뉴얼")).toBeVisible();

    // 설정 메뉴 확인
    await expect(sidebar.locator("text=환경설정")).toBeVisible();
  });

  test("대시보드 네비게이션", async ({ page }) => {
    const sidebar = page.locator(".mantine-AppShell-navbar");
    await safeClick(page, sidebar.locator("text=대시보드"));

    await waitForPageLoad(page);
    await expect(page).toHaveURL("/");
  });

  test("프로젝트 페이지 네비게이션", async ({ page }) => {
    const sidebar = page.locator(".mantine-AppShell-navbar");
    await safeClick(page, sidebar.locator("text=프로젝트"));

    await waitForPageLoad(page);
    await expect(page).toHaveURL("/projects");
  });

  test("주식 추이 확인 페이지 네비게이션", async ({ page }) => {
    const sidebar = page.locator(".mantine-AppShell-navbar");
    await safeClick(page, sidebar.locator("text=주식 추이 확인"));

    await waitForPageLoad(page);
    await expect(page).toHaveURL("/flowchart");
  });

  test("백테스트 페이지 네비게이션", async ({ page }) => {
    const sidebar = page.locator(".mantine-AppShell-navbar");
    await safeClick(page, sidebar.locator("text=백테스트"));

    await waitForPageLoad(page);
    await expect(page).toHaveURL("/backtest");
  });

  test("사용자 메뉴얼 페이지 네비게이션", async ({ page }) => {
    const sidebar = page.locator(".mantine-AppShell-navbar");
    await safeClick(page, sidebar.locator("text=사용자 메뉴얼"));

    await waitForPageLoad(page);
    await expect(page).toHaveURL("/manual");

    // 메뉴얼 페이지 요소 확인
    await expect(
      page.locator("h1").filter({ hasText: /사용자.*메뉴얼/ })
    ).toBeVisible();
  });

  test("환경설정 페이지 네비게이션", async ({ page }) => {
    const sidebar = page.locator(".mantine-AppShell-navbar");
    await safeClick(page, sidebar.locator("text=환경설정"));

    await waitForPageLoad(page);
    await expect(page).toHaveURL("/settings");
  });
});
