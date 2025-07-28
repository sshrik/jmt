/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";

// 테스트용 mock 데이터
const mockStockPrices = [
  {
    date: "2024-01-01",
    close: 1000,
    open: 1000,
    high: 1010,
    low: 990,
    volume: 100000,
  },
  {
    date: "2024-01-02",
    close: 1050,
    open: 1000,
    high: 1060,
    low: 1000,
    volume: 120000,
  }, // 5% 상승
  {
    date: "2024-01-03",
    close: 1100,
    open: 1050,
    high: 1120,
    low: 1050,
    volume: 150000,
  }, // 4.76% 상승
  {
    date: "2024-01-04",
    close: 1045,
    open: 1100,
    high: 1100,
    low: 1045,
    volume: 110000,
  }, // 5% 하락
  {
    date: "2024-01-05",
    close: 990,
    open: 1045,
    high: 1050,
    low: 990,
    volume: 130000,
  }, // 5.26% 하락
];

// 조건 평가 함수
function evaluateCondition(
  conditionType: string,
  params: any,
  currentPrice: any,
  prevPrice: any
): boolean {
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

    default:
      return false;
  }
}

// 액션 시뮬레이션 함수
function simulateAction(
  actionType: string,
  params: any,
  currentPrice: any,
  portfolio: any
): any {
  const price = currentPrice.close;
  const commission = 0.0025; // 0.25%
  const trades: any[] = [];

  switch (actionType) {
    case "buy_percent_cash": {
      const percent = params?.percentCash || 0;
      const amount = (portfolio.cash * percent) / 100;
      const commissionAmount = amount * commission;
      const netAmount = amount - commissionAmount;
      const quantity = Math.floor(netAmount / price);

      if (quantity > 0 && netAmount <= portfolio.cash) {
        trades.push({
          type: "buy",
          quantity,
          price,
          commission: commissionAmount,
          total: quantity * price + commissionAmount,
        });

        return {
          cash: portfolio.cash - (quantity * price + commissionAmount),
          shares: portfolio.shares + quantity,
          trades,
        };
      }
      break;
    }

    case "buy_shares": {
      const shareCount = params?.shareCount || 0;
      const shareAmount = shareCount * price;
      const shareCommission = shareAmount * commission;
      const shareTotal = shareAmount + shareCommission;

      if (shareCount > 0 && shareTotal <= portfolio.cash) {
        trades.push({
          type: "buy",
          quantity: shareCount,
          price,
          commission: shareCommission,
          total: shareTotal,
        });

        return {
          cash: portfolio.cash - shareTotal,
          shares: portfolio.shares + shareCount,
          trades,
        };
      }
      break;
    }

    case "sell_all": {
      if (portfolio.shares > 0) {
        const sellAmount = portfolio.shares * price;
        const sellCommission = sellAmount * commission;
        const netSellAmount = sellAmount - sellCommission;

        trades.push({
          type: "sell",
          quantity: portfolio.shares,
          price,
          commission: sellCommission,
          total: netSellAmount,
        });

        return {
          cash: portfolio.cash + netSellAmount,
          shares: 0,
          trades,
        };
      }
      break;
    }

    case "hold":
      // 아무것도 하지 않음
      break;
  }

  return { ...portfolio, trades };
}

