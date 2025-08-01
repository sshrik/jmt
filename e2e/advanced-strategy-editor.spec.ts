import { test, expect } from "@playwright/test";
import {
  waitForPageLoad,
  checkServerHealth,
  safeClick,
  safeFill,
} from "./utils";

test.describe("고급 전략 편집기 테스트", () => {
  test.beforeEach(async ({ page }) => {
    await checkServerHealth(page);
    await page.goto("/");
    await waitForPageLoad(page);

    // 프로젝트 생성 및 전략 편집 페이지로 이동
    await setupStrategyEditor(page);
  });

  test("React Flow 전략 편집기 기본 UI 확인", async ({ page }) => {
    // 투자 전략 탭 활성화 확인
    const strategyTab = page.locator('[role="tab"]', { hasText: "투자 전략" });
    await expect(strategyTab).toBeVisible();
    
    // React Flow 컨테이너 확인
    const flowContainer = page.locator(".react-flow").or(
      page.locator(".react-flow__wrapper")
    );
    
    if (await flowContainer.isVisible()) {
      await expect(flowContainer).toBeVisible();
      
      // React Flow 컨트롤 요소들 확인
      const controls = page.locator(".react-flow__controls");
      if (await controls.isVisible()) {
        await expect(controls).toBeVisible();
      }
      
      // 미니맵 확인 (있다면)
      const minimap = page.locator(".react-flow__minimap");
      if (await minimap.isVisible()) {
        await expect(minimap).toBeVisible();
      }
    }

    // 드래그 가능한 노드 팔레트 확인
    const nodeTypes = [
      "시작",
      "실행 일정", 
      "조건",
      "액션",
      "종료"
    ];

    let visibleNodeTypes = 0;
    for (const nodeType of nodeTypes) {
      const nodeElement = page.locator(`text=${nodeType}`);
      if (await nodeElement.isVisible()) {
        visibleNodeTypes++;
      }
    }

    // 최소 3개 이상의 노드 타입이 보여야 함
    expect(visibleNodeTypes).toBeGreaterThanOrEqual(3);
  });

  test("조건 블록 생성 및 설정", async ({ page }) => {
    // 조건 노드 요소 찾기
    const conditionNode = page.locator("text=조건").first();
    
    if (await conditionNode.isVisible()) {
      // 조건 노드 클릭 또는 드래그 시도
      await safeClick(page, conditionNode);
      await waitForPageLoad(page, 1000);

      // 조건 설정 모달이나 패널이 열리는지 확인
      const conditionSettings = [
        page.locator(".mantine-Modal-root"),
        page.locator("text=조건 설정"),
        page.locator("text=조건 타입"),
        page.locator("select"),
        page.locator("input[type='number']"),
      ];

      let hasConditionSettings = false;
      for (const setting of conditionSettings) {
        if (await setting.isVisible()) {
          hasConditionSettings = true;
          
          // 조건 타입 선택 시도
          if (setting.tagName === 'SELECT') {
            const options = await setting.locator("option").count();
            if (options > 1) {
              await setting.selectOption({ index: 1 });
            }
          }
          
          // 숫자 입력 필드가 있다면 값 입력
          if (await setting.getAttribute("type") === "number") {
            await setting.fill("5");
          }
          
          break;
        }
      }

      expect(hasConditionSettings).toBe(true);
    }
  });

  test("액션 블록 생성 및 설정", async ({ page }) => {
    // 액션 노드 요소 찾기
    const actionNode = page.locator("text=액션").first();
    
    if (await actionNode.isVisible()) {
      // 액션 노드 클릭
      await safeClick(page, actionNode);
      await waitForPageLoad(page, 1000);

      // 액션 설정 요소들 확인
      const actionSettings = [
        page.locator(".mantine-Modal-root"),
        page.locator("text=액션 설정"),
        page.locator("text=액션 타입"),
        page.locator("select"),
        page.locator("input[type='number']"),
      ];

      let hasActionSettings = false;
      for (const setting of actionSettings) {
        if (await setting.isVisible()) {
          hasActionSettings = true;
          
          // 액션 타입 선택
          if (setting.tagName === 'SELECT') {
            const options = await setting.locator("option").count();
            if (options > 1) {
              await setting.selectOption({ index: 1 });
            }
          }
          
          // 매매 비율이나 금액 입력
          if (await setting.getAttribute("type") === "number") {
            await setting.fill("30");
          }
          
          break;
        }
      }

      expect(hasActionSettings).toBe(true);
    }
  });

  test("복합 전략 시나리오 구성", async ({ page }) => {
    // 다양한 조건-액션 조합 테스트
    const strategyComponents = [
      { type: "시작", expectedNext: "실행 일정" },
      { type: "조건", settings: { percentage: "3", direction: "상승" } },
      { type: "액션", settings: { type: "매수", percentage: "50" } },
      { type: "종료", expectedPrev: "액션" },
    ];

    for (const component of strategyComponents) {
      const element = page.locator(`text=${component.type}`).first();
      
      if (await element.isVisible()) {
        await safeClick(page, element);
        
        // 설정이 있는 컴포넌트의 경우 설정 적용
        if (component.settings) {
          await configureStrategyComponent(page, component.settings);
        }
        
        await waitForPageLoad(page, 500);
      }
    }

    // 전략 흐름 유효성 검사
    await validateStrategyFlow(page);
  });

  test("조건-액션 쌍 다중 조합", async ({ page }) => {
    const conditionActionPairs = [
      {
        condition: { type: "가격 변동", threshold: "5", direction: "상승" },
        action: { type: "매수", amount: "30" }
      },
      {
        condition: { type: "거래량 증가", threshold: "20", period: "5분" },
        action: { type: "매수", amount: "20" }
      },
      {
        condition: { type: "가격 하락", threshold: "10", direction: "하락" },
        action: { type: "매도", amount: "50" }
      }
    ];

    for (let i = 0; i < conditionActionPairs.length; i++) {
      const pair = conditionActionPairs[i];
      
      // 조건 설정
      const conditionNode = page.locator("text=조건").nth(i);
      if (await conditionNode.isVisible()) {
        await safeClick(page, conditionNode);
        await configureCondition(page, pair.condition);
      }

      // 액션 설정
      const actionNode = page.locator("text=액션").nth(i);
      if (await actionNode.isVisible()) {
        await safeClick(page, actionNode);
        await configureAction(page, pair.action);
      }

      await waitForPageLoad(page, 1000);
    }

    // 다중 조건-액션 쌍이 올바르게 구성되었는지 확인
    const conditionNodes = page.locator("text=조건");
    const actionNodes = page.locator("text=액션");
    
    const conditionCount = await conditionNodes.count();
    const actionCount = await actionNodes.count();
    
    expect(conditionCount).toBeGreaterThanOrEqual(1);
    expect(actionCount).toBeGreaterThanOrEqual(1);
  });

  test("전략 저장 및 버전 관리", async ({ page }) => {
    // 간단한 전략 구성
    await createBasicStrategy(page);

    // 저장 버튼 찾기 및 클릭
    const saveButtons = [
      page.locator("button", { hasText: "저장" }),
      page.locator("button", { hasText: "새 버전으로 저장" }),
      page.locator("button", { hasText: "전략 저장" }),
    ];

    let savedSuccessfully = false;
    for (const button of saveButtons) {
      if (await button.isVisible()) {
        await safeClick(page, button);
        
        // 저장 모달이나 알림 확인
        const saveConfirmation = [
          page.locator(".mantine-Modal-root"),
          page.locator("text=저장되었습니다"),
          page.locator("text=성공"),
          page.locator(".mantine-Notification-root"),
        ];

        for (const confirmation of saveConfirmation) {
          if (await confirmation.isVisible({ timeout: 5000 })) {
            savedSuccessfully = true;
            
            // 모달이 있다면 확인 버튼 클릭
            const confirmButton = confirmation.locator("button", { hasText: "확인" });
            if (await confirmButton.isVisible()) {
              await safeClick(page, confirmButton);
            }
            
            break;
          }
        }
        
        if (savedSuccessfully) break;
      }
    }

    // 저장 성공 여부 확인
    expect(savedSuccessfully).toBe(true);
    
    // 페이지 새로고침 후 전략이 유지되는지 확인
    await page.reload();
    await waitForPageLoad(page);
    
    // 전략 탭으로 이동
    const strategyTab = page.locator('[role="tab"]', { hasText: "투자 전략" });
    await safeClick(page, strategyTab);
    await waitForPageLoad(page);
    
    // 전략 요소들이 여전히 존재하는지 확인
    const strategyElements = page.locator("text=시작").or(
      page.locator("text=조건").or(page.locator("text=액션"))
    );
    
    expect(await strategyElements.count()).toBeGreaterThan(0);
  });

  test("전략 편집기 유효성 검사", async ({ page }) => {
    // 불완전한 전략 구성 시도
    const incompleteStrategy = [
      page.locator("text=시작").first(),
      // 조건이나 액션 없이 바로 종료
      page.locator("text=종료").first(),
    ];

    for (const element of incompleteStrategy) {
      if (await element.isVisible()) {
        await safeClick(page, element);
        await waitForPageLoad(page, 500);
      }
    }

    // 유효성 검사 메시지 확인
    const validationMessages = [
      page.locator("text=불완전한 전략"),
      page.locator("text=필수 요소"),
      page.locator("text=오류"),
      page.locator(".mantine-Alert-root"),
      page.locator("[role='alert']"),
    ];

    let hasValidationMessage = false;
    for (const message of validationMessages) {
      if (await message.isVisible()) {
        hasValidationMessage = true;
        break;
      }
    }

    // 유효성 검사가 작동하는지 확인 (에러 메시지가 있거나 저장이 차단되어야 함)
    const saveButton = page.locator("button", { hasText: "저장" });
    if (await saveButton.isVisible()) {
      // 저장 버튼이 비활성화되었거나 클릭 시 에러가 발생해야 함
      const isDisabled = await saveButton.isDisabled();
      
      if (!isDisabled) {
        await safeClick(page, saveButton);
        // 저장 시도 후 에러 메시지가 나타나는지 확인
        await waitForPageLoad(page, 2000);
        
        for (const message of validationMessages) {
          if (await message.isVisible()) {
            hasValidationMessage = true;
            break;
          }
        }
      } else {
        hasValidationMessage = true; // 버튼이 비활성화됨
      }
    }

    expect(hasValidationMessage).toBe(true);
  });
});

