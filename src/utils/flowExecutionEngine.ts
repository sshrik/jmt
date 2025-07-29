import type {
  StrategyFlow,
  StrategyFlowNode,
  FlowExecutionContext,
  FlowExecutionResult,
  FlowNodeData,
  ConditionParameters,
  ActionParameters,
  EnhancedActionType,
  ScheduleParameters,
} from "../types/strategy";
import { calculateFormula } from "./formulaCalculator";

// 플로우 실행 엔진 클래스
export class FlowExecutionEngine {
  private flow: StrategyFlow;
  private context: FlowExecutionContext;
  private executionResult: FlowExecutionResult;

  constructor(flow: StrategyFlow, context: FlowExecutionContext) {
    this.flow = flow;
    this.context = context;
    this.executionResult = {
      executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      flowId: flow.id,
      startTime: new Date(),
      status: "running",
      nodeResults: [],
      finalActions: [],
    };
  }

  // 플로우 실행 메인 메서드
  async execute(): Promise<FlowExecutionResult> {
    try {
      // 1. 시작 노드 찾기
      const startNode = this.flow.nodes.find(
        (node) => node.data.type === "start"
      );
      if (!startNode) {
        throw new Error("시작 노드를 찾을 수 없습니다.");
      }

      // 2. 플로우 실행
      await this.executeFromNode(startNode.id);

      // 3. 실행 완료
      this.executionResult.status = "completed";
      this.executionResult.endTime = new Date();

      return this.executionResult;
    } catch (error) {
      console.error("❌ 플로우 실행 실패:", error);
      this.executionResult.status = "failed";
      this.executionResult.endTime = new Date();
      return this.executionResult;
    }
  }

  // 특정 노드부터 실행
  private async executeFromNode(nodeId: string): Promise<void> {
    const node = this.flow.nodes.find((n) => n.id === nodeId);
    if (!node) {
      throw new Error(`노드를 찾을 수 없습니다: ${nodeId}`);
    }

    // 노드 실행 결과 초기화
    const nodeResult = {
      nodeId: node.id,
      nodeType: node.data.type,
      executed: false,
      executionTime: new Date(),
      result: undefined as Record<string, unknown> | undefined,
      error: undefined as string | undefined,
    };

    try {
      // 노드 타입별 실행 로직
      const result = await this.executeNode(node);
      nodeResult.executed = true;
      nodeResult.result = result;

      this.executionResult.nodeResults.push(nodeResult);

      // 다음 노드 실행
      await this.executeNextNodes(node, result);
    } catch (error) {
      nodeResult.error =
        error instanceof Error ? error.message : "알 수 없는 오류";
      this.executionResult.nodeResults.push(nodeResult);
      throw error;
    }
  }

  // 노드 타입별 실행 로직
  private async executeNode(
    node: StrategyFlowNode
  ): Promise<Record<string, unknown>> {
    const { data } = node;

    switch (data.type) {
      case "start":
        return this.executeStartNode(data);

      case "schedule":
        return this.executeScheduleNode(data);

      case "condition":
        return this.executeConditionNode(data);

      case "action":
        return this.executeActionNode(data);

      case "end":
        return this.executeEndNode(data);

      default:
        throw new Error(`지원하지 않는 노드 타입: ${data.type}`);
    }
  }

  // 시작 노드 실행
  private async executeStartNode(
    _data: FlowNodeData
  ): Promise<Record<string, unknown>> {
    return {
      type: "start",
      message: "전략이 시작되었습니다.",
      timestamp: new Date(),
    };
  }

  // 스케줄 노드 실행
  private async executeScheduleNode(
    data: FlowNodeData
  ): Promise<Record<string, unknown>> {
    const params = data.scheduleParams;

    // 실제 구현에서는 현재 시간과 스케줄을 비교
    const shouldExecute = this.checkSchedule(params);

    return {
      type: "schedule",
      shouldExecute,
      scheduleType: params?.scheduleType,
      message: shouldExecute
        ? "스케줄 조건을 만족합니다."
        : "스케줄 조건을 만족하지 않습니다.",
    };
  }

