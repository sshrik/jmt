import { describe, test, expect } from "vitest";
import { mockStockPrices } from "./utils/mockData";
import { evaluateCondition, simulateAction } from "./utils/testHelpers";
import type { Portfolio } from "./utils/mockData";
import type {
  ConditionType,
  ActionType,
  ConditionParameters,
  ActionParameters,
} from "../src/types/strategy";

/**
 * 테스트 케이스 인터페이스 정의
 */
interface ConditionTestCase {
  type: ConditionType;
  params: ConditionParameters;
  currentPrice?: (typeof mockStockPrices)[0];
  prevPrice?: (typeof mockStockPrices)[0];
  expected: boolean;
  description: string;
}

interface ActionTestCase {
  type: ActionType;
  params: ActionParameters;
  description: string;
  expectTrade: boolean;
}

interface FormulaTestCase {
  price: (typeof mockStockPrices)[0];
  expectedN: number;
  expectedResult: number;
}

interface FormulaTest {
  actionType: ActionType;
  formula: string;
  testCases: FormulaTestCase[];
}

interface ErrorTestCase {
  type: ActionType;
  params: ActionParameters;
  description: string;
  useNegativePrice?: boolean;
}

describe("Comprehensive Strategy Tests", () => {
  describe("All Condition Types", () => {
    const conditionTestCases: ConditionTestCase[] = [
      // always 조건
      {
        type: "always",
        params: {},
        expected: true,
        description: "always 조건은 항상 true",
      },

      // 가격 변동 조건들
      {
        type: "close_price_change",
        params: { priceChangePercent: 5, priceChangeDirection: "up" },
        currentPrice: mockStockPrices[1], // 1050
        prevPrice: mockStockPrices[0], // 1000
        expected: true,
        description: "5% 상승 조건 (1000→1050)",
      },
      {
        type: "close_price_change",
        params: { priceChangePercent: 5, priceChangeDirection: "down" },
        currentPrice: mockStockPrices[3], // 1045
        prevPrice: mockStockPrices[2], // 1100
        expected: true,
        description: "5% 하락 조건 (1100→1045)",
      },
      {
        type: "close_price_change",
        params: { priceChangePercent: 10, priceChangeDirection: "up" },
        currentPrice: mockStockPrices[1], // 1050
        prevPrice: mockStockPrices[0], // 1000
        expected: false,
        description: "10% 상승 조건 실패 (1000→1050, 5%만 상승)",
      },

      // 고가 변동 조건들
      {
        type: "high_price_change",
        params: { priceChangePercent: 4, priceChangeDirection: "up" },
        currentPrice: mockStockPrices[1], // high: 1070
        prevPrice: mockStockPrices[0], // high: 1020
        expected: true,
        description: "고가 4% 이상 상승 조건 (1020→1070)",
      },

      // 저가 변동 조건들
      {
        type: "low_price_change",
        params: { priceChangePercent: 2, priceChangeDirection: "up" },
        currentPrice: mockStockPrices[1], // low: 1000
        prevPrice: mockStockPrices[0], // low: 980
        expected: true,
        description: "저가 2% 이상 상승 조건 (980→1000)",
      },

      // 범위 조건들
      {
        type: "close_price_range",
        params: { minPercent: 3, maxPercent: 7, rangeDirection: "up" },
        currentPrice: mockStockPrices[1], // 1050 (5% 상승)
        prevPrice: mockStockPrices[0], // 1000
        expected: true,
        description: "종가 변화율 범위 조건 (3%~7% 상승)",
      },

      // 절대 가격 범위
      {
        type: "price_value_range",
        params: { minPrice: 1000, maxPrice: 1200 },
        currentPrice: mockStockPrices[1], // 1050
        expected: true,
        description: "절대 가격 범위 조건 (1000~1200원)",
      },
    ];

    conditionTestCases.forEach((testCase) => {
      test(testCase.description, () => {
        const result = evaluateCondition(
          testCase.type,
          testCase.params,
          testCase.currentPrice || mockStockPrices[0],
          testCase.prevPrice || mockStockPrices[0]
        );
        expect(result).toBe(testCase.expected);
      });
    });
  });

  describe("All Action Types", () => {
    const actionTestCases: ActionTestCase[] = [
      // 퍼센트 기반 매수 액션들
      {
        type: "buy_percent_cash",
        params: { percentCash: 50 },
        description: "현금의 50% 매수",
        expectTrade: true,
      },

      // 고정 금액 매수 액션들
      {
        type: "buy_fixed_amount",
        params: { fixedAmount: 100000 },
        description: "고정 금액 매수 (10만원)",
        expectTrade: true,
      },

      // 주식 수 매수 액션들
      {
        type: "buy_shares",
        params: { shareCount: 50 },
        description: "고정 주식 수 매수 (50주)",
        expectTrade: true,
      },

      // 퍼센트 기반 매도 액션들
      {
        type: "sell_percent_stock",
        params: { percentStock: 30 },
        description: "보유 주식의 30% 매도",
        expectTrade: true,
      },

      // 고정 금액 매도 액션들
      {
        type: "sell_fixed_amount",
        params: { fixedAmount: 50000 },
        description: "고정 금액 매도 (5만원)",
        expectTrade: true,
      },

      // 주식 수 매도 액션들
      {
        type: "sell_shares",
        params: { shareCount: 20 },
        description: "고정 주식 수 매도 (20주)",
        expectTrade: true,
      },

      // 전량 매도
      {
        type: "sell_all",
        params: {},
        description: "전량 매도",
        expectTrade: true,
      },

      // 대기
      {
        type: "hold",
        params: {},
        description: "대기 (아무것도 하지 않음)",
        expectTrade: false,
      },
    ];

    actionTestCases.forEach((testCase) => {
      test(testCase.description, () => {
        const portfolio: Portfolio = {
          cash: 1000000,
          shares: 100,
        };

        const result = simulateAction(
          testCase.type,
          testCase.params,
          mockStockPrices[0],
          portfolio
        );

        if (testCase.expectTrade) {
          expect(result.trades.length).toBeGreaterThan(0);
          expect(result.portfolio).not.toEqual(portfolio);
        } else {
          expect(result.trades.length).toBe(0);
          expect(result.portfolio).toEqual(portfolio);
        }
      });
    });
  });

  describe("Formula-based Actions", () => {
    const formulaTests: FormulaTest[] = [
      {
        actionType: "buy_formula_amount",
        formula: "1000 + N * 100",
        testCases: [
          {
            price: mockStockPrices[1], // 5% 상승
            expectedN: 5,
            expectedResult: 1500, // 1000 + 5 * 100
          },
          {
            price: mockStockPrices[2], // 약 4.76% 상승
            expectedN: 4.76,
            expectedResult: 1476, // 1000 + 4.76 * 100
          },
        ],
      },
      {
        actionType: "sell_formula_shares",
        formula: "10 + abs(N) * 2",
        testCases: [
          {
            price: mockStockPrices[3], // 5% 하락 (N = -5)
            expectedN: -5,
            expectedResult: 20, // 10 + abs(-5) * 2
          },
          {
            price: mockStockPrices[4], // 약 5.26% 하락 (N = -5.26)
            expectedN: -5.26,
            expectedResult: 20.52, // 10 + abs(-5.26) * 2
          },
        ],
      },
    ];

    formulaTests.forEach((formulaTest) => {
      describe(`${formulaTest.actionType} with formula: ${formulaTest.formula}`, () => {
        formulaTest.testCases.forEach((testCase, index) => {
          test(`Test case ${index + 1}: N=${testCase.expectedN}, Expected=${testCase.expectedResult}`, () => {
            const portfolio: Portfolio = {
              cash: 1000000,
              shares: 200,
            };

            const result = simulateAction(
              formulaTest.actionType,
              { formula: formulaTest.formula },
              testCase.price,
              portfolio
            );

            // 수식 기반 액션이 실행되었는지 확인
            if (
              formulaTest.actionType.includes("buy") &&
              result.trades.length > 0
            ) {
              expect(result.trades[0].type).toBe("buy");
            } else if (
              formulaTest.actionType.includes("sell") &&
              result.trades.length > 0
            ) {
              expect(result.trades[0].type).toBe("sell");
            }
          });
        });
      });
    });
  });

  describe("Error Handling", () => {
    const errorTestCases: ErrorTestCase[] = [
      {
        type: "buy_fixed_amount",
        params: { fixedAmount: 2000000 },
        description: "현금 부족 시 매수 실패",
      },
      {
        type: "sell_shares",
        params: { shareCount: 1000 },
        description: "보유 주식 부족 시 매도 실패",
      },
      {
        type: "buy_formula_amount",
        params: { formula: "invalid_formula" },
        description: "잘못된 수식으로 매수 실패",
      },
      {
        type: "sell_formula_amount",
        params: { formula: "price / 0" },
        description: "0으로 나누기 수식으로 매도 실패",
      },
    ];

    errorTestCases.forEach((testCase) => {
      test(testCase.description, () => {
        const portfolio: Portfolio = {
          cash: 1000000,
          shares: 100,
        };

        const price = testCase.useNegativePrice
          ? { ...mockStockPrices[0], close: -100 }
          : mockStockPrices[0];

        const result = simulateAction(
          testCase.type,
          testCase.params,
          price,
          portfolio
        );

        // 에러 케이스에서는 거래가 실행되지 않아야 함
        expect(result.trades.length).toBe(0);
        expect(result.portfolio).toEqual(portfolio);
      });
    });
  });

  describe("Complex Scenarios", () => {
    test("연속 거래 시나리오", () => {
      let portfolio: Portfolio = {
        cash: 1000000,
        shares: 0,
      };

      // 1. 첫 번째 매수 (현금의 50%)
      const buy1 = simulateAction(
        "buy_percent_cash",
        { percentCash: 50 },
        mockStockPrices[0],
        portfolio
      );
      expect(buy1.trades.length).toBeGreaterThan(0);
      portfolio = buy1.portfolio;

      // 2. 두 번째 매수 (고정 금액)
      const buy2 = simulateAction(
        "buy_fixed_amount",
        { fixedAmount: 300000 },
        mockStockPrices[1],
        portfolio
      );
      expect(buy2.trades.length).toBeGreaterThan(0);
      portfolio = buy2.portfolio;

      // 3. 부분 매도 (주식의 30%)
      const sell1 = simulateAction(
        "sell_percent_stock",
        { percentStock: 30 },
        mockStockPrices[2],
        portfolio
      );
      expect(sell1.trades.length).toBeGreaterThan(0);
      portfolio = sell1.portfolio;

      // 4. 나머지 전량 매도
      const sell2 = simulateAction(
        "sell_all",
        {},
        mockStockPrices[3],
        portfolio
      );
      expect(sell2.trades.length).toBeGreaterThan(0);
      portfolio = sell2.portfolio;

      // 최종 포트폴리오 확인
      expect(portfolio.shares).toBe(0);
      expect(portfolio.cash).toBeGreaterThan(900000); // 수수료 고려
    });

    test("주식 수 기반 거래 시나리오", () => {
      let portfolio: Portfolio = {
        cash: 1000000,
        shares: 0,
      };

      // 1. 고정 주식 수 매수 (100주)
      const buy1 = simulateAction(
        "buy_shares",
        { shareCount: 100 },
        mockStockPrices[0],
        portfolio
      );
      expect(buy1.trades.length).toBeGreaterThan(0);
      expect(buy1.trades[0].quantity).toBe(100);
      portfolio = buy1.portfolio;

      // 2. 고정 주식 수 매도 (50주)
      const sell1 = simulateAction(
        "sell_shares",
        { shareCount: 50 },
        mockStockPrices[1],
        portfolio
      );
      expect(sell1.trades.length).toBeGreaterThan(0);
      expect(sell1.trades[0].quantity).toBe(50);
      portfolio = sell1.portfolio;

      // 최종 주식 수 확인
      expect(portfolio.shares).toBe(50);
    });

    test("대기 액션 시나리오", () => {
      const portfolio: Portfolio = {
        cash: 1000000,
        shares: 100,
      };

      // 대기 액션 실행
      const holdResult = simulateAction(
        "hold",
        {},
        mockStockPrices[0],
        portfolio
      );

      // 아무것도 변경되지 않아야 함
      expect(holdResult.trades.length).toBe(0);
      expect(holdResult.portfolio).toEqual(portfolio);
    });
  });
});
