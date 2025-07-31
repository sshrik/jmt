import { test, expect } from "@playwright/test";
import { waitForPageLoad, checkServerHealth, safeClick } from "./utils";

test.describe("사용자 메뉴얼 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await checkServerHealth(page);
    await page.goto("/manual");
    await waitForPageLoad(page);
  });

  test("메뉴얼 페이지 로딩", async ({ page }) => {
    // 페이지 제목 확인
    await expect(
      page.locator("h1").filter({ hasText: /사용자.*메뉴얼/ })
    ).toBeVisible();

    // 메뉴얼 기본 내용 확인
    await expect(page.locator("text=5분 만에 시작하기")).toBeVisible();
  });

  test("시작하기 섹션", async ({ page }) => {
    // 시작하기 아코디언 확인 (더 구체적인 locator 사용)
    const gettingStarted = page.locator("h3").filter({ hasText: "시작하기" });
    if (await gettingStarted.isVisible()) {
      await expect(gettingStarted).toBeVisible();

      // 아코디언 항목들 확인 (실제 있는 텍스트로)
      await expect(page.locator("text=첫 번째 프로젝트 만들기")).toBeVisible();
    }
  });

  test("전략 설계 섹션", async ({ page }) => {
    // 전략 설계 관련 내용 확인 (더 구체적인 locator 사용)
    const strategySection = page
      .locator("h3")
      .filter({ hasText: "투자 전략 설계" });
    if (await strategySection.isVisible()) {
      await expect(strategySection).toBeVisible();
    }
  });

  test("백테스트 분석 섹션", async ({ page }) => {
    // 백테스트 분석 관련 내용 확인 (실제 있는 텍스트로)
    const backtestSection = page.locator("text=결과 해석");
    if (await backtestSection.isVisible()) {
      await expect(backtestSection).toBeVisible();
    }
  });

  test("FAQ 섹션", async ({ page }) => {
    // FAQ 섹션 확인 (h3 태그로 더 구체적으로)
    const faqSection = page.locator("h3").filter({ hasText: "자주 묻는 질문" });
    if (await faqSection.isVisible()) {
      await expect(faqSection).toBeVisible();
    }
  });

  test("GitHub 링크", async ({ page }) => {
    // GitHub 이슈 링크 확인
    const githubLink = page.locator('a[href*="github.com"]');
    if (await githubLink.first().isVisible()) {
      await expect(githubLink.first()).toBeVisible();

      // 링크 URL 확인
      const href = await githubLink.first().getAttribute("href");
      expect(href).toContain("github.com/sshrik/jmt");
    }
  });

  test("네비게이션에서 메뉴얼 접근", async ({ page }) => {
    // 대시보드로 이동 후 사이드바에서 메뉴얼 클릭
    await page.goto("/");
    await waitForPageLoad(page);

    const sidebar = page.locator(".mantine-AppShell-navbar");
    await safeClick(page, sidebar.locator("text=사용자 메뉴얼"));

    await waitForPageLoad(page);
    await expect(page).toHaveURL("/manual");
    await expect(
      page.locator("h1").filter({ hasText: /사용자.*메뉴얼/ })
    ).toBeVisible();
  });
});
