import type {
  StrategyFlow,
  StrategyFlowNode,
  FlowExecutionContext,
  FlowExecutionResult,
  FlowNodeData,
  ConditionParameters,
  ActionParameters,
  EnhancedActionType,
} from "../types/strategy";

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
      console.log("🚀 플로우 실행 시작:", {
        flowId: this.flow.id,
        nodeCount: this.flow.nodes.length,
        edgeCount: this.flow.edges.length,
      });

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

      console.log("✅ 플로우 실행 완료:", this.executionResult);
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

    console.log(`🔄 노드 실행: ${node.data.type} - ${node.data.label}`);

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
    data: FlowNodeData
  ): Promise<Record<string, unknown>> {
    console.log("🎬 전략 시작:", data.label);
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
    console.log("⏰ 스케줄 확인:", params);

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

    console.log("🔍 조건 확인:", { conditionType, params });

    const conditionMet = this.evaluateCondition(conditionType, params);

    return {
      type: "condition",
      conditionMet,
      conditionType,
      params,
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

    console.log("⚡ 액션 실행:", { actionType, params });

    const actionResult = await this.executeAction(actionType, params);

    // 최종 액션 목록에 추가
    if (actionResult.executed) {
      this.executionResult.finalActions?.push({
        type: actionType!,
        params: (params as Record<string, unknown>) || {},
        executed: true,
        result: actionResult,
      });
    }

    return actionResult;
  }

  // 종료 노드 실행
  private async executeEndNode(
    data: FlowNodeData
  ): Promise<Record<string, unknown>> {
    console.log("🏁 전략 종료:", data.label);
    return {
      type: "end",
      message: "전략이 종료되었습니다.",
      timestamp: new Date(),
    };
  }

  // 다음 노드들 실행
  private async executeNextNodes(
    currentNode: StrategyFlowNode,
    result: Record<string, unknown>
  ): Promise<void> {
    const outgoingEdges = this.flow.edges.filter(
      (edge) => edge.source === currentNode.id
    );

    for (const edge of outgoingEdges) {
      let shouldFollowEdge = true;

      // 조건 노드의 경우 결과에 따라 분기
      if (currentNode.data.type === "condition") {
        const conditionMet = result.conditionMet as boolean;
        shouldFollowEdge =
          (edge.sourceHandle === "true" && conditionMet) ||
          (edge.sourceHandle === "false" && !conditionMet) ||
          !edge.sourceHandle; // 기본 연결
      }

      if (shouldFollowEdge) {
        await this.executeFromNode(edge.target);
      }
    }
  }

  // 스케줄 조건 확인
  private checkSchedule(params?: Record<string, unknown>): boolean {
    // 실제 구현에서는 현재 시간, 시장 상태 등을 확인
    // 여기서는 데모용으로 항상 true 반환
    console.log("📅 스케줄 체크:", params);
    return true;
  }

  // 투자 조건 평가
  private evaluateCondition(
    conditionType?: string,
    params?: ConditionParameters
  ): boolean {
    if (!conditionType || !params) return false;

    // 현재 마켓 데이터 가져오기
    const currentPrice = this.context.currentMarketData?.price || 100000;
    const mockPreviousPrice = 95000; // 실제로는 과거 데이터에서 가져옴

    console.log("📊 조건 평가:", {
      conditionType,
      currentPrice,
      mockPreviousPrice,
      params,
    });

    switch (conditionType) {
      case "close_price_change": {
        const changePercent =
          ((currentPrice - mockPreviousPrice) / mockPreviousPrice) * 100;
        const targetPercent = params.priceChangePercent || 0;

        if (params.priceChangeDirection === "up") {
          return changePercent >= targetPercent;
        } else {
          return changePercent <= -targetPercent;
        }
      }

      case "high_price_change":
      case "low_price_change":
        // 유사한 로직으로 구현
        return Math.random() > 0.5; // 데모용

      default:
        return false;
    }
  }

  // 투자 액션 실행
  private async executeAction(
    actionType?: EnhancedActionType,
    params?: ActionParameters
  ): Promise<Record<string, unknown>> {
    if (!actionType) {
      throw new Error("액션 타입이 정의되지 않았습니다.");
    }

    const portfolio = this.context.portfolio;
    const currentPrice = this.context.currentMarketData?.price || 100000;

    console.log("💰 액션 실행:", {
      actionType,
      params,
      portfolio,
      currentPrice,
    });

    switch (actionType) {
      case "buy_percent_cash": {
        const cashToBuy =
          (portfolio?.cash || 0) * ((params?.percentCash || 0) / 100);
        const sharesToBuy = Math.floor(cashToBuy / currentPrice);

        return {
          executed: true,
          actionType,
          amount: cashToBuy,
          shares: sharesToBuy,
          price: currentPrice,
          message: `현금 ${params?.percentCash}% (${cashToBuy.toLocaleString()}원)로 ${sharesToBuy}주 매수`,
        };
      }

      case "sell_percent_stock": {
        const currentHoldings = portfolio?.holdings?.[0]?.quantity || 0;
        const sharesToSell = Math.floor(
          currentHoldings * ((params?.percentStock || 0) / 100)
        );
        const cashToReceive = sharesToSell * currentPrice;

        return {
          executed: true,
          actionType,
          shares: sharesToSell,
          amount: cashToReceive,
          price: currentPrice,
          message: `보유 주식 ${params?.percentStock}% (${sharesToSell}주) 매도로 ${cashToReceive.toLocaleString()}원 확보`,
        };
      }

      case "exit_all":
        return {
          executed: true,
          actionType,
          message: "모든 포지션을 정리하고 투자를 종료합니다.",
        };

      case "pause_strategy":
        return {
          executed: true,
          actionType,
          message: "전략 실행을 일시정지합니다.",
        };

      case "alert":
        return {
          executed: true,
          actionType,
          message: "조건 만족 알림을 발송했습니다.",
        };

      case "log": {
        const logData = {
          timestamp: new Date(),
          portfolio,
          marketData: this.context.currentMarketData,
        };

        return {
          executed: true,
          actionType,
          message: "현재 상황을 로그에 기록했습니다.",
          data: logData,
        };
      }

      case "hold":
        return {
          executed: true,
          actionType,
          message: "현재 포지션을 유지합니다.",
        };

      default:
        throw new Error(`지원하지 않는 액션 타입: ${actionType}`);
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
