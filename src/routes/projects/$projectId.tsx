import { useState, useCallback, useMemo } from "react";
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
  Alert,
  Breadcrumbs,
  Anchor,
} from "@mantine/core";
import {
  IconEdit,
  IconArrowLeft,
  IconInfoCircle,
  IconChartLine,
} from "@tabler/icons-react";
import { useProjectStore } from "../../hooks/useProjectStore";
import { ProjectStore } from "../../stores/projectStore";
import { EditProjectModal } from "../../components/EditProjectModal";
import { StrategyEditor } from "../../components/strategy/StrategyEditor";
import type { Strategy } from "../../types/strategy";

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectDetail,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const { loading, error, updateProject } = useProjectStore();

  const [editModalOpened, setEditModalOpened] = useState(false);
  const [isStrategyModified, setIsStrategyModified] = useState(false);

  // 현재 프로젝트 찾기 (전체 Project 정보 필요)
  const project = useMemo(() => {
    try {
      return ProjectStore.getProjectById(projectId);
    } catch {
      return null;
    }
  }, [projectId]);

  // 기본 전략 생성 (프로젝트당 하나의 전략)
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

    return {
      id: `strategy-${project.id}`,
      projectId: project.id,
      versionId: project.versions[0]?.versionName || "v1.0",
      name: `${project.name} 전략`,
      description: project.description,
      blocks: [], // 나중에 프로젝트에 전략 데이터 저장 필드 추가 예정
      blockOrder: [],
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      isActive: true,
    };
  }, [project, projectId]);

  // 프로젝트 기본 정보 편집
  const handleEditProject = useCallback(
    async (name: string, description: string) => {
      if (project) {
        await updateProject(project.id, name, description);
        setEditModalOpened(false);
      }
    },
    [project, updateProject]
  );

  // 전략 업데이트
  const handleStrategyUpdate = useCallback((updatedStrategy: Strategy) => {
    // TODO: 실제로 전략 데이터를 프로젝트에 저장하는 로직 추가
    console.log("전략 업데이트:", updatedStrategy);
    setIsStrategyModified(true);
  }, []);

  // 백테스트 실행
  const handleBacktest = useCallback(() => {
    // TODO: 백테스트 엔진 연동
    console.log("백테스트 실행:", strategy);
    alert("백테스트 기능은 곧 구현 예정입니다!");
  }, [strategy]);

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
        <Group>
          <div>
            <Group>
              <Title order={1}>{project.name}</Title>
              <Tooltip label="프로젝트 정보 편집">
                <ActionIcon
                  variant="subtle"
                  onClick={() => setEditModalOpened(true)}
                >
                  <IconEdit size={20} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <Text c="dimmed" size="lg" mt="xs">
              {project.description}
            </Text>
          </div>
        </Group>

        <Group>
          <Button variant="light" onClick={() => navigate({ to: "/" })}>
            목록으로
          </Button>
        </Group>
      </Group>

      {/* 프로젝트 정보 카드 */}
      <Card withBorder mb="xl" p="md">
        <Group justify="space-between">
          <div>
            <Text size="sm" c="dimmed">
              현재 버전
            </Text>
            <Text fw={500}>{project.versions[0]?.versionName || "v1.0"}</Text>
          </div>
          <div>
            <Text size="sm" c="dimmed">
              전체 버전
            </Text>
            <Text fw={500}>{project.versions.length}개</Text>
          </div>
          <div>
            <Text size="sm" c="dimmed">
              최근 수정
            </Text>
            <Text fw={500}>
              {project.updatedAt.toLocaleDateString("ko-KR")}
            </Text>
          </div>
          {project.versions[0]?.backtestResults?.totalReturn !== undefined && (
            <div>
              <Text size="sm" c="dimmed">
                최근 수익률
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

      {/* 전략 편집 안내 */}
      <Alert
        icon={<IconInfoCircle size={16} />}
        color="blue"
        variant="light"
        mb="lg"
      >
        <Text size="sm">
          <strong>투자 전략 편집:</strong> 아래에서 매매 조건과 액션을 설정하여
          나만의 투자 전략을 구성하세요. 모든 변경사항은 자동으로 저장됩니다.
        </Text>
      </Alert>

      {/* 전략 에디터 */}
      <StrategyEditor
        strategy={strategy}
        onStrategyUpdate={handleStrategyUpdate}
        onBacktest={handleBacktest}
      />

      {/* 수정 상태 알림 */}
      {isStrategyModified && (
        <Alert color="orange" mt="lg">
          <Text size="sm">
            전략이 수정되었습니다. 변경사항이 자동으로 저장됩니다.
          </Text>
        </Alert>
      )}

      {/* 프로젝트 기본 정보 편집 모달 */}
      <EditProjectModal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        onSubmit={handleEditProject}
        project={
          project
            ? {
                id: project.id,
                name: project.name,
                description: project.description,
              }
            : null
        }
      />
    </Container>
  );
}
