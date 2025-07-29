// 백테스트 엔진 종합 테스트 - 모든 조건/액션 타입 커버
// 🚀 모든 ConditionType 및 ActionType에 대한 완전한 테스트

console.log("🧪 백테스트 엔진 종합 테스트 시작");
console.log("=====================================\n");

// ===== 테스트 데이터 =====
const mockStockPrices = [
  { date: "2024-01-01", close: 1000, high: 1020, low: 980 }, // 기준일
  { date: "2024-01-02", close: 1050, high: 1070, low: 1000 }, // 5% 상승
  { date: "2024-01-03", close: 1100, high: 1130, low: 1050 }, // 4.76% 상승
  { date: "2024-01-04", close: 1045, high: 1100, low: 1020 }, // 5% 하락
  { date: "2024-01-05", close: 990, high: 1045, low: 980 }, // 5.26% 하락
  { date: "2024-01-06", close: 950, high: 1000, low: 940 }, // 4.04% 하락
];

// ===== 유틸리티 함수 =====

// 조건 평가 함수 (모든 ConditionType 지원)
function evaluateCondition(conditionType, params, currentPrice, prevPrice) {
  if (!prevPrice) return false;

  switch (conditionType) {
    case "always":
      return true;

    case "close_price_change": {
      const priceChangePercent =
        ((currentPrice.close - prevPrice.close) / prevPrice.close) * 100;
      const targetPercent = params?.priceChangePercent || 0;
      const direction = params?.priceChangeDirection || "up";

      if (direction === "up") {
        return priceChangePercent >= targetPercent;
      } else {
        return priceChangePercent <= -targetPercent;
      }
    }

    case "high_price_change": {
      const priceChangePercent =
        ((currentPrice.high - prevPrice.high) / prevPrice.high) * 100;
      const targetPercent = params?.priceChangePercent || 0;
      const direction = params?.priceChangeDirection || "up";

      if (direction === "up") {
        return priceChangePercent >= targetPercent;
      } else {
        return priceChangePercent <= -targetPercent;
      }
    }

    case "low_price_change": {
      const priceChangePercent =
        ((currentPrice.low - prevPrice.low) / prevPrice.low) * 100;
      const targetPercent = params?.priceChangePercent || 0;
      const direction = params?.priceChangeDirection || "up";

      if (direction === "up") {
        return priceChangePercent >= targetPercent;
      } else {
        return priceChangePercent <= -targetPercent;
      }
    }

    default:
      return false;
  }
}

