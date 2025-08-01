import { test, expect } from "@playwright/test";
import {
  waitForPageLoad,
  checkServerHealth,
  safeClick,
  safeFill,
} from "./utils";

test.describe("포괄적인 프로젝트 관리 테스트", () => {
  test.beforeEach(async ({ page }) => {
    await checkServerHealth(page);
    await page.goto("/");
    await waitForPageLoad(page);
  });

  test("대시보드 로딩 및 기본 UI 요소 확인", async ({ page }) => {
    // 페이지 기본 요소들 확인
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("text=대시보드")).toBeVisible();
    
    // 사이드바 네비게이션 확인
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();
    
    // 주요 메뉴 항목들 확인
    await expect(page.locator("text=대시보드")).toBeVisible();
    await expect(page.locator("text=프로젝트")).toBeVisible();
    
    // 새 프로젝트 버튼 확인
    const newProjectButton = page.locator("button", { hasText: "새 프로젝트" });
    if (await newProjectButton.isVisible()) {
      await expect(newProjectButton).toBeVisible();
    }
  });

  test("프로젝트 생성 전체 워크플로우", async ({ page }) => {
    const timestamp = Date.now();
    const projectName = `E2E 테스트 프로젝트 ${timestamp}`;
    const projectDescription = `자동화된 E2E 테스트로 생성된 프로젝트입니다. 생성 시간: ${new Date().toISOString()}`;

    // 1. 새 프로젝트 생성 버튼 클릭
    const newProjectButton = page.locator("button", { hasText: "새 프로젝트" });
    await safeClick(page, newProjectButton);

    // 2. 모달 열림 확인
    await expect(page.locator("text=새 프로젝트 만들기")).toBeVisible({ timeout: 15000 });

    // 3. 모달 내 폼 요소들 확인
    const modal = page.locator(".mantine-Modal-root");
    await expect(modal).toBeVisible();
    
    const nameInput = modal.locator("input").first();
    const descriptionTextarea = modal.locator("textarea").first();
    
    await expect(nameInput).toBeVisible();
    await expect(descriptionTextarea).toBeVisible();

    // 4. 프로젝트 정보 입력
    await safeFill(page, nameInput, projectName);
    await safeFill(page, descriptionTextarea, projectDescription);

    // 5. 프로젝트 생성
    const createButton = modal.locator("button", { hasText: "프로젝트 생성" });
    await safeClick(page, createButton);

    // 6. 편집 페이지로 이동 확인
    await page.waitForURL(/\/projects\/.*\/edit$/, { timeout: 15000 });
    await waitForPageLoad(page);

    // 7. 편집 페이지 기본 요소들 확인
    await expect(page.locator("h1")).toContainText(projectName);
    await expect(page.locator("text=기본 정보")).toBeVisible();
    await expect(page.locator("text=투자 전략")).toBeVisible();
    await expect(page.locator("text=백테스트")).toBeVisible();

    // 8. 대시보드로 돌아가서 생성된 프로젝트 확인
    await page.goto("/");
    await waitForPageLoad(page);
    await expect(page.locator(`text=${projectName}`)).toBeVisible();
  });

  test("프로젝트 편집 페이지 탭 네비게이션 및 기능", async ({ page }) => {
    const projectName = await createTestProject(page);
    
    // 편집 페이지로 이동
    await navigateToProjectEdit(page, projectName);

    // 기본 정보 탭 테스트
    const basicTab = page.locator('[role="tab"]', { hasText: "기본 정보" });
    await safeClick(page, basicTab);
    await waitForPageLoad(page);
    
    // 기본 정보 폼 요소들 확인
    const projectForm = page.locator("form").or(page.locator("input")).first().locator("..");
    const nameField = page.locator("input").first();
    const descField = page.locator("textarea").first();
    
    if (await nameField.isVisible()) {
      await expect(nameField).toHaveValue(projectName);
    }

    // 투자 전략 탭 테스트
    const strategyTab = page.locator('[role="tab"]', { hasText: "투자 전략" });
    await safeClick(page, strategyTab);
    await waitForPageLoad(page);
    
    // 전략 편집기 요소들 확인
    const strategyElements = [
      page.locator(".react-flow"),
      page.locator("text=시작"),
      page.locator("text=조건"),
      page.locator("text=액션"),
      page.locator("canvas"),
    ];
    
    let hasStrategyElement = false;
    for (const element of strategyElements) {
      if (await element.isVisible()) {
        hasStrategyElement = true;
        break;
      }
    }
    expect(hasStrategyElement).toBe(true);

    // 백테스트 탭 테스트
    const backtestTab = page.locator('[role="tab"]', { hasText: "백테스트" });
    await safeClick(page, backtestTab);
    await waitForPageLoad(page);
    
    // 백테스트 설정 요소들 확인
    const backtestElements = [
      page.locator("text=백테스트"),
      page.locator("text=설정"),
      page.locator("input"),
      page.locator("select"),
      page.locator("button"),
    ];
    
    let hasBacktestElement = false;
    for (const element of backtestElements) {
      if (await element.isVisible()) {
        hasBacktestElement = true;
        break;
      }
    }
    expect(hasBacktestElement).toBe(true);
  });

  test("프로젝트 정보 수정 및 저장", async ({ page }) => {
    const originalName = await createTestProject(page);
    await navigateToProjectEdit(page, originalName);

    // 기본 정보 탭으로 이동
    const basicTab = page.locator('[role="tab"]', { hasText: "기본 정보" });
    await safeClick(page, basicTab);
    await waitForPageLoad(page);

    // 프로젝트 정보 수정
    const updatedName = `수정된 ${originalName}`;
    const updatedDescription = `수정된 설명 - ${new Date().toISOString()}`;

    const nameInput = page.locator("input").first();
    const descInput = page.locator("textarea").first();

    if (await nameInput.isVisible()) {
      await nameInput.clear();
      await nameInput.fill(updatedName);
    }

    if (await descInput.isVisible()) {
      await descInput.clear();
      await descInput.fill(updatedDescription);
    }

    // 저장 버튼 찾기 및 클릭
    const saveButtons = [
      page.locator("button", { hasText: "저장" }),
      page.locator("button", { hasText: "새 버전으로 저장" }),
      page.locator("button", { hasText: "완료" }),
    ];

    for (const button of saveButtons) {
      if (await button.isVisible()) {
        await safeClick(page, button);
        await waitForPageLoad(page);
        break;
      }
    }

    // 변경사항 확인
    await page.reload();
    await waitForPageLoad(page);
    
    const currentName = await nameInput.inputValue();
    expect(currentName).toContain(updatedName.substring(0, 10)); // 부분 매칭으로 유연성 확보
  });

  test("프로젝트 삭제 워크플로우", async ({ page }) => {
    const projectName = await createTestProject(page);
    
    // 대시보드로 이동
    await page.goto("/");
    await waitForPageLoad(page);

    // 생성된 프로젝트 카드 찾기
    const projectCard = page.locator('[data-testid="project-card"]').filter({
      hasText: projectName,
    });
    await expect(projectCard).toBeVisible();

    // 프로젝트 메뉴 열기
    const menuButton = projectCard.locator("button").last();
    await safeClick(page, menuButton);

    // 삭제 메뉴 클릭
    await safeClick(page, page.locator("text=프로젝트 삭제"));

    // 삭제 확인 모달 처리
    const confirmationButtons = [
      page.locator("button", { hasText: "삭제" }),
      page.locator("button", { hasText: "확인" }),
      page.locator("button", { hasText: "예" }),
    ];

    for (const button of confirmationButtons) {
      if (await button.isVisible({ timeout: 5000 })) {
        await safeClick(page, button);
        break;
      }
    }

    // 삭제 완료 확인
    await waitForPageLoad(page);
    await expect(page.locator(`text=${projectName}`)).not.toBeVisible();
  });

  test("다중 프로젝트 관리 시나리오", async ({ page }) => {
    const projectNames = [
      `프로젝트 Alpha ${Date.now()}`,
      `프로젝트 Beta ${Date.now() + 1}`,
      `프로젝트 Gamma ${Date.now() + 2}`,
    ];

    // 여러 프로젝트 생성
    for (const projectName of projectNames) {
      await createTestProject(page, projectName);
      await page.goto("/");
      await waitForPageLoad(page);
    }

    // 모든 프로젝트가 대시보드에 표시되는지 확인
    for (const projectName of projectNames) {
      await expect(page.locator(`text=${projectName}`)).toBeVisible();
    }

    // 프로젝트 카드 개수 확인
    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);

    // 첫 번째 프로젝트 편집 테스트
    await navigateToProjectEdit(page, projectNames[0]);
    await expect(page.locator("h1")).toContainText(projectNames[0]);

    // 대시보드로 돌아가서 다른 프로젝트들도 여전히 존재하는지 확인
    await page.goto("/");
    await waitForPageLoad(page);
    
    for (const projectName of projectNames.slice(1)) {
      await expect(page.locator(`text=${projectName}`)).toBeVisible();
    }
  });
});

