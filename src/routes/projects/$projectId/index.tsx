import { useMemo, useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  ActionIcon,
  Tooltip,
  LoadingOverlay,
  Card,
  Breadcrumbs,
  Anchor,
  Select,
  Alert,
  Tabs,
  Stack,
  Badge,
  SimpleGrid,
  Paper,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconChartLine,
  IconEdit,
  IconTrendingUp,
  IconEye,
  IconHistory,
  IconChartArea,
} from "@tabler/icons-react";
import { useProjectStore } from "../../../hooks/useProjectStore";
import { ProjectStore } from "../../../stores/projectStore";

import { StrategyEditor } from "../../../components/strategy/StrategyEditor";
import { BacktestRunner } from "../../../components/backtest/BacktestRunner";
import { VersionList } from "../../../components/version/VersionList";
import { BacktestDetailModal } from "../../../components/backtest/BacktestDetailModal";
import type { Strategy } from "../../../types/strategy";
import type { Version, BacktestResult } from "../../../types/project";
import type { StockInfo } from "../../../types/backtest";
import { notifications } from "@mantine/notifications";

export const Route = createFileRoute("/projects/$projectId/")({
  component: ProjectDetail,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { loading, error } = useProjectStore();
  const [activeTab, setActiveTab] = useState("strategy");
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  );
  const [shouldAutoStartBacktest, setShouldAutoStartBacktest] = useState(false);

  // 백테스트 상세 모달 상태
  const [selectedBacktest, setSelectedBacktest] = useState<{
    result: BacktestResult;
    version: Version;
  } | null>(null);

  // 버전 관리 핸들러들 (읽기 전용)
  const handleVersionSelect = (version: Version) => {
    notifications.show({
      title: "버전 선택",
      message: `${version.versionName} 버전을 확인 중입니다.`,
      color: "blue",
    });
    // TODO: 버전 선택 시 해당 버전의 전략을 표시하도록 구현
  };

  const handleVersionRevert = (_version: Version) => {
    notifications.show({
      title: "되돌리기 불가",
      message:
        "상세 페이지에서는 버전을 되돌릴 수 없습니다. 편집 페이지를 이용해주세요.",
      color: "orange",
    });
  };

  // 백테스트 상세 모달 핸들러
  const handleBacktestClick = (version: Version) => {
    if (version.backtestResults) {
      setSelectedBacktest({
        result: version.backtestResults,
        version: version,
      });
    }
  };

  const handleBacktestModalClose = () => {
    setSelectedBacktest(null);
  };

  // 다시 테스트하기 핸들러
  const [retestConfig, setRetestConfig] = useState<{
    symbol: string;
    startDate: string;
    endDate: string;
    initialCash: number;
    commission: number;
    slippage: number;
  } | null>(null);

  const handleRetest = (config: {
    symbol: string;
    startDate: string;
    endDate: string;
    initialCash: number;
    commission: number;
    slippage: number;
  }) => {
    // 백테스트 탭으로 이동하고 설정 자동 적용
    setActiveTab("backtest");
    setRetestConfig(config);
    // 모달 닫기
    setSelectedBacktest(null);
  };

  // 현재 종목 정보 (임시로 삼성전자 정보 사용)
  const stockInfo: StockInfo = {
    symbol: "005930",
    name: "삼성전자",
    market: "KOSPI",
    currency: "KRW",
  };

  const handleVersionDuplicate = (_version: Version) => {
    notifications.show({
      title: "복제 불가",
      message:
        "상세 페이지에서는 버전을 복제할 수 없습니다. 편집 페이지를 이용해주세요.",
      color: "orange",
    });
  };

  const handleVersionDelete = (_version: Version) => {
    notifications.show({
      title: "삭제 불가",
      message:
        "상세 페이지에서는 버전을 삭제할 수 없습니다. 편집 페이지를 이용해주세요.",
      color: "orange",
    });
  };

  // 현재 프로젝트 찾기
  const project = useMemo(() => {
    try {
      return ProjectStore.getProjectById(projectId);
    } catch {
      return null;
    }
  }, [projectId]);

  // 프로젝트 로드 시 기본 버전 설정 (백테스트한 버전 우선, 없으면 최신 버전)
  useEffect(() => {
    if (
      project &&
      project.versions &&
      project.versions.length > 0 &&
      !selectedVersionId
    ) {
      // 백테스트 결과가 있는 버전들을 최신순으로 정렬
      const versionsWithBacktest = project.versions
        .filter((v) => v.backtestResults)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      // 백테스트한 버전이 있으면 가장 최근 백테스트한 버전을 선택
      if (versionsWithBacktest.length > 0) {
        setSelectedVersionId(versionsWithBacktest[0].id);
      } else {
        // 백테스트한 버전이 없으면 가장 최신 버전 선택
        const latestVersion = [...project.versions].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        setSelectedVersionId(latestVersion.id);
      }
    }
  }, [project, selectedVersionId, setSelectedVersionId]);

  // 자동 백테스트 처리
  useEffect(() => {
    if (
      search &&
      typeof search === "object" &&
      "autoBacktest" in search &&
      "versionId" in search &&
      search.autoBacktest === "true" &&
      search.versionId &&
      project?.versions
    ) {
      const targetVersion = project.versions.find(
        (v) => v.id === search.versionId
      );
      if (targetVersion) {
        // 해당 버전 선택
        setSelectedVersionId(targetVersion.id);
        // 백테스트 탭으로 이동
        setActiveTab("backtest");
        // 자동 백테스트 시작 플래그 설정
        setShouldAutoStartBacktest(true);

        // URL에서 search params 제거 (한 번만 실행되도록)
        navigate({
          to: `/projects/${projectId}/`,
          replace: true,
        });

        notifications.show({
          title: "자동 백테스트 시작",
          message: `${targetVersion.versionName} 버전의 백테스트를 시작합니다.`,
          color: "blue",
        });
      }
    }
  }, [
    search,
    project,
    navigate,
    projectId,
    setSelectedVersionId,
    setActiveTab,
  ]);

  // 자동 백테스트 플래그 리셋
  useEffect(() => {
    if (shouldAutoStartBacktest) {
      // 다음 렌더링에서 자동 시작 플래그를 리셋
      const timer = setTimeout(() => {
        setShouldAutoStartBacktest(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [shouldAutoStartBacktest]);

  // 선택된 버전 찾기
  const selectedVersion = useMemo(() => {
    if (!project || !selectedVersionId) return null;
    return (
      project.versions?.find((v) => v.id === selectedVersionId) ||
      project.versions?.[0] ||
      null
    );
  }, [project, selectedVersionId]);

  // 선택된 버전의 전략 생성 (읽기 전용)
  const strategy = useMemo((): Strategy => {
    if (!project || !selectedVersion) {
      return {
        id: "temp-strategy",
        projectId: projectId,
        versionId: "v1.0",
        name: "기본 전략",
        description: "이 프로젝트의 투자 전략입니다.",
        blocks: [],
        blockOrder: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };
    }

    // 선택된 버전의 전략 사용
    if (
      selectedVersion.strategy &&
      typeof selectedVersion.strategy === "object" &&
      "blocks" in selectedVersion.strategy
    ) {
      // 새로운 Strategy 구조
      return selectedVersion.strategy as Strategy;
    }

    // 기존 블록 배열 구조 (레거시 지원)
    const rawBlocks = Array.isArray(selectedVersion.strategy)
      ? selectedVersion.strategy
      : [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const migratedBlocks = rawBlocks.map((block: any) => {
      // 기존 price_change_percent를 close_price_change로 마이그레이션
      if (block.conditionType === "price_change_percent") {
        return {
          ...block,
          conditionType: "close_price_change",
        };
      }
      return block;
    });

    // blockOrder가 없으면 blocks의 id로 자동 생성
    const blockOrder = migratedBlocks.map((block) => block.id);

    return {
      id: `strategy-${project.id}-${selectedVersion.id}`,
      projectId: project.id,
      versionId: selectedVersion.versionName || "v1.0",
      name: `${project.name} 전략 (${selectedVersion.versionName})`,
      description: selectedVersion.description || project.description,
      blocks: migratedBlocks, // 마이그레이션된 전략 데이터
      blockOrder: blockOrder, // 블록 ID 순서대로 자동 생성
      createdAt: selectedVersion.createdAt,
      updatedAt: selectedVersion.createdAt,
      isActive: true,
    };
  }, [project, projectId, selectedVersion]);

  // 로딩 상태
  if (loading) {
    return (
      <Container size="xl" style={{ position: "relative", minHeight: "400px" }}>
        <LoadingOverlay visible />
      </Container>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <Container size="xl">
        <Alert color="red" title="오류 발생">
          {error}
        </Alert>
      </Container>
    );
  }

  // 프로젝트를 찾을 수 없는 경우
  if (!project) {
    return (
      <Container size="xl">
        <Card padding="xl" withBorder style={{ textAlign: "center" }}>
          <IconChartLine
            size={48}
            style={{ margin: "0 auto", marginBottom: 16 }}
          />
          <Title order={3} mb="xs">
            프로젝트를 찾을 수 없습니다
          </Title>
          <Text c="dimmed" mb="lg">
            요청하신 프로젝트가 존재하지 않거나 삭제되었을 수 있습니다.
          </Text>
          <Button onClick={() => navigate({ to: "/" })}>
            프로젝트 목록으로 돌아가기
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="xl">
      {/* 네비게이션 */}
      <Group mb="lg">
        <Tooltip label="프로젝트 목록으로">
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={() => navigate({ to: "/" })}
          >
            <IconArrowLeft size={20} />
          </ActionIcon>
        </Tooltip>

        <Breadcrumbs>
          <Anchor onClick={() => navigate({ to: "/" })}>프로젝트 목록</Anchor>
          <Text>{project.name}</Text>
        </Breadcrumbs>
      </Group>

      {/* 프로젝트 헤더 */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>{project.name}</Title>
          <Text c="dimmed" size="lg" mt="xs">
            {project.description} • 최근 수정:{" "}
            {project.updatedAt.toLocaleDateString("ko-KR")}
          </Text>
        </div>

        <Button
          leftSection={<IconEdit size={16} />}
          onClick={() => {
            navigate({ to: `/projects/${projectId}/edit` });
          }}
        >
          수정하기
        </Button>
      </Group>

      {/* 버전 선택 및 수익률 */}
      <Card withBorder mb="xl" p="md">
        <Group justify="space-between">
          <div>
            <Text size="sm" c="dimmed" mb="xs">
              버전 선택
            </Text>
            <Select
              placeholder="버전을 선택하세요"
              data={
                project.versions
                  ?.sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .map((version, index) => ({
                    value: version.id,
                    label: `${version.versionName}${index === 0 ? " (최신)" : ""} - ${version.description || "설명 없음"}`,
                  })) || []
              }
              value={selectedVersionId}
              onChange={(value) => setSelectedVersionId(value)}
              searchable
              maxDropdownHeight={200}
            />
          </div>
          {selectedVersion?.backtestResults?.totalReturn !== undefined && (
            <div>
              <Text size="sm" c="dimmed">
                {selectedVersion.versionName} 수익률
              </Text>
              <Text
                fw={500}
                c={
                  selectedVersion.backtestResults.totalReturn > 0
                    ? "green"
                    : "red"
                }
              >
                {selectedVersion.backtestResults.totalReturn > 0 ? "+" : ""}
                {selectedVersion.backtestResults.totalReturn.toFixed(1)}%
              </Text>
            </div>
          )}
        </Group>
      </Card>

      {/* 투자 전략 (읽기 전용) */}
      <Tabs
        value={activeTab}
        onChange={(value) => setActiveTab(value || "strategy")}
        mb="xl"
      >
        <Tabs.List>
          <Tabs.Tab value="strategy" leftSection={<IconChartLine size={16} />}>
            투자 전략
          </Tabs.Tab>
          <Tabs.Tab value="backtest" leftSection={<IconTrendingUp size={16} />}>
            백테스트
          </Tabs.Tab>
          <Tabs.Tab value="overview" leftSection={<IconEye size={16} />}>
            개요
          </Tabs.Tab>
          <Tabs.Tab value="versions" leftSection={<IconHistory size={16} />}>
            버전 히스토리
          </Tabs.Tab>
          <Tabs.Tab
            value="backtest-history"
            leftSection={<IconChartArea size={16} />}
          >
            백테스트 이력
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="strategy" pt="lg">
          <Text size="sm" c="dimmed" mb="sm">
            현재 전략 블록 수: {strategy.blocks.length}개 (조건:{" "}
            {strategy.blocks.filter((b) => b.type === "condition").length}개,
            액션: {strategy.blocks.filter((b) => b.type === "action").length}개)
          </Text>
          <StrategyEditor
            strategy={strategy}
            onStrategyUpdate={() => {}} // 읽기 전용이므로 빈 함수
            readOnly={true}
          />
        </Tabs.Panel>

        <Tabs.Panel value="backtest" pt="lg">
          <BacktestRunner
            strategy={strategy}
            projectId={projectId}
            versionId={selectedVersionId || undefined}
            autoStart={shouldAutoStartBacktest}
            initialConfig={retestConfig || undefined}
          />
        </Tabs.Panel>

        <Tabs.Panel value="overview" pt="lg">
          <Stack gap="xl">
            {/* 프로젝트 기본 정보 */}
            <Card withBorder p="lg">
              <Group justify="space-between" mb="md">
                <Title order={4}>프로젝트 정보</Title>
                <Badge variant="light" color="blue">
                  {project.versions?.length || 0}개 버전
                </Badge>
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <div>
                  <Text size="sm" c="dimmed" mb="xs">
                    프로젝트 이름
                  </Text>
                  <Text fw={500} mb="md">
                    {project.name}
                  </Text>

                  <Text size="sm" c="dimmed" mb="xs">
                    설명
                  </Text>
                  <Text mb="md">
                    {project.description || "설명이 없습니다."}
                  </Text>
                </div>

                <div>
                  <Text size="sm" c="dimmed" mb="xs">
                    생성일
                  </Text>
                  <Text fw={500} mb="md">
                    {project.createdAt.toLocaleDateString("ko-KR")}
                  </Text>

                  <Text size="sm" c="dimmed" mb="xs">
                    최근 수정
                  </Text>
                  <Text fw={500}>
                    {project.updatedAt.toLocaleDateString("ko-KR")}
                  </Text>
                </div>
              </SimpleGrid>
            </Card>

            {/* 성과 요약 */}
            <Card withBorder p="lg">
              <Title order={4} mb="md">
                성과 요약
              </Title>
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                {(() => {
                  const versionsWithBacktest =
                    project.versions?.filter((v) => v.backtestResults) || [];
                  const returns = versionsWithBacktest.map(
                    (v) => v.backtestResults!.totalReturn
                  );
                  const maxReturn =
                    returns.length > 0 ? Math.max(...returns) : null;
                  const avgReturn =
                    returns.length > 0
                      ? returns.reduce((a, b) => a + b, 0) / returns.length
                      : null;

                  return (
                    <>
                      <Card withBorder p="md" style={{ textAlign: "center" }}>
                        <Text size="xs" c="dimmed" mb="xs">
                          최고 수익률
                        </Text>
                        <Text
                          size="xl"
                          fw={700}
                          c={
                            maxReturn !== null
                              ? maxReturn > 0
                                ? "green"
                                : "red"
                              : "gray"
                          }
                        >
                          {maxReturn !== null
                            ? `${maxReturn > 0 ? "+" : ""}${maxReturn.toFixed(1)}%`
                            : "미측정"}
                        </Text>
                      </Card>

                      <Card withBorder p="md" style={{ textAlign: "center" }}>
                        <Text size="xs" c="dimmed" mb="xs">
                          평균 수익률
                        </Text>
                        <Text
                          size="xl"
                          fw={700}
                          c={
                            avgReturn !== null
                              ? avgReturn > 0
                                ? "green"
                                : "red"
                              : "gray"
                          }
                        >
                          {avgReturn !== null
                            ? `${avgReturn > 0 ? "+" : ""}${avgReturn.toFixed(1)}%`
                            : "미측정"}
                        </Text>
                      </Card>

                      <Card withBorder p="md" style={{ textAlign: "center" }}>
                        <Text size="xs" c="dimmed" mb="xs">
                          백테스트 수행
                        </Text>
                        <Text size="xl" fw={700} c="blue">
                          {versionsWithBacktest.length}회
                        </Text>
                      </Card>
                    </>
                  );
                })()}
              </SimpleGrid>
            </Card>

            {/* 전략 구성 */}
            <Card withBorder p="lg">
              <Title order={4} mb="md">
                전략 구성
              </Title>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                <div>
                  <Text size="sm" c="dimmed" mb="sm">
                    현재 버전 ({selectedVersion?.versionName || "v1.0"})
                  </Text>
                  {(() => {
                    const conditionBlocks = strategy.blocks.filter(
                      (b) => b.type === "condition"
                    ).length;
                    const actionBlocks = strategy.blocks.filter(
                      (b) => b.type === "action"
                    ).length;
                    const totalBlocks = strategy.blocks.length;

                    return (
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text size="sm">총 블록 수</Text>
                          <Badge variant="light">{totalBlocks}개</Badge>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm">조건 블록</Text>
                          <Badge variant="light" color="blue">
                            {conditionBlocks}개
                          </Badge>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm">액션 블록</Text>
                          <Badge variant="light" color="green">
                            {actionBlocks}개
                          </Badge>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm">복잡도</Text>
                          <Badge
                            variant="light"
                            color={
                              totalBlocks <= 4
                                ? "green"
                                : totalBlocks <= 8
                                  ? "yellow"
                                  : "red"
                            }
                          >
                            {totalBlocks <= 4
                              ? "단순"
                              : totalBlocks <= 8
                                ? "보통"
                                : "복잡"}
                          </Badge>
                        </Group>
                      </Stack>
                    );
                  })()}
                </div>

                <div>
                  <Text size="sm" c="dimmed" mb="sm">
                    버전 관리 현황
                  </Text>
                  {(() => {
                    const totalVersions = project.versions?.length || 0;
                    const versionsWithBacktest =
                      project.versions?.filter((v) => v.backtestResults)
                        .length || 0;

                    return (
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text size="sm">총 버전</Text>
                          <Badge variant="light">{totalVersions}개</Badge>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm">백테스트 완료</Text>
                          <Badge variant="light" color="green">
                            {versionsWithBacktest}개
                          </Badge>
                        </Group>
                      </Stack>
                    );
                  })()}
                </div>
              </SimpleGrid>
            </Card>

            {/* 최근 활동 */}
            <Card withBorder p="lg">
              <Title order={4} mb="md">
                최근 활동
              </Title>
              {(() => {
                const recentVersions = [...(project.versions || [])]
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .slice(0, 5);

                if (recentVersions.length === 0) {
                  return (
                    <Text c="dimmed" style={{ textAlign: "center" }}>
                      아직 버전이 생성되지 않았습니다.
                    </Text>
                  );
                }

                return (
                  <Stack gap="md">
                    {recentVersions.map((version) => (
                      <Paper
                        key={version.id}
                        p="sm"
                        withBorder
                        className="version-card-recent-activity"
                      >
                        <Group justify="space-between">
                          <div>
                            <Group gap="xs" mb="xs">
                              <Text fw={500} size="sm">
                                {version.versionName}
                              </Text>

                              {version.backtestResults && (
                                <Badge size="xs" color="green" variant="light">
                                  백테스트
                                </Badge>
                              )}
                            </Group>
                            <Text size="xs" c="dimmed">
                              {version.description || "설명 없음"}
                            </Text>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <Text size="xs" c="dimmed">
                              {new Date(version.createdAt).toLocaleDateString(
                                "ko-KR"
                              )}
                            </Text>
                            {version.backtestResults && (
                              <Text
                                size="sm"
                                fw={500}
                                c={
                                  version.backtestResults.totalReturn > 0
                                    ? "green"
                                    : "red"
                                }
                              >
                                {version.backtestResults.totalReturn > 0
                                  ? "+"
                                  : ""}
                                {version.backtestResults.totalReturn.toFixed(1)}
                                %
                              </Text>
                            )}
                          </div>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                );
              })()}
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="versions" pt="lg">
          {project && (
            <VersionList
              project={project}
              currentVersionId={selectedVersionId || undefined}
              onVersionSelect={handleVersionSelect}
              onVersionRevert={handleVersionRevert}
              onVersionDuplicate={handleVersionDuplicate}
              onVersionDelete={handleVersionDelete}
              showActions={false}
              allowVersionSelection={false}
            />
          )}
        </Tabs.Panel>

        <Tabs.Panel value="backtest-history" pt="lg">
          {project && project.versions && (
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Title order={3}>백테스트 이력</Title>
                <Text size="sm" c="dimmed">
                  총 {project.versions.filter((v) => v.backtestResults).length}
                  건의 백테스트 결과
                </Text>
              </Group>

              {(() => {
                const versionsWithBacktest = project.versions.filter(
                  (version) => version.backtestResults
                );
                console.log("프로젝트 전체 버전:", project.versions);
                console.log("백테스트 결과가 있는 버전:", versionsWithBacktest);

                return versionsWithBacktest.sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                );
              })().map((version, index) => (
                <Paper
                  key={version.id}
                  withBorder
                  p="md"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleBacktestClick(version)}
                >
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Group gap="xs" mb="xs">
                        <Text fw={500} size="sm">
                          {version.versionName}
                        </Text>
                        {index === 0 && (
                          <Badge size="xs" color="blue">
                            최신
                          </Badge>
                        )}
                      </Group>

                      <Text size="xs" c="dimmed" mb="sm">
                        {version.description || "설명 없음"}
                      </Text>

                      <Text size="xs" c="dimmed">
                        실행일:{" "}
                        {new Date(version.createdAt).toLocaleString("ko-KR")}
                      </Text>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <Text
                        size="lg"
                        fw={600}
                        c={
                          version.backtestResults!.totalReturn > 0
                            ? "green"
                            : "red"
                        }
                      >
                        {version.backtestResults!.totalReturn > 0 ? "+" : ""}
                        {version.backtestResults!.totalReturn.toFixed(2)}%
                      </Text>

                      {"stats" in version.backtestResults! &&
                        (
                          version.backtestResults as {
                            stats: {
                              totalTrades?: number;
                              maxDrawdown?: number;
                            };
                          }
                        ).stats && (
                          <>
                            <Text size="xs" c="dimmed">
                              거래 횟수:{" "}
                              {(
                                version.backtestResults as {
                                  stats: { totalTrades?: number };
                                }
                              ).stats.totalTrades || 0}
                              회
                            </Text>
                            <Text size="xs" c="dimmed">
                              최대 손실:{" "}
                              {(
                                version.backtestResults as {
                                  stats: { maxDrawdown?: number };
                                }
                              ).stats.maxDrawdown?.toFixed(2) || "0.00"}
                              %
                            </Text>
                          </>
                        )}
                    </div>
                  </Group>
                </Paper>
              ))}

              {project.versions.filter((v) => v.backtestResults).length ===
                0 && (
                <Card withBorder p="xl" style={{ textAlign: "center" }}>
                  <IconChartArea
                    size={48}
                    style={{ margin: "0 auto 16px", opacity: 0.3 }}
                  />
                  <Title order={4} c="dimmed" mb="xs">
                    백테스트 이력이 없습니다
                  </Title>
                  <Text size="sm" c="dimmed">
                    전략을 설정하고 백테스트를 실행해보세요.
                  </Text>
                </Card>
              )}
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* 백테스트 상세 모달 */}
      {selectedBacktest && (
        <BacktestDetailModal
          isOpen={true}
          onClose={handleBacktestModalClose}
          result={selectedBacktest.result}
          version={selectedBacktest.version}
          stockInfo={stockInfo}
          onRetest={handleRetest}
        />
      )}
    </Container>
  );
}
