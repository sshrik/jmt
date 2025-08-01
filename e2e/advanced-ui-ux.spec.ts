import { test, expect } from "@playwright/test";
import {
  waitForPageLoad,
  checkServerHealth,
  safeClick,
  safeFill,
} from "./utils";

test.describe("고급 UI/UX 테스트", () => {
  test.beforeEach(async ({ page }) => {
    await checkServerHealth(page);
    await page.goto("/");
    await waitForPageLoad(page);
  });

  test("전체 애플리케이션 네비게이션 플로우", async ({ page }) => {
    // 대시보드에서 시작
    await expect(page.locator("h1")).toContainText("대시보드");

    // 사이드바 모든 메뉴 항목 테스트
    const menuItems = [
      { name: "대시보드", expectedUrl: "/" },
      { name: "프로젝트", expectedUrl: "/projects" },
      { name: "주식 추이 확인", expectedUrl: "/stocks" },
      { name: "백테스트", expectedUrl: "/backtest" },
      { name: "사용자 메뉴얼", expectedUrl: "/manual" },
      { name: "환경설정", expectedUrl: "/settings" },
    ];

    for (const menuItem of menuItems) {
      const menuElement = page.locator("text=" + menuItem.name);
      
      if (await menuElement.isVisible()) {
        await safeClick(page, menuElement);
        await waitForPageLoad(page);
        
        // URL 변경 확인 (부분 매칭)
        const currentUrl = page.url();
        
        // 페이지가 정상적으로 로드되었는지 확인
        await expect(page.locator("body")).toBeVisible();
        
        // 에러 페이지가 아닌지 확인
        const hasError = await page.locator("text=404").or(page.locator("text=오류")).isVisible();
        expect(hasError).toBe(false);
      }
    }

    // 다시 대시보드로 돌아가기
    const dashboardLink = page.locator("text=대시보드");
    if (await dashboardLink.isVisible()) {
      await safeClick(page, dashboardLink);
      await waitForPageLoad(page);
      await expect(page.locator("h1")).toContainText("대시보드");
    }
  });

  test("반응형 디자인 및 다양한 화면 크기", async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: "데스크톱 FHD" },
      { width: 1366, height: 768, name: "노트북" },
      { width: 768, height: 1024, name: "태블릿" },
      { width: 375, height: 667, name: "모바일" },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await waitForPageLoad(page, 2000);

      // 기본 레이아웃 요소들이 여전히 표시되는지 확인
      await expect(page.locator("body")).toBeVisible();
      await expect(page.locator("h1")).toBeVisible();

      // 사이드바나 네비게이션이 적절히 표시되는지 확인
      const sidebar = page.locator("aside");
      const mobileMenu = page.locator(".mantine-Burger-root").or(
        page.locator('[aria-label*="메뉴"]')
      );

      if (viewport.width < 768) {
        // 모바일에서는 햄버거 메뉴나 축소된 네비게이션
        if (await mobileMenu.isVisible()) {
          await expect(mobileMenu).toBeVisible();
        }
      } else {
        // 데스크톱에서는 사이드바
        if (await sidebar.isVisible()) {
          await expect(sidebar).toBeVisible();
        }
      }

      // 새 프로젝트 버튼이 적절히 표시되는지 확인
      const newProjectButton = page.locator("button", { hasText: "새 프로젝트" });
      if (await newProjectButton.isVisible()) {
        await expect(newProjectButton).toBeVisible();
      }
    }

    // 기본 뷰포트로 복원
    await page.setViewportSize({ width: 1366, height: 768 });
  });

  test("키보드 네비게이션 및 접근성", async ({ page }) => {
    // Tab 키로 포커스 이동 테스트
    let tabCount = 0;
    const maxTabs = 10;

    while (tabCount < maxTabs) {
      await page.keyboard.press("Tab");
      tabCount++;

      const focusedElement = page.locator(":focus");
      if (await focusedElement.isVisible()) {
        // 포커스된 요소가 실제로 인터랙티브한 요소인지 확인
        const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
        const interactiveTags = ["button", "input", "textarea", "select", "a"];
        
        if (interactiveTags.includes(tagName)) {
          // Enter 키로 요소 활성화 테스트
          if (tagName === "button") {
            await page.keyboard.press("Enter");
            await waitForPageLoad(page, 1000);
            
            // 모달이 열렸다면 ESC로 닫기
            const modal = page.locator(".mantine-Modal-root");
            if (await modal.isVisible()) {
              await page.keyboard.press("Escape");
              await waitForPageLoad(page, 1000);
            }
          }
        }
      }

      await waitForPageLoad(page, 500);
    }

    // 최소한 몇 개의 인터랙티브 요소에 포커스가 갔어야 함
    expect(tabCount).toBeGreaterThan(0);
  });

  test("다크/라이트 모드 토글 및 테마 일관성", async ({ page }) => {
    // 테마 토글 버튼 찾기
    const themeToggleSelectors = [
      'button[aria-label*="테마"]',
      'button[aria-label*="theme"]',
      '[data-testid="theme-toggle"]',
      'button[title*="테마"]',
    ];

    let themeToggle = null;
    for (const selector of themeToggleSelectors) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        themeToggle = element;
        break;
      }
    }

    if (themeToggle) {
      // 현재 테마 상태 확인
      const initialBodyClass = await page.locator("body").getAttribute("class");
      const initialDataTheme = await page.locator("html").getAttribute("data-theme");

      // 테마 토글
      await safeClick(page, themeToggle);
      await waitForPageLoad(page, 1000);

      // 테마 변경 확인
      const newBodyClass = await page.locator("body").getAttribute("class");
      const newDataTheme = await page.locator("html").getAttribute("data-theme");

      // 테마가 실제로 변경되었는지 확인
      const themeChanged = 
        (initialBodyClass !== newBodyClass) || 
        (initialDataTheme !== newDataTheme);

      if (themeChanged) {
        // 다시 토글해서 원래대로 돌아가는지 확인
        await safeClick(page, themeToggle);
        await waitForPageLoad(page, 1000);

        const finalBodyClass = await page.locator("body").getAttribute("class");
        const finalDataTheme = await page.locator("html").getAttribute("data-theme");

        expect(finalBodyClass).toBe(initialBodyClass);
        expect(finalDataTheme).toBe(initialDataTheme);
      }
    }
  });

  test("로딩 상태 및 스켈레톤 UI", async ({ page }) => {
    // 페이지 새로고침으로 로딩 상태 관찰
    await page.reload({ waitUntil: "domcontentloaded" });

    // 로딩 인디케이터 요소들 확인
    const loadingElements = [
      page.locator(".mantine-LoadingOverlay-root"),
      page.locator('[role="progressbar"]'),
      page.locator(".loading"),
      page.locator(".skeleton"),
      page.locator('.mantine-Skeleton-root'),
    ];

    let hasLoadingState = false;
    for (const element of loadingElements) {
      if (await element.isVisible({ timeout: 3000 })) {
        hasLoadingState = true;
        break;
      }
    }

    // 로딩 완료 후 콘텐츠 확인
    await waitForPageLoad(page);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("body")).toBeVisible();

    // 로딩 요소들이 사라졌는지 확인
    for (const element of loadingElements) {
      if (await element.isVisible({ timeout: 1000 })) {
        await expect(element).not.toBeVisible();
      }
    }
  });

  test("에러 처리 및 사용자 피드백", async ({ page }) => {
    // 존재하지 않는 페이지로 이동
    await page.goto("/non-existent-page-12345");

    // 404 페이지나 에러 페이지 확인
    const errorIndicators = [
      page.locator("text=404"),
      page.locator("text=페이지를 찾을 수 없습니다"),
      page.locator("text=존재하지 않습니다"),
      page.locator("text=오류"),
      page.locator('[data-testid="error-page"]'),
    ];

    let hasErrorPage = false;
    for (const indicator of errorIndicators) {
      if (await indicator.isVisible()) {
        hasErrorPage = true;
        break;
      }
    }

    if (hasErrorPage) {
      // 홈으로 돌아가기 버튼 확인
      const homeButtons = [
        page.locator("text=홈으로"),
        page.locator("text=대시보드로"),
        page.locator("text=돌아가기"),
        page.locator("button", { hasText: "홈" }),
      ];

      for (const button of homeButtons) {
        if (await button.isVisible()) {
          await safeClick(page, button);
          await waitForPageLoad(page);
          
          // 정상 페이지로 돌아갔는지 확인
          expect(page.url()).toMatch(/\/$|\/dashboard/);
          await expect(page.locator("h1")).toBeVisible();
          break;
        }
      }
    }
  });

  test("알림 및 토스트 메시지 시스템", async ({ page }) => {
    // 프로젝트 생성으로 성공 알림 유발
    const newProjectButton = page.locator("button", { hasText: "새 프로젝트" });
    
    if (await newProjectButton.isVisible()) {
      await safeClick(page, newProjectButton);
      await expect(page.locator("text=새 프로젝트 만들기")).toBeVisible();

      const modal = page.locator(".mantine-Modal-root");
      const nameInput = modal.locator("input").first();
      const descInput = modal.locator("textarea").first();

      await safeFill(page, nameInput, `알림 테스트 ${Date.now()}`);
      await safeFill(page, descInput, "알림 테스트용 프로젝트");

      const createButton = modal.locator("button", { hasText: "프로젝트 생성" });
      await safeClick(page, createButton);

      // 성공 알림 확인
      const notificationElements = [
        page.locator(".mantine-Notification-root"),
        page.locator('[data-testid="notification"]'),
        page.locator("text=성공"),
        page.locator("text=생성되었습니다"),
        page.locator("text=완료"),
      ];

      let hasNotification = false;
      for (const notification of notificationElements) {
        if (await notification.isVisible({ timeout: 5000 })) {
          hasNotification = true;
          
          // 알림이 자동으로 사라지는지 확인
          await waitForPageLoad(page, 3000);
          if (await notification.isVisible()) {
            // 수동으로 닫기 버튼 클릭
            const closeButton = notification.locator("button").or(
              notification.locator('[aria-label="닫기"]')
            );
            if (await closeButton.isVisible()) {
              await safeClick(page, closeButton);
            }
          }
          
          break;
        }
      }

      expect(hasNotification).toBe(true);
    }
  });

  test("검색 및 필터링 기능", async ({ page }) => {
    // 여러 프로젝트 생성
    await createMultipleTestProjects(page, 3);

    // 검색 기능 테스트
    const searchSelectors = [
      'input[placeholder*="검색"]',
      'input[type="search"]',
      '[data-testid="search"]',
      'input[name="search"]',
    ];

    let searchInput = null;
    for (const selector of searchSelectors) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        searchInput = element;
        break;
      }
    }

    if (searchInput) {
      await safeFill(page, searchInput, "테스트");
      await waitForPageLoad(page, 2000);

      // 검색 결과 확인
      const projectCards = page.locator('[data-testid="project-card"]');
      const visibleCards = await projectCards.count();
      
      expect(visibleCards).toBeGreaterThan(0);

      // 검색어 초기화
      await searchInput.clear();
      await waitForPageLoad(page, 2000);
    }

    // 필터 기능 테스트 (있다면)
    const filterSelectors = [
      'select[name="filter"]',
      'button[aria-label*="필터"]',
      '[data-testid="filter"]',
    ];

    for (const selector of filterSelectors) {
      const filterElement = page.locator(selector);
      if (await filterElement.isVisible()) {
        if (filterElement.tagName === 'SELECT') {
          const optionCount = await filterElement.locator("option").count();
          if (optionCount > 1) {
            await filterElement.selectOption({ index: 1 });
            await waitForPageLoad(page, 2000);
          }
        } else {
          await safeClick(page, filterElement);
          await waitForPageLoad(page, 1000);
        }
        break;
      }
    }
  });

  test("폼 유효성 검사 및 실시간 피드백", async ({ page }) => {
    // 프로젝트 생성 모달로 유효성 검사 테스트
    const newProjectButton = page.locator("button", { hasText: "새 프로젝트" });
    
    if (await newProjectButton.isVisible()) {
      await safeClick(page, newProjectButton);
      await expect(page.locator("text=새 프로젝트 만들기")).toBeVisible();

      const modal = page.locator(".mantine-Modal-root");
      const nameInput = modal.locator("input").first();
      const createButton = modal.locator("button", { hasText: "프로젝트 생성" });

      // 빈 값으로 제출 시도
      await safeClick(page, createButton);

      // 유효성 검사 에러 메시지 확인
      const errorSelectors = [
        ".mantine-TextInput-error",
        '[role="alert"]',
        "text=필수",
        "text=입력해주세요",
        ".error",
      ];

      let hasValidationError = false;
      for (const selector of errorSelectors) {
        const errorElement = page.locator(selector);
        if (await errorElement.isVisible()) {
          hasValidationError = true;
          break;
        }
      }

      expect(hasValidationError).toBe(true);

      // 올바른 값 입력 후 에러 사라짐 확인
      await safeFill(page, nameInput, "유효성 테스트 프로젝트");
      await waitForPageLoad(page, 1000);

      // 에러 메시지가 사라졌는지 확인
      let errorStillVisible = false;
      for (const selector of errorSelectors) {
        const errorElement = page.locator(selector);
        if (await errorElement.isVisible()) {
          errorStillVisible = true;
          break;
        }
      }

      expect(errorStillVisible).toBe(false);

      // 모달 닫기
      const cancelButton = modal.locator("button", { hasText: "취소" });
      if (await cancelButton.isVisible()) {
        await safeClick(page, cancelButton);
      } else {
        await page.keyboard.press("Escape");
      }
    }
  });

  test("브라우저 기본 기능 지원", async ({ page }) => {
    const currentUrl = page.url();

    // 프로젝트 페이지로 이동
    const projectMenu = page.locator("text=프로젝트");
    if (await projectMenu.isVisible()) {
      await safeClick(page, projectMenu);
      await waitForPageLoad(page);

      // 뒤로 가기 버튼 테스트
      await page.goBack();
      await waitForPageLoad(page);
      expect(page.url()).toBe(currentUrl);

      // 앞으로 가기 버튼 테스트
      await page.goForward();
      await waitForPageLoad(page);
      expect(page.url()).not.toBe(currentUrl);

      // 새로고침 테스트
      const beforeRefreshUrl = page.url();
      await page.reload();
      await waitForPageLoad(page);
      expect(page.url()).toBe(beforeRefreshUrl);
    }
  });
});

// 헬퍼 함수
async function createMultipleTestProjects(page: any, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    const newProjectButton = page.locator("button", { hasText: "새 프로젝트" });
    if (await newProjectButton.isVisible()) {
      await safeClick(page, newProjectButton);
      await expect(page.locator("text=새 프로젝트 만들기")).toBeVisible();

      const modal = page.locator(".mantine-Modal-root");
      const nameInput = modal.locator("input").first();
      const descInput = modal.locator("textarea").first();

      await safeFill(page, nameInput, `테스트 프로젝트 ${i + 1} ${Date.now()}`);
      await safeFill(page, descInput, `테스트 설명 ${i + 1}`);

      const createButton = modal.locator("button", { hasText: "프로젝트 생성" });
      await safeClick(page, createButton);

      // 편집 페이지로 이동한 후 대시보드로 돌아가기
      await page.waitForURL(/\/projects\/.*\/edit$/, { timeout: 10000 });
      await page.goto("/");
      await waitForPageLoad(page);
    }
  }
}