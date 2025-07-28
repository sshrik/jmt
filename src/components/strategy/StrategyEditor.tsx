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

// 룰 구조 정의
interface StrategyRule {
  id: string;
  conditions: StrategyBlock[];
  actions: StrategyBlock[];
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

  // 블록 정렬 및 룰 생성
  const rules = useMemo(() => {
    // blockOrder가 있으면 그에 따라 정렬, 없으면 createdAt 순서
    const sortedBlocks = strategy.blockOrder?.length
      ? (strategy.blockOrder
          .map((id) => strategy.blocks.find((block) => block.id === id))
          .filter(Boolean) as StrategyBlock[])
      : [...strategy.blocks].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

    // 조건-액션 패턴을 기반으로 룰 생성
    const newRules: StrategyRule[] = [];
    let currentConditions: StrategyBlock[] = [];
    let currentActions: StrategyBlock[] = [];

    for (let i = 0; i < sortedBlocks.length; i++) {
      const block = sortedBlocks[i];

      if (block.type === "condition") {
        // 현재 액션이 있고 새로운 조건이 나오면 이전 룰 완료
        if (currentActions.length > 0 && currentConditions.length > 0) {
          newRules.push({
            id: `rule-${newRules.length}`,
            conditions: [...currentConditions],
            actions: [...currentActions],
          });
          currentConditions = [];
          currentActions = [];
        }
        currentConditions.push(block);
      } else if (block.type === "action") {
        currentActions.push(block);
      }
    }

    // 마지막 룰 추가
    if (currentConditions.length > 0 && currentActions.length > 0) {
      newRules.push({
        id: `rule-${newRules.length}`,
        conditions: [...currentConditions],
        actions: [...currentActions],
      });
    }

    return newRules;
  }, [strategy.blocks, strategy.blockOrder]);

  // 전략 유효성 검사
  const isValidStrategy = rules.length > 0;

  // 새 룰 추가 (조건 1개, 액션 1개로 시작)
  const addRule = useCallback(() => {
    const conditionBlock = createBlock("condition");
    const actionBlock = createBlock("action");

    const currentBlockOrder = strategy.blockOrder || [];

    const updatedStrategy = {
      ...strategy,
      blocks: [...strategy.blocks, conditionBlock, actionBlock],
      blockOrder: [...currentBlockOrder, conditionBlock.id, actionBlock.id],
      updatedAt: new Date(),
    };

    onStrategyUpdate(updatedStrategy);
  }, [strategy, onStrategyUpdate]);

