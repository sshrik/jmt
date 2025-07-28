import { memo } from "react";
import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import {
  Card,
  Text,
  Group,
  Badge,
  ThemeIcon,
  Select,
  NumberInput,
  Stack,
  ActionIcon,
  Tooltip,
  TextInput,
} from "@mantine/core";
import {
  IconArrowUp,
  IconArrowDown,
  IconPlayerPause,
  IconPower,
  IconBell,
  IconFileText,
  IconTrash,
  IconMath,
} from "@tabler/icons-react";
import type {
  FlowNodeData,
  EnhancedActionType,
  ActionParameters,
} from "../../../types/strategy";

// 향상된 액션 타입별 설정
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
  buy_shares: {
    label: "N주 매수",
    description: "정해진 주식 수만큼 매수",
    icon: IconArrowUp,
    color: "green",
  },
  sell_shares: {
    label: "N주 매도",
    description: "정해진 주식 수만큼 매도",
    icon: IconArrowDown,
    color: "red",
  },
  sell_all: {
    label: "100% 판매",
    description: "보유 주식을 모두 매도",
    icon: IconArrowDown,
    color: "orange",
  },
  buy_formula_amount: {
    label: "수식 기반 금액 매수",
    description: "상승/하락 비율에 따른 수식으로 매수 금액 계산",
    icon: IconMath,
    color: "blue",
  },
  sell_formula_amount: {
    label: "수식 기반 금액 매도",
    description: "상승/하락 비율에 따른 수식으로 매도 금액 계산",
    icon: IconMath,
    color: "purple",
  },
  buy_formula_shares: {
    label: "수식 기반 주식 수 매수",
    description: "상승/하락 비율에 따른 수식으로 매수 주식 수 계산",
    icon: IconMath,
    color: "teal",
  },
  sell_formula_shares: {
    label: "수식 기반 주식 수 매도",
    description: "상승/하락 비율에 따른 수식으로 매도 주식 수 계산",
    icon: IconMath,
    color: "indigo",
  },
  buy_formula_percent: {
    label: "수식 기반 비율 매수",
    description: "상승/하락 비율에 따른 수식으로 매수 비율 계산",
    icon: IconMath,
    color: "cyan",
  },
  sell_formula_percent: {
    label: "수식 기반 비율 매도",
    description: "상승/하락 비율에 따른 수식으로 매도 비율 계산",
    icon: IconMath,
    color: "grape",
  },
  hold: {
    label: "대기",
    description: "매매하지 않고 대기",
    icon: IconPlayerPause,
    color: "gray",
  },
  exit_all: {
    label: "투자 종료",
    description: "모든 포지션 정리 후 투자 종료",
    icon: IconPower,
    color: "dark",
  },
  pause_strategy: {
    label: "전략 일시정지",
    description: "전략 실행을 일시적으로 중단",
    icon: IconPlayerPause,
    color: "yellow",
  },
  alert: {
    label: "알림 발송",
    description: "조건 만족시 알림만 발송",
    icon: IconBell,
    color: "blue",
  },
  log: {
    label: "로그 기록",
    description: "현재 상황을 로그에 기록",
    icon: IconFileText,
    color: "gray",
  },
} as const;

// 확장된 노드 데이터 타입
interface ExtendedFlowNodeData extends FlowNodeData {
  onUpdate?: (data: FlowNodeData) => void;
  onDelete?: () => void;
}

