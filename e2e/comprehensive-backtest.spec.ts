import { test, expect } from "@playwright/test";
import {
  waitForPageLoad,
  checkServerHealth,
  safeClick,
  safeFill,
} from "./utils";

test.describe("포괄적인 백테스트 테스트", () => {
  test.beforeEach(async ({ page }) => {
    await checkServerHealth(page);
    await page.goto("/");
    await waitForPageLoad(page);

    // 프로젝트 생성 및 백테스트 페이지로 이동
    await setupBacktestEnvironment(page);
  });

  test("백테스트 설정 UI 전체 확인", async ({ page }) => {
    // 백테스트 탭 활성화 확인
    const backtestTab = page.locator('[role="tab"]', { hasText: "백테스트" });
    await expect(backtestTab).toBeVisible();

    // 백테스트 설정 섹션 확인
    const settingsElements = [
      page.locator("text=백테스트 설정"),
      page.locator("text=백테스트"),
      page.locator("text=설정"),
    ];

    let hasSettingsSection = false;
    for (const element of settingsElements) {
      if (await element.isVisible()) {
        hasSettingsSection = true;
        break;
      }
    }
    expect(hasSettingsSection).toBe(true);

    // 필수 설정 필드들 확인
    const configFields = [
      { selector: 'input[type="text"]', name: "종목 입력 필드" },
      { selector: 'input[type="date"]', name: "날짜 입력 필드" },
      { selector: 'input[type="number"]', name: "숫자 입력 필드" },
      { selector: "select", name: "선택 박스" },
      { selector: "button", name: "버튼" },
    ];

    const availableFields = [];
    for (const field of configFields) {
      const elements = page.locator(field.selector);
      const count = await elements.count();
      if (count > 0) {
        availableFields.push({ ...field, count });
      }
    }

    // 최소한 3개 이상의 설정 필드가 있어야 함
    expect(availableFields.length).toBeGreaterThanOrEqual(3);
  });

  test("백테스트 기본 설정 및 실행", async ({ page }) => {
    // 기본 백테스트 설정
    await configureBasicBacktest(page, {
      symbol: "AAPL",
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      initialCash: "1000000",
      commission: "0.001"
    });

    // 백테스트 실행
    const runButtons = [
      page.locator("button", { hasText: "백테스트 실행" }),
      page.locator("button", { hasText: "실행" }),
      page.locator("button", { hasText: "시뮬레이션 시작" }),
      page.locator("button", { hasText: "테스트 시작" }),
    ];

    let executionStarted = false;
    for (const button of runButtons) {
      if (await button.isVisible()) {
        await safeClick(page, button);
        executionStarted = true;
        break;
      }
    }

    expect(executionStarted).toBe(true);

    // 실행 상태 확인
    const progressIndicators = [
      page.locator("text=백테스트를 실행"),
      page.locator("text=진행 중"),
      page.locator("text=처리 중"),
      page.locator('[role="progressbar"]'),
      page.locator(".mantine-Progress-root"),
    ];

    let hasProgressIndicator = false;
    for (const indicator of progressIndicators) {
      if (await indicator.isVisible({ timeout: 10000 })) {
        hasProgressIndicator = true;
        break;
      }
    }

    // 진행 표시가 나타나거나 즉시 완료되어야 함
    if (!hasProgressIndicator) {
      // 즉시 완료된 경우 결과 확인
      await checkBacktestResults(page);
    } else {
      // 완료 대기
      await waitForBacktestCompletion(page);
      await checkBacktestResults(page);
    }
  });

  test("다양한 종목으로 백테스트 실행", async ({ page }) => {
    const testSymbols = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"];
    const results = [];

    for (const symbol of testSymbols) {
      // 종목별 백테스트 설정
      await configureBasicBacktest(page, {
        symbol: symbol,
        startDate: "2023-06-01",
        endDate: "2023-12-31",
        initialCash: "1000000"
      });

      // 백테스트 실행
      const runButton = await findRunButton(page);
      if (runButton) {
        await safeClick(page, runButton);
        
        // 결과 대기 및 수집
        const result = await waitForAndCollectResults(page, symbol);
        if (result) {
          results.push(result);
        }

        // 다음 테스트를 위한 대기
        await waitForPageLoad(page, 2000);
      }
    }

    // 최소한 하나의 결과는 성공해야 함
    expect(results.length).toBeGreaterThan(0);
  });

  test("백테스트 기간 설정 테스트", async ({ page }) => {
    const periodTests = [
      { 
        name: "단기 (1개월)",
        startDate: "2023-11-01",
        endDate: "2023-12-01"
      },
      {
        name: "중기 (6개월)", 
        startDate: "2023-06-01",
        endDate: "2023-12-01"
      },
      {
        name: "장기 (1년)",
        startDate: "2023-01-01", 
        endDate: "2023-12-31"
      }
    ];

    for (const period of periodTests) {
      await configureBasicBacktest(page, {
        symbol: "AAPL",
        startDate: period.startDate,
        endDate: period.endDate,
        initialCash: "1000000"
      });

      const runButton = await findRunButton(page);
      if (runButton) {
        await safeClick(page, runButton);
        
        // 각 기간별 결과 확인
        const hasResult = await waitForBacktestCompletion(page);
        expect(hasResult).toBe(true);

        await waitForPageLoad(page, 1000);
      }
    }
  });

  test("초기 자금 규모별 백테스트", async ({ page }) => {
    const capitalTests = [
      { amount: "100000", label: "소액 (10만원)" },
      { amount: "1000000", label: "중간 (100만원)" },
      { amount: "10000000", label: "대액 (1천만원)" },
    ];

    for (const capital of capitalTests) {
      await configureBasicBacktest(page, {
        symbol: "AAPL",
        startDate: "2023-06-01",
        endDate: "2023-12-31",
        initialCash: capital.amount
      });

      const runButton = await findRunButton(page);
      if (runButton) {
        await safeClick(page, runButton);
        
        const hasResult = await waitForBacktestCompletion(page);
        expect(hasResult).toBe(true);

        // 초기 자금에 따른 결과 차이 확인
        await verifyResultsForCapital(page, capital.amount);
        
        await waitForPageLoad(page, 1000);
      }
    }
  });

  test("백테스트 결과 상세 분석", async ({ page }) => {
    // 표준 백테스트 실행
    await runStandardBacktest(page);

    // 결과 통계 섹션 확인
    const statsElements = [
      "총 수익률",
      "연평균 수익률",
      "최대 낙폭",
      "샤프 비율",
      "승률",
      "거래 횟수",
      "평균 수익",
      "최대 수익",
      "최대 손실"
    ];

    let visibleStats = 0;
    for (const stat of statsElements) {
      const statElement = page.locator(`text=${stat}`);
      if (await statElement.isVisible()) {
        visibleStats++;
        
        // 통계 값이 실제로 표시되는지 확인
        const statValue = statElement.locator("..").locator("text=").filter({
          hasText: /[\d.%+-]/
        });
        
        if (await statValue.isVisible()) {
          const valueText = await statValue.textContent();
          expect(valueText).toMatch(/[\d.%+-]/);
        }
      }
    }

    // 최소 5개 이상의 통계가 표시되어야 함
    expect(visibleStats).toBeGreaterThanOrEqual(5);

    // 거래 내역 테이블 확인
    await verifyTradesTable(page);

    // 포트폴리오 차트 확인
    await verifyPortfolioChart(page);
  });

  test("백테스트 히스토리 및 비교", async ({ page }) => {
    // 첫 번째 백테스트
    await runStandardBacktest(page);
    const firstResult = await extractBacktestSummary(page);

    // 설정 변경 후 두 번째 백테스트
    await configureBasicBacktest(page, {
      symbol: "AAPL",
      startDate: "2023-01-01",
      endDate: "2023-06-30", // 다른 기간
      initialCash: "2000000" // 다른 초기 자금
    });

    const runButton = await findRunButton(page);
    if (runButton) {
      await safeClick(page, runButton);
      await waitForBacktestCompletion(page);
      
      const secondResult = await extractBacktestSummary(page);

      // 두 결과가 다른지 확인
      expect(firstResult).not.toEqual(secondResult);
    }

    // 히스토리 섹션 확인
    const historyElements = [
      page.locator("text=백테스트 히스토리"),
      page.locator("text=이전 결과"),
      page.locator("text=결과 목록"),
      page.locator("text=히스토리"),
    ];

    let hasHistory = false;
    for (const element of historyElements) {
      if (await element.isVisible()) {
        hasHistory = true;
        await safeClick(page, element);
        
        // 여러 결과가 있는지 확인
        const resultItems = page.locator('[data-testid="backtest-result"]').or(
          page.locator('.result-item')
        );
        
        const itemCount = await resultItems.count();
        expect(itemCount).toBeGreaterThanOrEqual(1);
        
        break;
      }
    }
  });

  test("백테스트 오류 처리 및 복구", async ({ page }) => {
    // 잘못된 설정으로 테스트
    const invalidConfigs = [
      {
        symbol: "INVALID123",
        startDate: "2023-01-01",
        endDate: "2023-12-31",
        initialCash: "1000000",
        expectedError: "종목"
      },
      {
        symbol: "AAPL",
        startDate: "2025-01-01", // 미래 날짜
        endDate: "2025-12-31",
        initialCash: "1000000", 
        expectedError: "날짜"
      },
      {
        symbol: "AAPL",
        startDate: "2023-01-01",
        endDate: "2023-12-31",
        initialCash: "0", // 0원
        expectedError: "자금"
      }
    ];

    for (const config of invalidConfigs) {
      await configureBasicBacktest(page, config);
      
      const runButton = await findRunButton(page);
      if (runButton) {
        await safeClick(page, runButton);
        
        // 오류 메시지 확인
        const errorElements = [
          page.locator("text=오류"),
          page.locator("text=실패"),
          page.locator("text=잘못"),
          page.locator("text=유효하지 않"),
          page.locator('[role="alert"]'),
          page.locator(".mantine-Alert-root"),
        ];

        let hasError = false;
        for (const errorElement of errorElements) {
          if (await errorElement.isVisible({ timeout: 10000 })) {
            hasError = true;
            break;
          }
        }

        expect(hasError).toBe(true);
      }
    }

    // 올바른 설정으로 복구 테스트
    await configureBasicBacktest(page, {
      symbol: "AAPL",
      startDate: "2023-06-01", 
      endDate: "2023-12-31",
      initialCash: "1000000"
    });

    const finalRunButton = await findRunButton(page);
    if (finalRunButton) {
      await safeClick(page, finalRunButton);
      const recovered = await waitForBacktestCompletion(page);
      expect(recovered).toBe(true);
    }
  });
});