  // 룰에 조건 추가
  const addConditionToRule = useCallback(
    (ruleIndex: number) => {
      const rule = rules[ruleIndex];
      if (!rule) return;

      const conditionBlock = createBlock("condition");
      const currentBlockOrder = strategy.blockOrder || [];

      // 해당 룰의 마지막 조건 뒤에 새 조건 삽입
      const lastConditionId = rule.conditions[rule.conditions.length - 1].id;
      const insertIndex = currentBlockOrder.indexOf(lastConditionId) + 1;

      const newBlockOrder = [...currentBlockOrder];
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
      const currentBlockOrder = strategy.blockOrder || [];

      // 해당 룰의 마지막 액션 뒤에 새 액션 삽입
      const lastActionId = rule.actions[rule.actions.length - 1].id;
      const insertIndex = currentBlockOrder.indexOf(lastActionId) + 1;

      const newBlockOrder = [...currentBlockOrder];
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
      const currentBlockOrder = strategy.blockOrder || [];

      const updatedStrategy = {
        ...strategy,
        blocks: strategy.blocks.filter(
          (block) => !blockIdsToDelete.includes(block.id)
        ),
        blockOrder: currentBlockOrder.filter(
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
      const currentBlockOrder = strategy.blockOrder || [];

      const updatedStrategy = {
        ...strategy,
        blocks: strategy.blocks.filter((block) => block.id !== blockId),
        blockOrder: currentBlockOrder.filter((id) => id !== blockId),
        updatedAt: new Date(),
      };
      onStrategyUpdate(updatedStrategy);
    },
    [strategy, onStrategyUpdate]
  );

  // 플로우 변환 함수
  const convertToFlow = useCallback((): StrategyFlow => {
    console.log("🔄 convertToFlow called with strategy:", {
      id: strategy.id,
      blocksCount: strategy.blocks.length,
      blockOrder: strategy.blockOrder,
    });

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

    // 스케줄 노드 (시작에서 더 멀리)
    flowNodes.push({
      id: "schedule",
      type: "schedule",
      position: { x: 400, y: 400 }, // 300px 간격으로 증가
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

    // 기존 블록들을 플로우 노드로 변환 (더 넓은 간격)
    rules.forEach((rule, ruleIndex) => {
      const ruleY = 800 + ruleIndex * 600; // 스케줄에서 400px 떨어진 곳부터 시작, 룰 간 600px 간격

      // 조건 노드들
      rule.conditions.forEach((condition, condIndex) => {
        const nodeX = 100 + condIndex * 500; // 조건 간 500px 간격
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

      // 액션 노드들 (조건에서 더 멀리)
      rule.actions.forEach((action, actionIndex) => {
        const nodeX = 100 + actionIndex * 500; // 액션 간 500px 간격
        const actionY = ruleY + 500; // 조건에서 500px 아래
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

    // 종료 노드 (마지막 룰에서 충분히 멀리)
    const finalY =
      rules.length > 0 ? 800 + (rules.length - 1) * 600 + 1000 : 1200;
    flowNodes.push({
      id: "end",
      type: "end",
      position: { x: 400, y: finalY },
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

      // 기존 블록 수와 새 노드 수가 같다면 메타데이터만 업데이트
      const conditionNodes = updatedFlow.nodes.filter(
        (node) => node.data.type === "condition"
      );
      const actionNodes = updatedFlow.nodes.filter(
        (node) => node.data.type === "action"
      );
      const totalNewBlocks = conditionNodes.length + actionNodes.length;

      // 실제 블록 구조 변경이 없다면 업데이트 스킵
      // 단, 블록 ID가 다르면 새로운 블록이므로 업데이트 필요
      if (totalNewBlocks === strategy.blocks.length) {
        const currentBlockIds = new Set(strategy.blocks.map((b) => b.id));
        const flowBlockIds = new Set([
          ...conditionNodes.map((n) => n.id),
          ...actionNodes.map((n) => n.id),
        ]);

        // ID가 모두 동일하면 추가로 순서도 확인
        const allIdsMatch =
          currentBlockIds.size === flowBlockIds.size &&
          [...currentBlockIds].every((id) => flowBlockIds.has(id));

        if (allIdsMatch) {
          // blockOrder도 동일한지 확인
          const currentOrder = strategy.blockOrder || [];
          const expectedOrder: string[] = [];

          // 조건-액션 쌍 순서로 예상 순서 생성
          const minLength = Math.min(conditionNodes.length, actionNodes.length);
          for (let i = 0; i < minLength; i++) {
            expectedOrder.push(conditionNodes[i].id, actionNodes[i].id);
          }
          for (let i = minLength; i < conditionNodes.length; i++) {
            expectedOrder.push(conditionNodes[i].id);
          }
          for (let i = minLength; i < actionNodes.length; i++) {
            expectedOrder.push(actionNodes[i].id);
          }

          // 순서가 동일하면 업데이트 스킵
          const orderMatches =
            currentOrder.length === expectedOrder.length &&
            currentOrder.every((id, index) => id === expectedOrder[index]);

          if (orderMatches) {
            return; // 변경사항이 없으므로 업데이트 스킵
          }
        }
      }

      // 실제 변경이 있는 경우에만 업데이트 진행
      // 추가 조건: 룰 기반 에디터에서 최근에 변경했다면 일정 시간 동안 스킵
      const timeSinceLastUpdate = Date.now() - strategy.updatedAt.getTime();
      if (timeSinceLastUpdate < 3000) {
        // 3초 이내에는 스킵
        return;
      }

      // 플로우에서 조건과 액션 블록들 추출
      const newBlocks: StrategyBlock[] = [];
      const newBlockOrder: string[] = [];

      // 조건과 액션을 쌍으로 매칭하여 올바른 순서로 변환
      const minLength = Math.min(conditionNodes.length, actionNodes.length);

      for (let i = 0; i < minLength; i++) {
        // 조건 블록 추가
        const conditionNode = conditionNodes[i];
        const conditionBlock: StrategyBlock = {
          id: conditionNode.id,
          type: "condition",
          name: conditionNode.data.label,
          enabled: conditionNode.data.enabled || true,
          createdAt: conditionNode.data.createdAt || new Date(),
          updatedAt: new Date(),
          position: conditionNode.position,
          connections: [],
          conditionType: conditionNode.data.conditionType,
          conditionParams: conditionNode.data.conditionParams,
        };
        newBlocks.push(conditionBlock);
        newBlockOrder.push(conditionNode.id);

        // 액션 블록 추가
        const actionNode = actionNodes[i];
        const actionBlock: StrategyBlock = {
          id: actionNode.id,
          type: "action",
          name: actionNode.data.label,
          enabled: actionNode.data.enabled || true,
          createdAt: actionNode.data.createdAt || new Date(),
          updatedAt: new Date(),
          position: actionNode.position,
          connections: [],
          actionType: actionNode.data.actionType as ActionType,
          actionParams: actionNode.data.actionParams,
        };
        newBlocks.push(actionBlock);
        newBlockOrder.push(actionNode.id);
      }

      // 남은 조건들 추가 (액션보다 조건이 많은 경우)
      for (let i = minLength; i < conditionNodes.length; i++) {
        const conditionNode = conditionNodes[i];
        const conditionBlock: StrategyBlock = {
          id: conditionNode.id,
          type: "condition",
          name: conditionNode.data.label,
          enabled: conditionNode.data.enabled || true,
          createdAt: conditionNode.data.createdAt || new Date(),
          updatedAt: new Date(),
          position: conditionNode.position,
          connections: [],
          conditionType: conditionNode.data.conditionType,
          conditionParams: conditionNode.data.conditionParams,
        };
        newBlocks.push(conditionBlock);
        newBlockOrder.push(conditionNode.id);
      }

      // 남은 액션들 추가 (조건보다 액션이 많은 경우)
      for (let i = minLength; i < actionNodes.length; i++) {
        const actionNode = actionNodes[i];
        const actionBlock: StrategyBlock = {
          id: actionNode.id,
          type: "action",
          name: actionNode.data.label,
          enabled: actionNode.data.enabled || true,
          createdAt: actionNode.data.createdAt || new Date(),
          updatedAt: new Date(),
          position: actionNode.position,
          connections: [],
          actionType: actionNode.data.actionType as ActionType,
          actionParams: actionNode.data.actionParams,
        };
        newBlocks.push(actionBlock);
        newBlockOrder.push(actionNode.id);
      }

      // 전략 업데이트
      const updatedStrategy: Strategy = {
        ...strategy,
        name: updatedFlow.name.replace(" (플로우)", ""),
        description: updatedFlow.description,
        blocks: newBlocks,
        blockOrder: newBlockOrder,
        updatedAt: new Date(),
      };

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
              flow={(() => {
                const flowData = convertToFlow();
                console.log("📊 Passing flow to StrategyFlowEditor:", flowData);
                return flowData;
              })()}
              onFlowUpdate={handleFlowUpdate}
              readOnly={readOnly}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Card>
  );
};
