import { useState, useCallback } from "react";
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Paper,
  Alert,
  Badge,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconPlus,
  IconPlayerPlay,
  IconInfoCircle,
  IconArrowDown,
  IconChevronUp,
  IconChevronDown,
} from "@tabler/icons-react";
import { ConditionBlock } from "./ConditionBlock";
import { ActionBlock } from "./ActionBlock";
import type { StrategyBlock, Strategy } from "../../types/strategy";

interface StrategyEditorProps {
  strategy: Strategy;
  onStrategyUpdate: (strategy: Strategy) => void;
  onBacktest?: () => void;
  readOnly?: boolean;
}

export const StrategyEditor = ({
  strategy,
  onStrategyUpdate,
  onBacktest,
  readOnly = false,
}: StrategyEditorProps) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // 블록 생성 함수
  const createBlock = useCallback(
    (type: "condition" | "action"): StrategyBlock => {
      const id = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      return {
        id,
        type,
        name: type === "condition" ? "새 조건" : "새 액션",
        enabled: true,
        createdAt: now,
        updatedAt: now,
        ...(type === "condition" && {
          conditionType: "price_change_percent",
          conditionParams: {
            priceChangeDirection: "up",
            priceChangePercent: 5,
          },
        }),
        ...(type === "action" && {
          actionType: "buy_percent_cash",
          actionParams: {
            percentCash: 30,
          },
        }),
      };
    },
    []
  );

  // 블록 추가
  const addBlock = useCallback(
    (type: "condition" | "action") => {
      const newBlock = createBlock(type);
      const updatedStrategy = {
        ...strategy,
        blocks: [...strategy.blocks, newBlock],
        blockOrder: [...strategy.blockOrder, newBlock.id],
        updatedAt: new Date(),
      };
      onStrategyUpdate(updatedStrategy);
    },
    [strategy, createBlock, onStrategyUpdate]
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

  // 블록 순서 변경
  const moveBlock = useCallback(
    (blockId: string, direction: "up" | "down") => {
      const currentIndex = strategy.blockOrder.indexOf(blockId);
      if (currentIndex === -1) return;

      const newOrder = [...strategy.blockOrder];
      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (newIndex >= 0 && newIndex < newOrder.length) {
        [newOrder[currentIndex], newOrder[newIndex]] = [
          newOrder[newIndex],
          newOrder[currentIndex],
        ];

        const updatedStrategy = {
          ...strategy,
          blockOrder: newOrder,
          updatedAt: new Date(),
        };
        onStrategyUpdate(updatedStrategy);
      }
    },
    [strategy, onStrategyUpdate]
  );

  // 순서대로 정렬된 블록들
  const orderedBlocks = strategy.blockOrder
    .map((id) => strategy.blocks.find((block) => block.id === id))
    .filter(Boolean) as StrategyBlock[];

  // 조건 블록과 액션 블록 분리
  const conditionBlocks = orderedBlocks.filter(
    (block) => block.type === "condition"
  );
  const actionBlocks = orderedBlocks.filter((block) => block.type === "action");

  // 전략 유효성 검사
  const isValidStrategy = conditionBlocks.length > 0 && actionBlocks.length > 0;

  return (
    <Container size="lg">
      <Stack gap="lg">
        {/* 헤더 */}
        <Group justify="space-between">
          <div>
            <Title order={2}>{strategy.name}</Title>
            <Text c="dimmed" size="sm">
              {strategy.description || "투자 전략을 구성하세요"}
            </Text>
          </div>

          <Group>
            {isValidStrategy && onBacktest && (
              <Button
                leftSection={<IconPlayerPlay size={16} />}
                color="green"
                onClick={onBacktest}
                disabled={readOnly}
              >
                백테스트 실행
              </Button>
            )}

            <Button
              variant="subtle"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
            >
              {isPreviewMode ? "편집 모드" : "미리보기"}
            </Button>
          </Group>
        </Group>

        {/* 전략 설명 */}
        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
          <Text size="sm">
            <strong>전략 구성 방법:</strong> 조건 블록에서 매매 조건을 설정하고,
            액션 블록에서 실행할 매매 행동을 정의하세요. 조건은 위에서부터
            순차적으로 평가되며, 만족하는 조건이 있으면 해당 액션을 실행합니다.
          </Text>
        </Alert>

        {/* 통계 정보 */}
        <Paper p="md" withBorder>
          <Group>
            <Badge variant="light" color="blue">
              조건 블록 {conditionBlocks.length}개
            </Badge>
            <Badge variant="light" color="green">
              액션 블록 {actionBlocks.length}개
            </Badge>
            <Badge variant="light" color={isValidStrategy ? "green" : "orange"}>
              {isValidStrategy ? "실행 가능" : "불완전한 전략"}
            </Badge>
          </Group>
        </Paper>

        {/* 조건 블록 섹션 */}
        <div>
          <Group justify="space-between" mb="md">
            <Title order={3}>조건 블록</Title>
            {!readOnly && (
              <Button
                size="sm"
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={() => addBlock("condition")}
              >
                조건 추가
              </Button>
            )}
          </Group>

          <Stack gap="md">
            {conditionBlocks.length === 0 ? (
              <Paper p="xl" withBorder style={{ textAlign: "center" }}>
                <Text c="dimmed">
                  조건 블록이 없습니다. 매매 조건을 추가해주세요.
                </Text>
                {!readOnly && (
                  <Button
                    mt="md"
                    variant="light"
                    leftSection={<IconPlus size={16} />}
                    onClick={() => addBlock("condition")}
                  >
                    첫 번째 조건 추가
                  </Button>
                )}
              </Paper>
            ) : (
              conditionBlocks.map((block, index) => (
                <Paper key={block.id} p="sm" withBorder>
                  <Group justify="space-between" mb="sm">
                    <Text size="sm" fw={500} c="dimmed">
                      조건 #{index + 1}
                    </Text>
                    {!readOnly && (
                      <Group gap="xs">
                        <Tooltip label="위로 이동">
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            disabled={index === 0}
                            onClick={() => moveBlock(block.id, "up")}
                          >
                            <IconChevronUp size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="아래로 이동">
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            disabled={index === conditionBlocks.length - 1}
                            onClick={() => moveBlock(block.id, "down")}
                          >
                            <IconChevronDown size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    )}
                  </Group>

                  <ConditionBlock
                    block={block}
                    onUpdate={updateBlock}
                    onDelete={deleteBlock}
                    readOnly={readOnly}
                  />
                </Paper>
              ))
            )}
          </Stack>
        </div>

        {/* 화살표 */}
        {conditionBlocks.length > 0 && actionBlocks.length > 0 && (
          <div style={{ textAlign: "center" }}>
            <IconArrowDown size={24} color="var(--mantine-color-dimmed)" />
            <Text size="sm" c="dimmed" mt="xs">
              조건 만족시
            </Text>
          </div>
        )}

        {/* 액션 블록 섹션 */}
        <div>
          <Group justify="space-between" mb="md">
            <Title order={3}>액션 블록</Title>
            {!readOnly && (
              <Button
                size="sm"
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={() => addBlock("action")}
              >
                액션 추가
              </Button>
            )}
          </Group>

          <Stack gap="md">
            {actionBlocks.length === 0 ? (
              <Paper p="xl" withBorder style={{ textAlign: "center" }}>
                <Text c="dimmed">
                  액션 블록이 없습니다. 실행할 매매 행동을 추가해주세요.
                </Text>
                {!readOnly && (
                  <Button
                    mt="md"
                    variant="light"
                    leftSection={<IconPlus size={16} />}
                    onClick={() => addBlock("action")}
                  >
                    첫 번째 액션 추가
                  </Button>
                )}
              </Paper>
            ) : (
              actionBlocks.map((block, index) => (
                <Paper key={block.id} p="sm" withBorder>
                  <Group justify="space-between" mb="sm">
                    <Text size="sm" fw={500} c="dimmed">
                      액션 #{index + 1}
                    </Text>
                    {!readOnly && (
                      <Group gap="xs">
                        <Tooltip label="위로 이동">
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            disabled={index === 0}
                            onClick={() => moveBlock(block.id, "up")}
                          >
                            <IconChevronUp size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="아래로 이동">
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            disabled={index === actionBlocks.length - 1}
                            onClick={() => moveBlock(block.id, "down")}
                          >
                            <IconChevronDown size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    )}
                  </Group>

                  <ActionBlock
                    block={block}
                    onUpdate={updateBlock}
                    onDelete={deleteBlock}
                    readOnly={readOnly}
                  />
                </Paper>
              ))
            )}
          </Stack>
        </div>

        {/* 전략 유효성 알림 */}
        {!isValidStrategy && (
          <Alert color="orange" variant="light">
            <Text size="sm">
              <strong>불완전한 전략:</strong> 백테스트를 실행하려면 최소 1개의
              조건 블록과 1개의 액션 블록이 필요합니다.
            </Text>
          </Alert>
        )}
      </Stack>
    </Container>
  );
};
