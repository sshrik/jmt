import { test, expect } from "@playwright/test";
import {
  waitForPageLoad,
  checkServerHealth,
  safeClick,
  safeFill,
} from "./utils";

test.describe("프로젝트 관리", () => {
  test.beforeEach(async ({ page }) => {
    await checkServerHealth(page);
    await page.goto("/");
    await waitForPageLoad(page);
  });

  test("프로젝트 생성", async ({ page }) => {
    // 프로젝트가 없는 경우 프로젝트 만들기 버튼으로 생성
    const emptyButton = page.locator("text=프로젝트 만들기");
    const projectCards = page.locator('[data-testid="project-card"]');

    if (await emptyButton.isVisible()) {
      await safeClick(page, emptyButton);
      await expect(page).toHaveURL(/\/projects$/);
    } else {
      // 프로젝트가 있는 경우 네비게이션으로 이동
      const sidebarProjects = page
        .locator(".mantine-AppShell-navbar")
        .locator("text=프로젝트");
      await safeClick(page, sidebarProjects);
      await waitForPageLoad(page);
      await expect(page).toHaveURL(/\/projects$/);
    }
  });

  test("프로젝트 메뉴 접근", async ({ page }) => {
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      // 첫 번째 프로젝트 카드의 메뉴 버튼 클릭
      const firstCard = projectCards.first();
      const menuButton = firstCard
        .locator('[aria-label="Menu"]')
        .or(firstCard.locator("button").filter({ has: page.locator("svg") }));

      await safeClick(page, menuButton);

      // 메뉴 드롭다운 확인
      await expect(page.locator("text=프로젝트 수정")).toBeVisible();
      await expect(page.locator("text=프로젝트 삭제")).toBeVisible();
    }
  });

  test("프로젝트 편집 페이지 이동", async ({ page }) => {
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      // 첫 번째 프로젝트 카드의 메뉴에서 수정 클릭
      const firstCard = projectCards.first();
      const menuButton = firstCard
        .locator('[aria-label="Menu"]')
        .or(firstCard.locator("button").filter({ has: page.locator("svg") }));

      await safeClick(page, menuButton);
      await safeClick(page, page.locator("text=프로젝트 수정"));

      await waitForPageLoad(page);
      await expect(page).toHaveURL(/\/projects\/.*\/edit$/);
    }
  });

  test("프로젝트 삭제 확인", async ({ page }) => {
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      // 첫 번째 프로젝트 카드의 메뉴에서 삭제 클릭
      const firstCard = projectCards.first();
      const menuButton = firstCard
        .locator('[aria-label="Menu"]')
        .or(firstCard.locator("button").filter({ has: page.locator("svg") }));

      await safeClick(page, menuButton);
      await safeClick(page, page.locator("text=프로젝트 삭제"));

      // 삭제 확인 모달 표시 확인 (여러 방법으로 확인)
      try {
        await expect(page.locator('[role="dialog"]')).toBeVisible({
          timeout: 5000,
        });
      } catch {
        // 모달이 role="dialog"가 아닐 수도 있으니 다른 방법으로 확인
        await expect(page.locator(".mantine-Modal-root")).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });
});
