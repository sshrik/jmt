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
  Grid,
  Paper,
  NumberFormatter,
  Loader,
  Divider,
} from "@mantine/core";
import {
  IconInfoCircle,
  IconRefresh,
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
import { getStockList, getStockData } from "../utils/stockDataLoader";
import type { StockInfo, StockData } from "../types/backtest";

export const Route = createFileRoute("/flowchart")({
  component: StockTrendPage,
});

function StockTrendPage() {
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

  // 차트 데이터 (최근 90일)
  const chartData = useMemo(() => {
    if (!stockData) return [];

    return stockData.prices
      .slice(-90) // 최근 90일
      .map((price) => ({
        date: price.date,
        close: price.close,
        high: price.high,
        low: price.low,
        open: price.open,
        volume: price.volume,
      }));
  }, [stockData]);

  // 가격 변동 계산
  const priceChange = useMemo(() => {
    if (!stockData || stockData.prices.length < 2) return null;

    const latestPrice = stockData.prices[stockData.prices.length - 1];
    const previousPrice = stockData.prices[stockData.prices.length - 2];

    const change = latestPrice.close - previousPrice.close;
    const changePercent = (change / previousPrice.close) * 100;

    return {
      amount: change,
      percent: changePercent,
      isPositive: change >= 0,
    };
  }, [stockData]);

  const handleRefresh = () => {
    if (selectedStock) {
      const loadStockData = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getStockData(selectedStock);
          setStockData(data);
        } catch (err) {
          setError("주식 데이터를 새로고침하는데 실패했습니다.");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      loadStockData();
    }
  };

  return (
    <Container size="xl">
      {/* 페이지 헤더 */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>주식 추이 확인</Title>
          <Text c="dimmed" size="lg" mt="xs">
            종목별 주가 정보와 차트를 확인해보세요
          </Text>
        </div>

        <Group gap="sm">
          <Button
            variant="outline"
            leftSection={<IconRefresh size={16} />}
            onClick={handleRefresh}
            loading={loading}
            disabled={!selectedStock}
          >
            새로고침
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert color="red" icon={<IconInfoCircle size="1rem" />} mb="xl">
          {error}
        </Alert>
      )}

      {/* 종목 선택 */}
      <Card withBorder mb="xl" p="lg">
        <Group justify="space-between" mb="md">
          <div>
            <Text fw={500} mb="xs">
              종목 선택
            </Text>
            <Text size="sm" c="dimmed">
              분석하고 싶은 주식 종목을 선택하세요
            </Text>
          </div>
          {loading && <Loader size="sm" />}
        </Group>

        <Group grow>
          <Select
            placeholder="종목을 선택하세요"
            data={stockList.map((stock) => ({
              value: stock.symbol,
              label: `${stock.name} (${stock.symbol})`,
            }))}
            value={selectedStock}
            onChange={(value) => value && setSelectedStock(value)}
            searchable
            disabled={loading}
            size="md"
          />
          <DatePickerInput
            placeholder="날짜를 선택하세요"
            value={selectedDate}
            onChange={(value) => {
              if (typeof value === "string") {
                setSelectedDate(new Date(value));
              } else {
                setSelectedDate(value);
              }
            }}
            leftSection={<IconCalendar size={16} />}
            disabled={loading}
            size="md"
          />
        </Group>
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
              {/* 현재 가격 및 변동 정보 */}
              {stockData && priceChange && (
                <Paper
                  withBorder
                  p="md"
                  bg={priceChange.isPositive ? "green.0" : "red.0"}
                >
                  <Group justify="space-between" align="center">
                    <div>
                      <Text fw={500} size="lg">
                        {stockData.info.name} ({stockData.info.symbol})
                      </Text>
                      <Text size="sm" c="dimmed">
                        최신 가격 (
                        {stockData.prices[stockData.prices.length - 1]?.date})
                      </Text>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Group gap="xs" justify="flex-end">
                        {priceChange.isPositive ? (
                          <IconTrendingUp size={20} color="green" />
                        ) : (
                          <IconTrendingDown size={20} color="red" />
                        )}
                        <div>
                          <Text fw={600} size="lg">
                            <NumberFormatter
                              value={
                                stockData.prices[stockData.prices.length - 1]
                                  ?.close
                              }
                              thousandSeparator
                              suffix="원"
                            />
                          </Text>
                          <Text
                            size="sm"
                            c={priceChange.isPositive ? "green" : "red"}
                            fw={500}
                          >
                            {priceChange.isPositive ? "+" : ""}
                            <NumberFormatter
                              value={priceChange.amount}
                              thousandSeparator
                              suffix="원"
                            />{" "}
                            ({priceChange.isPositive ? "+" : ""}
                            <NumberFormatter
                              value={priceChange.percent}
                              decimalScale={2}
                              suffix="%"
                            />
                            )
                          </Text>
                        </div>
                      </Group>
                    </div>
                  </Group>
                </Paper>
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
              최근 90일 종가 추이
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
            주식 추이 확인 사용 방법
          </Text>
          <Text size="sm">
            • <strong>새로고침:</strong> 종목 또는 날짜를 변경하면 자동으로
            새로고침됩니다.
          </Text>
          <Text size="sm">
            • <strong>차트:</strong> 종가 추이를 시각적으로 확인할 수 있습니다.
          </Text>
          <Text size="sm">
            • <strong>정보:</strong> 선택된 날짜의 주식 가격, 고가, 저가,
            거래량을 확인할 수 있습니다.
          </Text>
        </Stack>
      </Alert>
    </Container>
  );
}
