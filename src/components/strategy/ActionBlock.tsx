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
  TextInput,
  Collapse,
  Code,
  Alert,
} from "@mantine/core";
import {
  IconTrash,
  IconArrowUp,
  IconArrowDown,
  IconPlayerPause,
  IconMath,
  IconInfoCircle,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import { useState } from "react";
import type {
  StrategyBlock,
  ActionType,
  ActionParameters,
} from "../../types/strategy";
import {
  validateFormula,
  calculateFormula,
  FORMULA_EXAMPLES,
} from "../../utils/formulaCalculator";

interface ActionBlockProps {
  block: StrategyBlock;
  onUpdate: (block: StrategyBlock) => void;
  onDelete: (blockId: string) => void;
  readOnly?: boolean;
  canDelete?: boolean;
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
} as const;

export const ActionBlock = ({
  block,
  onUpdate,
  onDelete,
  readOnly = false,
  canDelete = false,
}: ActionBlockProps) => {
  const [showExamples, setShowExamples] = useState(false);
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

  // 수식 입력 UI 렌더링
  const renderFormulaInput = () => {
    const formula = params.formula || "";
    const validation = validateFormula(formula);

    const getFormulaDescription = () => {
      switch (actionType) {
        case "buy_formula_amount":
          return "상승/하락 비율(N)에 따라 매수할 금액을 계산하는 수식을 입력하세요.";
        case "sell_formula_amount":
          return "상승/하락 비율(N)에 따라 매도할 금액을 계산하는 수식을 입력하세요.";
        case "buy_formula_shares":
          return "상승/하락 비율(N)에 따라 매수할 주식 수를 계산하는 수식을 입력하세요.";
        case "sell_formula_shares":
          return "상승/하락 비율(N)에 따라 매도할 주식 수를 계산하는 수식을 입력하세요.";
        case "buy_formula_percent":
          return "상승/하락 비율(N)에 따라 현금의 몇 %를 매수할지 계산하는 수식을 입력하세요.";
        case "sell_formula_percent":
          return "상승/하락 비율(N)에 따라 주식의 몇 %를 매도할지 계산하는 수식을 입력하세요.";
        default:
          return "수식을 입력하세요.";
      }
    };

    const getExampleFormula = () => {
      switch (actionType) {
        case "buy_formula_amount":
        case "sell_formula_amount":
          return "10000 * N + 2000";
        case "buy_formula_shares":
        case "sell_formula_shares":
          return "2 * N";
        case "buy_formula_percent":
        case "sell_formula_percent":
          return "abs(N) * 0.5";
        default:
          return "N";
      }
    };

    return (
      <Stack gap="sm">
        <TextInput
          label="수식"
          placeholder={`예: ${getExampleFormula()}`}
          value={formula}
          onChange={(event) =>
            updateParams({ formula: event.currentTarget.value })
          }
          disabled={readOnly}
          description={getFormulaDescription()}
          error={validation.isValid ? undefined : validation.error}
          rightSection={
            <Tooltip label="수식 예시 보기">
              <ActionIcon
                variant="subtle"
                color="blue"
                onClick={() => setShowExamples(!showExamples)}
              >
                {showExamples ? (
                  <IconChevronUp size={16} />
                ) : (
                  <IconChevronDown size={16} />
                )}
              </ActionIcon>
            </Tooltip>
          }
        />

        <Collapse in={showExamples}>
          <Alert
            icon={<IconInfoCircle size={16} />}
            color="blue"
            title="수식 예시"
          >
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                사용 가능한 변수 및 함수:
              </Text>
              <Text size="xs">
                • <Code>N</Code>: 실제 상승/하락 비율 (예: 5는 5%)
              </Text>
              <Text size="xs">
                • <Code>abs(N)</Code>: 절댓값 (상승/하락 관계없이)
              </Text>
              <Text size="xs">
                • 연산자: <Code>+</Code>, <Code>-</Code>, <Code>*</Code>,{" "}
                <Code>/</Code>, <Code>()</Code>
              </Text>

              <Text size="sm" fw={500} mt="sm">
                예시:
              </Text>
              {FORMULA_EXAMPLES.slice(0, 3).map((example, index) => (
                <div key={index}>
                  <Text size="xs">
                    <Code>{example.formula}</Code> - {example.description}
                  </Text>
                  <Text size="xs" c="dimmed" ml="md">
                    {example.example}
                  </Text>
                </div>
              ))}
            </Stack>
          </Alert>
        </Collapse>

        {formula && validation.isValid && (
          <Stack gap="xs">
            <Text size="xs" fw={500}>
              수식 테스트:
            </Text>
            {[1, 5, 10, -5, -10].map((testN) => {
              const result = calculateFormula(formula, testN);
              const unit = actionType.includes("amount")
                ? "원"
                : actionType.includes("shares")
                  ? "주"
                  : "%";
              const isNegativeAmount =
                result.isValid &&
                result.value < 0 &&
                actionType.includes("buy");
              return (
                <Text
                  key={testN}
                  size="xs"
                  c={isNegativeAmount ? "red" : "dimmed"}
                >
                  N={testN}% →{" "}
                  {result.isValid
                    ? `${result.value.toLocaleString()}${unit}`
                    : `오류: ${result.error}`}
                  {isNegativeAmount && " (음수: 매수 안함)"}
                </Text>
              );
            })}
          </Stack>
        )}
      </Stack>
    );
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

      case "buy_shares":
        return (
          <Stack gap="sm">
            <NumberInput
              label="매수 주식 수"
              placeholder="예: 100"
              value={params.shareCount || 0}
              onChange={(value) =>
                updateParams({ shareCount: Number(value) || 0 })
              }
              min={1}
              step={1}
              disabled={readOnly}
              description="몇 주를 매수할지 설정"
            />
            <Text size="xs" c="dimmed">
              {params.shareCount || 0}주 매수 실행
            </Text>
          </Stack>
        );

      case "sell_shares":
        return (
          <Stack gap="sm">
            <NumberInput
              label="매도 주식 수"
              placeholder="예: 50"
              value={params.shareCount || 0}
              onChange={(value) =>
                updateParams({ shareCount: Number(value) || 0 })
              }
              min={1}
              step={1}
              disabled={readOnly}
              description="몇 주를 매도할지 설정"
            />
            <Text size="xs" c="dimmed">
              {params.shareCount || 0}주 매도 실행
            </Text>
          </Stack>
        );

      case "sell_all":
        return (
          <Stack gap="sm">
            <Text size="xs" c="dimmed">
              보유한 모든 주식을 100% 매도합니다
            </Text>
          </Stack>
        );

      case "buy_formula_amount":
      case "sell_formula_amount":
      case "buy_formula_shares":
      case "sell_formula_shares":
      case "buy_formula_percent":
      case "sell_formula_percent":
        return renderFormulaInput();

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

        {!readOnly && canDelete && (
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