  // 조건 노드 실행
  private async executeConditionNode(
    data: FlowNodeData
  ): Promise<Record<string, unknown>> {
    const conditionType = data.conditionType;
    const params = data.conditionParams;

    const conditionMet = this.evaluateCondition(conditionType, params);

    return {
      type: "condition",
      conditionMet,
      conditionType,
      message: conditionMet
        ? "조건을 만족합니다."
        : "조건을 만족하지 않습니다.",
    };
  }

  // 액션 노드 실행
  private async executeActionNode(
    data: FlowNodeData
  ): Promise<Record<string, unknown>> {
    const actionType = data.actionType;
    const params = data.actionParams;

    const actionResult = await this.executeAction(actionType, params);

    return {
      type: "action",
      actionType,
      executed: true,
      result: actionResult,
      message: `${actionType} 액션을 실행했습니다.`,
    };
  }

  // 종료 노드 실행
  private async executeEndNode(
    _data: FlowNodeData
  ): Promise<Record<string, unknown>> {
    return {
      type: "end",
      message: "전략 실행이 완료되었습니다.",
      timestamp: new Date(),
    };
  }

  // 다음 노드들 실행 (엣지를 따라)
  private async executeNextNodes(
    currentNode: StrategyFlowNode,
    nodeResult: Record<string, unknown>
  ): Promise<void> {
    const outgoingEdges = this.flow.edges.filter(
      (edge) => edge.source === currentNode.id
    );

    for (const edge of outgoingEdges) {
      let shouldFollowEdge = true;

      // 조건 노드의 경우 결과에 따라 엣지 선택
      if (currentNode.data.type === "condition") {
        const conditionMet = nodeResult.conditionMet as boolean;
        // 기본적으로 조건이 만족되면 연결을 따라감
        shouldFollowEdge = conditionMet;
      }

      if (shouldFollowEdge) {
        await this.executeFromNode(edge.target);
      }
    }
  }

  // 스케줄 조건 확인
  private checkSchedule(_params?: ScheduleParameters): boolean {
    // 실제 구현에서는 현재 시간, 시장 상태 등을 확인
    // 여기서는 데모용으로 항상 true 반환
    return true;
  }

  // 투자 조건 평가
  private evaluateCondition(
    conditionType?: string,
    params?: ConditionParameters
  ): boolean {
    // 실제 구현에서는 시장 데이터를 기반으로 조건 평가
    // 여기서는 데모용 로직
    const currentPrice = this.context.currentMarketData?.price || 100000;
    const mockPreviousPrice = 95000; // 실제로는 과거 데이터에서 가져옴

    switch (conditionType) {
      case "always":
        return true;

      case "close_price_change": {
        const priceChangePercent = params?.priceChangePercent || 5;
        const direction = params?.priceChangeDirection || "up";
        const actualChangePercent =
          ((currentPrice - mockPreviousPrice) / mockPreviousPrice) * 100;

        if (direction === "up") {
          return actualChangePercent >= priceChangePercent;
        } else {
          return actualChangePercent <= -priceChangePercent;
        }
      }

      case "high_price_change": {
        const priceChangePercent = params?.priceChangePercent || 5;
        const direction = params?.priceChangeDirection || "up";
        const mockPreviousHigh = 96000; // 데모용
        const currentHigh = currentPrice * 1.02; // 데모용
        const actualChangePercent =
          ((currentHigh - mockPreviousHigh) / mockPreviousHigh) * 100;

        if (direction === "up") {
          return actualChangePercent >= priceChangePercent;
        } else {
          return actualChangePercent <= -priceChangePercent;
        }
      }

      case "low_price_change": {
        const priceChangePercent = params?.priceChangePercent || 5;
        const direction = params?.priceChangeDirection || "up";
        const mockPreviousLow = 94000; // 데모용
        const currentLow = currentPrice * 0.98; // 데모용
        const actualChangePercent =
          ((currentLow - mockPreviousLow) / mockPreviousLow) * 100;

        if (direction === "up") {
          return actualChangePercent >= priceChangePercent;
        } else {
          return actualChangePercent <= -priceChangePercent;
        }
      }

      case "close_price_range": {
        const actualChangePercent =
          ((currentPrice - mockPreviousPrice) / mockPreviousPrice) * 100;
        return this.evaluateRangeCondition(actualChangePercent, params);
      }

      case "high_price_range": {
        const mockPreviousHigh = 96000; // 데모용
        const currentHigh = currentPrice * 1.02; // 데모용
        const actualChangePercent =
          ((currentHigh - mockPreviousHigh) / mockPreviousHigh) * 100;
        return this.evaluateRangeCondition(actualChangePercent, params);
      }

      case "low_price_range": {
        const mockPreviousLow = 94000; // 데모용
        const currentLow = currentPrice * 0.98; // 데모용
        const actualChangePercent =
          ((currentLow - mockPreviousLow) / mockPreviousLow) * 100;
        return this.evaluateRangeCondition(actualChangePercent, params);
      }

      case "price_value_range": {
        return this.evaluateValueRangeCondition(currentPrice, params);
      }

      default:
        return true; // 기본적으로 조건 만족
    }
  }