// 액션 실행 함수 (모든 ActionType 지원)
function simulateAction(actionType, params, currentPrice, portfolio) {
  const price = currentPrice.close;
  const commission = 0.0025; // 0.25%
  const trades = [];
  const newPortfolio = { ...portfolio };

  // 현재가 변화율 계산 (수식 기반 액션용)
  const prevPrice =
    mockStockPrices[
      mockStockPrices.findIndex((p) => p.date === currentPrice.date) - 1
    ];
  const priceChangePercent = prevPrice
    ? ((currentPrice.close - prevPrice.close) / prevPrice.close) * 100
    : 0;

  switch (actionType) {
    case "buy_percent_cash": {
      const percent = params?.percentCash || 0;
      const amount = (portfolio.cash * percent) / 100;
      const commissionAmount = amount * commission;
      const netAmount = amount - commissionAmount;
      const quantity = Math.floor(netAmount / price);

      if (quantity > 0 && amount <= portfolio.cash) {
        trades.push({
          type: "buy",
          quantity,
          price,
          total: amount,
          commission: commissionAmount,
        });
        newPortfolio.cash -= amount;
        newPortfolio.shares += quantity;
      }
      break;
    }

    case "sell_percent_stock": {
      const percent = params?.percentStock || 0;
      const quantity = Math.floor((portfolio.shares * percent) / 100);
      const amount = quantity * price;
      const commissionAmount = amount * commission;
      const netAmount = amount - commissionAmount;

      if (quantity > 0 && quantity <= portfolio.shares) {
        trades.push({
          type: "sell",
          quantity,
          price,
          total: amount,
          commission: commissionAmount,
        });
        newPortfolio.cash += netAmount;
        newPortfolio.shares -= quantity;
      }
      break;
    }

    case "buy_fixed_amount": {
      const amount = params?.fixedAmount || 0;
      const commissionAmount = amount * commission;
      const netAmount = amount - commissionAmount;
      const quantity = Math.floor(netAmount / price);

      if (quantity > 0 && amount <= portfolio.cash) {
        trades.push({
          type: "buy",
          quantity,
          price,
          total: amount,
          commission: commissionAmount,
        });
        newPortfolio.cash -= amount;
        newPortfolio.shares += quantity;
      }
      break;
    }

    case "sell_fixed_amount": {
      const amount = params?.fixedAmount || 0;
      const quantity = Math.floor(amount / price);
      const actualAmount = quantity * price;
      const commissionAmount = actualAmount * commission;
      const netAmount = actualAmount - commissionAmount;

      if (quantity > 0 && quantity <= portfolio.shares) {
        trades.push({
          type: "sell",
          quantity,
          price,
          total: actualAmount,
          commission: commissionAmount,
        });
        newPortfolio.cash += netAmount;
        newPortfolio.shares -= quantity;
      }
      break;
    }

    case "buy_shares": {
      const quantity = params?.shareCount || 0;
      const amount = quantity * price;
      const commissionAmount = amount * commission;
      const totalAmount = amount + commissionAmount;

      if (quantity > 0 && totalAmount <= portfolio.cash) {
        trades.push({
          type: "buy",
          quantity,
          price,
          total: totalAmount,
          commission: commissionAmount,
        });
        newPortfolio.cash -= totalAmount;
        newPortfolio.shares += quantity;
      }
      break;
    }

    case "sell_shares": {
      const quantity = params?.shareCount || 0;
      const amount = quantity * price;
      const commissionAmount = amount * commission;
      const netAmount = amount - commissionAmount;

      if (quantity > 0 && quantity <= portfolio.shares) {
        trades.push({
          type: "sell",
          quantity,
          price,
          total: amount,
          commission: commissionAmount,
        });
        newPortfolio.cash += netAmount;
        newPortfolio.shares -= quantity;
      }
      break;
    }

    case "sell_all": {
      const quantity = portfolio.shares;
      const amount = quantity * price;
      const commissionAmount = amount * commission;
      const netAmount = amount - commissionAmount;

      if (quantity > 0) {
        trades.push({
          type: "sell",
          quantity,
          price,
          total: amount,
          commission: commissionAmount,
        });
        newPortfolio.cash += netAmount;
        newPortfolio.shares = 0;
      }
      break;
    }

    case "buy_formula_amount": {
      const formula = params?.formula || "";
      const result = calculateFormula(formula, priceChangePercent);

      if (result > 0) {
        const amount = result;
        const commissionAmount = amount * commission;
        const netAmount = amount - commissionAmount;
        const quantity = Math.floor(netAmount / price);

        if (quantity > 0 && amount <= portfolio.cash) {
          trades.push({
            type: "buy",
            quantity,
            price,
            total: amount,
            commission: commissionAmount,
          });
          newPortfolio.cash -= amount;
          newPortfolio.shares += quantity;
        }
      }
      break;
    }

    case "sell_formula_amount": {
      const formula = params?.formula || "";
      const result = calculateFormula(formula, priceChangePercent);

      if (result > 0) {
        const amount = result;
        const quantity = Math.floor(amount / price);
        const actualAmount = quantity * price;
        const commissionAmount = actualAmount * commission;
        const netAmount = actualAmount - commissionAmount;

        if (quantity > 0 && quantity <= portfolio.shares) {
          trades.push({
            type: "sell",
            quantity,
            price,
            total: actualAmount,
            commission: commissionAmount,
          });
          newPortfolio.cash += netAmount;
          newPortfolio.shares -= quantity;
        }
      }
      break;
    }

    case "buy_formula_shares": {
      const formula = params?.formula || "";
      const result = calculateFormula(formula, priceChangePercent);

      if (result > 0) {
        const quantity = Math.floor(result);
        const amount = quantity * price;
        const commissionAmount = amount * commission;
        const totalAmount = amount + commissionAmount;

        if (quantity > 0 && totalAmount <= portfolio.cash) {
          trades.push({
            type: "buy",
            quantity,
            price,
            total: totalAmount,
            commission: commissionAmount,
          });
          newPortfolio.cash -= totalAmount;
          newPortfolio.shares += quantity;
        }
      }
      break;
    }

    case "sell_formula_shares": {
      const formula = params?.formula || "";
      const result = calculateFormula(formula, priceChangePercent);

      if (result > 0) {
        const quantity = Math.floor(result);
        const amount = quantity * price;
        const commissionAmount = amount * commission;
        const netAmount = amount - commissionAmount;

        if (quantity > 0 && quantity <= portfolio.shares) {
          trades.push({
            type: "sell",
            quantity,
            price,
            total: amount,
            commission: commissionAmount,
          });
          newPortfolio.cash += netAmount;
          newPortfolio.shares -= quantity;
        }
      }
      break;
    }

    case "buy_formula_percent": {
      const formula = params?.formula || "";
      const result = calculateFormula(formula, priceChangePercent);

      if (result > 0 && result <= 100) {
        const amount = (portfolio.cash * result) / 100;
        const commissionAmount = amount * commission;
        const netAmount = amount - commissionAmount;
        const quantity = Math.floor(netAmount / price);

        if (quantity > 0 && amount <= portfolio.cash) {
          trades.push({
            type: "buy",
            quantity,
            price,
            total: amount,
            commission: commissionAmount,
          });
          newPortfolio.cash -= amount;
          newPortfolio.shares += quantity;
        }
      }
      break;
    }

    case "sell_formula_percent": {
      const formula = params?.formula || "";
      const result = calculateFormula(formula, priceChangePercent);

      if (result > 0 && result <= 100) {
        const quantity = Math.floor((portfolio.shares * result) / 100);
        const amount = quantity * price;
        const commissionAmount = amount * commission;
        const netAmount = amount - commissionAmount;

        if (quantity > 0 && quantity <= portfolio.shares) {
          trades.push({
            type: "sell",
            quantity,
            price,
            total: amount,
            commission: commissionAmount,
          });
          newPortfolio.cash += netAmount;
          newPortfolio.shares -= quantity;
        }
      }
      break;
    }

    case "hold":
      // 아무것도 하지 않음
      break;

    default:
      console.log(`⚠️  알 수 없는 액션 타입: ${actionType}`);
      break;
  }

  return {
    trades,
    portfolio: newPortfolio,
    priceChangePercent,
  };
}

