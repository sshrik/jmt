import { useNavigate, useLocation } from "@tanstack/react-router";
import {
  AppShell,
  Group,
  Text,
  UnstyledButton,
  rem,
  Stack,
  Divider,
  Badge,
  Tooltip,
} from "@mantine/core";
import {
  IconChartLine,
  IconTrendingUp,
  IconFolder,
  IconSettings,
  IconHome,
} from "@tabler/icons-react";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: string;
  description?: string;
}

const SidebarItem = ({
  icon,
  label,
  path,
  badge,
  description,
}: SidebarItemProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive =
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleClick = () => {
    navigate({ to: path });
  };

  return (
    <Tooltip label={description} position="right" disabled={!description}>
      <UnstyledButton
        onClick={handleClick}
        style={{
          display: "block",
          width: "100%",
          padding: rem(12),
          borderRadius: rem(8),
          color: isActive
            ? "var(--mantine-color-blue-6)"
            : "var(--mantine-color-gray-7)",
          backgroundColor: isActive
            ? "var(--mantine-color-blue-0)"
            : "transparent",
          border: isActive
            ? "1px solid var(--mantine-color-blue-2)"
            : "1px solid transparent",
          transition: "all 0.2s ease",
        }}
        data-active={isActive}
        __vars={{
          "--button-hover": "var(--mantine-color-gray-0)",
        }}
      >
        <Group gap="sm" wrap="nowrap" align="center">
          <div
            style={{
              color: isActive
                ? "var(--mantine-color-blue-6)"
                : "var(--mantine-color-gray-6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: rem(18),
              height: rem(18),
            }}
          >
            {icon}
          </div>
          <div style={{ flex: 1 }}>
            <Text
              size="sm"
              fw={isActive ? 600 : 400}
              style={{ lineHeight: 1.4 }}
            >
              {label}
            </Text>
          </div>
          {badge && (
            <Badge size="xs" variant="light" color={isActive ? "blue" : "gray"}>
              {badge}
            </Badge>
          )}
        </Group>
      </UnstyledButton>
    </Tooltip>
  );
};

export const Sidebar = () => {
  return (
    <AppShell.Navbar p="md">
      <Stack gap="xs">
        {/* 메인 네비게이션 */}
        <div>
          <Text size="xs" fw={700} c="dimmed" mb="xs" tt="uppercase">
            메인
          </Text>
          <Stack gap={4}>
            <SidebarItem
              icon={<IconHome size={18} />}
              label="대시보드"
              path="/"
              description="프로젝트 목록과 최근 활동을 확인하세요"
            />
            <SidebarItem
              icon={<IconFolder size={18} />}
              label="프로젝트"
              path="/projects"
              description="투자 전략 프로젝트를 관리하세요"
            />
          </Stack>
        </div>

        <Divider my="sm" />

        {/* 분석 도구 */}
        <div>
          <Text size="xs" fw={700} c="dimmed" mb="xs" tt="uppercase">
            분석 도구
          </Text>
          <Stack gap={4}>
            <SidebarItem
              icon={<IconChartLine size={18} />}
              label="주식 추이 확인"
              path="/flowchart"
              badge="New"
              description="종목별 주가 정보 및 차트"
            />
            <SidebarItem
              icon={<IconTrendingUp size={18} />}
              label="백테스트"
              path="/backtest"
              description="전략 성과를 테스트하세요"
            />
          </Stack>
        </div>

        <Divider my="sm" />

        {/* 설정 */}
        <div>
          <Text size="xs" fw={700} c="dimmed" mb="xs" tt="uppercase">
            설정
          </Text>
          <Stack gap={4}>
            <SidebarItem
              icon={<IconSettings size={18} />}
              label="환경설정"
              path="/settings"
              description="앱 설정을 변경하세요"
            />
          </Stack>
        </div>
      </Stack>
    </AppShell.Navbar>
  );
};
