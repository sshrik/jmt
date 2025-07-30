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

    // 범위 조건들
    if (conditionType.endsWith("_range")) {
      return renderRangeConditionParams();
    }

    // 기존 단순 조건들
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

  // 범위 조건 파라미터 UI 렌더링
  const renderRangeConditionParams = () => {
    const isValueRange = conditionType === "price_value_range";

    return (
      <Stack gap="sm">
        {!isValueRange && (
          <Select
            label="변화 방향"
            placeholder="선택"
            value={params.rangeDirection || "up"}
            onChange={(value) =>
              updateParams({ rangeDirection: value as "up" | "down" | "both" })
            }
            data={[
              { value: "up", label: "상승" },
              { value: "down", label: "하락" },
              { value: "both", label: "양방향 (상승/하락)" },
            ]}
            disabled={readOnly}
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
          disabled={readOnly}
        />

        <Group grow>
          <NumberInput
            label={isValueRange ? "최소 가격 (원)" : "최소값 (%)"}
            placeholder={isValueRange ? "예: 1000" : "예: 3"}
            value={isValueRange ? params.minPrice || 0 : params.minPercent || 0}
            onChange={(value) =>
              updateParams(
                isValueRange
                  ? { minPrice: Number(value) || 0 }
                  : { minPercent: Number(value) || 0 }
              )
            }
            min={0}
            max={isValueRange ? undefined : 100}
            step={isValueRange ? 1 : 0.1}
            disabled={readOnly}
          />
          <NumberInput
            label={isValueRange ? "최대 가격 (원)" : "최대값 (%)"}
            placeholder={isValueRange ? "예: 1500" : "예: 5"}
            value={isValueRange ? params.maxPrice || 0 : params.maxPercent || 0}
            onChange={(value) =>
              updateParams(
                isValueRange
                  ? { maxPrice: Number(value) || 0 }
                  : { maxPercent: Number(value) || 0 }
              )
            }
            min={0}
            max={isValueRange ? undefined : 100}
            step={isValueRange ? 1 : 0.1}
            disabled={readOnly}
          />
        </Group>

        <Text size="xs" c="dimmed">
          {renderRangeDescription()}
        </Text>
      </Stack>
    );
  };

  // 범위 조건 설명 텍스트
  const renderRangeDescription = () => {
    const isValueRange = conditionType === "price_value_range";
    const direction = params.rangeDirection || "up";
    const operator = params.rangeOperator || "inclusive";

    const minVal = isValueRange ? params.minPrice || 0 : params.minPercent || 0;
    const maxVal = isValueRange ? params.maxPrice || 0 : params.maxPercent || 0;
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

    return `${prefix}${operatorText}일 때 조건 만족`;
  };

  return (
    <Card withBorder padding="md" className="condition-block">
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
