// 테스트 헬퍼 유틸리티 함수들

import type {
  ConditionType,
  ActionType,
  ConditionParameters,
  ActionParameters,
} from "../../src/types/strategy";
import type { StockPrice, Portfolio, Trade } from "./mockData";
import { COMMISSION_RATE, mockStockPrices } from "./mockData";
import { calculateFormula } from "./formulaCalculator";

export interface ActionResult {
  trades: Trade[];
  portfolio: Portfolio;
  priceChangePercent: number;
}

/**
 * 조건 평가 함수 - 모든 ConditionType 지원
 */
export function evaluateCondition(
  conditionType: ConditionType,
  params: ConditionParameters | undefined,
  currentPrice: StockPrice,
  prevPrice?: StockPrice
): boolean {
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

/**
 * 액션 실행 함수 - 모든 ActionType 지원
 */
export function simulateAction(
  actionType: ActionType,
  params: ActionParameters | undefined,
  currentPrice: StockPrice,
  portfolio: Portfolio
): ActionResult {
  const price = currentPrice.close;
  const trades: Trade[] = [];
  const newPortfolio: Portfolio = { ...portfolio };

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
      const commissionAmount = amount * COMMISSION_RATE;
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
      const commissionAmount = amount * COMMISSION_RATE;
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
      const commissionAmount = amount * COMMISSION_RATE;
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
      const commissionAmount = actualAmount * COMMISSION_RATE;
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
      const commissionAmount = amount * COMMISSION_RATE;
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
      const commissionAmount = amount * COMMISSION_RATE;
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
      const commissionAmount = amount * COMMISSION_RATE;
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
        const commissionAmount = amount * COMMISSION_RATE;
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
        const commissionAmount = actualAmount * COMMISSION_RATE;
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
        const commissionAmount = amount * COMMISSION_RATE;
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
        const commissionAmount = amount * COMMISSION_RATE;
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
        const commissionAmount = amount * COMMISSION_RATE;
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
        const commissionAmount = amount * COMMISSION_RATE;
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

/**
 * 포트폴리오 가치 계산
 */
export function calculatePortfolioValue(
  portfolio: Portfolio,
  currentPrice: number
): number {
  return portfolio.cash + portfolio.shares * currentPrice;
}

/**
 * 수익률 계산
 */
export function calculateReturn(
  initialValue: number,
  currentValue: number
): number {
  return ((currentValue - initialValue) / initialValue) * 100;
}
