import type {
  BacktestConfig,
  BacktestResult,
  BacktestProgress,
  StockData,
  StockPrice,
  Trade,
  PortfolioSnapshot,
  BacktestStats,
} from "../types/backtest";
import type {
  Strategy,
  StrategyBlock,
  ConditionParameters,
} from "../types/strategy";
import { calculateFormula } from "./formulaCalculator";

// 백테스트 엔진 클래스
export class BacktestEngine {
  private config: BacktestConfig;
  private strategy: Strategy;
  private stockData: StockData;
  private progressCallback?: (progress: BacktestProgress) => void;

  // 포트폴리오 상태
  private cash: number;
  private positions: Map<string, { quantity: number; avgPrice: number }> =
    new Map();
  private trades: Trade[] = [];
  private portfolioHistory: PortfolioSnapshot[] = [];

  constructor(
    config: BacktestConfig,
    strategy: Strategy,
    stockData: StockData,
    progressCallback?: (progress: BacktestProgress) => void
  ) {
    this.config = config;
    this.strategy = strategy;
    this.stockData = stockData;
    this.progressCallback = progressCallback;
    this.cash = config.initialCash;
  }

  // 백테스트 실행
  async execute(): Promise<BacktestResult> {
    const startTime = Date.now();

    // 날짜 범위에 해당하는 데이터 필터링
    const filteredPrices = this.filterPricesByDateRange();

    if (filteredPrices.length === 0) {
      throw new Error("해당 기간에 주식 데이터가 없습니다.");
    }

    // 진행 상태 초기화
    this.reportProgress(
      0,
      filteredPrices.length,
      filteredPrices[0].date,
      "preparing"
    );

    // 초기 포트폴리오 스냅샷
    this.addPortfolioSnapshot(filteredPrices[0].date, filteredPrices[0].close);

    // 일별 백테스트 실행
    for (let i = 0; i < filteredPrices.length; i++) {
      const currentPrice = filteredPrices[i];
      const prevPrice = i > 0 ? filteredPrices[i - 1] : null;

      this.reportProgress(
        i,
        filteredPrices.length,
        currentPrice.date,
        "running"
      );

      // 전략 실행
      await this.executeStrategy(currentPrice, prevPrice);

      // 포트폴리오 스냅샷 저장 (매주 금요일 또는 마지막 날)
      if (i % 5 === 0 || i === filteredPrices.length - 1) {
        this.addPortfolioSnapshot(currentPrice.date, currentPrice.close);
      }
    }

    // 백테스트 완료
    this.reportProgress(
      filteredPrices.length,
      filteredPrices.length,
      filteredPrices[filteredPrices.length - 1].date,
      "completed"
    );

    // 통계 계산
    const stats = this.calculateStats(filteredPrices);
    const executionTime = Date.now() - startTime;

    return {
      config: this.config,
      trades: this.trades,
      portfolioHistory: this.portfolioHistory,
      stats,
      startDate: this.config.startDate,
      endDate: this.config.endDate,
      duration: this.calculateDuration(),
      executionTime,
    };
  }

  // 날짜 범위로 가격 데이터 필터링
  private filterPricesByDateRange(): StockPrice[] {
    return this.stockData.prices.filter(
      (price) =>
        price.date >= this.config.startDate && price.date <= this.config.endDate
    );
  }

