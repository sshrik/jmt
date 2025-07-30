import {
  Stack,
  Text,
  Group,
  Badge,
  Paper,
  ActionIcon,
  Menu,
  Alert,
  ScrollArea,
} from "@mantine/core";
import {
  IconGitBranch,
  IconClock,
  IconDots,
  IconRestore,
  IconCopy,
  IconTrash,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconEdit,
} from "@tabler/icons-react";
import type { Project, Version } from "../../types/project";
import { VersionStore } from "../../stores/versionStore";

interface VersionListProps {
  project: Project;
  currentVersionId?: string;
  onVersionSelect: (version: Version) => void;
  onVersionRevert: (version: Version) => void;
  onVersionDuplicate: (version: Version) => void;
  onVersionDelete?: (version: Version) => void;
  showActions?: boolean;
  allowVersionSelection?: boolean;
}

export const VersionList = ({
  project,
  currentVersionId,
  onVersionSelect,
  onVersionRevert,
  onVersionDuplicate,
  onVersionDelete,
  showActions = true,
  allowVersionSelection = true,
}: VersionListProps) => {
  const versions = VersionStore.getVersionsOrderedByDate(project) || [];
  const latestVersion = VersionStore.getLatestVersion(project);

  // 간단한 상대시간 포매터
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}초 전`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}일 전`;

    return date.toLocaleDateString("ko-KR");
  };

  const formatBacktestReturn = (totalReturn?: number) => {
    if (totalReturn === undefined || totalReturn === null) return null;

    const isPositive = totalReturn > 0;
    const isNegative = totalReturn < 0;

    return (
      <Group gap={4}>
        {isPositive && <IconTrendingUp size={12} color="green" />}
        {isNegative && <IconTrendingDown size={12} color="red" />}
        {!isPositive && !isNegative && <IconMinus size={12} color="gray" />}
        <Text
          size="xs"
          c={isPositive ? "green" : isNegative ? "red" : "dimmed"}
          fw={500}
        >
          {totalReturn > 0 ? "+" : ""}
          {totalReturn.toFixed(2)}%
        </Text>
      </Group>
    );
  };

  if (versions.length === 0) {
    return (
      <Alert color="blue" title="버전이 없습니다">
        아직 생성된 버전이 없습니다. 전략을 수정하면 자동으로 버전이 생성됩니다.
      </Alert>
    );
  }

  return (
    <ScrollArea style={{ height: 400 }}>
      <Stack gap="sm">
        {versions.map((version, _index) => {
          const isLatest = version.id === latestVersion?.id;
          const isCurrent = version.id === currentVersionId;
          const hasBacktest = !!version.backtestResults;

          return (
            <Paper
              key={version.id}
              p="md"
              withBorder
              className={isCurrent ? "version-card-selected" : ""}
              style={{
                cursor: allowVersionSelection ? "pointer" : "default",
              }}
              onClick={
                allowVersionSelection
                  ? () => onVersionSelect(version)
                  : undefined
              }
            >
              <Group justify="space-between" align="flex-start">
                <Stack gap="xs" style={{ flex: 1 }}>
                  {/* 버전 헤더 */}
                  <Group gap="sm">
                    <Group gap="xs">
                      <IconGitBranch size={16} className="version-card-icon" />
                      <Text fw={600} size="sm">
                        {version.versionName}
                      </Text>
                    </Group>

                    <Group gap="xs">
                      {isLatest && (
                        <Badge variant="filled" color="blue" size="xs">
                          최신
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge variant="filled" color="green" size="xs">
                          현재
                        </Badge>
                      )}

                      {hasBacktest && (
                        <Badge variant="light" color="teal" size="xs">
                          백테스트
                        </Badge>
                      )}
                    </Group>
                  </Group>

                  {/* 설명 */}
                  <Text size="sm" c="dimmed">
                    {version.description}
                  </Text>

                  {/* 메타 정보 */}
                  <Group gap="md">
                    <Group gap="xs">
                      <IconClock size={12} color="gray" />
                      <Text size="xs" c="dimmed">
                        {formatRelativeTime(new Date(version.createdAt))}
                      </Text>
                    </Group>

                    {hasBacktest &&
                      version.backtestResults &&
                      Array.isArray(version.backtestResults) &&
                      version.backtestResults.length > 0 &&
                      formatBacktestReturn(
                        version.backtestResults[
                          version.backtestResults.length - 1
                        ].totalReturn
                      )}
                  </Group>

                  {/* 전략 정보 */}
                  <Text size="xs" c="dimmed">
                    블록 {version.strategy?.blocks?.length || 0}개
                    {(version.strategy?.blocks?.length || 0) > 0 && (
                      <>
                        {" • "}
                        조건{" "}
                        {version.strategy?.blocks?.filter(
                          (b) => b.type === "condition"
                        ).length || 0}
                        개{" • "}
                        액션{" "}
                        {version.strategy?.blocks?.filter(
                          (b) => b.type === "action"
                        ).length || 0}
                        개
                      </>
                    )}
                  </Text>
                </Stack>

                {/* 액션 버튼 */}
                {showActions && (
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray" size="sm">
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                      <Menu.Label>버전 관리</Menu.Label>

                      {!isCurrent && (
                        <Menu.Item
                          leftSection={<IconEdit size={14} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onVersionSelect(version);
                          }}
                        >
                          이 버전으로 전환
                        </Menu.Item>
                      )}

                      <Menu.Item
                        leftSection={<IconRestore size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onVersionRevert(version);
                        }}
                      >
                        이 버전으로 되돌리기
                      </Menu.Item>

                      <Menu.Item
                        leftSection={<IconCopy size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onVersionDuplicate(version);
                        }}
                      >
                        복제
                      </Menu.Item>

                      {onVersionDelete && !isLatest && (
                        <>
                          <Menu.Divider />
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color="red"
                            onClick={(e) => {
                              e.stopPropagation();
                              onVersionDelete(version);
                            }}
                          >
                            삭제
                          </Menu.Item>
                        </>
                      )}
                    </Menu.Dropdown>
                  </Menu>
                )}
              </Group>
            </Paper>
          );
        })}
      </Stack>
    </ScrollArea>
  );
};
