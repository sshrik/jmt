import { useCallback, useMemo, useState } from "react";
import {
  Title,
  Text,
  Stack,
  Group,
  Button,
  Paper,
  Alert,
  Badge,
  Card,
  Tabs,
} from "@mantine/core";
import {
  IconPlus,
  IconInfoCircle,
  IconGitBranch,
  IconListCheck,
} from "@tabler/icons-react";
import { StrategyRuleEditor } from "./StrategyRuleEditor";
import { StrategyFlowEditor } from "./StrategyFlowEditor";
import type {
  StrategyBlock,
  Strategy,
  StrategyFlow,
  ActionType,
  StrategyFlowNode,
  StrategyFlowEdge,
} from "../../types/strategy";

interface StrategyEditorProps {
  strategy: Strategy;
  onStrategyUpdate: (strategy: Strategy) => void;
  readOnly?: boolean;
}

// 새 블록 생성 헬퍼 함수
const createBlock = (type: "condition" | "action"): StrategyBlock => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  const blockId = `block_${timestamp}_${randomId}`;

  const baseBlock = {
    id: blockId,
    type,
    name: type === "condition" ? "새 조건" : "새 액션",
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    position: { x: 0, y: 0 },
    connections: [],
  };

  if (type === "condition") {
    return {
      ...baseBlock,
      conditionType: "close_price_change" as const,
      conditionParams: {
        priceChangeDirection: "up" as const,
        priceChangePercent: 5,
      },
    };
  } else {
    return {
      ...baseBlock,
      actionType: "buy_percent_cash" as const,
      actionParams: {
        percentCash: 30,
      },
    };
  }
};

