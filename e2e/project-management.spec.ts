import { test, expect } from "@playwright/test";

test.describe("Project Management Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should create a new project", async ({ page }) => {
    // 새 프로젝트 생성 버튼 클릭
    await page.locator("text=새 프로젝트 생성").click();

    // 모달이 열렸는지 확인
    await expect(page.locator("text=새 프로젝트 생성")).toBeVisible();

    // 프로젝트 정보 입력
    const projectName = `테스트 프로젝트 ${Date.now()}`;
    await page.locator('input[placeholder*="프로젝트 이름"]').fill(projectName);
    await page
      .locator('textarea[placeholder*="프로젝트 설명"]')
      .fill("Playwright로 생성된 테스트 프로젝트입니다.");

    // 생성 버튼 클릭
    await page.locator('button:has-text("생성")').click();

    // 모달이 닫혔는지 확인 (로딩 시간 고려)
    await page.waitForTimeout(2000);

    // 대시보드에서 새 프로젝트 확인
    await expect(page.locator(`text=${projectName}`)).toBeVisible();
  });

  test("should edit existing project", async ({ page }) => {
    // 첫 번째 프로젝트의 메뉴 버튼 클릭
    await page.locator('[data-testid="project-menu"]').first().click();

    // 수정 메뉴 클릭
    await page.locator("text=수정").click();

    // 프로젝트 편집 페이지로 이동 확인
    await expect(page).toHaveURL(/\/projects\/.*\/edit/);

    // 프로젝트 이름 필드 확인
    await expect(
      page.locator('input[placeholder*="프로젝트 이름"]')
    ).toBeVisible();

    // 전략 편집 탭 확인
    await expect(page.locator("text=투자 전략")).toBeVisible();
    await expect(page.locator("text=백테스트")).toBeVisible();
  });

  test("should access project details", async ({ page }) => {
    // 첫 번째 프로젝트 카드 클릭
    await page.locator('[data-testid="project-card"]').first().click();

    // 프로젝트 상세 페이지로 이동 확인
    await expect(page).toHaveURL(/\/projects\/.*$/);

    // 상세 페이지 요소들 확인
    await expect(page.locator("text=투자 수익률")).toBeVisible();
    await expect(page.locator("text=백테스트 이력")).toBeVisible();
    await expect(page.locator("text=버전 관리")).toBeVisible();
  });

  test("should create new version", async ({ page }) => {
    // 프로젝트 편집 페이지로 이동
    await page.locator('[data-testid="project-menu"]').first().click();
    await page.locator("text=수정").click();

    // 새 버전으로 저장 버튼 클릭
    await page.locator("text=새 버전으로 저장").click();

    // 버전 생성 모달 확인
    await expect(page.locator("text=새 버전 생성")).toBeVisible();

    // 버전 이름 입력
    const versionName = `v${Date.now()}`;
    await page.locator('input[placeholder*="버전 이름"]').fill(versionName);
    await page
      .locator('textarea[placeholder*="변경 사항"]')
      .fill("Playwright 테스트용 버전");

    // 생성 버튼 클릭
    await page.locator('button:has-text("생성")').click();

    // 버전 생성 완료 대기
    await page.waitForTimeout(3000);

    // 성공 메시지 또는 새 버전 확인
    await expect(page.locator(`text=${versionName}`)).toBeVisible();
  });
});
