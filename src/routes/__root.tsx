import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { AppShell, Title, Group, Button } from "@mantine/core";
import { IconChartLine, IconPlus } from "@tabler/icons-react";

export const Route = createRootRoute({
  component: () => (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <IconChartLine size={28} />
            <Title order={3}>JMT</Title>
          </Group>
          <Group>
            <Button leftSection={<IconPlus size={16} />} variant="filled">
              새 프로젝트 만들기
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      <TanStackRouterDevtools />
    </AppShell>
  ),
});