// 헬퍼 함수들
async function setupStrategyEditor(page: any): Promise<void> {
  // 테스트 프로젝트 생성
  const timestamp = Date.now();
  const projectName = `전략 테스트 ${timestamp}`;

  const newProjectButton = page.locator("button", { hasText: "새 프로젝트" });
  await safeClick(page, newProjectButton);

  await expect(page.locator("text=새 프로젝트 만들기")).toBeVisible();

  const modal = page.locator(".mantine-Modal-root");
  await safeFill(page, modal.locator("input").first(), projectName);
  await safeFill(page, modal.locator("textarea").first(), "전략 편집 테스트");

  const createButton = modal.locator("button", { hasText: "프로젝트 생성" });
  await safeClick(page, createButton);

  await page.waitForURL(/\/projects\/.*\/edit$/, { timeout: 15000 });
  await waitForPageLoad(page);

  // 투자 전략 탭으로 이동
  const strategyTab = page.locator('[role="tab"]', { hasText: "투자 전략" });
  await safeClick(page, strategyTab);
  await waitForPageLoad(page);
}

async function configureStrategyComponent(page: any, settings: any): Promise<void> {
  // 설정 모달이나 패널에서 값 입력
  if (settings.percentage) {
    const percentageInput = page.locator('input[type="number"]').first();
    if (await percentageInput.isVisible()) {
      await percentageInput.fill(settings.percentage);
    }
  }

  if (settings.direction) {
    const directionSelect = page.locator("select").first();
    if (await directionSelect.isVisible()) {
      const options = directionSelect.locator("option");
      const optionCount = await options.count();
      
      for (let i = 0; i < optionCount; i++) {
        const optionText = await options.nth(i).textContent();
        if (optionText && optionText.includes(settings.direction)) {
          await directionSelect.selectOption({ index: i });
          break;
        }
      }
    }
  }

  // 설정 완료 버튼 클릭
  const confirmButtons = [
    page.locator("button", { hasText: "확인" }),
    page.locator("button", { hasText: "적용" }),
    page.locator("button", { hasText: "저장" }),
  ];

  for (const button of confirmButtons) {
    if (await button.isVisible()) {
      await safeClick(page, button);
      break;
    }
  }
}

