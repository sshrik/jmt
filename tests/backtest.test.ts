// 백테스트 엔진 테스트 (Vitest 버전)
import { describe, test, expect } from "vitest";
import { mockStockPrices } from "./utils/mockData";
import {
  evaluateCondition,
  simulateAction,
  calculatePortfolioValue,
  calculateReturn,
} from "./utils/testHelpers";
import type { Portfolio } from "./utils/mockData";

describe("백테스트 엔진 테스트", () => {
  describe("조건 평가", () => {
    test("always 조건은 항상 true를 반환해야 함", () => {
      const result = evaluateCondition(
        "always",
        {},
        mockStockPrices[1],
        mockStockPrices[0]
      );
      expect(result).toBe(true);
    });

    test("5% 상승 조건이 올바르게 평가되어야 함", () => {
      // 1000 → 1050, 5% 상승
      const result = evaluateCondition(
        "close_price_change",
        { priceChangePercent: 5, priceChangeDirection: "up" },
        mockStockPrices[1],
        mockStockPrices[0]
      );
      expect(result).toBe(true);

      // 1050 → 1100, 4.76% 상승 (5% 미만이므로 false)
      const result2 = evaluateCondition(
        "close_price_change",
        { priceChangePercent: 5, priceChangeDirection: "up" },
        mockStockPrices[2],
        mockStockPrices[1]
      );
      expect(result2).toBe(false);
    });

    test("5% 하락 조건이 올바르게 평가되어야 함", () => {
      // 1100 → 1045, 5% 하락
      const result = evaluateCondition(
        "close_price_change",
        { priceChangePercent: 5, priceChangeDirection: "down" },
        mockStockPrices[3],
        mockStockPrices[2]
      );
      expect(result).toBe(true);
    });
  });

  describe("액션 실행", () => {
    test("buy_percent_cash 액션이 올바르게 실행되어야 함", () => {
      const portfolio: Portfolio = { cash: 1000000, shares: 0 };
      const currentPrice = mockStockPrices[1]; // 1050원

      const result = simulateAction(
        "buy_percent_cash",
        { percentCash: 30 },
        currentPrice,
        portfolio
      );

      expect(result.trades.length).toBeGreaterThan(0);
      expect(result.portfolio.cash).toBeLessThan(1000000);
      expect(result.portfolio.shares).toBeGreaterThan(0);
    });

    test("buy_shares 액션이 올바르게 실행되어야 함", () => {
      const portfolio: Portfolio = { cash: 1000000, shares: 0 };
      const currentPrice = mockStockPrices[1]; // 1050원

      const result = simulateAction(
        "buy_shares",
        { shareCount: 100 },
        currentPrice,
        portfolio
      );

      expect(result.trades.length).toBeGreaterThan(0);
      expect(result.portfolio.shares).toBe(100);
    });

    test("sell_all 액션이 올바르게 실행되어야 함", () => {
      const portfolio: Portfolio = { cash: 895000, shares: 100 };
      const currentPrice = mockStockPrices[1]; // 1050원

      const result = simulateAction("sell_all", {}, currentPrice, portfolio);

      expect(result.trades.length).toBeGreaterThan(0);
      expect(result.portfolio.shares).toBe(0);
      expect(result.portfolio.cash).toBeGreaterThan(895000);
    });

    test("hold 액션은 아무것도 하지 않아야 함", () => {
      const portfolio: Portfolio = { cash: 1000000, shares: 100 };
      const currentPrice = mockStockPrices[1];

      const result = simulateAction("hold", {}, currentPrice, portfolio);

      expect(result.trades.length).toBe(0);
      expect(result.portfolio).toEqual(portfolio);
    });
  });

  describe("전략 시나리오", () => {
    test("주식 가격 1000→1050→1100 상승 시나리오가 올바르게 동작해야 함", () => {
      let portfolio: Portfolio = { cash: 1000000, shares: 0 };

      // 첫 번째 상승 (1000→1050): 3% 이상 상승 시 100주 매수
      const condition1 = evaluateCondition(
        "close_price_change",
        { priceChangePercent: 3, priceChangeDirection: "up" },
        mockStockPrices[1],
        mockStockPrices[0]
      );

      if (condition1) {
        const action1 = simulateAction(
          "buy_shares",
          { shareCount: 100 },
          mockStockPrices[1],
          portfolio
        );
        portfolio = action1.portfolio;
        expect(action1.trades.length).toBeGreaterThan(0);
      }

      // 두 번째 상승 (1050→1100): 3% 이상 상승 시 100주 더 매수
      const condition2 = evaluateCondition(
        "close_price_change",
        { priceChangePercent: 3, priceChangeDirection: "up" },
        mockStockPrices[2],
        mockStockPrices[1]
      );

      if (condition2) {
        const action2 = simulateAction(
          "buy_shares",
          { shareCount: 100 },
          mockStockPrices[2],
          portfolio
        );
        portfolio = action2.portfolio;
        expect(action2.trades.length).toBeGreaterThan(0);
      }

      expect(portfolio.shares).toBe(200); // 총 200주 보유
      expect(portfolio.cash).toBeLessThan(1000000); // 현금 감소
    });

    test("상승 매수 → 하락 매도 전략이 올바르게 동작해야 함", () => {
      let portfolio: Portfolio = { cash: 1000000, shares: 0 };

      // 상승 시 매수
      const buyCondition = evaluateCondition(
        "close_price_change",
        { priceChangePercent: 5, priceChangeDirection: "up" },
        mockStockPrices[1],
        mockStockPrices[0]
      );

      if (buyCondition) {
        const buyAction = simulateAction(
          "buy_percent_cash",
          { percentCash: 50 },
          mockStockPrices[1],
          portfolio
        );
        portfolio = buyAction.portfolio;
        expect(buyAction.trades.length).toBeGreaterThan(0);
      }

      // 하락 시 매도
      const sellCondition = evaluateCondition(
        "close_price_change",
        { priceChangePercent: 5, priceChangeDirection: "down" },
        mockStockPrices[3],
        mockStockPrices[2]
      );

      if (sellCondition && portfolio.shares > 0) {
        const sellAction = simulateAction(
          "sell_all",
          {},
          mockStockPrices[3],
          portfolio
        );
        portfolio = sellAction.portfolio;
        expect(sellAction.trades.length).toBeGreaterThan(0);
        expect(portfolio.shares).toBe(0);
      }
    });
  });

  describe("수익률 계산", () => {
    test("포트폴리오 수익률이 올바르게 계산되어야 함", () => {
      const portfolio: Portfolio = { cash: 899750, shares: 100 };
      const currentPrice = mockStockPrices[1]; // 1050원

      const portfolioValue = calculatePortfolioValue(
        portfolio,
        currentPrice.close
      );
      const returnRate = calculateReturn(1000000, portfolioValue);

      expect(portfolioValue).toBe(1004750); // 899750 + (100 * 1050)
      expect(returnRate).toBeCloseTo(0.475, 2); // 0.475% 수익률
    });
  });
});
