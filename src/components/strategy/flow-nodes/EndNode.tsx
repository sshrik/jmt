import { memo } from "react";
import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import { Card, Text, Group, Badge, ThemeIcon } from "@mantine/core";
import { IconPlayerStop } from "@tabler/icons-react";
import type { FlowNodeData } from "../../../types/strategy";

export const EndNode = memo(({ data, selected }: NodeProps<FlowNodeData>) => {
  return (
    <Card
      withBorder
      radius="md"
      p="md"
      style={{
        backgroundColor: selected
          ? "var(--mantine-color-red-2)"
          : "var(--mantine-color-red-0)",
        borderColor: selected
          ? "var(--mantine-color-red-6)"
          : "var(--mantine-color-red-3)",
        borderWidth: selected ? 2 : 1,
        minWidth: 200,
      }}
    >
      {/* 입력 핸들 */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: "#ef4444",
          borderColor: "#dc2626",
          width: 12,
          height: 12,
        }}
      />

      <Group gap="sm" mb="xs">
        <ThemeIcon color="red" variant="light" size="lg">
          <IconPlayerStop size={20} />
        </ThemeIcon>
        <div>
          <Text fw={600} size="sm">
            전략 종료
          </Text>
          <Text size="xs" c="dimmed">
            {data.label}
          </Text>
        </div>
      </Group>

      <Badge variant="light" color="red" size="sm">
        END
      </Badge>

      {data.description && (
        <Text size="xs" c="dimmed" mt="xs">
          {data.description}
        </Text>
      )}
    </Card>
  );
});

EndNode.displayName = "EndNode";
