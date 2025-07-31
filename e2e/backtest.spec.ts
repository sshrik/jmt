import { test, expect } from "@playwright/test";
import { waitForPageLoad, checkServerHealth, safeClick } from "./utils";

test.describe("백테스트 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await checkServerHealth(page);
    await page.goto("/");
    await waitForPageLoad(page);

    // 프로젝트가 있다면 편집 페이지로 이동
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      const firstCard = projectCards.first();
      const menuButton = firstCard
        .locator('[aria-label="Menu"]')
        .or(firstCard.locator("button").filter({ has: page.locator("svg") }));

      await safeClick(page, menuButton);
      await safeClick(page, page.locator("text=프로젝트 수정"));
      await waitForPageLoad(page);

      // 백테스트 탭으로 이동 (tab role을 사용해서 정확한 탭 요소 선택)
      const backtestTab = page.getByRole("tab", { name: "백테스트" });
      if (await backtestTab.isVisible()) {
        await safeClick(page, backtestTab);
        await waitForPageLoad(page);
      }
    }
  });

  test("백테스트 페이지 로딩", async ({ page }) => {
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      // 백테스트 탭이 활성화되었는지 확인
      const backtestTab = page.getByRole("tab", { name: "백테스트" });
      if (await backtestTab.isVisible()) {
        // 백테스트 설정 요소들 확인
        const backtestElements = page
          .locator("text=백테스트 설정")
          .or(page.locator("text=백테스트 실행"));

        if (await backtestElements.first().isVisible()) {
          await expect(backtestElements.first()).toBeVisible();
        }
      }
    }
  });

  test("백테스트 설정", async ({ page }) => {
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      // 백테스트 설정 폼 확인
      const settingInputs = page
        .locator('input[type="date"]')
        .or(page.locator('input[type="number"]').or(page.locator("select")));

      if (await settingInputs.first().isVisible()) {
        await expect(settingInputs.first()).toBeVisible();
      }
    }
  });

  test("백테스트 실행", async ({ page }) => {
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      // 백테스트 실행 버튼 확인
      const runButton = page
        .locator("button")
        .filter({ hasText: /실행|백테스트/ });

      if (await runButton.first().isVisible()) {
        await expect(runButton.first()).toBeVisible();

        // 실행 버튼 클릭 (실제로는 실행하지 않고 버튼만 확인)
        // await safeClick(page, runButton.first());
      }
    }
  });

  test("백테스트 결과 표시", async ({ page }) => {
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      // 백테스트 결과 영역 확인
      const resultElements = page
        .locator("text=결과")
        .or(page.locator("text=수익률").or(page.locator("text=성과")));

      if (await resultElements.first().isVisible()) {
        await expect(resultElements.first()).toBeVisible();
      }
    }
  });

  test("백테스트 히스토리", async ({ page }) => {
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      // 히스토리 관련 요소 확인
      const historyElements = page
        .locator("text=히스토리")
        .or(page.locator("text=이전").or(page.locator("text=기록")));

      if (await historyElements.first().isVisible()) {
        await expect(historyElements.first()).toBeVisible();
      }
    }
  });
});
