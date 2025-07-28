import { memo } from "react";
import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import { Card, Text, Group, Badge, ThemeIcon } from "@mantine/core";
import { IconPlayerPlay } from "@tabler/icons-react";
import type { FlowNodeData } from "../../../types/strategy";

export const StartNode = memo(({ data, selected }: NodeProps<FlowNodeData>) => {
  return (
    <Card
      withBorder
      radius="md"
      p="md"
      style={{
        backgroundColor: selected ? "#e3f2fd" : "#f8f9fa",
        borderColor: selected ? "#2196f3" : "#dee2e6",
        borderWidth: selected ? 2 : 1,
        minWidth: 200,
      }}
    >
      <Group gap="sm" mb="xs">
        <ThemeIcon color="green" variant="light" size="lg">
          <IconPlayerPlay size={20} />
        </ThemeIcon>
        <div>
          <Text fw={600} size="sm">
            전략 시작
          </Text>
          <Text size="xs" c="dimmed">
            {data.label}
          </Text>
        </div>
      </Group>

      <Badge variant="light" color="green" size="sm">
        START
      </Badge>

      {data.description && (
        <Text size="xs" c="dimmed" mt="xs">
          {data.description}
        </Text>
      )}

      {/* 출력 핸들 */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: "#22c55e",
          borderColor: "#16a34a",
          width: 12,
          height: 12,
        }}
      />
    </Card>
  );
});

StartNode.displayName = "StartNode";