describe("백테스트 엔진 테스트", () => {
  describe("조건 평가", () => {
    it("always 조건은 항상 true를 반환해야 함", () => {
      const result = evaluateCondition(
        "always",
        {},
        mockStockPrices[1],
        mockStockPrices[0]
      );
      expect(result).toBe(true);
    });

    it("5% 상승 조건이 올바르게 평가되어야 함", () => {
      const params = { priceChangePercent: 5, priceChangeDirection: "up" };

      // 1000 -> 1050 (5% 상승) - 조건 만족
      const result1 = evaluateCondition(
        "close_price_change",
        params,
        mockStockPrices[1],
        mockStockPrices[0]
      );
      expect(result1).toBe(true);

      // 1050 -> 1100 (4.76% 상승) - 조건 불만족 (5% 미만)
      const result2 = evaluateCondition(
        "close_price_change",
        params,
        mockStockPrices[2],
        mockStockPrices[1]
      );
      expect(result2).toBe(false);
    });

    it("5% 하락 조건이 올바르게 평가되어야 함", () => {
      const params = { priceChangePercent: 5, priceChangeDirection: "down" };

      // 1100 -> 1045 (5% 하락) - 조건 만족
      const result1 = evaluateCondition(
        "close_price_change",
        params,
        mockStockPrices[3],
        mockStockPrices[2]
      );
      expect(result1).toBe(true);

      // 1050 -> 1100 (상승) - 조건 불만족
      const result2 = evaluateCondition(
        "close_price_change",
        params,
        mockStockPrices[2],
        mockStockPrices[1]
      );
      expect(result2).toBe(false);
    });
  });

  describe("액션 실행", () => {
    it("buy_percent_cash 액션이 올바르게 실행되어야 함", () => {
      const portfolio = { cash: 1000000, shares: 0 }; // 100만원
      const params = { percentCash: 30 }; // 30% 매수

      const result = simulateAction(
        "buy_percent_cash",
        params,
        mockStockPrices[0],
        portfolio
      );

      // 30% of 1,000,000 = 300,000원
      // 수수료: 300,000 * 0.0025 = 750원
      // 실제 매수 가능 금액: 300,000 - 750 = 299,250원
      // 주식 수: floor(299,250 / 1000) = 299주
      // 총 비용: 299 * 1000 + 750 = 299,750원

      expect(result.cash).toBe(1000000 - 299750); // 700,250원
      expect(result.shares).toBe(299);
      expect(result.trades.length).toBe(1);
      expect(result.trades[0].type).toBe("buy");
    });

    it("buy_shares 액션이 올바르게 실행되어야 함", () => {
      const portfolio = { cash: 1000000, shares: 0 };
      const params = { shareCount: 100 };

      const result = simulateAction(
        "buy_shares",
        params,
        mockStockPrices[0],
        portfolio
      );

      // 100주 * 1000원 = 100,000원
      // 수수료: 100,000 * 0.0025 = 250원
      // 총 비용: 100,250원

      expect(result.cash).toBe(1000000 - 100250); // 899,750원
      expect(result.shares).toBe(100);
      expect(result.trades.length).toBe(1);
      expect(result.trades[0].quantity).toBe(100);
    });

    it("sell_all 액션이 올바르게 실행되어야 함", () => {
      const portfolio = { cash: 900000, shares: 100 }; // 100주 보유

      const result = simulateAction(
        "sell_all",
        {},
        mockStockPrices[1],
        portfolio
      ); // 1050원에 매도

      expect(result.shares).toBe(0);
      expect(result.cash).toBeGreaterThan(900000); // 현금 증가
      expect(result.trades.length).toBe(1);
      expect(result.trades[0].type).toBe("sell");
    });

    it("hold 액션은 아무것도 하지 않아야 함", () => {
      const portfolio = { cash: 1000000, shares: 0 };

      const result = simulateAction("hold", {}, mockStockPrices[0], portfolio);

      expect(result.cash).toBe(1000000); // 변화 없음
      expect(result.shares).toBe(0); // 변화 없음
      expect(result.trades.length).toBe(0); // 거래 없음
    });
  });

  describe("전략 시나리오", () => {
    it("주식 가격 1000→1050→1100 상승 시나리오가 올바르게 동작해야 함", () => {
      let portfolio = { cash: 1000000, shares: 0 };
      const allTrades: any[] = [];

      // 시나리오: 3% 이상 상승 시 100주 매수
      for (let i = 1; i < mockStockPrices.length; i++) {
        const currentPrice = mockStockPrices[i];
        const prevPrice = mockStockPrices[i - 1];

        const conditionMet = evaluateCondition(
          "close_price_change",
          { priceChangePercent: 3, priceChangeDirection: "up" },
          currentPrice,
          prevPrice
        );

        if (conditionMet) {
          const result = simulateAction(
            "buy_shares",
            { shareCount: 100 },
            currentPrice,
            portfolio
          );

          portfolio = { cash: result.cash, shares: result.shares };
          allTrades.push(...result.trades);
        }
      }

      // 1000 -> 1050 (5% 상승) - 조건 만족, 100주 매수
      // 1050 -> 1100 (4.76% 상승) - 조건 만족, 추가 100주 매수
      expect(allTrades.length).toBe(2); // 두 번의 매수
      expect(portfolio.shares).toBe(200); // 총 200주
      expect(portfolio.cash).toBeLessThan(1000000); // 현금 감소
    });

    it("상승 매수 → 하락 매도 전략이 올바르게 동작해야 함", () => {
      let portfolio = { cash: 1000000, shares: 0 };
      const allTrades: any[] = [];

      for (let i = 1; i < mockStockPrices.length; i++) {
        const currentPrice = mockStockPrices[i];
        const prevPrice = mockStockPrices[i - 1];

        // 5% 상승 시 100주 매수
        const buyCondition = evaluateCondition(
          "close_price_change",
          { priceChangePercent: 5, priceChangeDirection: "up" },
          currentPrice,
          prevPrice
        );

        if (buyCondition) {
          const result = simulateAction(
            "buy_shares",
            { shareCount: 100 },
            currentPrice,
            portfolio
          );
          portfolio = { cash: result.cash, shares: result.shares };
          allTrades.push(...result.trades);
        }

        // 5% 하락 시 전량 매도
        const sellCondition = evaluateCondition(
          "close_price_change",
          { priceChangePercent: 5, priceChangeDirection: "down" },
          currentPrice,
          prevPrice
        );

        if (sellCondition && portfolio.shares > 0) {
          const result = simulateAction(
            "sell_all",
            {},
            currentPrice,
            portfolio
          );
          portfolio = { cash: result.cash, shares: result.shares };
          allTrades.push(...result.trades);
        }
      }

      // 매수와 매도가 모두 발생해야 함
      const buyTrades = allTrades.filter((trade) => trade.type === "buy");
      const sellTrades = allTrades.filter((trade) => trade.type === "sell");

      expect(buyTrades.length).toBeGreaterThan(0);
      expect(sellTrades.length).toBeGreaterThan(0);
    });
  });

  describe("수익률 계산", () => {
    it("포트폴리오 수익률이 올바르게 계산되어야 함", () => {
      const initialCash = 1000000;
      let portfolio = { cash: initialCash, shares: 0 };

      // 100주를 1000원에 매수
      const buyResult = simulateAction(
        "buy_shares",
        { shareCount: 100 },
        mockStockPrices[0],
        portfolio
      );
      portfolio = { cash: buyResult.cash, shares: buyResult.shares };

      // 현재 포트폴리오 가치 계산 (1050원 시점)
      const currentPrice = mockStockPrices[1].close; // 1050원
      const stockValue = portfolio.shares * currentPrice;
      const totalValue = portfolio.cash + stockValue;
      const returnPct = ((totalValue - initialCash) / initialCash) * 100;

      // 100주를 1000원에 매수 (수수료 250원) = 총 100,250원
      // 주식 가치가 1050원이 되면 100주 * 1050원 = 105,000원
      // 총 포트폴리오 가치 = (1,000,000 - 100,250) + 105,000 = 1,004,750원
      // 수익률 = (1,004,750 - 1,000,000) / 1,000,000 * 100 = 0.475%

      expect(totalValue).toBeGreaterThan(initialCash); // 수익 발생
      expect(returnPct).toBeGreaterThan(0); // 양의 수익률
      expect(returnPct).toBeCloseTo(0.475, 2); // 약 0.475% 수익률
    });
  });
});
