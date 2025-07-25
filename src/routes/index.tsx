import { createFileRoute } from "@tanstack/react-router";
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
} from "@mantine/core";
import { IconPlus, IconChartLine } from "@tabler/icons-react";
import { useProjectStore } from "../hooks/useProjectStore";

export const Route = createFileRoute("/")({
  component: ProjectList,
});

function ProjectList() {
  const { projects, loading, error } = useProjectStore();

  if (error) {
    return (
      <Container size="xl">
        <Card padding="xl" withBorder style={{ textAlign: "center" }}>
          <Title order={3} c="red" mb="xs">
            오류가 발생했습니다
          </Title>
          <Text c="dimmed">{error}</Text>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="xl" style={{ position: "relative" }}>
      <LoadingOverlay visible={loading} />

      <div style={{ marginBottom: "2rem" }}>
        <Title order={1}>투자 전략 프로젝트</Title>
        <Text c="dimmed" size="lg" mt="xs">
          나만의 투자 전략을 설계하고 백테스트 결과를 확인하세요
        </Text>
      </div>

      {projects.length === 0 && !loading ? (
        <Card padding="xl" withBorder style={{ textAlign: "center" }}>
          <IconChartLine
            size={48}
            style={{ margin: "0 auto", marginBottom: 16 }}
          />
          <Title order={3} mb="xs">
            아직 생성된 프로젝트가 없습니다
          </Title>
          <Text c="dimmed" mb="md">
            첫 번째 투자 전략을 만들어보세요
          </Text>
          <Button leftSection={<IconPlus size={16} />}>
            새 프로젝트 만들기
          </Button>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {projects.map((project) => (
            <Card key={project.id} padding="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Title order={4}>{project.name}</Title>
                {project.latestReturn !== undefined && (
                  <Badge
                    color={project.latestReturn > 0 ? "green" : "red"}
                    variant="filled"
                  >
                    {project.latestReturn > 0 ? "+" : ""}
                    {project.latestReturn.toFixed(1)}%
                  </Badge>
                )}
              </Group>

              <Text c="dimmed" size="sm" mb="md">
                {project.description}
              </Text>

              <Group justify="space-between" mb="md">
                <Text size="sm" c="dimmed">
                  버전: {project.totalVersions}개
                </Text>
                <Text size="sm" c="dimmed">
                  {project.lastModified.toLocaleDateString("ko-KR")}
                </Text>
              </Group>

              <Button fullWidth variant="light">
                상세 보기
              </Button>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}