  // 전략 실행
  private async executeStrategy(
    currentPrice: StockPrice,
    prevPrice: StockPrice | null
  ): Promise<void> {
    if (!prevPrice) return; // 첫날은 건너뛰기

    // 가격 변화율 계산
    const priceChangePercent =
      ((currentPrice.close - prevPrice.close) / prevPrice.close) * 100;

    // 디버깅: 가격 변화 로그 (5%보다 큰 변화만)
    if (Math.abs(priceChangePercent) > 1) {
      console.log(
        `📊 ${currentPrice.date}: ${prevPrice.close}원 → ${currentPrice.close}원 (${priceChangePercent.toFixed(2)}%)`
      );
    }

    // 룰별 실행
    for (const blockId of this.strategy.blockOrder) {
      const block = this.strategy.blocks.find((b) => b.id === blockId);
      if (!block || !block.enabled) continue;

      if (block.type === "condition") {
        const conditionMet = this.evaluateCondition(
          block,
          currentPrice,
          prevPrice
        );

        // 디버깅: 조건 평가 결과 로그
        if (Math.abs(priceChangePercent) > 1) {
          console.log(
            `  🔍 ${block.name}: ${conditionMet ? "✅ 만족" : "❌ 불만족"}`
          );
        }

        if (conditionMet) {
          console.log(`🎯 조건 만족! ${block.name} - 액션 실행`);
          // 조건이 만족되면 다음 액션 블록들 실행
          const actionBlocks = this.getNextActionBlocks(blockId);
          for (const actionBlock of actionBlocks) {
            console.log(`  💰 액션 실행: ${actionBlock.name}`);
            await this.executeAction(actionBlock, currentPrice);
          }
        }
      }
    }
  }

  // 조건 평가
  private evaluateCondition(
    block: StrategyBlock,
    currentPrice: StockPrice,
    prevPrice: StockPrice
  ): boolean {
    const { conditionType, conditionParams } = block;

    switch (conditionType) {
      case "always":
        return true;
      case "close_price_change": {
        const priceChangePercent =
          ((currentPrice.close - prevPrice.close) / prevPrice.close) * 100;
        const targetPercent = conditionParams?.priceChangePercent || 0;
        const direction = conditionParams?.priceChangeDirection || "up";

        if (direction === "up") {
          return priceChangePercent >= targetPercent;
        } else {
          return priceChangePercent <= -targetPercent;
        }
      }

      case "high_price_change": {
        const priceChangePercent =
          ((currentPrice.high - prevPrice.high) / prevPrice.high) * 100;
        const targetPercent = conditionParams?.priceChangePercent || 0;
        const direction = conditionParams?.priceChangeDirection || "up";

        if (direction === "up") {
          return priceChangePercent >= targetPercent;
        } else {
          return priceChangePercent <= -targetPercent;
        }
      }

      case "low_price_change": {
        const priceChangePercent =
          ((currentPrice.low - prevPrice.low) / prevPrice.low) * 100;
        const targetPercent = conditionParams?.priceChangePercent || 0;
        const direction = conditionParams?.priceChangeDirection || "up";

        if (direction === "up") {
          return priceChangePercent >= targetPercent;
        } else {
          return priceChangePercent <= -targetPercent;
        }
      }

      case "close_price_range": {
        const priceChangePercent =
          ((currentPrice.close - prevPrice.close) / prevPrice.close) * 100;
        return this.evaluateRangeCondition(priceChangePercent, conditionParams);
      }

      case "high_price_range": {
        const priceChangePercent =
          ((currentPrice.high - prevPrice.high) / prevPrice.high) * 100;
        return this.evaluateRangeCondition(priceChangePercent, conditionParams);
      }

      case "low_price_range": {
        const priceChangePercent =
          ((currentPrice.low - prevPrice.low) / prevPrice.low) * 100;
        return this.evaluateRangeCondition(priceChangePercent, conditionParams);
      }

      case "price_value_range": {
        const currentValue = currentPrice.close;
        return this.evaluateValueRangeCondition(currentValue, conditionParams);
      }

      default:
        return false;
    }
  }

