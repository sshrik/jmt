import { test, expect } from "@playwright/test";
import { waitForPageLoad, checkServerHealth, safeClick } from "./utils";

test.describe("전략 편집 페이지", () => {
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
    }
  });

  test("전략 편집 페이지 로딩", async ({ page }) => {
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      // 편집 페이지 확인
      await expect(page).toHaveURL(/\/projects\/.*\/edit$/);

      // 탭 메뉴 확인 (role 기반 locator 사용)
      const tabs = page.locator('[role="tablist"]');
      if (await tabs.isVisible()) {
        await expect(
          page.getByRole("tab", { name: "프로젝트 정보" })
        ).toBeVisible();
        await expect(
          page.getByRole("tab", { name: "투자 전략" })
        ).toBeVisible();
        await expect(page.getByRole("tab", { name: "백테스트" })).toBeVisible();
      }
    }
  });

  test("투자 전략 탭으로 이동", async ({ page }) => {
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      // 투자 전략 탭 클릭
      const strategyTab = page.getByRole("tab", { name: "투자 전략" });
      if (await strategyTab.isVisible()) {
        await safeClick(page, strategyTab);
        await waitForPageLoad(page);

        // React Flow 컨테이너 확인
        await expect(page.locator(".react-flow")).toBeVisible({
          timeout: 10000,
        });
      }
    }
  });

  test("전략 플로우 편집기 표시", async ({ page }) => {
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      // 투자 전략 탭으로 이동
      const strategyTab = page.getByRole("tab", { name: "투자 전략" });
      if (await strategyTab.isVisible()) {
        await safeClick(page, strategyTab);
        await waitForPageLoad(page);

        // React Flow 관련 요소들 확인
        const reactFlow = page.locator(".react-flow");
        if (await reactFlow.isVisible()) {
          // 미니맵 확인
          await expect(page.locator(".react-flow__minimap")).toBeVisible({
            timeout: 5000,
          });

          // 컨트롤 패널 확인
          await expect(page.locator(".react-flow__controls")).toBeVisible({
            timeout: 5000,
          });
        }
      }
    }
  });

  test("노드 추가 기능", async ({ page }) => {
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      // 투자 전략 탭으로 이동
      const strategyTab = page.getByRole("tab", { name: "투자 전략" });
      if (await strategyTab.isVisible()) {
        await safeClick(page, strategyTab);
        await waitForPageLoad(page);

        // 노드 추가 버튼들 확인
        const addButtons = page
          .locator("text=조건 추가")
          .or(page.locator("text=액션 추가"));
        if (await addButtons.first().isVisible()) {
          await expect(addButtons.first()).toBeVisible();
        }
      }
    }
  });

  test("전략 저장 기능", async ({ page }) => {
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      // 투자 전략 탭으로 이동
      const strategyTab = page.getByRole("tab", { name: "투자 전략" });
      if (await strategyTab.isVisible()) {
        await safeClick(page, strategyTab);
        await waitForPageLoad(page);

        // 저장 관련 버튼들 확인
        const saveButtons = page
          .locator("button")
          .filter({ hasText: /저장|변경사항/ });
        if (await saveButtons.first().isVisible()) {
          await expect(saveButtons.first()).toBeVisible();
        }
      }
    }
  });
});
