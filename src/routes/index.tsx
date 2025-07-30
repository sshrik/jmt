import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Container,
  Title,
  Text,
  Card,
  SimpleGrid,
  Button,
  Group,
  Badge,
  LoadingOverlay,
  Menu,
  ActionIcon,
  Modal,
} from "@mantine/core";
import {
  IconPlus,
  IconChartLine,
  IconDots,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { useProjectStore } from "../hooks/useProjectStore";
import { CreateProjectModal } from "../components/CreateProjectModal";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { projects, loading, error, deleteProject, createProject } =
    useProjectStore();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [
    createModalOpened,
    { open: openCreateModal, close: closeCreateModal },
  ] = useDisclosure(false);

  // 프로젝트를 수익률 순으로 정렬 (가장 효과 좋은 것이 상위)
  const sortedProjects = [...projects].sort((a, b) => {
    const returnA = a.latestReturn || 0;
    const returnB = b.latestReturn || 0;
    return returnB - returnA; // 내림차순 정렬
  });

  const handleDeleteClick = (projectId: string, projectName: string) => {
    setProjectToDelete({ id: projectId, name: projectName });
    setDeleteModalOpened(true);
  };

  const handleConfirmDelete = async () => {
    if (projectToDelete) {
      await deleteProject(projectToDelete.id);
      setDeleteModalOpened(false);
      setProjectToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpened(false);
    setProjectToDelete(null);
  };

  const handleCreateProject = async (name: string, description: string) => {
    const newProject = await createProject(name, description);
    closeCreateModal();
    navigate({ to: `/projects/${newProject.id}/edit` });
  };

  const getReturnClass = (returnValue?: number) => {
    if (!returnValue) return "return-text-neutral";
    if (returnValue > 0) return "return-text-positive";
    if (returnValue < 0) return "return-text-negative";
    return "return-text-neutral";
  };

  const getReturnIconClass = (returnValue?: number) => {
    if (!returnValue) return "return-icon-neutral";
    if (returnValue > 0) return "return-icon-positive";
    if (returnValue < 0) return "return-icon-negative";
    return "return-icon-neutral";
  };

  const formatReturn = (returnValue?: number) => {
    if (returnValue === undefined || returnValue === null) return "미측정";
    return `${returnValue > 0 ? "+" : ""}${returnValue.toFixed(1)}%`;
  };

  if (error) {
    return (
      <Container>
        <Text color="red">오류가 발생했습니다: {error}</Text>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <LoadingOverlay visible={loading} />

      {/* 페이지 헤더 */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>대시보드</Title>
          <Text c="dimmed" size="lg" mt="xs">
            투자 전략 성과를 확인하고 프로젝트를 관리하세요
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openCreateModal}
          size="md"
        >
          새 프로젝트
        </Button>
      </Group>

      {/* 성과 요약 */}
      {projects.length > 0 && (
        <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
          <Card withBorder p="lg" style={{ textAlign: "center" }}>
            <Text size="sm" c="dimmed" mb="xs">
              총 프로젝트
            </Text>
            <Text size="xl" fw={700} c="blue">
              {projects.length}개
            </Text>
          </Card>
          <Card withBorder p="lg" style={{ textAlign: "center" }}>
            <Text size="sm" c="dimmed" mb="xs">
              최고 수익률
            </Text>
            <Text
              size="xl"
              fw={700}
              className={getReturnClass(
                Math.max(...projects.map((p) => p.latestReturn || 0))
              )}
            >
              {formatReturn(
                Math.max(...projects.map((p) => p.latestReturn || 0))
              )}
            </Text>
          </Card>
          <Card withBorder p="lg" style={{ textAlign: "center" }}>
            <Text size="sm" c="dimmed" mb="xs">
              평균 수익률
            </Text>
            <Text
              size="xl"
              fw={700}
              className={getReturnClass(
                projects.reduce((sum, p) => sum + (p.latestReturn || 0), 0) /
                  projects.length
              )}
            >
              {formatReturn(
                projects.reduce((sum, p) => sum + (p.latestReturn || 0), 0) /
                  projects.length
              )}
            </Text>
          </Card>
        </SimpleGrid>
      )}

      {/* 프로젝트 목록 */}
      {projects.length === 0 ? (
        <Card withBorder p="xl" style={{ textAlign: "center" }}>
          <IconChartLine size={48} color="var(--mantine-color-dimmed)" />
          <Title order={3} mt="md" mb="xs">
            아직 프로젝트가 없습니다
          </Title>
          <Text c="dimmed" mb="lg">
            첫 번째 투자 전략 프로젝트를 만들어보세요
          </Text>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => navigate({ to: "/projects" })}
          >
            프로젝트 만들기
          </Button>
        </Card>
      ) : (
        <div>
          <Group justify="space-between" mb="md">
            <Title order={2}>투자 전략 프로젝트</Title>
            <Text c="dimmed" size="sm">
              성과가 좋은 순으로 정렬됨
            </Text>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {sortedProjects.map((project, index) => (
              <Card
                key={project.id}
                data-testid="project-card"
                withBorder
                p="lg"
                style={{
                  height: "fit-content",
                  position: "relative",
                }}
              >
                <Group justify="space-between" mb="xs" align="flex-start">
                  <Text
                    fw={600}
                    size="lg"
                    lineClamp={2}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      marginRight: "8px", // 오른쪽 요소들과의 간격
                    }}
                  >
                    {project.name}
                  </Text>

                  {/* 순위 배지와 메뉴 버튼을 함께 배치 */}
                  <Group gap="xs" style={{ flexShrink: 0 }}>
                    {/* 순위 배지 */}
                    {index < 3 &&
                      project.latestReturn &&
                      project.latestReturn > 0 && (
                        <Badge
                          variant="filled"
                          color={
                            index === 0
                              ? "yellow"
                              : index === 1
                                ? "gray"
                                : "orange"
                          }
                          size="sm"
                        >
                          #{index + 1}
                        </Badge>
                      )}

                    {/* 메뉴 버튼 - 순위 배지 바로 옆에 */}
                    <Menu shadow="md" width={200}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray">
                          <IconDots size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEdit size={14} />}
                          onClick={() =>
                            navigate({ to: `/projects/${project.id}/edit` })
                          }
                        >
                          프로젝트 수정
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          leftSection={<IconTrash size={14} />}
                          color="red"
                          onClick={() =>
                            handleDeleteClick(project.id, project.name)
                          }
                        >
                          프로젝트 삭제
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Group>

                <Text c="dimmed" size="sm" mb="md" lineClamp={2}>
                  {project.description || "설명이 없습니다."}
                </Text>

                {/* 수익률 강조 표시 */}
                <Card
                  withBorder
                  p="sm"
                  mb="md"
                  className={
                    project.latestReturn
                      ? project.latestReturn > 0
                        ? "return-card-positive"
                        : "return-card-negative"
                      : "return-card-neutral"
                  }
                >
                  <Group justify="space-between" align="center">
                    <div>
                      <Text size="xs" c="dimmed" mb="xs">
                        투자 수익률
                      </Text>
                      <Text
                        fw={700}
                        size="lg"
                        className={getReturnClass(project.latestReturn)}
                      >
                        {formatReturn(project.latestReturn)}
                      </Text>
                    </div>
                    {project.latestReturn && (
                      <div className={getReturnIconClass(project.latestReturn)}>
                        <IconChartLine size={24} />
                      </div>
                    )}
                  </Group>
                </Card>

                <Group justify="space-between" mb="md">
                  <div>
                    <Text size="xs" c="dimmed">
                      버전
                    </Text>
                    <Text size="sm" fw={500}>
                      {project.totalVersions}개
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      마지막 수정
                    </Text>
                    <Text size="sm" fw={500}>
                      {new Date(project.lastModified).toLocaleDateString(
                        "ko-KR"
                      )}
                    </Text>
                  </div>
                </Group>

                <Button
                  fullWidth
                  variant="light"
                  onClick={() => navigate({ to: `/projects/${project.id}/` })}
                >
                  상세 보기
                </Button>
              </Card>
            ))}
          </SimpleGrid>
        </div>
      )}

      {/* 삭제 확인 Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={handleCancelDelete}
        title="프로젝트 삭제"
        centered
      >
        <Text mb="md">
          <strong>{projectToDelete?.name}</strong> 프로젝트를 정말
          삭제하시겠습니까?
        </Text>
        <Text size="sm" c="dimmed" mb="lg">
          이 작업은 되돌릴 수 없으며, 모든 버전과 백테스트 결과가 함께
          삭제됩니다.
        </Text>

        <Group justify="flex-end">
          <Button variant="subtle" onClick={handleCancelDelete}>
            취소
          </Button>
          <Button color="red" onClick={handleConfirmDelete}>
            삭제
          </Button>
        </Group>
      </Modal>

      {/* 프로젝트 생성 모달 */}
      <CreateProjectModal
        opened={createModalOpened}
        onClose={closeCreateModal}
        onSubmit={handleCreateProject}
      />
    </Container>
  );
}
