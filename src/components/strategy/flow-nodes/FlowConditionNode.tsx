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
} from "@mantine/core";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconTrash,
} from "@tabler/icons-react";
import type {
  FlowNodeData,
  ConditionType,
  ConditionParameters,
} from "../../../types/strategy";

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
  close_price_range: {
    label: "종가 변화율 범위",
    description:
      "종가 변화율이 지정된 범위 내에 있을 때 조건 만족 (예: 3% 이상 5% 이하)",
    icon: IconTrendingUp,
    color: "indigo",
  },
  high_price_range: {
    label: "고가 변화율 범위",
    description: "고가 변화율이 지정된 범위 내에 있을 때 조건 만족",
    icon: IconTrendingUp,
    color: "teal",
  },
  low_price_range: {
    label: "저가 변화율 범위",
    description: "저가 변화율이 지정된 범위 내에 있을 때 조건 만족",
    icon: IconTrendingDown,
    color: "yellow",
  },
  price_value_range: {
    label: "절대 가격 범위",
    description:
      "현재 주가가 지정된 가격 범위 내에 있을 때 조건 만족 (예: 1000원 이상 1500원 이하)",
    icon: IconTrendingUp,
    color: "purple",
  },
} as const;

// 확장된 노드 데이터 타입
interface ExtendedFlowNodeData extends FlowNodeData {
  onUpdate?: (data: FlowNodeData) => void;
  onDelete?: () => void;
}

export const FlowConditionNode = memo(
  ({ data, selected }: NodeProps<ExtendedFlowNodeData>) => {
    const conditionType = data.conditionType || "close_price_change";
    const params = data.conditionParams || {};
    const config = CONDITION_CONFIG[conditionType];
    const IconComponent = config.icon;
    const { onUpdate, onDelete } = data;

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

    // 범위 조건 설명 텍스트
    const renderRangeDescription = (
      conditionType: ConditionType,
      params: ConditionParameters
    ) => {
      const isValueRange = conditionType === "price_value_range";
      const direction = params.rangeDirection || "up";
      const operator = params.rangeOperator || "inclusive";

      const minVal = isValueRange
        ? params.minPrice || 0
        : params.minPercent || 0;
      const maxVal = isValueRange
        ? params.maxPrice || 0
        : params.maxPercent || 0;
      const unit = isValueRange ? "원" : "%";

      let prefix = "";
      if (!isValueRange) {
        if (direction === "up") prefix = "상승 ";
        else if (direction === "down") prefix = "하락 ";
        else prefix = "변화율이 ";
      } else {
        prefix = "현재 주가가 ";
      }

      let operatorText = "";
      switch (operator) {
        case "inclusive":
          operatorText = `${minVal}${unit} 이상 ${maxVal}${unit} 이하`;
          break;
        case "exclusive":
          operatorText = `${minVal}${unit} 초과 ${maxVal}${unit} 미만`;
          break;
        case "left_inclusive":
          operatorText = `${minVal}${unit} 이상 ${maxVal}${unit} 미만`;
          break;
        case "right_inclusive":
          operatorText = `${minVal}${unit} 초과 ${maxVal}${unit} 이하`;
          break;
      }

      return `${prefix}${operatorText}`;
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
          <div style={{ flex: 1 }}>
            <Text fw={600} size="sm">
              조건
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
          {conditionType === "always" ? (
            <Badge variant="light" color={config.color} size="sm">
              조건 없이 항상 실행
            </Badge>
          ) : conditionType.endsWith("_range") ? (
            // 범위 조건들
            <>
              {conditionType !== "price_value_range" && (
                <Select
                  label="변화 방향"
                  placeholder="선택"
                  value={params.rangeDirection || "up"}
                  onChange={(value) =>
                    updateParams({
                      rangeDirection: value as "up" | "down" | "both",
                    })
                  }
                  data={[
                    { value: "up", label: "상승" },
                    { value: "down", label: "하락" },
                    { value: "both", label: "양방향" },
                  ]}
                  size="sm"
                />
              )}

              <Select
                label="범위 타입"
                placeholder="선택"
                value={params.rangeOperator || "inclusive"}
                onChange={(value) =>
                  updateParams({
                    rangeOperator: value as
                      | "inclusive"
                      | "exclusive"
                      | "left_inclusive"
                      | "right_inclusive",
                  })
                }
                data={[
                  { value: "inclusive", label: "이상 이하 (≥ ≤)" },
                  { value: "exclusive", label: "초과 미만 (> <)" },
                  { value: "left_inclusive", label: "이상 미만 (≥ <)" },
                  { value: "right_inclusive", label: "초과 이하 (> ≤)" },
                ]}
                size="sm"
              />

              <Group grow>
                <NumberInput
                  label={
                    conditionType === "price_value_range"
                      ? "최소 가격 (원)"
                      : "최소값 (%)"
                  }
                  placeholder={
                    conditionType === "price_value_range" ? "예: 1000" : "예: 3"
                  }
                  value={
                    conditionType === "price_value_range"
                      ? params.minPrice || 0
                      : params.minPercent || 0
                  }
                  onChange={(value) =>
                    updateParams(
                      conditionType === "price_value_range"
                        ? { minPrice: Number(value) || 0 }
                        : { minPercent: Number(value) || 0 }
                    )
                  }
                  min={0}
                  max={conditionType === "price_value_range" ? undefined : 100}
                  step={conditionType === "price_value_range" ? 1 : 0.1}
                  size="sm"
                />
                <NumberInput
                  label={
                    conditionType === "price_value_range"
                      ? "최대 가격 (원)"
                      : "최대값 (%)"
                  }
                  placeholder={
                    conditionType === "price_value_range" ? "예: 1500" : "예: 5"
                  }
                  value={
                    conditionType === "price_value_range"
                      ? params.maxPrice || 0
                      : params.maxPercent || 0
                  }
                  onChange={(value) =>
                    updateParams(
                      conditionType === "price_value_range"
                        ? { maxPrice: Number(value) || 0 }
                        : { maxPercent: Number(value) || 0 }
                    )
                  }
                  min={0}
                  max={conditionType === "price_value_range" ? undefined : 100}
                  step={conditionType === "price_value_range" ? 1 : 0.1}
                  size="sm"
                />
              </Group>

              <Badge variant="light" color={config.color} size="sm">
                {renderRangeDescription(conditionType, params)}
              </Badge>
            </>
          ) : (
            // 기존 단순 조건들
            <>
              <Group grow>
                <Select
                  label="방향"
                  placeholder="선택"
                  value={params.priceChangeDirection || "up"}
                  onChange={(value) =>
                    updateParams({
                      priceChangeDirection: value as "up" | "down",
                    })
                  }
                  data={[
                    { value: "up", label: "상승" },
                    { value: "down", label: "하락" },
                  ]}
                  size="sm"
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
                  size="sm"
                />
              </Group>

              <Badge variant="light" color={config.color} size="sm">
                조건: {conditionType === "close_price_change" && "종가"}
                {conditionType === "high_price_change" && "고가"}
                {conditionType === "low_price_change" && "저가"} 대비{" "}
                {params.priceChangeDirection === "down" ? "하락" : "상승"}{" "}
                {params.priceChangePercent || 0}%{" "}
                {params.priceChangeDirection === "down" ? "이하" : "이상"}
              </Badge>
            </>
          )}

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
