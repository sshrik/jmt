import {
  Card,
  Title,
  Group,
  Text,
  ActionIcon,
  Tooltip,
  Stack,
  Badge,
} from "@mantine/core";
import {
  IconTrash,
  IconChevronUp,
  IconChevronDown,
  IconArrowRight,
} from "@tabler/icons-react";
import { ConditionBlock } from "./ConditionBlock";
import { ActionBlock } from "./ActionBlock";
import type { StrategyBlock } from "../../types/strategy";

interface ConditionActionPairProps {
  conditionBlock: StrategyBlock;
  actionBlock: StrategyBlock;
  index: number;
  onUpdateCondition: (block: StrategyBlock) => void;
  onUpdateAction: (block: StrategyBlock) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  readOnly?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export const ConditionActionPair = ({
  conditionBlock,
  actionBlock,
  index,
  onUpdateCondition,
  onUpdateAction,
  onDelete,
  onMoveUp,
  onMoveDown,
  readOnly = false,
  canMoveUp = false,
  canMoveDown = false,
}: ConditionActionPairProps) => {
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
                <ActionIcon color="red" variant="subtle" onClick={onDelete}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}
        </Group>

        {/* 조건과 액션 */}
        <Group align="stretch" grow>
          {/* 조건 블록 */}
          <div style={{ flex: 1 }}>
            <Title order={6} mb="sm" c="blue">
              📋 조건 (언제)
            </Title>
            <ConditionBlock
              block={conditionBlock}
              onUpdate={onUpdateCondition}
              onDelete={() => {}} // 쌍에서는 개별 삭제 비활성화
              readOnly={readOnly}
            />
          </div>

          {/* 화살표 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "60px",
            }}
          >
            <IconArrowRight size={24} color="var(--mantine-color-gray-5)" />
          </div>

          {/* 액션 블록 */}
          <div style={{ flex: 1 }}>
            <Title order={6} mb="sm" c="green">
              ⚡ 액션 (무엇을)
            </Title>
            <ActionBlock
              block={actionBlock}
              onUpdate={onUpdateAction}
              onDelete={() => {}} // 쌍에서는 개별 삭제 비활성화
              readOnly={readOnly}
            />
          </div>
        </Group>

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
            💡 <strong>실행 로직:</strong> 위 조건이 만족되면 바로 해당 액션을
            실행하고 다음 규칙으로 넘어갑니다. 여러 규칙이 있을 경우 위에서부터
            순차적으로 확인합니다.
          </Text>
        </div>
      </Stack>
    </Card>
  );
};
