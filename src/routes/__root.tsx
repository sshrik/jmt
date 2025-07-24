import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { AppShell, Title, Group, Button } from "@mantine/core";
import { IconChartLine } from "@tabler/icons-react";

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
            <Button component={Link} to="/" variant="subtle">
              프로젝트 목록
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