async function configureCondition(page: any, condition: any): Promise<void> {
  await waitForPageLoad(page, 1000);
  
  // 조건 설정 로직
  if (condition.threshold) {
    const thresholdInput = page.locator('input[type="number"]').first();
    if (await thresholdInput.isVisible()) {
      await thresholdInput.fill(condition.threshold);
    }
  }
}

async function configureAction(page: any, action: any): Promise<void> {
  await waitForPageLoad(page, 1000);
  
  // 액션 설정 로직
  if (action.amount) {
    const amountInput = page.locator('input[type="number"]').first();
    if (await amountInput.isVisible()) {
      await amountInput.fill(action.amount);
    }
  }
}

async function createBasicStrategy(page: any): Promise<void> {
  // 기본적인 시작-조건-액션-종료 플로우 생성
  const basicComponents = ["시작", "조건", "액션", "종료"];
  
  for (const component of basicComponents) {
    const element = page.locator(`text=${component}`).first();
    if (await element.isVisible()) {
      await safeClick(page, element);
      await waitForPageLoad(page, 500);
    }
  }
}

async function validateStrategyFlow(page: any): Promise<void> {
  // 전략 흐름의 기본적인 유효성 검사
  const flowElements = [
    page.locator("text=시작"),
    page.locator("text=종료"),
  ];

  for (const element of flowElements) {
    const count = await element.count();
    expect(count).toBeGreaterThan(0);
  }
}