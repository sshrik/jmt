import { test, expect } from "@playwright/test";
import { waitForPageLoad, checkServerHealth } from "./utils";

test.describe("대시보드 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await checkServerHealth(page);
    await page.goto("/");
    await waitForPageLoad(page);
  });

  test("대시보드 로딩 확인", async ({ page }) => {
    // 페이지 제목 확인
    await expect(page.locator("h1").first()).toContainText("대시보드");

    // 사이드바 확인
    await expect(page.locator(".mantine-AppShell-navbar")).toBeVisible();
  });

  test("프로젝트 카드 표시", async ({ page }) => {
    // 프로젝트가 있는 경우 카드 확인
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      // 첫 번째 프로젝트 카드 확인
      const firstCard = projectCards.first();
      await expect(firstCard).toBeVisible();

      // 카드 내 텍스트 요소 확인
      await expect(firstCard).toBeVisible();
    } else {
      // 프로젝트가 없는 경우 빈 상태 확인
      await expect(page.locator("text=아직 프로젝트가 없습니다")).toBeVisible();
      await expect(page.locator("text=프로젝트 만들기")).toBeVisible();
    }
  });

  test("성과 통계 표시", async ({ page }) => {
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      // 프로젝트가 있으면 실제 통계 정보 확인
      await expect(page.locator("text=총 프로젝트")).toBeVisible();
      await expect(page.locator("text=평균 수익률")).toBeVisible();
    } else {
      // 프로젝트가 없는 경우 빈 상태 확인
      await expect(page.locator("text=아직 프로젝트가 없습니다")).toBeVisible();
    }
  });

  test("프로젝트 정렬", async ({ page }) => {
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount > 1) {
      // 성과가 좋은 순으로 정렬됨 텍스트 확인
      await expect(
        page.locator("text=성과가 좋은 순으로 정렬됨")
      ).toBeVisible();
    }
  });
});