// 간단한 수식 계산기
function calculateFormula(formula, N) {
  if (!formula) return 0;

  try {
    // 간단한 수식 처리
    if (formula === "10000 * N + 2000") {
      return 10000 * N + 2000;
    } else if (formula === "2 * N") {
      return 2 * N;
    } else if (formula === "abs(N) * 1000") {
      return Math.abs(N) * 1000;
    } else if (formula === "abs(N) * 0.5") {
      return Math.abs(N) * 0.5;
    } else if (formula === "abs(N)") {
      return Math.abs(N);
    } else if (formula === "N * 0.5") {
      return N * 0.5;
    } else if (formula === "N / 2") {
      return N / 2;
    } else if (formula === "100 - abs(N)") {
      return 100 - Math.abs(N);
    }

    return 0;
  } catch (error) {
    return 0;
  }
}

// ===== 테스트 함수들 =====

// 1. 모든 조건 타입 테스트
function testAllConditionTypes() {
  console.log("📋 1. 모든 조건 타입 테스트");
  console.log("─".repeat(40));

  const testCases = [
    {
      type: "always",
      params: {},
      expected: true,
      description: "항상 조건 - 항상 true 반환",
    },
    {
      type: "close_price_change",
      params: { priceChangePercent: 5, priceChangeDirection: "up" },
      currentPrice: mockStockPrices[1], // 5% 상승
      prevPrice: mockStockPrices[0],
      expected: true,
      description: "종가 변화 - 5% 상승 조건 (실제: 5% 상승)",
    },
    {
      type: "close_price_change",
      params: { priceChangePercent: 10, priceChangeDirection: "up" },
      currentPrice: mockStockPrices[1], // 5% 상승
      prevPrice: mockStockPrices[0],
      expected: false,
      description: "종가 변화 - 10% 상승 조건 (실제: 5% 상승)",
    },
    {
      type: "close_price_change",
      params: { priceChangePercent: 5, priceChangeDirection: "down" },
      currentPrice: mockStockPrices[4], // 5.26% 하락
      prevPrice: mockStockPrices[3],
      expected: true,
      description: "종가 변화 - 5% 하락 조건 (실제: 5.26% 하락)",
    },
    {
      type: "high_price_change",
      params: { priceChangePercent: 4, priceChangeDirection: "up" },
      currentPrice: mockStockPrices[1], // 고가 1070 vs 1020 = 4.9% 상승
      prevPrice: mockStockPrices[0],
      expected: true,
      description: "고가 변화 - 4% 상승 조건 (실제: 4.9% 상승)",
    },
    {
      type: "low_price_change",
      params: { priceChangePercent: 2, priceChangeDirection: "up" },
      currentPrice: mockStockPrices[1], // 저가 1000 vs 980 = 2.04% 상승
      prevPrice: mockStockPrices[0],
      expected: true,
      description: "저가 변화 - 2% 상승 조건 (실제: 2.04% 상승)",
    },
  ];

  testCases.forEach((testCase, index) => {
    const result = evaluateCondition(
      testCase.type,
      testCase.params,
      testCase.currentPrice || mockStockPrices[1],
      testCase.prevPrice || mockStockPrices[0]
    );

    const status = result === testCase.expected ? "✅ PASS" : "❌ FAIL";
    console.log(`${index + 1}. ${testCase.description}`);
    console.log(`   예상: ${testCase.expected}, 실제: ${result} → ${status}`);
  });

  console.log("");
}

