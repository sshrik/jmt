import { useState } from "react";
import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { AppShell, Title, Group, Button } from "@mantine/core";
import { IconChartLine, IconPlus } from "@tabler/icons-react";
import { CreateProjectModal } from "../components/CreateProjectModal";
import { useProjectStore } from "../hooks/useProjectStore";

const RootComponent = () => {
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const { createProject } = useProjectStore();
  const location = useLocation();

  const handleCreateProject = async (name: string, description: string) => {
    await createProject(name, description);
  };

  // 현재 경로에 따라 헤더 버튼 결정
  const getHeaderButton = () => {
    const pathname = location.pathname;

    if (pathname === "/") {
      // 메인 화면: 새 프로젝트 만들기
      return (
        <Button
          leftSection={<IconPlus size={16} />}
          variant="filled"
          onClick={() => setCreateModalOpened(true)}
        >
          새 프로젝트 만들기
        </Button>
      );
    }

    return null;
  };

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <IconChartLine size={28} />
            <Title order={3}>JMT</Title>
          </Group>
          <Group>{getHeaderButton()}</Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      <TanStackRouterDevtools />

      <CreateProjectModal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        onSubmit={handleCreateProject}
      />
    </AppShell>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});
