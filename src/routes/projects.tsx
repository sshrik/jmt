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
  IconEye,
} from "@tabler/icons-react";
import { useProjectStore } from "../hooks/useProjectStore";

export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, loading, error, deleteProject } = useProjectStore();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

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

  const handleCreateProject = () => {
    navigate({ to: "/" }); // 대시보드로 이동하여 프로젝트 생성
  };

  const handleEditProject = (projectId: string) => {
    navigate({ to: `/projects/${projectId}/edit` });
  };

  const handleViewProject = (projectId: string) => {
    navigate({ to: `/projects/${projectId}/` });
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
          <Title order={1}>투자 전략 프로젝트</Title>
          <Text c="dimmed" size="lg" mt="xs">
            투자 전략을 관리하고 백테스트를 실행하세요
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleCreateProject}
          size="md"
        >
          새 프로젝트
        </Button>
      </Group>

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
            onClick={handleCreateProject}
          >
            프로젝트 만들기
          </Button>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {projects.map((project) => (
            <Card
              key={project.id}
              withBorder
              p="lg"
              style={{ height: "fit-content" }}
            >
              <Group justify="space-between" mb="xs">
                <Text fw={600} size="lg" lineClamp={1}>
                  {project.name}
                </Text>
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray">
                      <IconDots size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconEye size={14} />}
                      onClick={() => handleViewProject(project.id)}
                    >
                      상세보기
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconEdit size={14} />}
                      onClick={() => handleEditProject(project.id)}
                    >
                      수정
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      leftSection={<IconTrash size={14} />}
                      color="red"
                      onClick={() =>
                        handleDeleteClick(project.id, project.name)
                      }
                    >
                      삭제
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>

              <Text c="dimmed" size="sm" mb="md" lineClamp={2}>
                {project.description || "설명이 없습니다."}
              </Text>

              <Group justify="space-between" mb="md">
                <div>
                  <Text size="xs" c="dimmed">
                    버전
                  </Text>
                  <Badge variant="light" color="blue">
                    {project.totalVersions}개
                  </Badge>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    마지막 수정
                  </Text>
                  <Text size="sm" fw={500}>
                    {new Date(project.lastModified).toLocaleDateString("ko-KR")}
                  </Text>
                </div>
              </Group>

              <Group justify="stretch" mt="md">
                <Button
                  variant="light"
                  size="sm"
                  flex={1}
                  onClick={() => handleViewProject(project.id)}
                >
                  상세보기
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  flex={1}
                  onClick={() => handleEditProject(project.id)}
                >
                  수정
                </Button>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* 삭제 확인 모달 */}
      <Modal
        opened={deleteModalOpened}
        onClose={handleCancelDelete}
        title="프로젝트 삭제"
        centered
      >
        <Text mb="md">
          정말로 <strong>{projectToDelete?.name}</strong> 프로젝트를
          삭제하시겠습니까?
        </Text>
        <Text size="sm" c="dimmed" mb="lg">
          이 작업은 되돌릴 수 없습니다.
        </Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={handleCancelDelete}>
            취소
          </Button>
          <Button color="red" onClick={handleConfirmDelete}>
            삭제
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
