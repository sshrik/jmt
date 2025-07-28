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
} from "@mantine/core";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import type {
  FlowNodeData,
  ConditionType,
  ConditionParameters,
} from "../../../types/strategy";

// 조건 타입별 설정
const CONDITION_CONFIG = {
  close_price_change: {
    label: "전일 종가 대비 변화",
    description: "전일 종가 대비 주가 변화율로 조건 설정",
    icon: IconTrendingUp,
    color: "blue",
  },
  high_price_change: {
    label: "전일 고가 대비 변화",
    description: "전일 고가 대비 주가 변화율로 조건 설정",
    icon: IconTrendingUp,
    color: "green",
  },
  low_price_change: {
    label: "전일 저가 대비 변화",
    description: "전일 저가 대비 주가 변화율로 조건 설정",
    icon: IconTrendingDown,
    color: "orange",
  },
} as const;

interface FlowConditionNodeProps extends NodeProps<FlowNodeData> {
  onUpdate?: (data: FlowNodeData) => void;
}

export const FlowConditionNode = memo(
  ({ data, selected, onUpdate }: FlowConditionNodeProps) => {
    const conditionType = data.conditionType || "close_price_change";
    const params = data.conditionParams || {};
    const config = CONDITION_CONFIG[conditionType];
    const IconComponent = config.icon;

    const updateConditionData = (updates: Partial<FlowNodeData>) => {
      if (onUpdate) {
        onUpdate({ ...data, ...updates });
      }
    };

    const updateParams = (newParams: Partial<ConditionParameters>) => {
      updateConditionData({
        conditionParams: { ...params, ...newParams },
      });
    };

    const handleConditionTypeChange = (value: string | null) => {
      if (value && value in CONDITION_CONFIG) {
        updateConditionData({
          conditionType: value as ConditionType,
          conditionParams: {
            priceChangeDirection: "up",
            priceChangePercent: 5,
          },
          label: `${CONDITION_CONFIG[value as ConditionType].label} 조건`,
        });
      }
    };

    return (
      <Card
        withBorder
        radius="md"
        p="md"
        style={{
          backgroundColor: selected ? "#e3f2fd" : "#f0f9ff",
          borderColor: selected ? "#2196f3" : "#bae6fd",
          borderWidth: selected ? 2 : 1,
          minWidth: 300,
        }}
      >
        {/* 입력 핸들 */}
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: "#3b82f6",
            borderColor: "#2563eb",
            width: 12,
            height: 12,
          }}
        />

        <Group gap="sm" mb="md">
          <ThemeIcon color={config.color} variant="light" size="lg">
            <IconComponent size={20} />
          </ThemeIcon>
          <div>
            <Text fw={600} size="sm">
              조건
            </Text>
            <Text size="xs" c="dimmed">
              {data.label}
            </Text>
          </div>
        </Group>

        <Stack gap="sm">
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
            size="sm"
          />

          {/* 조건 파라미터 */}
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
              size="sm"
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
              size="sm"
            />
          </Group>

          <Badge variant="light" color={config.color} size="sm">
            조건: {conditionType === "close_price_change" && "종가"}
            {conditionType === "high_price_change" && "고가"}
            {conditionType === "low_price_change" && "저가"} 대비{" "}
            {params.priceChangeDirection === "down" ? "하락" : "상승"}{" "}
            {params.priceChangePercent || 0}%
          </Badge>

          <Text size="xs" c="dimmed">
            {config.description}
          </Text>
        </Stack>

        {/* 출력 핸들 - 조건 만족 */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          style={{
            background: "#22c55e",
            borderColor: "#16a34a",
            width: 12,
            height: 12,
            left: "75%",
          }}
        />

        {/* 출력 핸들 - 조건 불만족 */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          style={{
            background: "#ef4444",
            borderColor: "#dc2626",
            width: 12,
            height: 12,
            left: "25%",
          }}
        />
      </Card>
    );
  }
);

FlowConditionNode.displayName = "FlowConditionNode";