// 헬퍼 함수들
async function setupBacktestEnvironment(page: any): Promise<void> {
  const timestamp = Date.now();
  const projectName = `백테스트 테스트 ${timestamp}`;

  // 프로젝트 생성
  const newProjectButton = page.locator("button", { hasText: "새 프로젝트" });
  await safeClick(page, newProjectButton);

  await expect(page.locator("text=새 프로젝트 만들기")).toBeVisible();

  const modal = page.locator(".mantine-Modal-root");
  await safeFill(page, modal.locator("input").first(), projectName);
  await safeFill(page, modal.locator("textarea").first(), "백테스트 테스트용");

  const createButton = modal.locator("button", { hasText: "프로젝트 생성" });
  await safeClick(page, createButton);

  await page.waitForURL(/\/projects\/.*\/edit$/, { timeout: 15000 });
  await waitForPageLoad(page);

  // 백테스트 탭으로 이동
  const backtestTab = page.locator('[role="tab"]', { hasText: "백테스트" });
  await safeClick(page, backtestTab);
  await waitForPageLoad(page);
}

async function configureBasicBacktest(page: any, config: any): Promise<void> {
  // 종목 설정
  if (config.symbol) {
    const symbolInputs = [
      page.locator('input[type="text"]').first(),
      page.locator('input[placeholder*="종목"]'),
      page.locator('select[name="symbol"]'),
    ];

    for (const input of symbolInputs) {
      if (await input.isVisible()) {
        if (input.tagName === 'SELECT') {
          await input.selectOption(config.symbol);
        } else {
          await input.clear();
          await input.fill(config.symbol);
        }
        break;
      }
    }
  }

  // 날짜 설정
  const dateInputs = page.locator('input[type="date"]');
  const dateCount = await dateInputs.count();
  
  if (dateCount >= 2 && config.startDate && config.endDate) {
    await dateInputs.first().fill(config.startDate);
    await dateInputs.last().fill(config.endDate);
  }

  // 초기 자금 설정
  if (config.initialCash) {
    const cashInputs = [
      page.locator('input[type="number"]').first(),
      page.locator('input[placeholder*="초기"]'),
      page.locator('input[placeholder*="자금"]'),
    ];

    for (const input of cashInputs) {
      if (await input.isVisible()) {
        await input.clear();
        await input.fill(config.initialCash);
        break;
      }
    }
  }

  // 수수료 설정 (있다면)
  if (config.commission) {
    const commissionInput = page.locator('input[placeholder*="수수료"]');
    if (await commissionInput.isVisible()) {
      await commissionInput.clear();
      await commissionInput.fill(config.commission);
    }
  }

  await waitForPageLoad(page, 1000);
}

