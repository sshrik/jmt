import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Container,
  Title,
  Text,
  Group,
  Card,
  Alert,
  Stack,
  Tabs,
} from "@mantine/core";
import {
  IconTrendingUp,
  IconInfoCircle,
  IconChartLine,
  IconHistory,
} from "@tabler/icons-react";
import { BacktestRunner } from "../components/backtest/BacktestRunner";
import type { Strategy } from "../types/strategy";

export const Route = createFileRoute("/backtest")({
  component: BacktestPage,
});

function BacktestPage() {
  const [activeTab, setActiveTab] = useState<string>("runner");

  // 기본 전략 생성 (백테스트용)
  const defaultStrategy = useMemo((): Strategy => {
    return {
      id: "backtest-strategy",
      projectId: "standalone",
      versionId: "v1.0",
      name: "백테스트 전략",
      description: "독립적인 백테스트를 위한 기본 전략",
      blocks: [
        {
          id: "condition-1",
          type: "condition",
          name: "예시 조건",
          conditionType: "close_price_change",
          conditionParams: {
            priceChangePercent: 5,
            priceChangeDirection: "up",
          },
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "action-1",
          type: "action",
          name: "예시 액션",
          actionType: "buy_percent_cash",
          actionParams: {
            percentCash: 20,
          },
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      blockOrder: ["condition-1", "action-1"],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
  }, []);

  return (
    <Container size="xl">
      {/* 페이지 헤더 */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>백테스트</Title>
          <Text c="dimmed" size="lg" mt="xs">
            투자 전략의 과거 성과를 분석하고 검증해보세요
          </Text>
        </div>
      </Group>

      {/* 안내 사항 */}
      <Alert
        icon={<IconInfoCircle size={16} />}
        color="blue"
        variant="light"
        mb="xl"
      >
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            백테스트 사용 가이드
          </Text>
          <Text size="sm">
            • <strong>종목 선택:</strong> 12개의 주요 종목 중에서 선택하세요
            (한국 6개, 미국 6개)
          </Text>
          <Text size="sm">
            • <strong>기간 설정:</strong> 2023년부터 현재까지의 실제 데이터를
            사용할 수 있습니다
          </Text>
          <Text size="sm">
            • <strong>전략 수정:</strong> 아래에서 조건과 액션을 수정한 후
            백테스트를 실행하세요
          </Text>
          <Text size="sm">
            • <strong>결과 분석:</strong> 수익률, 샤프 비율, 최대 낙폭 등 다양한
            지표를 확인하세요
          </Text>
        </Stack>
      </Alert>

      {/* 탭 메뉴 */}
      <Tabs
        value={activeTab}
        onChange={(value) => setActiveTab(value || "runner")}
        mb="xl"
      >
        <Tabs.List>
          <Tabs.Tab value="runner" leftSection={<IconTrendingUp size={16} />}>
            백테스트 실행
          </Tabs.Tab>
          <Tabs.Tab value="strategy" leftSection={<IconChartLine size={16} />}>
            전략 설정
          </Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
            실행 기록
          </Tabs.Tab>
        </Tabs.List>

        {/* 백테스트 실행 탭 */}
        <Tabs.Panel value="runner" pt="lg">
          <BacktestRunner strategy={defaultStrategy} />
        </Tabs.Panel>

        {/* 전략 설정 탭 */}
        <Tabs.Panel value="strategy" pt="lg">
          <Card withBorder p="lg">
            <Title order={4} mb="md">
              전략 설정
            </Title>
            <Text c="dimmed" mb="lg">
              현재는 기본 전략을 사용합니다. 향후 업데이트에서 전략을 직접
              수정할 수 있게 됩니다.
            </Text>

            <Stack gap="md">
              <div>
                <Text size="sm" fw={500} c="dimmed" mb="xs">
                  현재 조건
                </Text>
                <Text>종가가 5% 이상 상승했을 때</Text>
              </div>

              <div>
                <Text size="sm" fw={500} c="dimmed" mb="xs">
                  현재 액션
                </Text>
                <Text>보유 현금의 20%를 매수</Text>
              </div>
            </Stack>
          </Card>
        </Tabs.Panel>

        {/* 실행 기록 탭 */}
        <Tabs.Panel value="history" pt="lg">
          <Card withBorder p="lg">
            <Title order={4} mb="md">
              백테스트 실행 기록
            </Title>
            <Text c="dimmed">
              백테스트 실행 기록 기능은 향후 업데이트에서 제공됩니다. 실행한
              백테스트들을 저장하고 비교할 수 있게 됩니다.
            </Text>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
