import { useState } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AppShell, Title, Group, Burger } from "@mantine/core";
import { IconChartLine } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { CreateProjectModal } from "../components/CreateProjectModal";
import { Sidebar } from "../components/layout/Sidebar";
import { useProjectStore } from "../hooks/useProjectStore";

const RootComponent = () => {
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const { createProject } = useProjectStore();

  const handleCreateProject = async (name: string, description: string) => {
    await createProject(name, description);
  };

  // 현재 경로에 따라 헤더 버튼 결정
  const getHeaderButton = () => {
    // 헤더 버튼 제거됨
    return null;
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 280,
        breakpoint: "md",
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="md"
              size="sm"
            />
            <Burger
              opened={desktopOpened}
              onClick={toggleDesktop}
              visibleFrom="md"
              size="sm"
            />
            <IconChartLine size={28} />
            <Title order={3}>JMT</Title>
          </Group>
          <Group>{getHeaderButton()}</Group>
        </Group>
      </AppShell.Header>

      <Sidebar />

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
