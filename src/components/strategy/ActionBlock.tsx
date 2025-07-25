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
  IconArrowUp,
  IconArrowDown,
  IconPause,
  IconTarget,
  IconShield,
} from "@tabler/icons-react";
import type {
  StrategyBlock,
  ActionType,
  ActionParameters,
} from "../../types/strategy";

interface ActionBlockProps {
  block: StrategyBlock;
  onUpdate: (block: StrategyBlock) => void;
  onDelete: (blockId: string) => void;
  readOnly?: boolean;
}

// 액션 타입별 설정
const ACTION_CONFIG = {
  buy_percent_cash: {
    label: "현금 비율 매수",
    description: "보유 현금의 일정 비율로 매수",
    icon: IconArrowUp,
    color: "green",
  },
  sell_percent_stock: {
    label: "주식 비율 매도",
    description: "보유 주식의 일정 비율을 매도",
    icon: IconArrowDown,
    color: "red",
  },
  buy_fixed_amount: {
    label: "고정 금액 매수",
    description: "정해진 금액만큼 매수",
    icon: IconArrowUp,
    color: "green",
  },
  sell_fixed_amount: {
    label: "고정 금액 매도",
    description: "정해진 금액만큼 매도",
    icon: IconArrowDown,
    color: "red",
  },
  hold: {
    label: "대기",
    description: "매매하지 않고 대기",
    icon: IconPause,
    color: "gray",
  },
  stop_loss: {
    label: "손절",
    description: "손실률 달성시 자동 매도",
    icon: IconShield,
    color: "red",
  },
  take_profit: {
    label: "익절",
    description: "수익률 달성시 자동 매도",
    icon: IconTarget,
    color: "green",
  },
} as const;

export const ActionBlock = ({
  block,
  onUpdate,
  onDelete,
  readOnly = false,
}: ActionBlockProps) => {
  const actionType = block.actionType || "buy_percent_cash";
  const params = block.actionParams || {};
  const config = ACTION_CONFIG[actionType];
  const IconComponent = config.icon;

  const updateBlock = (updates: Partial<StrategyBlock>) => {
    onUpdate({
      ...block,
      ...updates,
      updatedAt: new Date(),
    });
  };

  const updateParams = (newParams: Partial<ActionParameters>) => {
    updateBlock({
      actionParams: { ...params, ...newParams },
    });
  };

  const handleActionTypeChange = (value: string | null) => {
    if (value && value in ACTION_CONFIG) {
      updateBlock({
        actionType: value as ActionType,
        actionParams: {}, // 타입 변경시 파라미터 초기화
        name: `${ACTION_CONFIG[value as ActionType].label} 액션`,
      });
    }
  };

  // 액션별 파라미터 UI 렌더링
  const renderActionParams = () => {
    switch (actionType) {
      case "buy_percent_cash":
        return (
          <Stack gap="sm">
            <NumberInput
              label="매수 비율 (%)"
              placeholder="예: 30"
              value={params.percentCash || 0}
              onChange={(value) =>
                updateParams({ percentCash: Number(value) || 0 })
              }
              min={0}
              max={100}
              step={1}
              disabled={readOnly}
              description="보유 현금의 몇 %를 매수할지 설정"
            />
            <Text size="xs" c="dimmed">
              현재 보유 현금의 {params.percentCash || 0}%만큼 매수 실행
            </Text>
          </Stack>
        );

      case "sell_percent_stock":
        return (
          <Stack gap="sm">
            <NumberInput
              label="매도 비율 (%)"
              placeholder="예: 50"
              value={params.percentStock || 0}
              onChange={(value) =>
                updateParams({ percentStock: Number(value) || 0 })
              }
              min={0}
              max={100}
              step={1}
              disabled={readOnly}
              description="보유 주식의 몇 %를 매도할지 설정"
            />
            <Text size="xs" c="dimmed">
              현재 보유 주식의 {params.percentStock || 0}%만큼 매도 실행
            </Text>
          </Stack>
        );

      case "buy_fixed_amount":
        return (
          <Stack gap="sm">
            <NumberInput
              label="매수 금액 (원)"
              placeholder="예: 1000000"
              value={params.fixedAmount || 0}
              onChange={(value) =>
                updateParams({ fixedAmount: Number(value) || 0 })
              }
              min={0}
              step={10000}
              disabled={readOnly}
              description="고정된 금액만큼 매수"
              thousandSeparator=","
            />
            <Text size="xs" c="dimmed">
              {(params.fixedAmount || 0).toLocaleString("ko-KR")}원만큼 매수
              실행
            </Text>
          </Stack>
        );

      case "sell_fixed_amount":
        return (
          <Stack gap="sm">
            <NumberInput
              label="매도 금액 (원)"
              placeholder="예: 500000"
              value={params.fixedAmount || 0}
              onChange={(value) =>
                updateParams({ fixedAmount: Number(value) || 0 })
              }
              min={0}
              step={10000}
              disabled={readOnly}
              description="고정된 금액만큼 매도"
              thousandSeparator=","
            />
            <Text size="xs" c="dimmed">
              {(params.fixedAmount || 0).toLocaleString("ko-KR")}원만큼 매도
              실행
            </Text>
          </Stack>
        );

      case "stop_loss":
        return (
          <Stack gap="sm">
            <NumberInput
              label="손절 비율 (%)"
              placeholder="예: 5"
              value={params.stopLossPercent || 0}
              onChange={(value) =>
                updateParams({ stopLossPercent: Number(value) || 0 })
              }
              min={0}
              max={50}
              step={0.1}
              disabled={readOnly}
              description="몇 % 손실시 자동 매도할지 설정"
            />
            <Text size="xs" c="dimmed">
              {params.stopLossPercent || 0}% 손실 달성시 전량 매도
            </Text>
          </Stack>
        );

      case "take_profit":
        return (
          <Stack gap="sm">
            <NumberInput
              label="익절 비율 (%)"
              placeholder="예: 10"
              value={params.takeProfitPercent || 0}
              onChange={(value) =>
                updateParams({ takeProfitPercent: Number(value) || 0 })
              }
              min={0}
              max={100}
              step={0.1}
              disabled={readOnly}
              description="몇 % 수익시 자동 매도할지 설정"
            />
            <Text size="xs" c="dimmed">
              {params.takeProfitPercent || 0}% 수익 달성시 전량 매도
            </Text>
          </Stack>
        );

      case "hold":
        return (
          <Stack gap="sm">
            <Text c="dimmed" ta="center" py="xl">
              매매를 하지 않고 대기합니다.
              <br />
              추가 설정이 필요하지 않습니다.
            </Text>
          </Stack>
        );

      default:
        return <Text c="dimmed">액션을 선택해주세요</Text>;
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
            <Title order={5}>액션 블록</Title>
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
          label="액션 타입"
          placeholder="액션 선택"
          value={actionType}
          onChange={handleActionTypeChange}
          data={Object.entries(ACTION_CONFIG).map(([key, config]) => ({
            value: key,
            label: config.label,
          }))}
          disabled={readOnly}
        />

        {renderActionParams()}
      </Stack>
    </Card>
  );
};
