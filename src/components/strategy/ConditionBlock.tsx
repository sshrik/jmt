import React from "react";
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
  IconSettings,
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
}

// 조건 타입별 설정
const CONDITION_CONFIG = {
  price_change_percent: {
    label: "전일가 대비 변화",
    description: "전일 종가 대비 주가 변화율로 조건 설정",
    icon: IconTrendingUp,
    color: "blue",
  },
  profit_loss_percent: {
    label: "수익률 달성",
    description: "보유 주식의 수익률 기준",
    icon: IconTrendingUp,
    color: "green",
  },
  consecutive_days: {
    label: "연속 상승/하락",
    description: "N일 연속 상승 또는 하락",
    icon: IconTrendingDown,
    color: "orange",
  },
  moving_average_cross: {
    label: "이동평균 교차",
    description: "단기/장기 이동평균선 교차",
    icon: IconSettings,
    color: "purple",
  },
  rsi_threshold: {
    label: "RSI 임계값",
    description: "RSI 지표 기준 과매수/과매도",
    icon: IconSettings,
    color: "red",
  },
} as const;

export const ConditionBlock = ({
  block,
  onUpdate,
  onDelete,
  readOnly = false,
}: ConditionBlockProps) => {
  const conditionType = block.conditionType || "price_change_percent";
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
        conditionParams: {}, // 타입 변경시 파라미터 초기화
        name: `${CONDITION_CONFIG[value as ConditionType].label} 조건`,
      });
    }
  };

  // 조건별 파라미터 UI 렌더링
  const renderConditionParams = () => {
    switch (conditionType) {
      case "price_change_percent":
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
                label="변화율 (%)"
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
              전일 종가 대비{" "}
              {params.priceChangeDirection === "down" ? "하락" : "상승"}{" "}
              {params.priceChangePercent || 0}%일 때 조건 만족
            </Text>
          </Stack>
        );

      case "profit_loss_percent":
        return (
          <Stack gap="sm">
            <Group grow>
              <Select
                label="타입"
                placeholder="선택"
                value={params.profitLossType || "profit"}
                onChange={(value) =>
                  updateParams({ profitLossType: value as "profit" | "loss" })
                }
                data={[
                  { value: "profit", label: "수익" },
                  { value: "loss", label: "손실" },
                ]}
                disabled={readOnly}
              />
              <NumberInput
                label="수익률 (%)"
                placeholder="예: 10"
                value={params.profitLossPercent || 0}
                onChange={(value) =>
                  updateParams({ profitLossPercent: Number(value) || 0 })
                }
                min={0}
                max={100}
                step={0.1}
                disabled={readOnly}
              />
            </Group>
            <Text size="xs" c="dimmed">
              보유 주식이 {params.profitLossPercent || 0}%{" "}
              {params.profitLossType === "loss" ? "손실" : "수익"}일 때 조건
              만족
            </Text>
          </Stack>
        );

      case "consecutive_days":
        return (
          <Stack gap="sm">
            <Group grow>
              <NumberInput
                label="연속 일수"
                placeholder="예: 3"
                value={params.consecutiveDays || 1}
                onChange={(value) =>
                  updateParams({ consecutiveDays: Number(value) || 1 })
                }
                min={1}
                max={10}
                disabled={readOnly}
              />
              <Select
                label="방향"
                placeholder="선택"
                value={params.consecutiveDirection || "up"}
                onChange={(value) =>
                  updateParams({ consecutiveDirection: value as "up" | "down" })
                }
                data={[
                  { value: "up", label: "상승" },
                  { value: "down", label: "하락" },
                ]}
                disabled={readOnly}
              />
            </Group>
            <Text size="xs" c="dimmed">
              {params.consecutiveDays || 1}일 연속{" "}
              {params.consecutiveDirection === "down" ? "하락" : "상승"}일 때
              조건 만족
            </Text>
          </Stack>
        );

      case "rsi_threshold":
        return (
          <Stack gap="sm">
            <Group grow>
              <NumberInput
                label="RSI 값"
                placeholder="예: 70"
                value={params.rsiValue || 50}
                onChange={(value) =>
                  updateParams({ rsiValue: Number(value) || 50 })
                }
                min={0}
                max={100}
                disabled={readOnly}
              />
              <Select
                label="조건"
                placeholder="선택"
                value={params.rsiCondition || "above"}
                onChange={(value) =>
                  updateParams({ rsiCondition: value as "above" | "below" })
                }
                data={[
                  { value: "above", label: "이상" },
                  { value: "below", label: "이하" },
                ]}
                disabled={readOnly}
              />
            </Group>
            <Text size="xs" c="dimmed">
              RSI가 {params.rsiValue || 50}{" "}
              {params.rsiCondition === "below" ? "이하" : "이상"}일 때 조건 만족
            </Text>
          </Stack>
        );

      default:
        return <Text c="dimmed">조건을 선택해주세요</Text>;
    }
  };

  return (
    <Card
      withBorder
      radius="md"
      style={{ backgroundColor: `var(--mantine-color-${config.color}-0)` }}
    >
      <Group justify="space-between" mb="md">
        <Group>
          <IconComponent
            size={20}
            color={`var(--mantine-color-${config.color}-6)`}
          />
          <div>
            <Title order={5}>조건 블록</Title>
            <Text size="xs" c="dimmed">
              {config.description}
            </Text>
          </div>
        </Group>

        {!readOnly && (
          <Group gap="xs">
            <Tooltip label="블록 삭제">
              <ActionIcon
                color="red"
                variant="subtle"
                onClick={() => onDelete(block.id)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
      </Group>

      <Stack gap="md">
        <Select
          label="조건 타입"
          placeholder="조건 선택"
          value={conditionType}
          onChange={handleConditionTypeChange}
          data={Object.entries(CONDITION_CONFIG).map(([key, config]) => ({
            value: key,
            label: config.label,
          }))}
          disabled={readOnly}
        />

        {renderConditionParams()}
      </Stack>
    </Card>
  );
};