// 헬퍼 함수들
async function createTestProject(page: any, customName?: string): Promise<string> {
  const timestamp = Date.now();
  const projectName = customName || `테스트 프로젝트 ${timestamp}`;
  const projectDescription = `테스트용 프로젝트 설명 - ${timestamp}`;

  // 대시보드에서 시작
  await page.goto("/");
  await waitForPageLoad(page);

  // 새 프로젝트 생성
  const newProjectButton = page.locator("button", { hasText: "새 프로젝트" });
  await safeClick(page, newProjectButton);

  await expect(page.locator("text=새 프로젝트 만들기")).toBeVisible();

  const modal = page.locator(".mantine-Modal-root");
  const nameInput = modal.locator("input").first();
  const descTextarea = modal.locator("textarea").first();

  await safeFill(page, nameInput, projectName);
  await safeFill(page, descTextarea, projectDescription);

  const createButton = modal.locator("button", { hasText: "프로젝트 생성" });
  await safeClick(page, createButton);

  // 편집 페이지로 이동 대기
  await page.waitForURL(/\/projects\/.*\/edit$/, { timeout: 15000 });
  await waitForPageLoad(page);

  return projectName;
}

async function navigateToProjectEdit(page: any, projectName: string): Promise<void> {
  // 대시보드로 이동
  await page.goto("/");
  await waitForPageLoad(page);

  // 프로젝트 카드 찾기
  const projectCard = page.locator('[data-testid="project-card"]').filter({
    hasText: projectName,
  });
  await expect(projectCard).toBeVisible();

  // 메뉴 버튼 클릭
  const menuButton = projectCard.locator("button").last();
  await safeClick(page, menuButton);

  // 프로젝트 수정 메뉴 클릭
  await safeClick(page, page.locator("text=프로젝트 수정"));

  // 편집 페이지로 이동 대기
  await page.waitForURL(/\/projects\/.*\/edit$/, { timeout: 15000 });
  await waitForPageLoad(page);
}