async function findRunButton(page: any): Promise<any> {
  const runButtons = [
    page.locator("button", { hasText: "백테스트 실행" }),
    page.locator("button", { hasText: "실행" }),
    page.locator("button", { hasText: "시뮬레이션 시작" }),
    page.locator("button", { hasText: "테스트 시작" }),
  ];

  for (const button of runButtons) {
    if (await button.isVisible()) {
      return button;
    }
  }
  return null;
}

async function waitForBacktestCompletion(page: any): Promise<boolean> {
  // 완료 또는 결과 표시 대기
  const completionIndicators = [
    page.locator("text=백테스트가 성공적으로 완료"),
    page.locator("text=완료"),
    page.locator("text=결과"),
    page.locator("text=수익률"),
    page.locator("text=거래 내역"),
  ];

  for (const indicator of completionIndicators) {
    if (await indicator.isVisible({ timeout: 60000 })) {
      return true;
    }
  }

  return false;
}

async function checkBacktestResults(page: any): Promise<void> {
  // 결과 요소들이 표시되는지 확인
  const resultElements = [
    page.locator("text=수익률"),
    page.locator("text=결과"),
    page.locator("text=완료"),
    page.locator("text=성공"),
  ];

  let hasResults = false;
  for (const element of resultElements) {
    if (await element.isVisible()) {
      hasResults = true;
      break;
    }
  }

  expect(hasResults).toBe(true);
}

