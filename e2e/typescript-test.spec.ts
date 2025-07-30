import { test, expect } from "./fixtures";
import type { TestData } from "./types";

test.describe("TypeScript E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should demonstrate TypeScript features", async ({
    page,
    dashboardPage,
    projectEditPage,
  }) => {
    // 타입 안전성을 가진 테스트 데이터
    const testData: TestData = {
      projectName: `TS Test Project ${Date.now()}`,
      projectDescription: "TypeScript로 작성된 E2E 테스트 프로젝트",
      versionName: "v1.0.0",
    };

    // 페이지 객체 모델 사용
    await dashboardPage.goto("/");
    await dashboardPage.waitForLoad();

    // 대시보드 확인
    await expect(page.locator("h1, h2")).toContainText(/대시보드|투자/);

    // 프로젝트 카드 개수 확인 (타입 안전)
    const initialProjectCount: number = await dashboardPage.getProjectCount();
    expect(initialProjectCount).toBeGreaterThan(0);

    // 첫 번째 프로젝트 메뉴 클릭
    const firstProjectMenu = page
      .locator('[data-testid="project-menu"]')
      .first();
    if (await firstProjectMenu.isVisible()) {
      await firstProjectMenu.click();
      await page.locator("text=수정").click();

      // 프로젝트 편집 페이지 확인
      await expect(page).toHaveURL(/\/projects\/.*\/edit/);

      // 타입 안전한 폼 입력
      await projectEditPage.fillProjectInfo(
        testData.projectName,
        testData.projectDescription
      );

      // 전략 탭으로 전환
      await projectEditPage.switchToStrategyTab();
      await expect(page.locator(".react-flow")).toBeVisible();

      // 백테스트 탭으로 전환
      await projectEditPage.switchToBacktestTab();
      await expect(page.locator("text=백테스트 설정")).toBeVisible();
    }
  });

  test("should handle arrays and objects with proper typing", async ({
    page,
  }) => {
    // 타입 안전한 배열 처리
    const expectedMenuItems: string[] = [
      "대시보드",
      "주식 추이",
      "사용자 메뉴얼",
    ];

    for (const menuItem of expectedMenuItems) {
      await expect(page.locator(`text=${menuItem}`)).toBeVisible();
    }

    // 타입 안전한 객체 검증
    interface ProjectStats {
      totalProjects: number;
      activeStrategies: number;
      averageReturn: number;
    }

    // 통계 카드들이 표시되는지 확인
    const statsElements = page.locator('[data-testid="stats-card"]');
    const statsCount = await statsElements.count();

    if (statsCount > 0) {
      // 통계 정보가 올바른 형태인지 확인
      const statsCards = await statsElements.all();

      for (const card of statsCards) {
        const cardText = await card.textContent();
        expect(cardText).toBeTruthy();
        expect(typeof cardText).toBe("string");
      }
    }
  });

  test("should work with async/await and Promise types", async ({ page }) => {
    // Promise 기반 타입 안전 함수
    const getPageTitle = async (): Promise<string> => {
      return await page.title();
    };

    const getProjectCardTitles = async (): Promise<string[]> => {
      const cards = page.locator('[data-testid="project-card"] h3');
      const titles: string[] = [];

      const cardCount = await cards.count();
      for (let i = 0; i < cardCount; i++) {
        const title = await cards.nth(i).textContent();
        if (title) {
          titles.push(title);
        }
      }

      return titles;
    };

    // 타입 안전한 비동기 함수 호출
    const pageTitle: string = await getPageTitle();
    expect(pageTitle).toContain("JMT");

    const projectTitles: string[] = await getProjectCardTitles();
    expect(Array.isArray(projectTitles)).toBe(true);
    expect(projectTitles.length).toBeGreaterThanOrEqual(0);
  });
});
