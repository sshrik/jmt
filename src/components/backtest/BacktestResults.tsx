import {
  Card,
  Title,
  Text,
  Group,
  Stack,
  Grid,
  Badge,
  Alert,
  Tabs,
  Table,
  Progress,
  Tooltip as MantineTooltip,
} from "@mantine/core";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconCoin,
  IconChartLine,
  IconList,
  IconInfoCircle,
} from "@tabler/icons-react";
import type { BacktestResult } from "../../types/backtest";

interface BacktestResultsProps {
  result: BacktestResult;
}

export const BacktestResults = ({ result }: BacktestResultsProps) => {
  const { stats, portfolioHistory, trades, config } = result;

  // 차트 데이터 준비
  const chartData = portfolioHistory.map((snapshot) => ({
    date: snapshot.date,
    totalValue: snapshot.totalValue,
    totalReturn: snapshot.totalReturn,
    totalReturnPct: snapshot.totalReturnPct,
    cash: snapshot.cash,
  }));

  // 성과 지표 색상 결정
  const getPerformanceColor = (value: number) => {
    if (value > 0) return "green";
    if (value < 0) return "red";
    return "gray";
  };

  // 숫자 포맷팅
  const formatNumber = (value: number, decimals = 2) => {
    return new Intl.NumberFormat("ko-KR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  // 통계 카드 컴포넌트
  const StatCard = ({
    title,
    value,
    suffix = "",
    icon,
    color,
  }: {
    title: string;
    value: number;
    suffix?: string;
    icon: React.ReactNode;
    color?: string;
  }) => (
    <Card withBorder p="md">
      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed">
          {title}
        </Text>
        {icon}
      </Group>
      <Text size="xl" fw={700} c={color}>
        {formatNumber(value)}
        {suffix}
      </Text>
    </Card>
  );

  return (
    <Stack gap="xl">
      {/* 헤더 */}
      <Card withBorder>
        <Group justify="space-between" align="flex-start" mb="md">
          <div>
            <Title order={2}>백테스트 결과</Title>
            <Text size="sm" c="dimmed" mt="xs">
              {config.symbol} | {config.startDate} ~ {config.endDate} (총{" "}
              {result.duration}일)
            </Text>
          </div>
          <Badge
            color={getPerformanceColor(stats.totalReturnPct)}
            size="lg"
            variant="light"
          >
            {stats.totalReturnPct > 0 ? "+" : ""}
            {formatNumber(stats.totalReturnPct, 2)}%
          </Badge>
        </Group>

        {/* 백테스트 요약 */}
        <Alert color="blue" variant="light" title="백테스트 요약">
          <Text size="sm">
            {result.duration}일 동안 {stats.totalTrades}회 거래를 통해{" "}
            {stats.totalReturnPct > 0 ? "" : "-"}₩
            {formatNumber(Math.abs(stats.totalReturn))}의{" "}
            {stats.totalReturnPct > 0 ? "수익" : "손실"}을 기록했습니다. (실행
            시간: {result.executionTime}ms)
          </Text>
        </Alert>
      </Card>

      {/* 핵심 성과 지표 */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <StatCard
            title="기간 내 변화량"
            value={stats.totalReturnPct}
            suffix="%"
            icon={
              stats.totalReturnPct >= 0 ? (
                <IconTrendingUp color="green" />
              ) : (
                <IconTrendingDown color="red" />
              )
            }
            color={getPerformanceColor(stats.totalReturnPct)}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <StatCard
            title="연간 변화율"
            value={stats.annualizedReturn}
            suffix="%"
            icon={<IconChartLine />}
            color={getPerformanceColor(stats.annualizedReturn)}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <StatCard
            title="샤프 비율"
            value={stats.sharpeRatio}
            icon={<IconTrendingUp />}
            color={
              stats.sharpeRatio > 1
                ? "green"
                : stats.sharpeRatio > 0.5
                  ? "yellow"
                  : "red"
            }
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <StatCard
            title="최대 낙폭"
            value={stats.maxDrawdown}
            suffix="%"
            icon={<IconTrendingDown />}
            color="red"
          />
        </Grid.Col>
      </Grid>

      {/* 탭 콘텐츠 */}
      <Tabs defaultValue="chart" variant="outline">
        <Tabs.List>
          <Tabs.Tab value="chart" leftSection={<IconChartLine size={16} />}>
            성과 차트
          </Tabs.Tab>
          <Tabs.Tab value="stats" leftSection={<IconCoin size={16} />}>
            상세 통계
          </Tabs.Tab>
          <Tabs.Tab value="trades" leftSection={<IconList size={16} />}>
            거래 내역
          </Tabs.Tab>
        </Tabs.List>

        {/* 성과 차트 */}
        <Tabs.Panel value="chart" pt="md">
          <Card withBorder>
            <Title order={4} mb="md">
              포트폴리오 가치 변화
            </Title>
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      `₩${(value / 1000000).toFixed(1)}M`
                    }
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === "포트폴리오 가치"
                        ? `₩${formatNumber(value)}`
                        : `${formatNumber(value, 2)}%`,
                      name,
                    ]}
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString("ko-KR")
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalValue"
                    stroke="#2563eb"
                    strokeWidth={2}
                    name="포트폴리오 가치"
                    dot={false}
                    yAxisId="left"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalReturnPct"
                    stroke="#16a34a"
                    strokeWidth={2}
                    name="수익률 (%)"
                    dot={false}
                    yAxisId="right"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Tabs.Panel>

        {/* 상세 통계 */}
        <Tabs.Panel value="stats" pt="md">
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder>
                <Title order={4} mb="md">
                  수익성 지표
                </Title>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text size="sm">총 수익</Text>
                    <Text fw={500} c={getPerformanceColor(stats.totalReturn)}>
                      ₩{formatNumber(stats.totalReturn)}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">기간 내 변화량</Text>
                    <Text
                      fw={500}
                      c={getPerformanceColor(stats.totalReturnPct)}
                    >
                      {formatNumber(stats.totalReturnPct, 2)}%
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">연간 변화율</Text>
                    <Text
                      fw={500}
                      c={getPerformanceColor(stats.annualizedReturn)}
                    >
                      {formatNumber(stats.annualizedReturn, 2)}%
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">수익 거래 비율</Text>
                    <Text fw={500}>{formatNumber(stats.winRate, 1)}%</Text>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder>
                <Title order={4} mb="md">
                  리스크 지표
                </Title>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <MantineTooltip
                      label="주가의 연간 변동성으로, 높을수록 가격 변동이 큰 위험한 투자입니다."
                      position="top"
                      withArrow
                      multiline
                      w={250}
                    >
                      <Text
                        size="sm"
                        style={{ cursor: "help", borderBottom: "1px dotted" }}
                      >
                        변동성 (연간)
                      </Text>
                    </MantineTooltip>
                    <Text fw={500}>{formatNumber(stats.volatility, 2)}%</Text>
                  </Group>
                  <Group justify="space-between">
                    <MantineTooltip
                      label="수익률 대비 위험도를 나타내는 지표입니다. 1.0 이상이면 양호, 2.0 이상이면 우수한 투자 성과입니다."
                      position="top"
                      withArrow
                      multiline
                      w={250}
                    >
                      <Text
                        size="sm"
                        style={{ cursor: "help", borderBottom: "1px dotted" }}
                      >
                        샤프 비율
                      </Text>
                    </MantineTooltip>
                    <Text
                      fw={500}
                      c={stats.sharpeRatio > 1 ? "green" : "orange"}
                    >
                      {formatNumber(stats.sharpeRatio, 3)}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <MantineTooltip
                      label="투자 기간 중 최고점 대비 최대 하락폭입니다. 낮을수록 안정적인 투자입니다."
                      position="top"
                      withArrow
                      multiline
                      w={250}
                    >
                      <Text
                        size="sm"
                        style={{ cursor: "help", borderBottom: "1px dotted" }}
                      >
                        최대 낙폭
                      </Text>
                    </MantineTooltip>
                    <Text fw={500} c="red">
                      -{formatNumber(stats.maxDrawdown, 2)}%
                    </Text>
                  </Group>
                  <div>
                    <Group justify="space-between" mb="xs">
                      <MantineTooltip
                        label="샤프 비율을 기준으로 계산된 투자 위험도입니다. 낮을수록 위험 대비 수익이 좋은 투자입니다."
                        position="top"
                        withArrow
                        multiline
                        w={250}
                      >
                        <Text
                          size="sm"
                          style={{ cursor: "help", borderBottom: "1px dotted" }}
                        >
                          리스크 점수
                        </Text>
                      </MantineTooltip>
                      <Text size="xs" c="dimmed">
                        {stats.sharpeRatio > 1.5
                          ? "낮음"
                          : stats.sharpeRatio > 1
                            ? "보통"
                            : stats.sharpeRatio > 0.5
                              ? "높음"
                              : "매우 높음"}
                      </Text>
                    </Group>
                    <Progress
                      value={Math.max(
                        0,
                        Math.min(100, (stats.sharpeRatio / 2) * 100)
                      )}
                      color={
                        stats.sharpeRatio > 1.5
                          ? "green"
                          : stats.sharpeRatio > 1
                            ? "yellow"
                            : stats.sharpeRatio > 0.5
                              ? "orange"
                              : "red"
                      }
                    />
                  </div>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={12}>
              <Card withBorder>
                <Title order={4} mb="md">
                  거래 통계
                </Title>
                <Grid>
                  <Grid.Col span={{ base: 6, md: 3 }}>
                    <Text size="xs" c="dimmed">
                      총 거래 수
                    </Text>
                    <Text size="lg" fw={700}>
                      {stats.totalTrades}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 6, md: 3 }}>
                    <Text size="xs" c="dimmed">
                      수익 거래 비율
                    </Text>
                    <Text size="lg" fw={700}>
                      {formatNumber(stats.winRate, 1)}%
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 6, md: 3 }}>
                    <Text size="xs" c="dimmed">
                      평균 거래 수익
                    </Text>
                    <Text
                      size="lg"
                      fw={700}
                      c={getPerformanceColor(stats.avgTradeReturn)}
                    >
                      ₩{formatNumber(stats.avgTradeReturn)}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 6, md: 3 }}>
                    <Text size="xs" c="dimmed">
                      수익 팩터
                    </Text>
                    <Text size="lg" fw={700}>
                      {formatNumber(stats.profitFactor, 2)}
                    </Text>
                  </Grid.Col>
                </Grid>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        {/* 거래 내역 */}
        <Tabs.Panel value="trades" pt="md">
          <Card withBorder>
            <Title order={4} mb="md">
              거래 내역
            </Title>
            {trades.length > 0 ? (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>날짜</Table.Th>
                    <Table.Th>구분</Table.Th>
                    <Table.Th>수량</Table.Th>
                    <Table.Th>가격</Table.Th>
                    <Table.Th>수수료</Table.Th>
                    <Table.Th>총액</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {trades
                    .slice(-20)
                    .reverse()
                    .map((trade) => (
                      <Table.Tr key={trade.id}>
                        <Table.Td>{trade.date}</Table.Td>
                        <Table.Td>
                          <Badge
                            color={trade.type === "buy" ? "blue" : "red"}
                            variant="light"
                          >
                            {trade.type === "buy" ? "매수" : "매도"}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{formatNumber(trade.quantity, 0)}주</Table.Td>
                        <Table.Td>₩{formatNumber(trade.price)}</Table.Td>
                        <Table.Td>₩{formatNumber(trade.commission)}</Table.Td>
                        <Table.Td>
                          <Text c={trade.type === "buy" ? "red" : "green"}>
                            ₩{formatNumber(trade.total)}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Alert
                icon={<IconInfoCircle size={16} />}
                color="blue"
                variant="light"
              >
                거래 내역이 없습니다. 설정한 조건에 맞는 거래가 발생하지
                않았습니다.
              </Alert>
            )}
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};