  // 범위 조건 평가 (퍼센트)
  private evaluateRangeCondition(
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

  // 투자 액션 실행
  private async executeAction(
    actionType?: EnhancedActionType,
    params?: ActionParameters
  ): Promise<Record<string, unknown>> {
    // 실제 구현에서는 브로커 API를 통해 주문 실행
    // 여기서는 데모용 로직
    const portfolio = this.context.portfolio;
    const currentPrice = this.context.currentMarketData?.price || 100000;

    if (!portfolio) {
      return {
        action: actionType || "unknown",
        error: "포트폴리오 정보가 없습니다.",
      };
    }

    // 보유 주식 수량 계산
    const totalStocks = portfolio.holdings.reduce(
      (sum, holding) => sum + holding.quantity,
      0
    );

    switch (actionType) {
      case "buy_percent_cash": {
        const buyPercent = params?.percentCash || 30;
        const buyAmount = (portfolio.cash * buyPercent) / 100;
        return {
          action: "buy",
          amount: buyAmount,
          price: currentPrice,
          shares: Math.floor(buyAmount / currentPrice),
          message: `현금의 ${buyPercent}%로 매수 주문 실행`,
        };
      }

      case "sell_percent_stock": {
        const sellPercent = params?.percentStock || 50;
        const sellShares = Math.floor((totalStocks * sellPercent) / 100);
        return {
          action: "sell",
          shares: sellShares,
          price: currentPrice,
          amount: sellShares * currentPrice,
          message: `보유 주식의 ${sellPercent}%를 매도 주문 실행`,
        };
      }

      case "buy_shares": {
        const shareCount = params?.shareCount || 0;
        const amount = shareCount * currentPrice;
        return {
          action: "buy",
          shares: shareCount,
          price: currentPrice,
          amount: amount,
          message: `${shareCount}주 매수 주문 실행`,
        };
      }

      case "sell_shares": {
        const shareCount = params?.shareCount || 0;
        const amount = shareCount * currentPrice;
        return {
          action: "sell",
          shares: shareCount,
          price: currentPrice,
          amount: amount,
          message: `${shareCount}주 매도 주문 실행`,
        };
      }

      case "sell_all": {
        return {
          action: "sell",
          shares: totalStocks,
          price: currentPrice,
          amount: totalStocks * currentPrice,
          message: "보유 주식 100% 매도 주문 실행",
        };
      }

      case "buy_formula_amount":
      case "sell_formula_amount":
      case "buy_formula_shares":
      case "sell_formula_shares":
      case "buy_formula_percent":
      case "sell_formula_percent": {
        const formula = params?.formula || "";
        if (!formula) {
          return {
            action: actionType,
            error: "수식이 설정되지 않았습니다.",
          };
        }

        // 간단한 가격 변화율 계산 (실제로는 이전 가격 데이터 필요)
        const priceChangePercent = 5; // 테스트용 고정값
        const formulaResult = calculateFormula(formula, priceChangePercent);

        if (!formulaResult.isValid) {
          return {
            action: actionType,
            error: `수식 계산 오류: ${formulaResult.error}`,
          };
        }

        switch (actionType) {
          case "buy_formula_amount": {
            const amount = formulaResult.value;
            const shares = Math.floor(amount / currentPrice);
            return {
              action: "buy",
              shares,
              price: currentPrice,
              amount,
              message: `수식 결과 ${amount.toLocaleString()}원으로 ${shares}주 매수`,
            };
          }

          case "sell_formula_amount": {
            const amount = formulaResult.value;
            const shares = Math.min(
              Math.floor(amount / currentPrice),
              totalStocks
            );
            return {
              action: "sell",
              shares,
              price: currentPrice,
              amount: shares * currentPrice,
              message: `수식 결과 ${amount.toLocaleString()}원 상당의 ${shares}주 매도`,
            };
          }

          case "buy_formula_shares": {
            const shares = Math.floor(formulaResult.value);
            const amount = shares * currentPrice;
            return {
              action: "buy",
              shares,
              price: currentPrice,
              amount,
              message: `수식 결과 ${shares}주 매수`,
            };
          }

          case "sell_formula_shares": {
            const shares = Math.min(
              Math.floor(formulaResult.value),
              totalStocks
            );
            const amount = shares * currentPrice;
            return {
              action: "sell",
              shares,
              price: currentPrice,
              amount,
              message: `수식 결과 ${shares}주 매도`,
            };
          }

          case "buy_formula_percent": {
            const percent = Math.min(100, Math.max(0, formulaResult.value));
            const amount = (portfolio.cash * percent) / 100;
            const shares = Math.floor(amount / currentPrice);
            return {
              action: "buy",
              shares,
              price: currentPrice,
              amount,
              message: `수식 결과 현금의 ${percent.toFixed(1)}%로 ${shares}주 매수`,
            };
          }

          case "sell_formula_percent": {
            const percent = Math.min(100, Math.max(0, formulaResult.value));
            const shares = Math.floor((totalStocks * percent) / 100);
            const amount = shares * currentPrice;
            return {
              action: "sell",
              shares,
              price: currentPrice,
              amount,
              message: `수식 결과 보유 주식의 ${percent.toFixed(1)}%인 ${shares}주 매도`,
            };
          }

          default:
            return {
              action: actionType,
              error: "알 수 없는 수식 기반 액션",
            };
        }
      }

      case "exit_all": {
        return {
          action: "exit_all",
          sellShares: totalStocks,
          amount: totalStocks * currentPrice,
          message: "모든 포지션 청산 완료",
        };
      }

      default:
        return {
          action: actionType || "unknown",
          message: `${actionType} 액션 실행 완료`,
        };
    }
  }
}

// 플로우 실행 헬퍼 함수
export const executeStrategyFlow = async (
  flow: StrategyFlow,
  context: FlowExecutionContext
): Promise<FlowExecutionResult> => {
  const engine = new FlowExecutionEngine(flow, context);
  return await engine.execute();
};

// 테스트용 컨텍스트 생성
export const createTestExecutionContext = (
  flowId: string
): FlowExecutionContext => ({
  flowId,
  currentMarketData: {
    price: 105000,
    timestamp: new Date(),
    volume: 1000000,
  },
  portfolio: {
    cash: 1000000,
    holdings: [
      {
        symbol: "TEST",
        quantity: 100,
        value: 10500000,
      },
    ],
  },
  executionHistory: [],
});
