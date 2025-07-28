import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Card,
  Alert,
  Stack,
  Select,
  Badge,
  Grid,
  Paper,
  NumberFormatter,
  Loader,
  Divider,
} from "@mantine/core";
import {
  IconInfoCircle,
  IconDownload,
  IconUpload,
  IconRefresh,
  IconPlayerPlay,
  IconTrendingUp,
  IconTrendingDown,
  IconCalendar,
  IconCurrencyWon,
} from "@tabler/icons-react";
import { DatePickerInput } from "@mantine/dates";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StrategyFlowEditor } from "../components/strategy/StrategyFlowEditor";
import { getStockList, getStockData } from "../utils/stockDataLoader";
import type { StrategyFlow } from "../types/strategy";
import type { StockInfo, StockData } from "../types/backtest";

export const Route = createFileRoute("/flowchart")({
  component: FlowchartPage,
});

function FlowchartPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("basic");
  const [currentFlow, setCurrentFlow] = useState<StrategyFlow | undefined>(
    undefined
  );

  // 주식 데이터 관련 state
  const [stockList, setStockList] = useState<StockInfo[]>([]);
  const [selectedStock, setSelectedStock] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 주식 목록 로드
  useEffect(() => {
    const loadStockList = async () => {
      try {
        const stocks = await getStockList();
        setStockList(stocks);
        if (stocks.length > 0) {
          setSelectedStock(stocks[0].symbol);
        }
      } catch (err) {
        setError("주식 목록을 불러오는데 실패했습니다.");
        console.error(err);
      }
    };
    loadStockList();
  }, []);

  // 선택된 주식 데이터 로드
  useEffect(() => {
    if (selectedStock) {
      const loadStockData = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getStockData(selectedStock);
          setStockData(data);
        } catch (err) {
          setError("주식 데이터를 불러오는데 실패했습니다.");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      loadStockData();
    }
  }, [selectedStock]);

  // 선택된 날짜의 주식 가격 정보
  const selectedDatePrice = useMemo(() => {
    if (!stockData || !selectedDate) return null;

    const dateStr = selectedDate.toISOString().split("T")[0];
    return stockData.prices.find((price) => price.date === dateStr);
  }, [stockData, selectedDate]);

  // 차트 데이터 (최근 30일)
  const chartData = useMemo(() => {
    if (!stockData) return [];

    return stockData.prices
      .slice(-30) // 최근 30일
      .map((price) => ({
        date: price.date,
        close: price.close,
        high: price.high,
        low: price.low,
        volume: price.volume,
      }));
  }, [stockData]);

  // 템플릿 전략들
  const templates = [
    {
      value: "basic",
      label: "기본 매수/매도 전략",
      description: "단순한 가격 변동 기반 매매 전략",
    },
    {
      value: "momentum",
      label: "모멘텀 전략",
      description: "상승 추세를 따라가는 모멘텀 전략",
    },
    {
      value: "contrarian",
      label: "역추세 전략",
      description: "시장 반대 방향으로 투자하는 전략",
    },
    {
      value: "custom",
      label: "사용자 정의",
      description: "처음부터 새로 만드는 전략",
    },
  ];

  const handleFlowUpdate = (updatedFlow: StrategyFlow) => {
    setCurrentFlow(updatedFlow);
  };

  const handleTemplateChange = (template: string | null) => {
    if (template) {
      setSelectedTemplate(template);
      // TODO: 템플릿에 따른 기본 플로우 설정
    }
  };

  const handleExportFlow = () => {
    if (currentFlow) {
      const dataStr = JSON.stringify(currentFlow, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `strategy-flow-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportFlow = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedFlow = JSON.parse(e.target?.result as string);
            setCurrentFlow(importedFlow);
          } catch (error) {
            console.error("파일 import 실패:", error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <Container size="xl">
      {/* 페이지 헤더 */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>주식 흐름도</Title>
          <Text c="dimmed" size="lg" mt="xs">
            시각적으로 투자 전략을 설계하고 테스트해보세요
          </Text>
        </div>

        <Group gap="sm">
          <Button
            variant="outline"
            leftSection={<IconUpload size={16} />}
            onClick={handleImportFlow}
          >
            가져오기
          </Button>
          <Button
            variant="outline"
            leftSection={<IconDownload size={16} />}
            onClick={handleExportFlow}
            disabled={!currentFlow}
          >
            내보내기
          </Button>
          <Button
            variant="outline"
            leftSection={<IconRefresh size={16} />}
            onClick={() => setCurrentFlow(undefined)}
          >
            초기화
          </Button>
        </Group>
      </Group>

      {/* 템플릿 선택 */}
      <Card withBorder mb="xl" p="lg">
        <Group justify="space-between" mb="md">
          <div>
            <Text fw={500} mb="xs">
              전략 템플릿
            </Text>
            <Text size="sm" c="dimmed">
              기본 템플릿을 선택하거나 처음부터 새로 만드세요
            </Text>
          </div>
          <Badge variant="light" color="blue">
            {templates.find((t) => t.value === selectedTemplate)?.label}
          </Badge>
        </Group>

        <Select
          placeholder="전략 템플릿을 선택하세요"
          data={templates.map((template) => ({
            value: template.value,
            label: template.label,
          }))}
          value={selectedTemplate}
          onChange={handleTemplateChange}
          description={
            templates.find((t) => t.value === selectedTemplate)?.description
          }
        />
      </Card>

      {/* 주식 정보 섹션 */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder p="lg" h="100%">
            <Group justify="space-between" mb="md">
              <div>
                <Text fw={500} mb="xs">
                  주식 종목 정보
                </Text>
                <Text size="sm" c="dimmed">
                  종목과 날짜를 선택하여 가격 정보를 확인하세요
                </Text>
              </div>
              {loading && <Loader size="sm" />}
            </Group>

            <Stack gap="md">
              <Group grow>
                <Select
                  label="종목 선택"
                  placeholder="종목을 선택하세요"
                  data={stockList.map((stock) => ({
                    value: stock.symbol,
                    label: `${stock.name} (${stock.symbol})`,
                  }))}
                  value={selectedStock}
                  onChange={(value) => value && setSelectedStock(value)}
                  searchable
                  disabled={loading}
                />
                <DatePickerInput
                  label="날짜 선택"
                  placeholder="날짜를 선택하세요"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  leftSection={<IconCalendar size={16} />}
                  disabled={loading}
                />
              </Group>

              {error && (
                <Alert color="red" icon={<IconInfoCircle size="1rem" />}>
                  {error}
                </Alert>
              )}

              {selectedDatePrice && (
                <Paper withBorder p="md" bg="gray.0">
                  <Text fw={500} mb="sm">
                    {stockData?.info.name} ({selectedDatePrice.date})
                  </Text>
                  <Grid>
                    <Grid.Col span={3}>
                      <Stack gap="xs" align="center">
                        <IconCurrencyWon size={20} color="blue" />
                        <Text size="xs" c="dimmed">
                          종가
                        </Text>
                        <Text fw={600}>
                          <NumberFormatter
                            value={selectedDatePrice.close}
                            thousandSeparator
                            suffix="원"
                          />
                        </Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={3}>
                      <Stack gap="xs" align="center">
                        <IconTrendingUp size={20} color="green" />
                        <Text size="xs" c="dimmed">
                          고가
                        </Text>
                        <Text fw={600} c="green">
                          <NumberFormatter
                            value={selectedDatePrice.high}
                            thousandSeparator
                            suffix="원"
                          />
                        </Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={3}>
                      <Stack gap="xs" align="center">
                        <IconTrendingDown size={20} color="red" />
                        <Text size="xs" c="dimmed">
                          저가
                        </Text>
                        <Text fw={600} c="red">
                          <NumberFormatter
                            value={selectedDatePrice.low}
                            thousandSeparator
                            suffix="원"
                          />
                        </Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={3}>
                      <Stack gap="xs" align="center">
                        <Text size="xs" c="dimmed">
                          거래량
                        </Text>
                        <Text fw={600}>
                          <NumberFormatter
                            value={selectedDatePrice.volume}
                            thousandSeparator
                          />
                        </Text>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Paper>
              )}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder p="lg" h="100%">
            <Text fw={500} mb="md">
              최근 30일 종가 추이
            </Text>
            {chartData.length > 0 ? (
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value.toLocaleString()}원`,
                        "종가",
                      ]}
                      labelFormatter={(label) => `날짜: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="close"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div
                style={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text c="dimmed" size="sm">
                  데이터가 없습니다
                </Text>
              </div>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      <Divider mb="xl" />

      {/* 안내 사항 */}
      <Alert
        icon={<IconInfoCircle size={16} />}
        color="blue"
        variant="light"
        mb="xl"
      >
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            주식 흐름도 사용 방법
          </Text>
          <Text size="sm">
            • <strong>드래그 앤 드롭:</strong> 왼쪽에서 블록을 끌어서 추가하세요
          </Text>
          <Text size="sm">
            • <strong>연결:</strong> 블록 간의 연결점을 드래그해서 연결하세요
          </Text>
          <Text size="sm">
            • <strong>편집:</strong> 블록을 클릭해서 조건과 액션을 설정하세요
          </Text>
          <Text size="sm">
            • <strong>삭제:</strong> 블록의 휴지통 아이콘을 클릭하세요
          </Text>
        </Stack>
      </Alert>

      {/* 플로우 에디터 */}
      <Card withBorder>
        <Group justify="space-between" mb="md">
          <div>
            <Text fw={500} mb="xs">
              전략 흐름도
            </Text>
            <Text size="sm" c="dimmed">
              블록을 추가하고 연결해서 투자 전략을 설계하세요
            </Text>
          </div>
          <Group gap="sm">
            <Button
              size="sm"
              variant="light"
              leftSection={<IconPlayerPlay size={14} />}
              disabled={!currentFlow || !currentFlow.nodes.length}
            >
              미리보기
            </Button>
          </Group>
        </Group>

        <div style={{ height: "calc(100vh - 400px)", minHeight: "600px" }}>
          <StrategyFlowEditor
            flow={currentFlow}
            onFlowUpdate={handleFlowUpdate}
          />
        </div>
      </Card>

      {/* 플로우 정보 */}
      {currentFlow && (
        <Card withBorder mt="xl" p="lg">
          <Title order={4} mb="md">
            현재 플로우 정보
          </Title>
          <Group gap="xl">
            <div>
              <Text size="sm" c="dimmed">
                총 블록 수
              </Text>
              <Text fw={500}>{currentFlow.nodes.length}개</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                연결 수
              </Text>
              <Text fw={500}>{currentFlow.edges.length}개</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                마지막 수정
              </Text>
              <Text fw={500}>
                {new Date(currentFlow.updatedAt).toLocaleString("ko-KR")}
              </Text>
            </div>
          </Group>
        </Card>
      )}
    </Container>
  );
}
