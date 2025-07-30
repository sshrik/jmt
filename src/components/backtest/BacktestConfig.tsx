import { useState, useEffect } from "react";
import {
  Card,
  Title,
  Stack,
  Group,
  Select,
  NumberInput,
  Button,
  Text,
  Badge,
  Alert,
  LoadingOverlay,
  Tooltip,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import {
  IconCalendar,
  IconCurrencyDollar,
  IconInfoCircle,
  IconChartLine,
} from "@tabler/icons-react";
import type {
  BacktestConfig as BacktestConfigType,
  StockSummary,
} from "../../types/backtest";
import {
  getStockDataSummary,
  getStockData,
  getAllAssets,
} from "../../utils/stockDataLoader";
import type { StockInfo } from "../../types/backtest";
import type { Strategy } from "../../types/strategy";

interface BacktestConfigProps {
  initialConfig?: Partial<BacktestConfigType>;
  onConfigChange: (config: BacktestConfigType) => void;
  onRunBacktest: (config: BacktestConfigType) => void;
  isRunning?: boolean;
  strategy?: Strategy;
}

export const BacktestConfig = ({
  initialConfig,
  onConfigChange,
  onRunBacktest,
  isRunning = false,
  strategy,
}: BacktestConfigProps) => {
  const [stockList, setStockList] = useState<StockInfo[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockInfo | null>(null);
  const [stockSummary, setStockSummary] = useState<StockSummary | null>(null);
  const [loadingStocks, setLoadingStocks] = useState(true);

  // 폼 상태
  const [config, setConfig] = useState<BacktestConfigType>({
    symbol: "",
    startDate: "2024-01-01", // 더 짧은 기간으로 변경
    endDate: "2024-12-31",
    initialCash: 10000000, // 1천만원
    commission: 0.0015, // 0.15%
    slippage: 0.001, // 0.1%
    ...initialConfig,
  });

  // initialConfig 변경 시 config 업데이트
  useEffect(() => {
    if (initialConfig) {
      console.log("initialConfig 업데이트:", initialConfig);
      setConfig((prev) => ({ ...prev, ...initialConfig }));

      // 종목이 설정되어 있으면 해당 종목 선택 및 요약 로드
      if (initialConfig.symbol && stockList.length > 0) {
        console.log(
          "종목 찾기:",
          initialConfig.symbol,
          "in",
          stockList.length,
          "stocks"
        );
        const stock = stockList.find((s) => s.symbol === initialConfig.symbol);
        console.log("찾은 종목:", stock);
        if (stock) {
          setSelectedStock(stock);
          loadStockSummary(initialConfig.symbol);
        } else {
          console.warn("종목을 찾을 수 없습니다:", initialConfig.symbol);
        }
      }
    }
  }, [initialConfig, stockList]);

  // 주식 목록 로드
  useEffect(() => {
    const loadStockList = async () => {
      try {
        setLoadingStocks(true);
        const stocks = await getAllAssets();
        setStockList(stocks);

        // 초기 선택된 종목이 있다면 찾기
        if (config.symbol) {
          const stock = stocks.find((s) => s.symbol === config.symbol);
          if (stock) {
            setSelectedStock(stock);
            loadStockSummary(config.symbol);
          }
        }
      } catch (error) {
        console.error("주식 목록 로드 실패:", error);
      } finally {
        setLoadingStocks(false);
      }
    };

    loadStockList();
  }, [config.symbol]);

  // 주식 요약 정보 로드
  const loadStockSummary = async (symbol: string) => {
    try {
      const stockData = await getStockData(symbol);
      const summary = getStockDataSummary(stockData);
      setStockSummary(summary);
    } catch (error) {
      console.error("주식 요약 정보 로드 실패:", error);
      setStockSummary(null);
    }
  };

  // 설정 변경 핸들러
  const handleConfigChange = (
    field: keyof BacktestConfigType,
    value: string | number | null
  ) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    onConfigChange(newConfig);

    // 종목 변경 시 요약 정보 로드
    if (field === "symbol" && value) {
      const stock = stockList.find((s) => s.symbol === value);
      setSelectedStock(stock || null);
      loadStockSummary(value as string);
    }
  };

  // 백테스트 실행
  const handleRunBacktest = () => {
    if (config.symbol && config.startDate && config.endDate) {
      onRunBacktest(config);
    }
  };

  // 유효성 검사
  const isConfigValid =
    config.symbol &&
    config.startDate &&
    config.endDate &&
    config.initialCash > 0 &&
    config.commission >= 0 &&
    config.slippage >= 0;

  const hasStrategy = strategy && strategy.blocks && strategy.blocks.length > 0;

  const getTooltipLabel = () => {
    if (!hasStrategy) {
      return "백테스트를 실행하려면 먼저 투자 전략을 설정해야 합니다. '투자 전략' 탭에서 조건과 액션을 추가해주세요.";
    }
    if (!isConfigValid) {
      return "백테스트를 실행하려면 모든 필드를 채워야 합니다.";
    }
    return null;
  };

  return (
    <Card withBorder>
      <LoadingOverlay visible={loadingStocks} />

      <Stack gap="lg">
        <Title order={3}>백테스트 설정</Title>

        {/* 종목 선택 */}
        <div>
          <Text size="sm" fw={500} mb="xs">
            종목 선택
          </Text>
          <Select
            placeholder="백테스트할 종목을 선택하세요"
            data={stockList.map((stock) => ({
              value: stock.symbol,
              label: `${stock.name} (${stock.symbol})`,
            }))}
            value={config.symbol || null}
            onChange={(value) => handleConfigChange("symbol", value)}
            searchable
            clearable
            leftSection={<IconChartLine size={16} />}
          />

          {/* 종목 정보 */}
          {selectedStock && (
            <Group mt="xs" gap="xs">
              <Badge variant="light" color="blue">
                {selectedStock.market}
              </Badge>
              <Badge variant="light" color="green">
                {selectedStock.currency}
              </Badge>
            </Group>
          )}
        </div>

        {/* 기간 설정 */}
        <Group grow>
          <div>
            <Text size="sm" fw={500} mb="xs">
              시작일
            </Text>
            <DatePickerInput
              placeholder="시작일 선택"
              value={config.startDate ? new Date(config.startDate) : null}
              onChange={(date) => {
                if (date) {
                  // Date 객체인 경우 ISO 문자열로 변환
                  const dateString = new Date(date).toISOString().split("T")[0];
                  handleConfigChange("startDate", dateString);
                } else {
                  handleConfigChange("startDate", null);
                }
              }}
              leftSection={<IconCalendar size={16} />}
              maxDate={config.endDate ? new Date(config.endDate) : undefined}
              dropdownType="popover"
              popoverProps={{ position: "bottom" }}
              firstDayOfWeek={0}
            />
          </div>
          <div>
            <Text size="sm" fw={500} mb="xs">
              종료일
            </Text>
            <DatePickerInput
              placeholder="종료일 선택"
              value={config.endDate ? new Date(config.endDate) : null}
              onChange={(date) => {
                if (date) {
                  // Date 객체인 경우 ISO 문자열로 변환
                  const dateString = new Date(date).toISOString().split("T")[0];
                  handleConfigChange("endDate", dateString);
                } else {
                  handleConfigChange("endDate", null);
                }
              }}
              leftSection={<IconCalendar size={16} />}
              minDate={
                config.startDate ? new Date(config.startDate) : undefined
              }
              maxDate={new Date()}
              dropdownType="popover"
              popoverProps={{ position: "bottom" }}
            />
          </div>
        </Group>

        {/* 투자 설정 */}
        <Group grow>
          <NumberInput
            label="초기 자금"
            placeholder="초기 투자 자금"
            value={config.initialCash}
            onChange={(value) =>
              handleConfigChange(
                "initialCash",
                typeof value === "number" ? value : 0
              )
            }
            leftSection={<IconCurrencyDollar size={16} />}
            thousandSeparator=","
            suffix=" 원"
            min={100000}
            step={1000000}
          />
          <Group grow>
            <Tooltip
              label="거래 시 발생하는 수수료 비율입니다. 일반적으로 0.15%~0.25% 수준이며, 증권사마다 다를 수 있습니다."
              position="top"
              withArrow
              multiline
              w={300}
            >
              <NumberInput
                label="수수료율 (%)"
                value={(config.commission || 0) * 100}
                onChange={(value) =>
                  handleConfigChange(
                    "commission",
                    typeof value === "number" ? value / 100 : 0
                  )
                }
                decimalScale={3}
                step={0.001}
                min={0}
                max={1}
              />
            </Tooltip>
            <Tooltip
              label="주문 가격과 실제 체결 가격의 차이를 반영하는 비율입니다. 시장 상황과 거래량에 따라 0.05%~0.1% 수준에서 발생합니다."
              position="top"
              withArrow
              multiline
              w={300}
            >
              <NumberInput
                label="슬리피지율 (%)"
                value={(config.slippage || 0) * 100}
                onChange={(value) =>
                  handleConfigChange(
                    "slippage",
                    typeof value === "number" ? value / 100 : 0
                  )
                }
                decimalScale={3}
                step={0.001}
                min={0}
                max={1}
              />
            </Tooltip>
          </Group>
        </Group>

        {/* 종목 요약 정보 */}
        {stockSummary && (
          <Alert
            icon={<IconInfoCircle size={16} />}
            color="blue"
            variant="light"
          >
            <Text size="sm" fw={500} mb="xs">
              {stockSummary.name} 데이터 정보
            </Text>
            <Group gap="md">
              <Text size="xs">
                <strong>최대 지원 기간:</strong> {stockSummary.startDate} ~{" "}
                {stockSummary.endDate} ({stockSummary.dataPoints}일)
              </Text>
              <Text size="xs">
                <strong>전체 기간 수익률:</strong>{" "}
                {stockSummary.totalReturn.toFixed(2)}%
              </Text>
              <Text size="xs">
                <strong>변동성:</strong> {stockSummary.volatility.toFixed(2)}%
              </Text>
            </Group>
          </Alert>
        )}

        {/* 실행 버튼 */}
        <Tooltip
          label={getTooltipLabel()}
          position="top"
          withArrow
          disabled={!getTooltipLabel()}
        >
          <Button
            size="lg"
            onClick={handleRunBacktest}
            disabled={!isConfigValid || isRunning || !hasStrategy}
            loading={isRunning}
            leftSection={<IconChartLine size={18} />}
          >
            {isRunning ? "백테스트 실행 중..." : "백테스트 실행"}
          </Button>
        </Tooltip>
      </Stack>
    </Card>
  );
};