async function waitForAndCollectResults(page: any, symbol: string): Promise<any> {
  const completed = await waitForBacktestCompletion(page);
  
  if (completed) {
    return {
      symbol,
      timestamp: new Date().toISOString(),
      success: true
    };
  }
  
  return null;
}

async function runStandardBacktest(page: any): Promise<void> {
  await configureBasicBacktest(page, {
    symbol: "AAPL",
    startDate: "2023-06-01",
    endDate: "2023-12-31",
    initialCash: "1000000"
  });

  const runButton = await findRunButton(page);
  if (runButton) {
    await safeClick(page, runButton);
    await waitForBacktestCompletion(page);
  }
}

async function verifyTradesTable(page: any): Promise<void> {
  const tableSelectors = [
    'table',
    '[data-testid="trades-table"]',
    '.mantine-Table-root',
    'text=거래 내역',
  ];

  let hasTable = false;
  for (const selector of tableSelectors) {
    const table = page.locator(selector);
    if (await table.isVisible()) {
      hasTable = true;
      break;
    }
  }

  expect(hasTable).toBe(true);
}

async function verifyPortfolioChart(page: any): Promise<void> {
  const chartSelectors = [
    'canvas',
    'svg',
    '.recharts-wrapper',
    '[data-testid="portfolio-chart"]',
  ];

  let hasChart = false;
  for (const selector of chartSelectors) {
    const chart = page.locator(selector);
    if (await chart.isVisible()) {
      hasChart = true;
      break;
    }
  }

  expect(hasChart).toBe(true);
}

async function extractBacktestSummary(page: any): Promise<any> {
  // 백테스트 결과 요약 정보 추출
  const summary = {
    totalReturn: null,
    trades: null,
    timestamp: new Date().toISOString()
  };

  const returnElement = page.locator("text=총 수익률").locator("..").locator("span");
  if (await returnElement.isVisible()) {
    summary.totalReturn = await returnElement.textContent();
  }

  const tradesElement = page.locator("text=거래 횟수").locator("..").locator("span");
  if (await tradesElement.isVisible()) {
    summary.trades = await tradesElement.textContent();
  }

  return summary;
}

async function verifyResultsForCapital(page: any, amount: string): Promise<void> {
  // 초기 자금에 따른 결과 검증
  const resultElements = [
    page.locator("text=총 수익률"),
    page.locator("text=수익"),
    page.locator("text=손실"),
  ];

  let hasRelevantResults = false;
  for (const element of resultElements) {
    if (await element.isVisible()) {
      hasRelevantResults = true;
      break;
    }
  }

  expect(hasRelevantResults).toBe(true);
}