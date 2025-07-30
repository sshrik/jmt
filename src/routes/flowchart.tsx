import { useState, useEffect, useMemo, useCallback } from "react";
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
import { getStockData, getAllAssets } from "../utils/stockDataLoader";
import type { StockInfo, StockData, StockPrice } from "../types/backtest";

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

  // 차트 기간 선택 state 추가
  const [chartStartDate, setChartStartDate] = useState<Date | null>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 90); // 기본 90일 전
    return date;
  });
  const [chartEndDate, setChartEndDate] = useState<Date | null>(new Date());

  // 컴포넌트 마운트 시 주식 목록 로드
  useEffect(() => {
    const loadStockList = async () => {
      try {
        const stocks = await getAllAssets(); // 모든 자산 로드 (주식 + 지수 + 암호화폐)
        setStockList(stocks);
        if (stocks.length > 0) {
          // S&P 500이 있으면 기본 선택, 없으면 첫 번째 항목 선택
          const sp500 = stocks.find((stock) => stock.symbol === "^GSPC");
          setSelectedStock(sp500?.symbol || stocks[0].symbol);
        }
      } catch (err) {
        console.error("주식 목록 로드 실패:", err);
        setError("주식 목록을 불러올 수 없습니다.");
      }
    };

    loadStockList();
  }, []);

  // 선택된 주식이 변경될 때마다 데이터 로드
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

  // 데이터 샘플링 함수
  const sampleData = useCallback(
    (data: StockPrice[], startDate: Date, endDate: Date) => {
      if (!data || data.length === 0) return [];

      // 날짜 범위로 필터링
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      const filteredData = data.filter(
        (item) => item.date >= startDateStr && item.date <= endDateStr
      );

      if (filteredData.length === 0) return [];

      const daysDiff = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // 기간에 따른 스마트 샘플링
      if (daysDiff <= 365) {
        // 1년 이하: 모든 데이터 (일별)
        return filteredData;
      } else if (daysDiff <= 1095) {
        // 1-3년: 주별 샘플링 (매주 마지막 거래일)
        const sampled = [];
        let lastWeek = -1;

        for (const item of filteredData) {
          const date = new Date(item.date);
          const weekOfYear = Math.floor(
            date.getTime() / (1000 * 60 * 60 * 24 * 7)
          );

          if (weekOfYear !== lastWeek) {
            sampled.push(item);
            lastWeek = weekOfYear;
          }
        }
        return sampled;
      } else if (daysDiff <= 3650) {
        // 3-10년: 월별 샘플링 (매월 마지막 거래일)
        const sampled = [];
        let lastMonth = -1;

        for (const item of filteredData) {
          const date = new Date(item.date);
          const monthKey = date.getFullYear() * 12 + date.getMonth();

          if (monthKey !== lastMonth) {
            sampled.push(item);
            lastMonth = monthKey;
          }
        }
        return sampled;
      } else {
        // 10년 이상: 분기별 샘플링
        const sampled = [];
        let lastQuarter = -1;

        for (const item of filteredData) {
          const date = new Date(item.date);
          const quarterKey =
            date.getFullYear() * 4 + Math.floor(date.getMonth() / 3);

          if (quarterKey !== lastQuarter) {
            sampled.push(item);
            lastQuarter = quarterKey;
          }
        }
        return sampled;
      }
    },
    []
  );

  // 차트 데이터 (기간 및 샘플링 적용)
  const chartData = useMemo(() => {
    if (!stockData || !chartStartDate || !chartEndDate) return [];

    const sampledData = sampleData(
      stockData.prices,
      chartStartDate,
      chartEndDate
    );

    return sampledData.map((price) => ({
      date: price.date,
      close: price.close,
      high: price.high,
      low: price.low,
      open: price.open,
      volume: price.volume,
    }));
  }, [stockData, chartStartDate, chartEndDate, sampleData]);

  // 차트 기간 정보
  const chartPeriodInfo = useMemo(() => {
    if (!chartStartDate || !chartEndDate) return null;

    const daysDiff = Math.ceil(
      (chartEndDate.getTime() - chartStartDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    let samplingType = "";

    if (daysDiff <= 365) {
      samplingType = "일별";
    } else if (daysDiff <= 1095) {
      samplingType = "주별";
    } else if (daysDiff <= 3650) {
      samplingType = "월별";
    } else {
      samplingType = "분기별";
    }

    return {
      days: daysDiff,
      sampling: samplingType,
      dataPoints: chartData.length,
    };
  }, [chartStartDate, chartEndDate, chartData.length]);

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

  // 기간 프리셋 함수들
  const setPresetPeriod = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    setChartStartDate(startDate);
    setChartEndDate(endDate);
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
            dropdownType="popover"
            popoverProps={{ position: "bottom" }}
            size="md"
          />
        </Group>
      </Card>

      <Divider mb="xl" label="선택된 종목 정보" labelPosition="center" />

      {/* 종목 정보 및 차트 통합 섹션 */}
      <Card withBorder mb="xl" p="lg">
        {/* 주식 종목 정보 */}
        <Stack gap="xl">
          <div>
            <Group justify="space-between" mb="md">
              <div>
                <Text fw={500} size="lg" mb="xs">
                  주식 종목 정보
                </Text>
                <Text size="sm" c="dimmed">
                  선택된 종목의 가격 정보를 확인하세요
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
                  className={
                    priceChange.isPositive
                      ? "return-card-positive"
                      : "return-card-negative"
                  }
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
                          <IconTrendingUp
                            size={20}
                            className="return-icon-positive"
                          />
                        ) : (
                          <IconTrendingDown
                            size={20}
                            className="return-icon-negative"
                          />
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
                            className={
                              priceChange.isPositive
                                ? "return-text-positive"
                                : "return-text-negative"
                            }
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

              {/* 선택된 날짜 가격 정보 */}
              {selectedDatePrice && (
                <Paper withBorder p="md" bg="gray.0">
                  <Group justify="space-between" align="center" mb="md">
                    <div>
                      <Text fw={500} mb="xs">
                        선택된 날짜 가격 정보
                      </Text>
                      <Group gap="xs" align="center">
                        <IconCalendar size={16} />
                        <Text size="sm" c="dimmed">
                          {selectedDatePrice.date}
                        </Text>
                      </Group>
                    </div>
                    <Group gap="xs" align="center">
                      <IconCurrencyWon size={16} />
                      <Text fw={600} size="lg">
                        <NumberFormatter
                          value={selectedDatePrice.close}
                          thousandSeparator
                          suffix="원"
                        />
                      </Text>
                    </Group>
                  </Group>

                  <Grid>
                    <Grid.Col span={3}>
                      <Stack gap="xs" align="center">
                        <Text size="xs" c="dimmed">
                          시가
                        </Text>
                        <Text fw={600}>
                          <NumberFormatter
                            value={selectedDatePrice.open}
                            thousandSeparator
                            suffix="원"
                          />
                        </Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={3}>
                      <Stack gap="xs" align="center">
                        <IconTrendingUp
                          size={20}
                          className="return-icon-positive"
                        />
                        <Text size="xs" c="dimmed">
                          고가
                        </Text>
                        <Text fw={600} className="return-text-positive">
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
                        <IconTrendingDown
                          size={20}
                          className="return-icon-negative"
                        />
                        <Text size="xs" c="dimmed">
                          저가
                        </Text>
                        <Text fw={600} className="return-text-negative">
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
          </div>

          <Divider label="주가 추이 차트" labelPosition="center" />

          {/* 주가 추이 차트 */}
          <div>
            <Group justify="space-between" mb="md">
              <div>
                <Text fw={500} size="lg">
                  주가 추이 차트
                </Text>
                {chartPeriodInfo && (
                  <Text size="xs" c="dimmed">
                    {chartPeriodInfo.days}일간 • {chartPeriodInfo.sampling}{" "}
                    샘플링 • {chartPeriodInfo.dataPoints}개 데이터
                  </Text>
                )}
              </div>
            </Group>

            {/* 기간 선택 UI */}
            <Stack gap="sm" mb="md">
              <Group gap="xs" wrap="wrap">
                <Button
                  size="xs"
                  variant="light"
                  onClick={() => setPresetPeriod(30)}
                >
                  1개월
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  onClick={() => setPresetPeriod(90)}
                >
                  3개월
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  onClick={() => setPresetPeriod(365)}
                >
                  1년
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  onClick={() => setPresetPeriod(1095)}
                >
                  3년
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  onClick={() => setPresetPeriod(3650)}
                >
                  10년
                </Button>
              </Group>

              <Group gap="xs">
                <DatePickerInput
                  size="xs"
                  placeholder="시작일"
                  value={chartStartDate}
                  onChange={(value: string | null) => {
                    if (value) {
                      setChartStartDate(new Date(value));
                    } else {
                      setChartStartDate(null);
                    }
                  }}
                  maxDate={chartEndDate || undefined}
                  w="48%"
                  dropdownType="popover"
                  popoverProps={{ position: "bottom" }}
                />
                <DatePickerInput
                  size="xs"
                  placeholder="종료일"
                  value={chartEndDate}
                  onChange={(value: string | null) => {
                    if (value) {
                      setChartEndDate(new Date(value));
                    } else {
                      setChartEndDate(null);
                    }
                  }}
                  minDate={chartStartDate || undefined}
                  maxDate={new Date()}
                  w="48%"
                  dropdownType="popover"
                  popoverProps={{ position: "bottom" }}
                />
              </Group>
            </Stack>

            {/* 차트 */}
            {chartData.length > 0 ? (
              <div style={{ height: 400, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        // 기간에 따라 표시 형식 변경
                        if (chartPeriodInfo && chartPeriodInfo.days > 1095) {
                          return `${date.getFullYear()}`;
                        } else if (
                          chartPeriodInfo &&
                          chartPeriodInfo.days > 365
                        ) {
                          return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}`;
                        } else {
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
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
                  height: 400,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px dashed #dee2e6",
                  borderRadius: "8px",
                  backgroundColor: "#f8f9fa",
                }}
              >
                <Text c="dimmed" size="sm">
                  {loading
                    ? "데이터 로딩 중..."
                    : "선택한 기간에 데이터가 없습니다"}
                </Text>
              </div>
            )}
          </div>
        </Stack>
      </Card>

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
