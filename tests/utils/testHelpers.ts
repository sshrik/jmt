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

    case "close_price_range": {
      const priceChangePercent =
        ((currentPrice.close - prevPrice.close) / prevPrice.close) * 100;
      return evaluateRangeCondition(priceChangePercent, params);
    }

    case "high_price_range": {
      const priceChangePercent =
        ((currentPrice.high - prevPrice.high) / prevPrice.high) * 100;
      return evaluateRangeCondition(priceChangePercent, params);
    }

    case "low_price_range": {
      const priceChangePercent =
        ((currentPrice.low - prevPrice.low) / prevPrice.low) * 100;
      return evaluateRangeCondition(priceChangePercent, params);
    }

    case "price_value_range": {
      const currentValue = currentPrice.close;
      return evaluateValueRangeCondition(currentValue, params);
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

/**
 * 범위 조건 평가 (퍼센트)
 */
function evaluateRangeCondition(
  priceChangePercent: number,
  params: ConditionParameters | undefined
): boolean {
  const minPercent = params?.minPercent || 0;
  const maxPercent = params?.maxPercent || 0;
  const direction = params?.rangeDirection || "up";
  const operator = params?.rangeOperator || "inclusive";

  // 방향에 따른 변화율 조정
  let adjustedValue = priceChangePercent;
  if (direction === "down") {
    adjustedValue = -priceChangePercent; // 하락은 양수로 변환
  } else if (direction === "both") {
    adjustedValue = Math.abs(priceChangePercent); // 양방향은 절댓값
  }

  // 범위 연산자에 따른 조건 평가
  switch (operator) {
    case "inclusive": // 이상 이상 (≥ ≤)
      return adjustedValue >= minPercent && adjustedValue <= maxPercent;
    case "exclusive": // 초과 미만 (> <)
      return adjustedValue > minPercent && adjustedValue < maxPercent;
    case "left_inclusive": // 이상 미만 (≥ <)
      return adjustedValue >= minPercent && adjustedValue < maxPercent;
    case "right_inclusive": // 초과 이하 (> ≤)
      return adjustedValue > minPercent && adjustedValue <= maxPercent;
    default:
      return false;
  }
}

/**
 * 절대 가격 범위 조건 평가
 */
function evaluateValueRangeCondition(
  currentValue: number,
  params: ConditionParameters | undefined
): boolean {
  const minPrice = params?.minPrice || 0;
  const maxPrice = params?.maxPrice || 0;
  const operator = params?.rangeOperator || "inclusive";

  // 범위 연산자에 따른 조건 평가
  switch (operator) {
    case "inclusive": // 이상 이하 (≥ ≤)
      return currentValue >= minPrice && currentValue <= maxPrice;
    case "exclusive": // 초과 미만 (> <)
      return currentValue > minPrice && currentValue < maxPrice;
    case "left_inclusive": // 이상 미만 (≥ <)
      return currentValue >= minPrice && currentValue < maxPrice;
    case "right_inclusive": // 초과 이하 (> ≤)
      return currentValue > minPrice && currentValue <= maxPrice;
    default:
      return false;
  }
}