export const StrategyEditor = ({
  strategy,
  onStrategyUpdate,
  readOnly = false,
}: StrategyEditorProps) => {
  const [activeTab, setActiveTab] = useState<"rules" | "flow">("rules");

  // 순서대로 정렬된 블록들
  const orderedBlocks = strategy.blockOrder
    .map((id) => strategy.blocks.find((block) => block.id === id))
    .filter(Boolean) as StrategyBlock[];

  console.log("📋 StrategyEditor 블록 순서 정렬:", {
    blockOrderLength: strategy.blockOrder.length,
    foundBlocks: orderedBlocks.length,
    allBlocks: strategy.blocks.length,
    blockIds: strategy.blocks.map((b) => b.id),
    blockOrder: strategy.blockOrder,
  });

  // 룰별로 블록 그룹핑 (blockOrder 기반으로 순서대로 조건-액션 쌍을 만듦)
  const rules = useMemo(() => {
    const orderedBlocks = strategy.blockOrder
      .map((id) => strategy.blocks.find((block) => block.id === id))
      .filter(Boolean) as StrategyBlock[];

    console.log("📋 StrategyEditor 블록 순서 정렬:", {
      blockOrderLength: strategy.blockOrder.length,
      foundBlocks: orderedBlocks.length,
      allBlocks: strategy.blocks.length,
      blockIds: strategy.blocks.map((b) => b.id),
      blockOrder: strategy.blockOrder,
    });

    // 조건과 액션을 순서대로 쌍으로 만들되, 룰 단위로 그룹핑
    const generatedRules = [];
    let currentRuleConditions: StrategyBlock[] = [];
    let currentRuleActions: StrategyBlock[] = [];
    let expectingAction = false;

    for (const block of orderedBlocks) {
      if (block.type === "condition") {
        // 새로운 조건이 시작되면 이전 룰을 완성하고 새 룰 시작
        if (expectingAction && currentRuleActions.length > 0) {
          generatedRules.push({
            conditions: currentRuleConditions,
            actions: currentRuleActions,
          });
          currentRuleConditions = [];
          currentRuleActions = [];
        }
        currentRuleConditions.push(block);
        expectingAction = false;
      } else if (block.type === "action") {
        currentRuleActions.push(block);
        expectingAction = true;
      }
    }

    // 마지막 룰 추가
    if (currentRuleConditions.length > 0 && currentRuleActions.length > 0) {
      generatedRules.push({
        conditions: currentRuleConditions,
        actions: currentRuleActions,
      });
    }

    console.log("🔗 룰 생성:", {
      totalRules: generatedRules.length,
      rules: generatedRules.map((rule, index) => ({
        ruleIndex: index,
        conditionCount: rule.conditions.length,
        actionCount: rule.actions.length,
      })),
    });

    return generatedRules;
  }, [strategy.blocks, strategy.blockOrder]);

  // 전략 유효성 검사
  const isValidStrategy = rules.length > 0;

  // 새 룰 추가 (조건 1개, 액션 1개로 시작)
  const addRule = useCallback(() => {
    const conditionBlock = createBlock("condition");
    const actionBlock = createBlock("action");

    const updatedStrategy = {
      ...strategy,
      blocks: [...strategy.blocks, conditionBlock, actionBlock],
      blockOrder: [...strategy.blockOrder, conditionBlock.id, actionBlock.id],
      updatedAt: new Date(),
    };

    console.log("➕ 새 룰 추가:", {
      blocksCount: updatedStrategy.blocks.length,
      blockOrderCount: updatedStrategy.blockOrder.length,
      conditionId: conditionBlock.id,
      actionId: actionBlock.id,
    });

    onStrategyUpdate(updatedStrategy);
  }, [strategy, onStrategyUpdate]);

  // 룰에 조건 추가
  const addConditionToRule = useCallback(
    (ruleIndex: number) => {
      const rule = rules[ruleIndex];
      if (!rule) return;

      const conditionBlock = createBlock("condition");

      // 해당 룰의 마지막 조건 뒤에 새 조건 삽입
      const lastConditionId = rule.conditions[rule.conditions.length - 1].id;
      const insertIndex = strategy.blockOrder.indexOf(lastConditionId) + 1;

      const newBlockOrder = [...strategy.blockOrder];
      newBlockOrder.splice(insertIndex, 0, conditionBlock.id);

      const updatedStrategy = {
        ...strategy,
        blocks: [...strategy.blocks, conditionBlock],
        blockOrder: newBlockOrder,
        updatedAt: new Date(),
      };

      onStrategyUpdate(updatedStrategy);
    },
    [rules, strategy, onStrategyUpdate]
  );

  // 룰에 액션 추가
  const addActionToRule = useCallback(
    (ruleIndex: number) => {
      const rule = rules[ruleIndex];
      if (!rule) return;

      const actionBlock = createBlock("action");

      // 해당 룰의 마지막 액션 뒤에 새 액션 삽입
      const lastActionId = rule.actions[rule.actions.length - 1].id;
      const insertIndex = strategy.blockOrder.indexOf(lastActionId) + 1;

      const newBlockOrder = [...strategy.blockOrder];
      newBlockOrder.splice(insertIndex, 0, actionBlock.id);

      const updatedStrategy = {
        ...strategy,
        blocks: [...strategy.blocks, actionBlock],
        blockOrder: newBlockOrder,
        updatedAt: new Date(),
      };

      onStrategyUpdate(updatedStrategy);
    },
    [rules, strategy, onStrategyUpdate]
  );

  // 룰 삭제
  const deleteRule = useCallback(
    (ruleIndex: number) => {
      const rule = rules[ruleIndex];
      if (!rule) return;

      const blocksToDelete = [...rule.conditions, ...rule.actions];
      const blockIdsToDelete = blocksToDelete.map((block) => block.id);

      const updatedStrategy = {
        ...strategy,
        blocks: strategy.blocks.filter(
          (block) => !blockIdsToDelete.includes(block.id)
        ),
        blockOrder: strategy.blockOrder.filter(
          (id) => !blockIdsToDelete.includes(id)
        ),
        updatedAt: new Date(),
      };

      onStrategyUpdate(updatedStrategy);
    },
    [rules, strategy, onStrategyUpdate]
  );

  // 블록 업데이트
  const updateBlock = useCallback(
    (updatedBlock: StrategyBlock) => {
      const updatedStrategy = {
        ...strategy,
        blocks: strategy.blocks.map((block) =>
          block.id === updatedBlock.id ? updatedBlock : block
        ),
        updatedAt: new Date(),
      };
      onStrategyUpdate(updatedStrategy);
    },
    [strategy, onStrategyUpdate]
  );

  // 블록 삭제
  const deleteBlock = useCallback(
    (blockId: string) => {
      const updatedStrategy = {
        ...strategy,
        blocks: strategy.blocks.filter((block) => block.id !== blockId),
        blockOrder: strategy.blockOrder.filter((id) => id !== blockId),
        updatedAt: new Date(),
      };
      onStrategyUpdate(updatedStrategy);
    },
    [strategy, onStrategyUpdate]
  );

  // 플로우 변환 함수
  const convertToFlow = useCallback((): StrategyFlow => {
    const flowNodes: StrategyFlowNode[] = [];
    const flowEdges: StrategyFlowEdge[] = [];

    // 시작 노드
    flowNodes.push({
      id: "start",
      type: "start",
      position: { x: 400, y: 100 },
      data: {
        id: "start",
        label: "전략 시작",
        type: "start",
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 스케줄 노드
    flowNodes.push({
      id: "schedule",
      type: "schedule",
      position: { x: 400, y: 300 },
      data: {
        id: "schedule",
        label: "실행 일정",
        type: "schedule",
        enabled: true,
        scheduleParams: {
          scheduleType: "daily",
          executionTime: "09:30",
          description: "매일 09:30에 실행",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 기존 블록들을 플로우 노드로 변환
    rules.forEach((rule, ruleIndex) => {
      const ruleY = 500 + ruleIndex * 400;

      // 조건 노드들
      rule.conditions.forEach((condition, condIndex) => {
        const nodeX = 100 + condIndex * 400;
        flowNodes.push({
          id: condition.id,
          type: "condition",
          position: { x: nodeX, y: ruleY },
          data: {
            id: condition.id,
            label: condition.name,
            type: "condition",
            enabled: condition.enabled,
            conditionType: condition.conditionType,
            conditionParams: condition.conditionParams,
            createdAt: condition.createdAt,
            updatedAt: condition.updatedAt,
          },
        });
      });

      // 액션 노드들
      rule.actions.forEach((action, actionIndex) => {
        const nodeX = 100 + actionIndex * 400;
        const actionY = ruleY + 300;
        flowNodes.push({
          id: action.id,
          type: "action",
          position: { x: nodeX, y: actionY },
          data: {
            id: action.id,
            label: action.name,
            type: "action",
            enabled: action.enabled,
            actionType: action.actionType,
            actionParams: action.actionParams,
            createdAt: action.createdAt,
            updatedAt: action.updatedAt,
          },
        });
      });
    });

    // 종료 노드
    flowNodes.push({
      id: "end",
      type: "end",
      position: { x: 400, y: 1000 },
      data: {
        id: "end",
        label: "전략 종료",
        type: "end",
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 기본 연결 생성
    flowEdges.push({
      id: "start-schedule",
      source: "start",
      target: "schedule",
      animated: true,
    });

    // 룰들 간의 연결 생성
    if (rules.length > 0) {
      // 스케줄 노드에서 첫 번째 룰의 첫 번째 조건으로 연결
      const firstRule = rules[0];
      if (firstRule.conditions.length > 0) {
        flowEdges.push({
          id: "schedule-first-condition",
          source: "schedule",
          target: firstRule.conditions[0].id,
          animated: true,
        });
      }

      // 각 룰 내에서 조건-액션 연결
      rules.forEach((rule, ruleIndex) => {
        // 각 조건에서 룰의 모든 액션으로 연결
        rule.conditions.forEach((condition) => {
          rule.actions.forEach((action, actionIndex) => {
            flowEdges.push({
              id: `${condition.id}-${action.id}`,
              source: condition.id,
              target: action.id,
              animated: true,
              label: actionIndex === 0 ? "조건 만족 시" : "", // 첫 번째 액션에만 라벨
            });
          });
        });

        // 다음 룰이 있다면 현재 룰의 첫 번째 액션에서 다음 룰의 첫 번째 조건으로 연결
        if (ruleIndex < rules.length - 1) {
          const nextRule = rules[ruleIndex + 1];
          if (rule.actions.length > 0 && nextRule.conditions.length > 0) {
            flowEdges.push({
              id: `rule-${ruleIndex}-to-${ruleIndex + 1}`,
              source: rule.actions[0].id, // 첫 번째 액션에서
              target: nextRule.conditions[0].id, // 다음 룰의 첫 번째 조건으로
              animated: true,
              label: "다음 룰",
              style: { strokeDasharray: "5,5" }, // 점선으로 구분
            });
          }
        }
      });

      // 마지막 룰의 첫 번째 액션에서 종료 노드로 연결
      const lastRule = rules[rules.length - 1];
      if (lastRule.actions.length > 0) {
        flowEdges.push({
          id: "last-action-end",
          source: lastRule.actions[0].id,
          target: "end",
          animated: true,
          label: "전략 완료",
        });
      }
    } else {
      // 룰이 없다면 스케줄에서 바로 종료로 연결
      flowEdges.push({
        id: "schedule-end",
        source: "schedule",
        target: "end",
        animated: true,
        label: "룰 없음",
      });
    }

    return {
      id: `flow-${strategy.id}`,
      projectId: strategy.projectId || "",
      versionId: `v${Date.now()}`,
      name: `${strategy.name} (플로우)`,
      description: strategy.description,
      nodes: flowNodes,
      edges: flowEdges,
      executionSettings: {
        maxConcurrentActions: 1,
        errorHandling: "stop",
        retryCount: 3,
      },
      createdAt: strategy.createdAt,
      updatedAt: new Date(),
      isActive: true,
    };
  }, [strategy, rules]);

  // 플로우 업데이트 핸들러
  const handleFlowUpdate = useCallback(
    (updatedFlow: StrategyFlow) => {
      // 플로우를 기존 룰 기반 구조로 역변환하는 로직
      console.log("🔄 플로우 업데이트:", updatedFlow);

      // 기존 블록 수와 새 노드 수가 같다면 메타데이터만 업데이트
      const conditionNodes = updatedFlow.nodes.filter(
        (node) => node.data.type === "condition"
      );
      const actionNodes = updatedFlow.nodes.filter(
        (node) => node.data.type === "action"
      );
      const totalNewBlocks = conditionNodes.length + actionNodes.length;

      // 실제 블록 구조 변경이 없다면 업데이트 스킵
      if (totalNewBlocks === strategy.blocks.length) {
        console.log("📝 블록 구조 변경 없음 - 업데이트 스킵");
        return;
      }

      // 플로우에서 조건과 액션 블록들 추출
      const newBlocks: StrategyBlock[] = [];
      const newBlockOrder: string[] = [];

      // 조건 노드들을 블록으로 변환
      conditionNodes.forEach((node) => {
        const block: StrategyBlock = {
          id: node.id,
          type: "condition",
          name: node.data.label,
          enabled: node.data.enabled || true,
          createdAt: node.data.createdAt || new Date(),
          updatedAt: new Date(),
          position: node.position,
          connections: [],
          conditionType: node.data.conditionType,
          conditionParams: node.data.conditionParams,
        };
        newBlocks.push(block);
        newBlockOrder.push(node.id);
      });

      // 액션 노드들을 블록으로 변환
      actionNodes.forEach((node) => {
        const block: StrategyBlock = {
          id: node.id,
          type: "action",
          name: node.data.label,
          enabled: node.data.enabled || true,
          createdAt: node.data.createdAt || new Date(),
          updatedAt: new Date(),
          position: node.position,
          connections: [],
          actionType: node.data.actionType as ActionType,
          actionParams: node.data.actionParams,
        };
        newBlocks.push(block);
        newBlockOrder.push(node.id);
      });

      // 전략 업데이트
      const updatedStrategy: Strategy = {
        ...strategy,
        name: updatedFlow.name.replace(" (플로우)", ""),
        description: updatedFlow.description,
        blocks: newBlocks,
        blockOrder: newBlockOrder,
        updatedAt: new Date(),
      };

      console.log("📝 전략 업데이트:", {
        원본블록수: strategy.blocks.length,
        새블록수: newBlocks.length,
        블록순서: newBlockOrder,
      });

      onStrategyUpdate(updatedStrategy);
    },
    [strategy, onStrategyUpdate]
  );

  return (
    <Card withBorder p="lg">
      <Stack gap="lg">
        {/* 헤더 */}
        <Group justify="space-between">
          <Title order={2}>투자 전략</Title>
          <Group gap="sm">
            <Badge variant="light" color="blue">
              {activeTab === "rules" ? "룰 기반" : "플로우 차트"}
            </Badge>
            <Badge variant="light" color={isValidStrategy ? "green" : "orange"}>
              {isValidStrategy ? "실행 가능" : "불완전한 전략"}
            </Badge>
          </Group>
        </Group>

        {/* 모드 선택 탭 */}
        <Tabs
          value={activeTab}
          onChange={(value) => setActiveTab(value as "rules" | "flow")}
        >
          <Tabs.List>
            <Tabs.Tab value="rules" leftSection={<IconListCheck size={16} />}>
              룰 기반 에디터
            </Tabs.Tab>
            <Tabs.Tab value="flow" leftSection={<IconGitBranch size={16} />}>
              플로우 차트 에디터
            </Tabs.Tab>
          </Tabs.List>

          {/* 룰 기반 에디터 */}
          <Tabs.Panel value="rules" pt="lg">
            {/* 설명 (편집 모드에서만 표시) */}
            {!readOnly && (
              <Alert icon={<IconInfoCircle size="1rem" />} color="blue" mb="lg">
                <Text size="sm">
                  <strong>룰 기반 에디터:</strong> 조건과 액션을 쌍으로 연결하여
                  순차적인 투자 룰을 만드세요. 각 룰은 "이런 조건일 때 → 이런
                  행동을 실행"으로 구성됩니다.
                </Text>
              </Alert>
            )}

            {/* 통계 정보 */}
            <Paper p="md" withBorder mb="lg">
              <Group gap="md">
                <Badge variant="light" color="blue">
                  조건-액션 쌍 {rules.length}개
                </Badge>
                <Badge
                  variant="light"
                  color={isValidStrategy ? "green" : "orange"}
                >
                  {isValidStrategy ? "실행 가능" : "불완전한 전략"}
                </Badge>
              </Group>
            </Paper>

            {/* 기존 룰 에디터 내용 */}
            <div>
              <Group justify="space-between" mb="md">
                <Title order={3}>투자 전략 룰</Title>
                {!readOnly && (
                  <Button
                    size="sm"
                    variant="light"
                    leftSection={<IconPlus size={16} />}
                    onClick={addRule}
                  >
                    새 룰 추가
                  </Button>
                )}
              </Group>

              <Stack gap="md">
                {rules.length === 0 ? (
                  <Paper p="xl" withBorder style={{ textAlign: "center" }}>
                    <Text c="dimmed">
                      투자 룰이 없습니다. 조건과 액션을 연결한 룰을
                      추가해주세요.
                    </Text>
                    {!readOnly && (
                      <Button
                        mt="md"
                        variant="light"
                        leftSection={<IconPlus size={16} />}
                        onClick={addRule}
                      >
                        첫 번째 룰 추가
                      </Button>
                    )}
                  </Paper>
                ) : (
                  rules.map((rule, index) => (
                    <StrategyRuleEditor
                      key={`rule-${index}-${rule.conditions[0]?.id || ""}-${rule.actions[0]?.id || ""}`}
                      conditionBlocks={rule.conditions}
                      actionBlocks={rule.actions}
                      index={index}
                      onUpdateCondition={updateBlock}
                      onUpdateAction={updateBlock}
                      onDeleteCondition={deleteBlock}
                      onDeleteAction={deleteBlock}
                      onAddCondition={() => addConditionToRule(index)}
                      onAddAction={() => addActionToRule(index)}
                      onDeleteRule={() => deleteRule(index)}
                      onMoveUp={
                        index > 0
                          ? () => {
                              // 룰 순서 변경 로직은 복잡하므로 일단 비활성화
                            }
                          : undefined
                      }
                      onMoveDown={
                        index < rules.length - 1
                          ? () => {
                              // 룰 순서 변경 로직은 복잡하므로 일단 비활성화
                            }
                          : undefined
                      }
                      readOnly={readOnly}
                      canMoveUp={false} // 룰 순서 변경은 일단 비활성화
                      canMoveDown={false} // 룰 순서 변경은 일단 비활성화
                    />
                  ))
                )}
              </Stack>
            </div>

            {/* 전략 유효성 알림 (편집 모드에서만 표시) */}
            {!isValidStrategy && !readOnly && (
              <Alert color="orange" variant="light" mt="lg">
                <Text size="sm">
                  <strong>불완전한 전략:</strong> 백테스트를 실행하려면 최소
                  1개의 룰이 필요합니다.
                </Text>
              </Alert>
            )}
          </Tabs.Panel>

          {/* 플로우 차트 에디터 */}
          <Tabs.Panel value="flow" pt="lg">
            <Alert icon={<IconInfoCircle size="1rem" />} color="green" mb="lg">
              <Text size="sm">
                <strong>플로우 차트 에디터:</strong> 드래그앤드롭으로 노드를
                추가하고 연결하여 복잡한 투자 전략을 시각적으로 구성하세요.
                분기와 조건부 실행이 가능합니다.
              </Text>
            </Alert>

            <StrategyFlowEditor
              flow={convertToFlow()}
              onFlowUpdate={handleFlowUpdate}
              readOnly={readOnly}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Card>
  );
};
