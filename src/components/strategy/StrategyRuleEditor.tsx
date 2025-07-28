import {
  Card,
  Title,
  Group,
  Text,
  ActionIcon,
  Tooltip,
  Stack,
  Badge,
  Button,
} from "@mantine/core";
import {
  IconTrash,
  IconChevronUp,
  IconChevronDown,
  IconArrowDown,
  IconPlus,
} from "@tabler/icons-react";
import { ConditionBlock } from "./ConditionBlock";
import { ActionBlock } from "./ActionBlock";
import type { StrategyBlock } from "../../types/strategy";

interface StrategyRuleEditorProps {
  conditionBlocks: StrategyBlock[];
  actionBlocks: StrategyBlock[];
  index: number;
  onUpdateCondition: (block: StrategyBlock) => void;
  onUpdateAction: (block: StrategyBlock) => void;
  onDeleteCondition: (blockId: string) => void;
  onDeleteAction: (blockId: string) => void;
  onAddCondition: () => void;
  onAddAction: () => void;
  onDeleteRule: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  readOnly?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export const StrategyRuleEditor = ({
  conditionBlocks,
  actionBlocks,
  index,
  onUpdateCondition,
  onUpdateAction,
  onDeleteCondition,
  onDeleteAction,
  onAddCondition,
  onAddAction,
  onDeleteRule,
  onMoveUp,
  onMoveDown,
  readOnly = false,
  canMoveUp = false,
  canMoveDown = false,
}: StrategyRuleEditorProps) => {
  return (
    <Card withBorder p="lg" style={{ backgroundColor: "#f8f9fa" }}>
      <Stack gap="lg">
        {/* 헤더 */}
        <Group justify="space-between">
          <Group gap="sm">
            <Badge variant="light" color="blue" size="lg">
              규칙 {index + 1}
            </Badge>
            <Text size="sm" c="dimmed">
              조건이 만족되면 액션을 실행합니다
            </Text>
          </Group>

          {!readOnly && (
            <Group gap="xs">
              <Tooltip label="위로 이동">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  disabled={!canMoveUp}
                  onClick={onMoveUp}
                >
                  <IconChevronUp size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="아래로 이동">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  disabled={!canMoveDown}
                  onClick={onMoveDown}
                >
                  <IconChevronDown size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="규칙 삭제">
                <ActionIcon color="red" variant="subtle" onClick={onDeleteRule}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}
        </Group>

        {/* 조건 섹션 */}
        <div>
          <Group justify="space-between" mb="sm">
            <Title order={5} c="blue">
              📋 조건 (언제)
            </Title>
            {!readOnly && (
              <Button
                size="xs"
                variant="light"
                color="blue"
                leftSection={<IconPlus size={14} />}
                onClick={onAddCondition}
              >
                조건 추가
              </Button>
            )}
          </Group>

          <Stack gap="sm">
            {conditionBlocks.map((conditionBlock) => (
              <ConditionBlock
                key={conditionBlock.id}
                block={conditionBlock}
                onUpdate={onUpdateCondition}
                onDelete={(blockId) => {
                  if (conditionBlocks.length > 1) {
                    onDeleteCondition(blockId);
                  }
                }}
                readOnly={readOnly}
              />
            ))}
          </Stack>
        </div>

        {/* 화살표 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px",
          }}
        >
          <IconArrowDown size={24} color="var(--mantine-color-blue-5)" />
        </div>

        {/* 액션 섹션 */}
        <div>
          <Group justify="space-between" mb="sm">
            <Title order={5} c="green">
              ⚡ 액션 (무엇을)
            </Title>
            {!readOnly && (
              <Button
                size="xs"
                variant="light"
                color="green"
                leftSection={<IconPlus size={14} />}
                onClick={onAddAction}
              >
                액션 추가
              </Button>
            )}
          </Group>

          <Stack gap="sm">
            {actionBlocks.map((actionBlock) => (
              <ActionBlock
                key={actionBlock.id}
                block={actionBlock}
                onUpdate={onUpdateAction}
                onDelete={(blockId) => {
                  if (actionBlocks.length > 1) {
                    onDeleteAction(blockId);
                  }
                }}
                readOnly={readOnly}
              />
            ))}
          </Stack>
        </div>

        {/* 실행 로직 설명 */}
        <div
          style={{
            padding: "12px",
            backgroundColor: "#e3f2fd",
            borderRadius: "8px",
            borderLeft: "4px solid #2196f3",
          }}
        >
          <Text size="sm" c="dimmed">
            💡 <strong>실행 로직:</strong> 모든 조건이 만족되면(AND 조건)
            순서대로 모든 액션을 실행하고 다음 규칙으로 넘어갑니다. 여러 규칙이
            있을 경우 위에서부터 순차적으로 확인합니다.
          </Text>
        </div>
      </Stack>
    </Card>
  );
};
