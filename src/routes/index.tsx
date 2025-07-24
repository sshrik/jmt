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
} from "@mantine/core";
import { IconPlus, IconChartLine } from "@tabler/icons-react";

export const Route = createFileRoute("/")({
  component: ProjectList,
});

function ProjectList() {
  // 임시 Mock 데이터
  const mockProjects = [
    {
      id: "1",
      name: "삼성전자 단순매매 전략",
      description: "가격 상승/하락에 따른 단순 매매 전략",
      lastModified: "2024-01-15",
      totalVersions: 3,
      latestReturn: 12.5,
    },
    {
      id: "2",
      name: "비트코인 모멘텀 전략",
      description: "모멘텀 기반 암호화폐 투자 전략",
      lastModified: "2024-01-10",
      totalVersions: 5,
      latestReturn: -3.2,
    },
  ];

  return (
    <Container size="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>투자 전략 프로젝트</Title>
          <Text c="dimmed" size="lg" mt="xs">
            나만의 투자 전략을 설계하고 백테스트 결과를 확인하세요
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} size="lg">
          새 프로젝트 만들기
        </Button>
      </Group>

      {mockProjects.length === 0 ? (
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
          {mockProjects.map((project) => (
            <Card key={project.id} padding="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Title order={4}>{project.name}</Title>
                <Badge
                  color={project.latestReturn > 0 ? "green" : "red"}
                  variant="filled"
                >
                  {project.latestReturn > 0 ? "+" : ""}
                  {project.latestReturn}%
                </Badge>
              </Group>

              <Text c="dimmed" size="sm" mb="md">
                {project.description}
              </Text>

              <Group justify="space-between" mb="md">
                <Text size="sm" c="dimmed">
                  버전: {project.totalVersions}개
                </Text>
                <Text size="sm" c="dimmed">
                  {project.lastModified}
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
