import { useMemo } from "react";
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
} from "@mantine/core";
import { IconArrowLeft, IconChartLine, IconEdit } from "@tabler/icons-react";
import { useProjectStore } from "../../hooks/useProjectStore";
import { ProjectStore } from "../../stores/projectStore";
import { StrategyEditor } from "../../components/strategy/StrategyEditor";
import type { Strategy } from "../../types/strategy";

export const Route = createFileRoute("/projects/$projectId/")({
  component: ProjectDetail,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const { loading, error } = useProjectStore();

  // 현재 프로젝트 찾기
  const project = useMemo(() => {
    try {
      return ProjectStore.getProjectById(projectId);
    } catch {
      return null;
    }
  }, [projectId]);

  // 기본 전략 생성 (읽기 전용)
  const strategy = useMemo((): Strategy => {
    if (!project) {
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

    console.log("🔍 상세 페이지 프로젝트 데이터:", {
      projectId: project.id,
      versionsCount: project.versions.length,
      firstVersionStrategy: project.versions[0]?.strategy?.length || 0,
    });

    // 기존 블록 타입 마이그레이션
    const rawBlocks = project.versions[0]?.strategy || [];
    console.log("📦 로드된 블록들:", rawBlocks);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const migratedBlocks = rawBlocks.map((block: any) => {
      // 기존 price_change_percent를 close_price_change로 마이그레이션
      if (block.conditionType === "price_change_percent") {
        console.log("🔄 상세 페이지 마이그레이션:", block.id);
        return {
          ...block,
          conditionType: "close_price_change",
        };
      }
      return block;
    });

    console.log("✅ 마이그레이션된 블록들:", migratedBlocks);

    return {
      id: `strategy-${project.id}`,
      projectId: project.id,
      versionId: project.versions[0]?.versionName || "v1.0",
      name: `${project.name} 전략`,
      description: project.description,
      blocks: migratedBlocks, // 마이그레이션된 전략 데이터
      blockOrder: [],
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      isActive: true,
    };
  }, [project, projectId]);

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
              data={project.versions.map((version, index) => ({
                value: version.versionName,
                label: `${version.versionName}${index === 0 ? " (최신)" : ""}`,
              }))}
              value={project.versions[0]?.versionName || "v1.0"}
              disabled // TODO: 버전 선택 기능 구현 시 제거
            />
          </div>
          {project.versions[0]?.backtestResults?.totalReturn !== undefined && (
            <div>
              <Text size="sm" c="dimmed">
                수익률
              </Text>
              <Text
                fw={500}
                c={
                  project.versions[0].backtestResults.totalReturn > 0
                    ? "green"
                    : "red"
                }
              >
                {project.versions[0].backtestResults.totalReturn > 0 ? "+" : ""}
                {project.versions[0].backtestResults.totalReturn.toFixed(1)}%
              </Text>
            </div>
          )}
        </Group>
      </Card>

      {/* 투자 전략 (읽기 전용) */}
      {/* 투자 전략 (읽기 전용) */}
      <div>
        <Text size="sm" c="dimmed" mb="sm">
          현재 전략 블록 수: {strategy.blocks.length}개
        </Text>
        <StrategyEditor
          strategy={strategy}
          onStrategyUpdate={() => {}} // 읽기 전용이므로 빈 함수
          readOnly={true}
        />
      </div>
    </Container>
  );
}