  // 범위 조건 평가 (퍼센트)
  private evaluateRangeCondition(
    priceChangePercent: number,
    conditionParams: ConditionParameters | undefined
  ): boolean {
    const minPercent = conditionParams?.minPercent || 0;
    const maxPercent = conditionParams?.maxPercent || 0;
    const direction = conditionParams?.rangeDirection || "up";
    const operator = conditionParams?.rangeOperator || "inclusive";

    // 방향에 따른 변화율 조정
    let adjustedValue = priceChangePercent;
    if (direction === "down") {
      adjustedValue = -priceChangePercent; // 하락은 양수로 변환
    } else if (direction === "both") {
      adjustedValue = Math.abs(priceChangePercent); // 양방향은 절댓값
    }

    // 범위 연산자에 따른 조건 평가
    switch (operator) {
      case "inclusive": // 이상 이하 (≥ ≤)
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

  // 절대 가격 범위 조건 평가
  private evaluateValueRangeCondition(
    currentValue: number,
    conditionParams: ConditionParameters | undefined
  ): boolean {
    const minPrice = conditionParams?.minPrice || 0;
    const maxPrice = conditionParams?.maxPrice || 0;
    const operator = conditionParams?.rangeOperator || "inclusive";

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

  // 액션 실행
  private async executeAction(
    block: StrategyBlock,
    currentPrice: StockPrice
  ): Promise<void> {
    const { actionType, actionParams } = block;
    const price = currentPrice.close;

    switch (actionType) {
      case "buy_percent_cash": {
        const percent = actionParams?.percentCash || 0;
        const amount = (this.cash * percent) / 100;
        const commission = amount * this.config.commission;
        const netAmount = amount - commission;
        const quantity = Math.floor(netAmount / price);

        if (quantity > 0 && netAmount <= this.cash) {
          this.executeBuy(
            currentPrice.date,
            quantity,
            price,
            commission,
            `현금 ${percent}% 매수`
          );
        }
        break;
      }

      case "sell_percent_stock": {
        const percent = actionParams?.percentStock || 0;
        const position = this.positions.get(this.config.symbol);
        if (position) {
          const quantity = Math.floor((position.quantity * percent) / 100);
          if (quantity > 0) {
            const commission = quantity * price * this.config.commission;
            this.executeSell(
              currentPrice.date,
              quantity,
              price,
              commission,
              `보유 주식 ${percent}% 매도`
            );
          }
        }
        break;
      }

      case "buy_fixed_amount": {
        const amount = actionParams?.fixedAmount || 0;
        const commission = amount * this.config.commission;
        const netAmount = amount - commission;
        const quantity = Math.floor(netAmount / price);

        if (quantity > 0 && amount <= this.cash) {
          this.executeBuy(
            currentPrice.date,
            quantity,
            price,
            commission,
            `고정 금액 ₩${amount.toLocaleString()} 매수`
          );
        }
        break;
      }

      case "sell_fixed_amount": {
        const amount = actionParams?.fixedAmount || 0;
        const quantity = Math.floor(amount / price);
        const position = this.positions.get(this.config.symbol);

        if (position && quantity > 0 && quantity <= position.quantity) {
          const commission = quantity * price * this.config.commission;
          this.executeSell(currentPrice.date, quantity, price, commission);
        }
        break;
      }

      case "buy_shares": {
        const quantity = actionParams?.shareCount || 0;
        const amount = quantity * price;
        const commission = amount * this.config.commission;
        const total = amount + commission;

        if (quantity > 0 && total <= this.cash) {
          this.executeBuy(
            currentPrice.date,
            quantity,
            price,
            commission,
            `${quantity}주 매수`
          );
        }
        break;
      }

      case "sell_shares": {
        const quantity = actionParams?.shareCount || 0;
        const position = this.positions.get(this.config.symbol);

        if (position && quantity > 0 && quantity <= position.quantity) {
          const commission = quantity * price * this.config.commission;
          this.executeSell(currentPrice.date, quantity, price, commission);
        }
        break;
      }

      case "sell_all": {
        const position = this.positions.get(this.config.symbol);
        if (position && position.quantity > 0) {
          const commission = position.quantity * price * this.config.commission;
          this.executeSell(
            currentPrice.date,
            position.quantity,
            price,
            commission,
            "전량 매도"
          );
        }
        break;
      }

      case "buy_formula_amount": {
        const formula = actionParams?.formula || "";
        if (formula) {
          const priceChangePercent =
            this.getCurrentPriceChangePercent(currentPrice);
          const formulaResult = calculateFormula(formula, priceChangePercent);

          if (formulaResult.isValid && formulaResult.value > 0) {
            const amount = formulaResult.value;
            const commission = amount * this.config.commission;
            const netAmount = amount - commission;
            const quantity = Math.floor(netAmount / price);

            if (quantity > 0 && amount <= this.cash) {
              this.executeBuy(
                currentPrice.date,
                quantity,
                price,
                commission,
                `공식 계산 ₩${formulaResult.value.toLocaleString()} 매수`
              );
            }
          }
        }
        break;
      }

      case "sell_formula_amount": {
        const formula = actionParams?.formula || "";
        if (formula) {
          const priceChangePercent =
            this.getCurrentPriceChangePercent(currentPrice);
          const formulaResult = calculateFormula(formula, priceChangePercent);

          if (formulaResult.isValid && formulaResult.value > 0) {
            const amount = formulaResult.value;
            const quantity = Math.floor(amount / price);
            const position = this.positions.get(this.config.symbol);

            if (position && quantity > 0 && quantity <= position.quantity) {
              const commission = quantity * price * this.config.commission;
              this.executeSell(currentPrice.date, quantity, price, commission);
            }
          }
        }
        break;
      }

      case "buy_formula_shares": {
        const formula = actionParams?.formula || "";
        if (formula) {
          const priceChangePercent =
            this.getCurrentPriceChangePercent(currentPrice);
          const formulaResult = calculateFormula(formula, priceChangePercent);

          if (formulaResult.isValid && formulaResult.value > 0) {
            const quantity = Math.floor(formulaResult.value);
            const amount = quantity * price;
            const commission = amount * this.config.commission;
            const total = amount + commission;

            if (quantity > 0 && total <= this.cash) {
              this.executeBuy(currentPrice.date, quantity, price, commission);
            }
          }
        }
        break;
      }

      case "sell_formula_shares": {
        const formula = actionParams?.formula || "";
        if (formula) {
          const priceChangePercent =
            this.getCurrentPriceChangePercent(currentPrice);
          const formulaResult = calculateFormula(formula, priceChangePercent);

          if (formulaResult.isValid && formulaResult.value > 0) {
            const quantity = Math.floor(formulaResult.value);
            const position = this.positions.get(this.config.symbol);

            if (position && quantity > 0 && quantity <= position.quantity) {
              const commission = quantity * price * this.config.commission;
              this.executeSell(
                currentPrice.date,
                quantity,
                price,
                commission,
                `공식 계산 ${quantity}주 매도`
              );
            }
          }
        }
        break;
      }

      case "buy_formula_percent": {
        const formula = actionParams?.formula || "";
        if (formula) {
          const priceChangePercent =
            this.getCurrentPriceChangePercent(currentPrice);
          const formulaResult = calculateFormula(formula, priceChangePercent);

          if (formulaResult.isValid && formulaResult.value > 0) {
            const percent = Math.min(100, Math.max(0, formulaResult.value));
            const amount = (this.cash * percent) / 100;
            const commission = amount * this.config.commission;
            const netAmount = amount - commission;
            const quantity = Math.floor(netAmount / price);

            if (quantity > 0 && netAmount <= this.cash) {
              this.executeBuy(currentPrice.date, quantity, price, commission);
            }
          }
        }
        break;
      }

      case "sell_formula_percent": {
        const formula = actionParams?.formula || "";
        if (formula) {
          const priceChangePercent =
            this.getCurrentPriceChangePercent(currentPrice);
          const formulaResult = calculateFormula(formula, priceChangePercent);

          if (formulaResult.isValid && formulaResult.value > 0) {
            const percent = Math.min(100, Math.max(0, formulaResult.value));
            const position = this.positions.get(this.config.symbol);
            if (position) {
              const quantity = Math.floor((position.quantity * percent) / 100);
              if (quantity > 0) {
                const commission = quantity * price * this.config.commission;
                this.executeSell(
                  currentPrice.date,
                  quantity,
                  price,
                  commission
                );
              }
            }
          }
        }
        break;
      }

      case "hold":
        // 아무것도 하지 않음
        break;
    }
  }

  // 매수 실행
  private executeBuy(
    date: string,
    quantity: number,
    price: number,
    commission: number,
    reason?: string
  ): void {
    const total = quantity * price + commission;

    if (total > this.cash) return;

    // 거래 기록
    const trade: Trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      date,
      type: "buy",
      symbol: this.config.symbol,
      quantity,
      price,
      commission,
      total,
      reason: reason || "전략 조건 충족",
    };

    this.trades.push(trade);
    this.cash -= total;

    // 포지션 업데이트
    const currentPosition = this.positions.get(this.config.symbol) || {
      quantity: 0,
      avgPrice: 0,
    };
    const newQuantity = currentPosition.quantity + quantity;
    const newAvgPrice =
      (currentPosition.quantity * currentPosition.avgPrice + quantity * price) /
      newQuantity;

    this.positions.set(this.config.symbol, {
      quantity: newQuantity,
      avgPrice: newAvgPrice,
    });
  }

  // 매도 실행
  private executeSell(
    date: string,
    quantity: number,
    price: number,
    commission: number,
    reason?: string
  ): void {
    const position = this.positions.get(this.config.symbol);
    if (!position || quantity > position.quantity) return;

    const total = quantity * price - commission;

    // 거래 기록
    const trade: Trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      date,
      type: "sell",
      symbol: this.config.symbol,
      quantity,
      price,
      commission,
      total,
      reason: reason || "전략 조건 충족",
    };

    this.trades.push(trade);
    this.cash += total;

    // 포지션 업데이트
    const newQuantity = position.quantity - quantity;
    if (newQuantity <= 0) {
      this.positions.delete(this.config.symbol);
    } else {
      this.positions.set(this.config.symbol, {
        ...position,
        quantity: newQuantity,
      });
    }
  }

  // 다음 액션 블록들 찾기
  private getNextActionBlocks(conditionBlockId: string): StrategyBlock[] {
    const conditionIndex = this.strategy.blockOrder.indexOf(conditionBlockId);
    const actionBlocks: StrategyBlock[] = [];

    // 현재 조건 블록 다음의 액션 블록들 찾기
    for (let i = conditionIndex + 1; i < this.strategy.blockOrder.length; i++) {
      const blockId = this.strategy.blockOrder[i];
      const block = this.strategy.blocks.find((b) => b.id === blockId);

      if (block?.type === "action") {
        actionBlocks.push(block);
      } else if (block?.type === "condition") {
        break; // 다음 조건 블록을 만나면 중단
      }
    }

    return actionBlocks;
  }

  // 포트폴리오 스냅샷 추가
  private addPortfolioSnapshot(date: string, currentPrice: number): void {
    const position = this.positions.get(this.config.symbol);
    const positions = position
      ? [
          {
            symbol: this.config.symbol,
            quantity: position.quantity,
            avgPrice: position.avgPrice,
            currentPrice,
            marketValue: position.quantity * currentPrice,
            unrealizedPnL:
              (currentPrice - position.avgPrice) * position.quantity,
          },
        ]
      : [];

    const totalValue =
      this.cash + positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    const totalReturn = totalValue - this.config.initialCash;
    const totalReturnPct = (totalReturn / this.config.initialCash) * 100;

    this.portfolioHistory.push({
      date,
      cash: this.cash,
      positions,
      totalValue,
      totalReturn,
      totalReturnPct,
    });
  }

  // 백테스트 통계 계산
  private calculateStats(_prices: StockPrice[]): BacktestStats {
    const finalValue =
      this.portfolioHistory[this.portfolioHistory.length - 1]?.totalValue ||
      this.config.initialCash;
    const totalReturn = finalValue - this.config.initialCash;
    const totalReturnPct = (totalReturn / this.config.initialCash) * 100;

    const years = this.calculateDuration() / 365;
    const annualizedReturn =
      Math.pow(finalValue / this.config.initialCash, 1 / years) - 1;

    // 변동성 계산 (일간 수익률의 표준편차)
    const dailyReturns = this.portfolioHistory.slice(1).map((snapshot, i) => {
      const prevValue = this.portfolioHistory[i].totalValue;
      return (snapshot.totalValue - prevValue) / prevValue;
    });

    const avgDailyReturn =
      dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
    const variance =
      dailyReturns.reduce(
        (sum, ret) => sum + Math.pow(ret - avgDailyReturn, 2),
        0
      ) / dailyReturns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // 연간화

    // 샤프 비율 (무위험 수익률 0으로 가정)
    const sharpeRatio = annualizedReturn / volatility;

    // 최대 낙폭 계산
    let maxDrawdown = 0;
    let peak = this.config.initialCash;
    for (const snapshot of this.portfolioHistory) {
      if (snapshot.totalValue > peak) {
        peak = snapshot.totalValue;
      }
      const drawdown = (peak - snapshot.totalValue) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // 거래 통계
    const winningTrades = this.trades.filter((trade) => {
      if (trade.type === "sell") {
        const buyTrades = this.trades.filter(
          (t) =>
            t.type === "buy" &&
            t.symbol === trade.symbol &&
            t.date <= trade.date
        );
        if (buyTrades.length > 0) {
          const avgBuyPrice =
            buyTrades.reduce((sum, t) => sum + t.price, 0) / buyTrades.length;
          return trade.price > avgBuyPrice;
        }
      }
      return false;
    });

    const winRate =
      this.trades.length > 0 ? winningTrades.length / this.trades.length : 0;
    const avgTradeReturn =
      this.trades.length > 0 ? totalReturn / this.trades.length : 0;

    return {
      totalReturn,
      totalReturnPct,
      annualizedReturn: annualizedReturn * 100,
      volatility: volatility * 100,
      sharpeRatio,
      maxDrawdown: maxDrawdown * 100,
      maxDrawdownDuration: 0, // 추후 계산 가능
      winRate: winRate * 100,
      profitFactor: 1, // 추후 계산 가능
      totalTrades: this.trades.length,
      avgTradeReturn,
    };
  }

  // 백테스트 기간 계산 (일수)
  private calculateDuration(): number {
    const start = new Date(this.config.startDate);
    const end = new Date(this.config.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  // 진행 상태 보고
  private reportProgress(
    current: number,
    total: number,
    currentDate: string,
    status: BacktestProgress["status"]
  ): void {
    if (this.progressCallback) {
      this.progressCallback({
        current,
        total,
        currentDate,
        status,
        message:
          status === "running" ? `${currentDate} 데이터 처리 중...` : undefined,
      });
    }
  }

  // 현재 가격 변화율 계산 (N 값)
  private getCurrentPriceChangePercent(currentPrice: StockPrice): number {
    const currentIndex = this.stockData.prices.findIndex(
      (p) => p.date === currentPrice.date
    );

    if (currentIndex <= 0) return 0; // 첫 번째 데이터이거나 찾을 수 없는 경우

    const prevPrice = this.stockData.prices[currentIndex - 1];
    const changePercent =
      ((currentPrice.close - prevPrice.close) / prevPrice.close) * 100;

    return changePercent;
  }
}

// 백테스트 실행 헬퍼 함수
export async function runBacktest(
  config: BacktestConfig,
  strategy: Strategy,
  stockData: StockData,
  progressCallback?: (progress: BacktestProgress) => void
): Promise<BacktestResult> {
  const engine = new BacktestEngine(
    config,
    strategy,
    stockData,
    progressCallback
  );
  return await engine.execute();
}
