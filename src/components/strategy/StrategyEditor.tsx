import { useCallback, useMemo } from "react";
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
} from "@mantine/core";
import { IconPlus, IconInfoCircle } from "@tabler/icons-react";
import { StrategyRuleEditor } from "./StrategyRuleEditor";
import type { StrategyBlock, Strategy } from "../../types/strategy";

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

  return (
    <Card withBorder p="lg">
      <Stack gap="lg">
        {/* 헤더 */}
        <Group justify="space-between">
          <Title order={2}>투자 전략</Title>
        </Group>

        {/* 설명 (편집 모드에서만 표시) */}
        {!readOnly && (
          <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
            <Text size="sm">
              <strong>전략 구성 방법:</strong> 조건과 액션을 쌍으로 연결하여
              투자 룰을 만드세요. 각 룰은 "이런 조건일 때 → 이런 행동을
              실행"으로 구성됩니다.
            </Text>
          </Alert>
        )}

        {/* 통계 정보 */}
        <Paper p="md" withBorder>
          <Group gap="md">
            <Badge variant="light" color="blue">
              조건-액션 쌍 {rules.length}개
            </Badge>
            <Badge variant="light" color={isValidStrategy ? "green" : "orange"}>
              {isValidStrategy ? "실행 가능" : "불완전한 전략"}
            </Badge>
          </Group>
        </Paper>

        {/* 조건-액션 쌍 섹션 */}
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
                  투자 룰이 없습니다. 조건과 액션을 연결한 룰을 추가해주세요.
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
          <Alert color="orange" variant="light">
            <Text size="sm">
              <strong>불완전한 전략:</strong> 백테스트를 실행하려면 최소 1개의
              룰이 필요합니다.
            </Text>
          </Alert>
        )}
      </Stack>
    </Card>
  );
};