export const FlowActionNode = memo(
  ({ data, selected }: NodeProps<ExtendedFlowNodeData>) => {
    const actionType = data.actionType || "buy_percent_cash";
    const params = data.actionParams || {};
    const config = ACTION_CONFIG[actionType];
    const IconComponent = config.icon;
    const { onUpdate, onDelete } = data;

    const updateActionData = (updates: Partial<FlowNodeData>) => {
      if (onUpdate) {
        onUpdate({ ...data, ...updates });
      }
    };

    const updateParams = (newParams: Partial<ActionParameters>) => {
      updateActionData({
        actionParams: { ...params, ...newParams },
      });
    };

    const handleActionTypeChange = (value: string | null) => {
      if (value && value in ACTION_CONFIG) {
        updateActionData({
          actionType: value as EnhancedActionType,
          actionParams: {}, // 타입 변경시 파라미터 초기화
          label: `${ACTION_CONFIG[value as EnhancedActionType].label} 액션`,
        });
      }
    };

    // 액션별 파라미터 UI 렌더링
    const renderActionParams = () => {
      switch (actionType) {
        case "buy_percent_cash":
          return (
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
              description="보유 현금의 몇 %를 매수할지 설정"
              size="sm"
            />
          );

        case "sell_percent_stock":
          return (
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
              description="보유 주식의 몇 %를 매도할지 설정"
              size="sm"
            />
          );

        case "buy_fixed_amount":
        case "sell_fixed_amount":
          return (
            <NumberInput
              label={`${actionType === "buy_fixed_amount" ? "매수" : "매도"} 금액 (원)`}
              placeholder="예: 1000000"
              value={params.fixedAmount || 0}
              onChange={(value) =>
                updateParams({ fixedAmount: Number(value) || 0 })
              }
              min={0}
              step={10000}
              description="고정된 금액만큼 매매"
              thousandSeparator=","
              size="sm"
            />
          );

        case "buy_shares":
          return (
            <NumberInput
              label="매수 주식 수"
              placeholder="예: 100"
              value={params.shareCount || 0}
              onChange={(value) =>
                updateParams({ shareCount: Number(value) || 0 })
              }
              min={1}
              step={1}
              description="몇 주를 매수할지 설정"
              size="sm"
            />
          );

        case "sell_shares":
          return (
            <NumberInput
              label="매도 주식 수"
              placeholder="예: 50"
              value={params.shareCount || 0}
              onChange={(value) =>
                updateParams({ shareCount: Number(value) || 0 })
              }
              min={1}
              step={1}
              description="몇 주를 매도할지 설정"
              size="sm"
            />
          );

        case "sell_all":
          return (
            <Text size="xs" c="dimmed">
              보유한 모든 주식을 100% 매도합니다
            </Text>
          );

        case "buy_formula_amount":
        case "sell_formula_amount":
        case "buy_formula_shares":
        case "sell_formula_shares":
        case "buy_formula_percent":
        case "sell_formula_percent":
          return (
            <TextInput
              label="수식"
              placeholder="예: 10000 * N + 2000"
              value={params.formula || ""}
              onChange={(event) =>
                updateParams({ formula: event.currentTarget.value })
              }
              description="N = 상승/하락 비율(%). 예: N=5는 5% 변화"
              size="sm"
            />
          );

        case "exit_all":
        case "pause_strategy":
        case "alert":
        case "log":
        case "hold":
          return (
            <Text c="dimmed" ta="center" py="sm" size="sm">
              {config.description}
              <br />
              추가 설정이 필요하지 않습니다.
            </Text>
          );

        default:
          return <Text c="dimmed">액션을 선택해주세요</Text>;
      }
    };

    return (
      <Card
        withBorder
        radius="md"
        p="md"
        style={{
          backgroundColor: selected ? "#fef3c7" : "#fff7ed",
          borderColor: selected ? "#f59e0b" : "#fed7aa",
          borderWidth: selected ? 2 : 1,
          minWidth: 300,
        }}
      >
        {/* 입력 핸들 */}
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: "#f59e0b",
            borderColor: "#d97706",
            width: 12,
            height: 12,
          }}
        />

        <Group gap="sm" mb="md">
          <ThemeIcon color={config.color} variant="light" size="lg">
            <IconComponent size={20} />
          </ThemeIcon>
          <div style={{ flex: 1 }}>
            <Text fw={600} size="sm">
              액션
            </Text>
            <Text size="xs" c="dimmed">
              {data.label}
            </Text>
          </div>
          {onDelete && (
            <Tooltip label="노드 삭제">
              <ActionIcon
                color="red"
                variant="subtle"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>

        <Stack gap="sm">
          <Select
            label="액션 타입"
            placeholder="액션 선택"
            value={actionType}
            onChange={handleActionTypeChange}
            data={Object.entries(ACTION_CONFIG).map(([key, config]) => ({
              value: key,
              label: config.label,
            }))}
            size="sm"
          />

          {renderActionParams()}

          <Badge variant="light" color={config.color} size="sm">
            {config.label}
          </Badge>

          <Text size="xs" c="dimmed">
            {config.description}
          </Text>
        </Stack>

        {/* 출력 핸들 - 종료 액션이 아닌 경우에만 */}
        {actionType !== "exit_all" && actionType !== "pause_strategy" && (
          <Handle
            type="source"
            position={Position.Bottom}
            style={{
              background: "#f59e0b",
              borderColor: "#d97706",
              width: 12,
              height: 12,
            }}
          />
        )}
      </Card>
    );
  }
);

FlowActionNode.displayName = "FlowActionNode";
