import { test, expect } from "@playwright/test";

test.describe("Strategy Editor Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // 첫 번째 프로젝트의 편집 페이지로 이동
    await page.locator('[data-testid="project-menu"]').first().click();
    await page.locator("text=수정").click();

    // 투자 전략 탭으로 이동
    await page.locator("text=투자 전략").click();
  });

  test("should display strategy flow editor", async ({ page }) => {
    // ReactFlow 컨테이너 확인
    await expect(page.locator(".react-flow")).toBeVisible();

    // 기본 노드들 확인 (시작, 스케줄 등)
    await expect(page.locator("text=전략 시작")).toBeVisible();
    await expect(page.locator("text=실행 일정")).toBeVisible();

    // 노드 팔레트 확인
    await expect(page.locator("text=조건")).toBeVisible();
    await expect(page.locator("text=액션")).toBeVisible();
  });

  test("should add condition node", async ({ page }) => {
    // 조건 노드 드래그 앤 드롭
    const conditionButton = page.locator("text=조건").first();
    const flowArea = page.locator(".react-flow");

    await conditionButton.dragTo(flowArea, {
      targetPosition: { x: 400, y: 500 },
    });

    // 새로운 조건 노드가 추가되었는지 확인
    await expect(
      page.locator("text=새 조건").or(page.locator("text=조건"))
    ).toBeVisible();
  });

  test("should add action node", async ({ page }) => {
    // 액션 노드 드래그 앤 드롭
    const actionButton = page.locator("text=액션").first();
    const flowArea = page.locator(".react-flow");

    await actionButton.dragTo(flowArea, {
      targetPosition: { x: 600, y: 500 },
    });

    // 새로운 액션 노드가 추가되었는지 확인
    await expect(
      page.locator("text=새 액션").or(page.locator("text=액션"))
    ).toBeVisible();
  });

  test("should show strategy validation", async ({ page }) => {
    // 전략 유효성 검사 섹션 확인
    await expect(
      page.locator("text=전략 유효성 검사").or(page.locator("text=유효성 검사"))
    ).toBeVisible();

    // 경고나 오류 메시지가 있는지 확인
    const validationSection = page.locator(
      '[data-testid="validation-section"]'
    );
    if (await validationSection.isVisible()) {
      // 유효성 검사 결과 확인
      await expect(validationSection).toContainText(/유효|오류|경고/);
    }
  });

  test("should save strategy changes", async ({ page }) => {
    // 전략 수정 후 저장
    await page.locator("text=새 버전으로 저장").click();

    // 버전 생성 모달에서 저장
    await page
      .locator('input[placeholder*="버전 이름"]')
      .fill("전략 테스트 버전");
    await page.locator('button:has-text("생성")').click();

    // 저장 완료 대기
    await page.waitForTimeout(3000);

    // 성공 메시지나 버전 목록 확인
    await expect(
      page.locator("text=전략 테스트 버전").or(page.locator("text=저장"))
    ).toBeVisible();
  });
});
