import { test, expect } from "@playwright/test";

test.describe("Backtest Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // 첫 번째 프로젝트의 편집 페이지로 이동
    await page.locator('[data-testid="project-menu"]').first().click();
    await page.locator("text=수정").click();

    // 백테스트 탭으로 이동
    await page.locator("text=백테스트").click();
  });

  test("should configure and run backtest", async ({ page }) => {
    // 백테스트 설정 요소들 확인
    await expect(page.locator("text=백테스트 설정")).toBeVisible();
    await expect(page.locator("text=종목 선택")).toBeVisible();

    // 종목 선택 드롭다운 클릭
    const stockSelect = page.locator('input[placeholder="종목을 선택하세요"]');
    await stockSelect.click();

    // 첫 번째 종목 선택
    await page.locator("[data-combobox-option]").first().click();

    // 백테스트 실행 버튼 확인 및 클릭
    const runButton = page.locator('button:has-text("백테스트 실행")');
    await expect(runButton).toBeVisible();
    await runButton.click();

    // 백테스트 진행 확인 (프로그레스 바 또는 로딩 상태)
    await expect(
      page.locator("text=백테스트를 실행하고 있습니다")
    ).toBeVisible();

    // 백테스트 완료 대기 (최대 30초)
    await page.waitForSelector("text=백테스트가 성공적으로 완료되었습니다", {
      timeout: 30000,
    });

    // 결과 확인
    await expect(page.locator("text=총 수익률")).toBeVisible();
    await expect(page.locator("text=거래 횟수")).toBeVisible();
  });

  test("should show backtest history", async ({ page }) => {
    // 프로젝트 상세 페이지로 이동
    await page.goto("/");
    await page.locator('[data-testid="project-card"]').first().click();

    // 백테스트 이력 섹션 확인
    await expect(page.locator("text=백테스트 이력")).toBeVisible();

    // 백테스트 이력 카드들이 있는지 확인
    const backtestCards = page.locator('[data-testid="backtest-card"]');
    const cardCount = await backtestCards.count();

    if (cardCount > 0) {
      // 첫 번째 백테스트 카드 클릭
      await backtestCards.first().click();

      // 백테스트 상세 모달 확인
      await expect(page.locator("text=백테스트 상세 결과")).toBeVisible();
      await expect(page.locator("text=동일조건으로 다시 테스트")).toBeVisible();
    }
  });

  test("should validate backtest configuration", async ({ page }) => {
    // 종목을 선택하지 않고 백테스트 실행 시도
    const runButton = page.locator('button:has-text("백테스트 실행")');

    // 버튼이 비활성화되어 있거나 경고 메시지가 표시되는지 확인
    const isDisabled = await runButton.isDisabled();
    if (!isDisabled) {
      await runButton.click();
      // 경고 메시지 확인
      await expect(
        page
          .locator("text=종목을 선택해주세요")
          .or(page.locator("text=필수 항목"))
      ).toBeVisible();
    }
  });
});