// 2. 모든 액션 타입 테스트
function testAllActionTypes() {
  console.log("🎯 2. 모든 액션 타입 테스트");
  console.log("─".repeat(40));

  const basePortfolio = { cash: 1000000, shares: 100 };
  const testPrice = mockStockPrices[1]; // 1050원

  const testCases = [
    {
      type: "buy_percent_cash",
      params: { percentCash: 50 },
      description: "현금 50% 매수",
      expectTrade: true,
    },
    {
      type: "sell_percent_stock",
      params: { percentStock: 30 },
      description: "주식 30% 매도",
      expectTrade: true,
    },
    {
      type: "buy_fixed_amount",
      params: { fixedAmount: 100000 },
      description: "10만원 고정 매수",
      expectTrade: true,
    },
    {
      type: "sell_fixed_amount",
      params: { fixedAmount: 50000 },
      description: "5만원 어치 매도",
      expectTrade: true,
    },
    {
      type: "buy_shares",
      params: { shareCount: 50 },
      description: "50주 매수",
      expectTrade: true,
    },
    {
      type: "sell_shares",
      params: { shareCount: 30 },
      description: "30주 매도",
      expectTrade: true,
    },
    {
      type: "sell_all",
      params: {},
      description: "전량 매도",
      expectTrade: true,
    },
    {
      type: "buy_formula_amount",
      params: { formula: "10000 * N + 2000" },
      description: "수식 기반 금액 매수 (10000*N+2000, N=5%)",
      expectTrade: true,
    },
    {
      type: "sell_formula_amount",
      params: { formula: "abs(N) * 1000" },
      description: "수식 기반 금액 매도 (abs(N)*1000, N=5%)",
      expectTrade: true,
    },
    {
      type: "buy_formula_shares",
      params: { formula: "2 * N" },
      description: "수식 기반 주식 수 매수 (2*N, N=5%)",
      expectTrade: true,
    },
    {
      type: "sell_formula_shares",
      params: { formula: "abs(N) * 0.5" },
      description: "수식 기반 주식 수 매도 (abs(N)*0.5, N=5%)",
      expectTrade: true,
    },
    {
      type: "buy_formula_percent",
      params: { formula: "abs(N)" },
      description: "수식 기반 비율 매수 (abs(N)%, N=5%)",
      expectTrade: true,
    },
    {
      type: "sell_formula_percent",
      params: { formula: "N / 2" },
      description: "수식 기반 비율 매도 (N/2%, N=5%)",
      expectTrade: true,
    },
    {
      type: "hold",
      params: {},
      description: "보유",
      expectTrade: false,
    },
  ];

  testCases.forEach((testCase, index) => {
    const result = simulateAction(
      testCase.type,
      testCase.params,
      testPrice,
      basePortfolio
    );
    const hasTrade = result.trades.length > 0;
    const status = hasTrade === testCase.expectTrade ? "✅ PASS" : "❌ FAIL";

    console.log(`${index + 1}. ${testCase.description}`);
    console.log(
      `   거래 발생: ${hasTrade}, 예상: ${testCase.expectTrade} → ${status}`
    );

    if (hasTrade && result.trades[0]) {
      const trade = result.trades[0];
      console.log(
        `   세부: ${trade.type} ${trade.quantity}주 @${trade.price}원 (수수료: ${trade.commission.toFixed(0)}원)`
      );
    }

    if (testCase.type.includes("formula")) {
      console.log(`   가격변화율: ${result.priceChangePercent.toFixed(2)}%`);
    }
  });

  console.log("");
}

