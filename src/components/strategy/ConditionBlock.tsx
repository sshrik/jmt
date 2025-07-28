import {
  Card,
  Title,
  Select,
  NumberInput,
  Group,
  Text,
  ActionIcon,
  Tooltip,
  Stack,
} from "@mantine/core";
import {
  IconTrash,
  IconTrendingUp,
  IconTrendingDown,
} from "@tabler/icons-react";
import type {
  StrategyBlock,
  ConditionType,
  ConditionParameters,
} from "../../types/strategy";

interface ConditionBlockProps {
  block: StrategyBlock;
  onUpdate: (block: StrategyBlock) => void;
  onDelete: (blockId: string) => void;
  readOnly?: boolean;
  canDelete?: boolean;
}

// 조건 타입별 설정
const CONDITION_CONFIG = {
  always: {
    label: "항상",
    description: "조건 없이 항상 실행",
    icon: IconTrendingUp,
    color: "orange",
  },
  close_price_change: {
    label: "전일 종가 대비 변화",
    description: "전일 종가 대비 주가 변화율이 임계값 이상/이하일 때 조건 만족",
    icon: IconTrendingUp,
    color: "blue",
  },
  high_price_change: {
    label: "전일 고가 대비 변화",
    description: "전일 고가 대비 주가 변화율이 임계값 이상/이하일 때 조건 만족",
    icon: IconTrendingUp,
    color: "green",
  },
  low_price_change: {
    label: "전일 저가 대비 변화",
    description: "전일 저가 대비 주가 변화율이 임계값 이상/이하일 때 조건 만족",
    icon: IconTrendingDown,
    color: "orange",
  },
} as const;

export const ConditionBlock = ({
  block,
  onUpdate,
  onDelete,
  readOnly = false,
  canDelete = true,
}: ConditionBlockProps) => {
  const conditionType = block.conditionType || "close_price_change";
  const params = block.conditionParams || {};
  const config = CONDITION_CONFIG[conditionType];
  const IconComponent = config.icon;

  const updateBlock = (updates: Partial<StrategyBlock>) => {
    onUpdate({
      ...block,
      ...updates,
      updatedAt: new Date(),
    });
  };

  const updateParams = (newParams: Partial<ConditionParameters>) => {
    updateBlock({
      conditionParams: { ...params, ...newParams },
    });
  };

  const handleConditionTypeChange = (value: string | null) => {
    if (value && value in CONDITION_CONFIG) {
      updateBlock({
        conditionType: value as ConditionType,
        conditionParams: {
          priceChangeDirection: "up",
          priceChangePercent: 5,
        },
        name: `${CONDITION_CONFIG[value as ConditionType].label} 조건`,
      });
    }
  };

  const handleDelete = () => {
    if (!readOnly) {
      onDelete(block.id);
    }
  };

  // 조건 파라미터 UI 렌더링
  const renderConditionParams = () => {
    if (conditionType === "always") {
      return (
        <Text size="xs" c="dimmed">
          조건 없이 항상 실행됩니다
        </Text>
      );
    }

    return (
      <Stack gap="sm">
        <Group grow>
          <Select
            label="방향"
            placeholder="선택"
            value={params.priceChangeDirection || "up"}
            onChange={(value) =>
              updateParams({ priceChangeDirection: value as "up" | "down" })
            }
            data={[
              { value: "up", label: "상승" },
              { value: "down", label: "하락" },
            ]}
            disabled={readOnly}
          />
          <NumberInput
            label="임계값 (%)"
            placeholder="예: 5"
            value={params.priceChangePercent || 0}
            onChange={(value) =>
              updateParams({ priceChangePercent: Number(value) || 0 })
            }
            min={0}
            max={100}
            step={0.1}
            disabled={readOnly}
          />
        </Group>
        <Text size="xs" c="dimmed">
          {conditionType === "close_price_change" && "전일 종가"}
          {conditionType === "high_price_change" && "전일 고가"}
          {conditionType === "low_price_change" && "전일 저가"} 대비{" "}
          {params.priceChangeDirection === "down" ? "하락" : "상승"}{" "}
          {params.priceChangePercent || 0}%{" "}
          {params.priceChangeDirection === "down" ? "이하" : "이상"}일 때 조건
          만족
        </Text>
      </Stack>
    );
  };

  return (
    <Card withBorder padding="md" style={{ backgroundColor: "#fafafa" }}>
      <Stack gap="md">
        {/* 헤더 */}
        <Group justify="space-between">
          <Group gap="sm">
            <IconComponent size={20} color={config.color} />
            <Title order={5}>{config.label}</Title>
          </Group>
          {!readOnly && canDelete && (
            <Tooltip label="조건 삭제">
              <ActionIcon
                color="red"
                variant="subtle"
                onClick={handleDelete}
                size="sm"
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>

        {/* 조건 타입 선택 */}
        <Select
          label="조건 타입"
          placeholder="조건을 선택하세요"
          value={conditionType}
          onChange={handleConditionTypeChange}
          data={Object.entries(CONDITION_CONFIG).map(([key, config]) => ({
            value: key,
            label: config.label,
          }))}
          disabled={readOnly}
        />

        {/* 조건 파라미터 */}
        {renderConditionParams()}
      </Stack>
    </Card>
  );
};
