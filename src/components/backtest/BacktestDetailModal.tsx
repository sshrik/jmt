import { useState } from "react";
import {
  Modal,
  Stack,
  Card,
  Text,
  Group,
  Badge,
  SimpleGrid,
  Button,
  Table,
  ScrollArea,
  Alert,
  Tabs,
} from "@mantine/core";
import {
  IconChartLine,
  IconCalendar,
  IconCoin,
  IconRefresh,
  IconInfoCircle,
  IconChartArea,
  IconExternalLink,
} from "@tabler/icons-react";
import type { BacktestResult, Version } from "../../types/project";
import type { StockInfo } from "../../types/backtest";

interface BacktestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: BacktestResult;
  version: Version;
  stockInfo?: StockInfo; // 종목 정보
  onRetest?: (config: {
    symbol: string;
    startDate: string;
    endDate: string;
    initialCash: number;
    commission: number;
    slippage: number;
  }) => void;
}

export const BacktestDetailModal = ({
  isOpen,
  onClose,
  result,
  version,
  stockInfo,
  onRetest,
}: BacktestDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<string | null>("overview");

  // 백테스트 설정 추출 (실제 백테스트 결과에서 가져옴)
  const config = {
    symbol: result.config?.symbol || stockInfo?.symbol || "005930", // 백테스트 결과에서 종목 정보 가져오기
    startDate: result.backtestPeriod.startDate.toISOString().split("T")[0],
    endDate: result.backtestPeriod.endDate.toISOString().split("T")[0],
    initialCash: result.initialCash,
    commission: result.config?.commission || 0.001,
    slippage: result.config?.slippage || 0.001,
  };

  const handleRetest = () => {
    if (onRetest) {
      onRetest(config);
      onClose();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  // 거래 기간 계산
  const tradingDays = Math.floor(
    (result.backtestPeriod.endDate.getTime() -
      result.backtestPeriod.startDate.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Group gap="sm">
          <IconChartArea size={20} />
          <Text fw={600}>백테스트 상세 결과</Text>
          <Badge variant="light" color="blue">
            {version.versionName}
          </Badge>
        </Group>
      }
      size="xl"
      centered
    >
      <Stack gap="lg">
        {/* 기본 정보 */}
        <Card withBorder p="md">
          <Group gap="sm" mb="md">
            <IconInfoCircle size={16} />
            <Text fw={500}>테스트 정보</Text>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <div>
              <Text size="sm" c="dimmed" mb="xs">
                종목
              </Text>
              <Group gap="xs" mb="md">
                <Text fw={500}>{stockInfo?.name || config.symbol}</Text>
                <Badge variant="light" size="xs">
                  {config.symbol}
                </Badge>
                {stockInfo?.market && (
                  <Badge variant="outline" size="xs" color="gray">
                    {stockInfo.market}
                  </Badge>
                )}
              </Group>

              <Text size="sm" c="dimmed" mb="xs">
                테스트 기간
              </Text>
              <Group gap="xs" mb="md">
                <IconCalendar size={16} color="gray" />
                <Text size="sm">
                  {formatDate(result.backtestPeriod.startDate)} ~{" "}
                  {formatDate(result.backtestPeriod.endDate)}
                </Text>
                <Badge variant="light" size="xs" color="gray">
                  {tradingDays}일
                </Badge>
              </Group>
            </div>

            <div>
              <Text size="sm" c="dimmed" mb="xs">
                초기 투자금
              </Text>
              <Group gap="xs" mb="md">
                <IconCoin size={16} color="gray" />
                <Text fw={500} size="sm">
                  {formatCurrency(result.initialCash)}
                </Text>
              </Group>

              <Text size="sm" c="dimmed" mb="xs">
                거래 조건
              </Text>
              <Group gap="xs">
                <Text size="xs" c="dimmed">
                  수수료: {(config.commission * 100).toFixed(2)}%
                </Text>
                <Text size="xs" c="dimmed">
                  슬리피지: {(config.slippage * 100).toFixed(2)}%
                </Text>
              </Group>
            </div>
          </SimpleGrid>
        </Card>

        {/* 결과 요약 */}
        <Card withBorder p="md">
          <Group gap="sm" mb="md">
            <IconChartLine size={16} />
            <Text fw={500}>성과 요약</Text>
          </Group>

          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <div style={{ textAlign: "center" }}>
              <Text
                size="xl"
                fw={700}
                c={result.totalReturn > 0 ? "green" : "red"}
              >
                {formatPercentage(result.totalReturn)}
              </Text>
              <Text size="xs" c="dimmed">
                총 수익률
              </Text>
            </div>

            <div style={{ textAlign: "center" }}>
              <Text size="xl" fw={700} c="red">
                {formatPercentage(result.maxDrawdown)}
              </Text>
              <Text size="xs" c="dimmed">
                최대 낙폭
              </Text>
            </div>

            <div style={{ textAlign: "center" }}>
              <Text size="xl" fw={700}>
                {result.tradeCount}
              </Text>
              <Text size="xs" c="dimmed">
                총 거래 횟수
              </Text>
            </div>

            <div style={{ textAlign: "center" }}>
              <Text
                size="xl"
                fw={700}
                c={result.winRate >= 50 ? "green" : "orange"}
              >
                {result.winRate.toFixed(1)}%
              </Text>
              <Text size="xs" c="dimmed">
                승률
              </Text>
            </div>
          </SimpleGrid>
        </Card>

        {/* 상세 정보 탭 */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab
              value="overview"
              leftSection={<IconChartLine size={14} />}
            >
              개요
            </Tabs.Tab>
            <Tabs.Tab
              value="trades"
              leftSection={<IconExternalLink size={14} />}
            >
              거래 내역
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <Stack gap="md">
              {/* 포트폴리오 정보 */}
              <Alert
                variant="light"
                color="blue"
                icon={<IconInfoCircle size={16} />}
              >
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500} mb="xs">
                      백테스트 실행일
                    </Text>
                    <Text size="sm" c="dimmed">
                      {formatDate(result.executedAt)}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" fw={500} mb="xs">
                      전략 버전
                    </Text>
                    <Text size="sm" c="dimmed">
                      {version.versionName} -{" "}
                      {version.description || "설명 없음"}
                    </Text>
                  </div>
                </Group>
              </Alert>

              {/* 추가 통계 (포트폴리오 히스토리가 있을 경우) */}
              {result.portfolioHistory &&
                result.portfolioHistory.length > 0 && (
                  <Card withBorder p="md">
                    <Text fw={500} mb="md">
                      포트폴리오 변화
                    </Text>
                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                      <div>
                        <Text size="sm" c="dimmed" mb="xs">
                          시작 가치
                        </Text>
                        <Text fw={500}>
                          {formatCurrency(
                            result.portfolioHistory[0]?.totalValue ||
                              result.initialCash
                          )}
                        </Text>
                      </div>
                      <div>
                        <Text size="sm" c="dimmed" mb="xs">
                          종료 가치
                        </Text>
                        <Text fw={500}>
                          {formatCurrency(
                            result.portfolioHistory[
                              result.portfolioHistory.length - 1
                            ]?.totalValue || result.initialCash
                          )}
                        </Text>
                      </div>
                      <div>
                        <Text size="sm" c="dimmed" mb="xs">
                          순이익
                        </Text>
                        <Text
                          fw={500}
                          c={result.totalReturn > 0 ? "green" : "red"}
                        >
                          {formatCurrency(
                            (result.portfolioHistory[
                              result.portfolioHistory.length - 1
                            ]?.totalValue || result.initialCash) -
                              result.initialCash
                          )}
                        </Text>
                      </div>
                    </SimpleGrid>
                  </Card>
                )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="trades" pt="md">
            {result.transactions && result.transactions.length > 0 ? (
              <ScrollArea h={300}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>날짜</Table.Th>
                      <Table.Th>구분</Table.Th>
                      <Table.Th>가격</Table.Th>
                      <Table.Th>수량</Table.Th>
                      <Table.Th>금액</Table.Th>
                      <Table.Th>수수료</Table.Th>
                      <Table.Th>사유</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {result.transactions.map((transaction) => (
                      <Table.Tr key={transaction.id}>
                        <Table.Td>
                          <Text size="sm">
                            {new Date(transaction.date).toLocaleDateString(
                              "ko-KR"
                            )}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={transaction.type === "buy" ? "blue" : "red"}
                            variant="light"
                            size="sm"
                          >
                            {transaction.type === "buy" ? "매수" : "매도"}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {formatCurrency(transaction.price)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {transaction.quantity.toLocaleString()}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {formatCurrency(transaction.amount)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {formatCurrency(transaction.fee)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            {transaction.reason || "-"}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            ) : (
              <Alert variant="light" icon={<IconInfoCircle size={16} />}>
                거래 내역이 없습니다.
              </Alert>
            )}
          </Tabs.Panel>
        </Tabs>

        {/* 액션 버튼 */}
        <Group justify="flex-end" pt="md">
          <Button variant="light" onClick={onClose}>
            닫기
          </Button>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={handleRetest}
            disabled={!onRetest}
          >
            동일 조건으로 다시 테스트
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