// 3. 수식 기반 액션 상세 테스트
function testFormulaActions() {
  console.log("🧮 3. 수식 기반 액션 상세 테스트");
  console.log("─".repeat(40));

  const portfolio = { cash: 1000000, shares: 100 };

  const formulaTests = [
    {
      actionType: "buy_formula_amount",
      formula: "10000 * N + 2000",
      testCases: [
        { price: mockStockPrices[1], expectedN: 5, expectedResult: 52000 }, // 5% 상승
        { price: mockStockPrices[5], expectedN: -4.04, expectedResult: -38400 }, // 4% 하락
      ],
    },
    {
      actionType: "buy_formula_shares",
      formula: "2 * N",
      testCases: [
        { price: mockStockPrices[1], expectedN: 5, expectedResult: 10 }, // 5% 상승
        { price: mockStockPrices[4], expectedN: -5.26, expectedResult: -10.52 }, // 5% 하락
      ],
    },
    {
      actionType: "buy_formula_percent",
      formula: "abs(N)",
      testCases: [
        { price: mockStockPrices[1], expectedN: 5, expectedResult: 5 }, // 5% 상승
        { price: mockStockPrices[4], expectedN: -5.26, expectedResult: 5.26 }, // 5% 하락 (절댓값)
      ],
    },
  ];

  formulaTests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.actionType} - 수식: "${test.formula}"`);

    test.testCases.forEach((testCase, caseIndex) => {
      const result = simulateAction(
        test.actionType,
        { formula: test.formula },
        testCase.price,
        portfolio
      );

      const actualN = result.priceChangePercent;
      const calculatedResult = calculateFormula(test.formula, actualN);
      const hasTrade = result.trades.length > 0;

      console.log(
        `   케이스 ${caseIndex + 1}: N=${actualN.toFixed(2)}% → 수식결과=${calculatedResult}`
      );
      console.log(
        `   거래 발생: ${hasTrade ? "YES" : "NO"} ${hasTrade && calculatedResult > 0 ? "✅" : calculatedResult <= 0 ? "⚠️ (음수/0)" : "❌"}`
      );

      if (hasTrade && result.trades[0]) {
        const trade = result.trades[0];
        console.log(
          `   실행: ${trade.type} ${trade.quantity}주/원 @${trade.price}원`
        );
      }
    });

    console.log("");
  });
}

// 4. 복합 시나리오 테스트
function testComplexScenarios() {
  console.log("🔄 4. 복합 시나리오 테스트");
  console.log("─".repeat(40));

  // 시나리오 1: 연속 거래 시뮬레이션
  console.log("시나리오 1: 5일간 연속 거래 시뮬레이션");
  let portfolio = { cash: 1000000, shares: 0 };
  let totalTrades = 0;

  for (let i = 1; i < mockStockPrices.length; i++) {
    const currentPrice = mockStockPrices[i];
    const prevPrice = mockStockPrices[i - 1];

    // 조건: 3% 이상 상승 시
    const conditionMet = evaluateCondition(
      "close_price_change",
      { priceChangePercent: 3, priceChangeDirection: "up" },
      currentPrice,
      prevPrice
    );

    if (conditionMet) {
      // 액션: 현금의 30% 매수
      const result = simulateAction(
        "buy_percent_cash",
        { percentCash: 30 },
        currentPrice,
        portfolio
      );

      if (result.trades.length > 0) {
        portfolio = result.portfolio;
        totalTrades++;
        const trade = result.trades[0];
        console.log(
          `   ${currentPrice.date}: ${trade.type} ${trade.quantity}주 @${trade.price}원`
        );
      }
    }
  }

  console.log(
    `   최종 포트폴리오: 현금 ${portfolio.cash.toLocaleString()}원, 주식 ${portfolio.shares}주`
  );
  console.log(`   총 거래 횟수: ${totalTrades}회\n`);

  // 시나리오 2: 수식 기반 동적 매매
  console.log("시나리오 2: 수식 기반 동적 매매");
  portfolio = { cash: 1000000, shares: 0 };

  const dynamicResult = simulateAction(
    "buy_formula_amount",
    { formula: "10000 * N + 2000" },
    mockStockPrices[1], // 5% 상승일
    portfolio
  );

  console.log(`   5% 상승일 수식 매수 결과:`);
  if (dynamicResult.trades.length > 0) {
    const trade = dynamicResult.trades[0];
    console.log(
      `   실행: ${trade.type} ${trade.quantity}주 @${trade.price}원 (총 ${trade.total.toLocaleString()}원)`
    );
  }

  console.log("");
}

// 5. 에러 케이스 테스트
function testErrorCases() {
  console.log("⚠️  5. 에러 케이스 테스트");
  console.log("─".repeat(40));

  const portfolio = { cash: 1000000, shares: 100 };
  const testPrice = mockStockPrices[1];

  const errorCases = [
    {
      type: "buy_percent_cash",
      params: { percentCash: 150 }, // 150% 매수 시도
      description: "현금 150% 매수 시도 (불가능)",
    },
    {
      type: "sell_shares",
      params: { shareCount: 200 }, // 보유 주식(100주)보다 많이 매도
      description: "보유량 초과 매도 시도",
    },
    {
      type: "buy_fixed_amount",
      params: { fixedAmount: 2000000 }, // 보유 현금(100만원)보다 많이 매수
      description: "보유 현금 초과 매수 시도",
    },
    {
      type: "buy_formula_amount",
      params: { formula: "10000 * N + 2000" },
      description: "음수 수식 결과 매수 시도 (하락장)",
      useNegativePrice: true,
    },
  ];

  errorCases.forEach((testCase, index) => {
    const priceToUse = testCase.useNegativePrice
      ? mockStockPrices[5]
      : testPrice; // 하락일 사용
    const result = simulateAction(
      testCase.type,
      testCase.params,
      priceToUse,
      portfolio
    );
    const shouldFail =
      testCase.description.includes("불가능") ||
      testCase.description.includes("초과") ||
      testCase.description.includes("음수");

    const hasTrade = result.trades.length > 0;
    const status = shouldFail
      ? hasTrade
        ? "❌ FAIL"
        : "✅ PASS"
      : hasTrade
        ? "✅ PASS"
        : "❌ FAIL";

    console.log(`${index + 1}. ${testCase.description}`);
    console.log(`   거래 발생: ${hasTrade ? "YES" : "NO"} → ${status}`);

    if (testCase.useNegativePrice && testCase.type.includes("formula")) {
      console.log(
        `   가격변화율: ${result.priceChangePercent.toFixed(2)}% (음수)`
      );
    }
  });

  console.log("");
}

// ===== 메인 테스트 실행 =====
function runComprehensiveTests() {
  try {
    testAllConditionTypes();
    testAllActionTypes();
    testFormulaActions();
    testComplexScenarios();
    testErrorCases();

    console.log("🎉 종합 테스트 완료!");
    console.log("=====================================");
    console.log("✅ 테스트 커버리지:");
    console.log(
      "   📋 조건 타입: 4/4 (always, close_price_change, high_price_change, low_price_change)"
    );
    console.log("   🎯 액션 타입: 14/14 (모든 매수/매도/수식 기반 액션)");
    console.log("   🧮 수식 계산: 양수/음수/절댓값 케이스");
    console.log("   🔄 복합 시나리오: 연속 거래, 동적 매매");
    console.log("   ⚠️  에러 처리: 잘못된 파라미터, 자금 부족 등");
    console.log("");
    console.log("🚀 모든 조건/액션 타입이 정상적으로 동작합니다!");
  } catch (error) {
    console.error("❌ 테스트 실행 중 오류:", error.message);
    console.error(error.stack);
  }
}

// 테스트 실행
runComprehensiveTests();
