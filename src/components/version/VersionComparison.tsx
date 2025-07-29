import {
  Stack,
  Text,
  Group,
  Paper,
  Badge,
  Alert,
  Divider,
  Tabs,
  ScrollArea,
  JsonInput,
  Code,
} from "@mantine/core";
import {
  IconGitCompare,
  IconPlus,
  IconMinus,
  IconEdit,
  IconAlertCircle,
  IconCode,
  IconList,
} from "@tabler/icons-react";
import type { Version } from "../../types/project";
import { VersionStore } from "../../stores/versionStore";

interface VersionComparisonProps {
  version1: Version;
  version2: Version;
  showTitle?: boolean;
}

export const VersionComparison = ({
  version1,
  version2,
  showTitle = true,
}: VersionComparisonProps) => {
  const comparison = VersionStore.compareVersions(version1, version2);

  const getChangeIcon = (type: "added" | "removed" | "modified") => {
    switch (type) {
      case "added":
        return <IconPlus size={14} color="green" />;
      case "removed":
        return <IconMinus size={14} color="red" />;
      case "modified":
        return <IconEdit size={14} color="orange" />;
    }
  };

  const getChangeColor = (type: "added" | "removed" | "modified") => {
    switch (type) {
      case "added":
        return "green";
      case "removed":
        return "red";
      case "modified":
        return "orange";
    }
  };

  const getChangeDescription = (type: "added" | "removed" | "modified") => {
    switch (type) {
      case "added":
        return "추가됨";
      case "removed":
        return "제거됨";
      case "modified":
        return "수정됨";
    }
  };

  if (!comparison.hasChanges) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="변경사항 없음"
        color="blue"
      >
        두 버전 간에 차이점이 없습니다.
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      {showTitle && (
        <Group gap="sm">
          <IconGitCompare size={20} />
          <Text fw={600} size="lg">
            버전 비교
          </Text>
        </Group>
      )}

      {/* 버전 정보 헤더 */}
      <Group justify="space-between">
        <Paper p="sm" withBorder style={{ flex: 1 }}>
          <Stack gap="xs">
            <Text fw={600} size="sm" c="red">
              {version1.versionName} (이전)
            </Text>
            <Text size="xs" c="dimmed">
              {version1.description}
            </Text>
            <Text size="xs" c="dimmed">
              {new Date(version1.createdAt).toLocaleString("ko-KR")}
            </Text>
          </Stack>
        </Paper>

        <Text size="xl" c="dimmed" fw={600}>
          →
        </Text>

        <Paper p="sm" withBorder style={{ flex: 1 }}>
          <Stack gap="xs">
            <Text fw={600} size="sm" c="green">
              {version2.versionName} (이후)
            </Text>
            <Text size="xs" c="dimmed">
              {version2.description}
            </Text>
            <Text size="xs" c="dimmed">
              {new Date(version2.createdAt).toLocaleString("ko-KR")}
            </Text>
          </Stack>
        </Paper>
      </Group>

      <Divider />

      <Tabs defaultValue="changes">
        <Tabs.List>
          <Tabs.Tab value="changes" leftSection={<IconList size={16} />}>
            변경사항 ({comparison.strategyChanges.length})
          </Tabs.Tab>
          <Tabs.Tab value="details" leftSection={<IconCode size={16} />}>
            상세 비교
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="changes" pt="md">
          <ScrollArea style={{ height: 300 }}>
            <Stack gap="sm">
              {comparison.strategyChanges.map((change, index) => (
                <Paper key={index} p="md" withBorder>
                  <Group gap="sm" align="flex-start">
                    {getChangeIcon(change.type)}
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Group gap="sm">
                        <Badge
                          variant="light"
                          color={getChangeColor(change.type)}
                          size="sm"
                        >
                          {getChangeDescription(change.type)}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {change.blockType}
                        </Badge>
                      </Group>

                      <Text size="sm">{change.description}</Text>

                      <Group gap="sm">
                        <Text size="xs" c="dimmed">
                          블록 ID: <Code>{change.blockId}</Code>
                        </Text>
                      </Group>
                    </Stack>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </ScrollArea>
        </Tabs.Panel>

        <Tabs.Panel value="details" pt="md">
          <Stack gap="md">
            <Group grow>
              <Paper p="md" withBorder>
                <Stack gap="sm">
                  <Text fw={600} size="sm" c="red">
                    {version1.versionName} 전략
                  </Text>
                  <JsonInput
                    value={JSON.stringify(version1.strategy, null, 2)}
                    readOnly
                    autosize
                    maxRows={10}
                    styles={{
                      input: {
                        fontSize: "11px",
                        fontFamily: "monospace",
                      },
                    }}
                  />
                </Stack>
              </Paper>

              <Paper p="md" withBorder>
                <Stack gap="sm">
                  <Text fw={600} size="sm" c="green">
                    {version2.versionName} 전략
                  </Text>
                  <JsonInput
                    value={JSON.stringify(version2.strategy, null, 2)}
                    readOnly
                    autosize
                    maxRows={10}
                    styles={{
                      input: {
                        fontSize: "11px",
                        fontFamily: "monospace",
                      },
                    }}
                  />
                </Stack>
              </Paper>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* 요약 정보 */}
      <Paper p="md" withBorder bg="gray.0">
        <Stack gap="xs">
          <Text fw={600} size="sm">
            변경사항 요약
          </Text>
          <Group gap="md">
            <Group gap="xs">
              <IconPlus size={14} color="green" />
              <Text size="sm">
                추가:{" "}
                {
                  comparison.strategyChanges.filter((c) => c.type === "added")
                    .length
                }
                개
              </Text>
            </Group>
            <Group gap="xs">
              <IconMinus size={14} color="red" />
              <Text size="sm">
                제거:{" "}
                {
                  comparison.strategyChanges.filter((c) => c.type === "removed")
                    .length
                }
                개
              </Text>
            </Group>
            <Group gap="xs">
              <IconEdit size={14} color="orange" />
              <Text size="sm">
                수정:{" "}
                {
                  comparison.strategyChanges.filter(
                    (c) => c.type === "modified"
                  ).length
                }
                개
              </Text>
            </Group>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
};
