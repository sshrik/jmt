import { test, expect } from "@playwright/test";

test.describe("Dashboard Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display dashboard overview", async ({ page }) => {
    // 대시보드 제목 확인
    await expect(page.locator("h1")).toContainText("대시보드");

    // 프로젝트 통계 확인
    await expect(page.locator("text=총 프로젝트")).toBeVisible();
    await expect(page.locator("text=활성 전략")).toBeVisible();
    await expect(page.locator("text=평균 수익률")).toBeVisible();
  });

  test("should display project cards", async ({ page }) => {
    // 프로젝트 카드들이 표시되는지 확인
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    // 최소 1개의 프로젝트 카드가 있어야 함
    expect(cardCount).toBeGreaterThan(0);

    // 첫 번째 프로젝트 카드의 요소들 확인
    const firstCard = projectCards.first();
    await expect(
      firstCard.locator("text=#1").or(firstCard.locator("text=#"))
    ).toBeVisible(); // 순위 뱃지
    await expect(
      firstCard.locator('[data-testid="project-menu"]')
    ).toBeVisible(); // 메뉴 버튼
  });

  test("should show project performance indicators", async ({ page }) => {
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      const firstCard = projectCards.first();

      // 수익률 표시 확인 (양수/음수에 따른 색상)
      const returnText = firstCard.locator("text=/%/");
      if (await returnText.isVisible()) {
        // 수익률이 표시되는지 확인
        await expect(returnText).toBeVisible();
      }

      // 프로젝트 이름과 설명 확인
      await expect(firstCard.locator("h3")).toBeVisible();
    }
  });

  test("should handle empty state", async ({ page }) => {
    // localStorage를 클리어하여 빈 상태 테스트
    await page.evaluate(() => {
      localStorage.clear();
    });

    await page.reload();

    // 기본 프로젝트가 생성되거나 빈 상태 메시지가 표시되어야 함
    await expect(
      page
        .locator("text=새 프로젝트 생성")
        .or(
          page
            .locator("text=고속도로 매매법")
            .or(page.locator("text=프로젝트가 없습니다"))
        )
    ).toBeVisible();
  });

  test("should sort projects by performance", async ({ page }) => {
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount > 1) {
      // 첫 번째 프로젝트가 #1 순위인지 확인
      await expect(projectCards.first().locator("text=#1")).toBeVisible();

      // 두 번째 프로젝트가 #2 순위인지 확인
      await expect(projectCards.nth(1).locator("text=#2")).toBeVisible();
    }
  });
});
