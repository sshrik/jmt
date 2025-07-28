import { memo } from "react";
import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import {
  Card,
  Text,
  Group,
  Badge,
  ThemeIcon,
  Select,
  NumberInput,
  Stack,
} from "@mantine/core";
import { IconClock, IconCalendar, IconRefresh } from "@tabler/icons-react";
import type { FlowNodeData, ScheduleType } from "../../../types/strategy";

// 스케줄 타입별 설정
const SCHEDULE_CONFIG = {
  market_open: {
    label: "장 시작 시",
    description: "09:00 장 시작과 함께 실행",
    icon: IconClock,
    color: "blue",
  },
  market_close: {
    label: "장 마감 시",
    description: "15:30 장 마감 30분 전 실행",
    icon: IconClock,
    color: "orange",
  },
  interval: {
    label: "주기적 실행",
    description: "설정한 간격마다 실행",
    icon: IconRefresh,
    color: "green",
  },
  daily: {
    label: "매일 지정 시간",
    description: "매일 특정 시간에 실행",
    icon: IconCalendar,
    color: "purple",
  },
  weekly: {
    label: "주간 실행",
    description: "매주 특정 요일에 실행",
    icon: IconCalendar,
    color: "pink",
  },
  manual: {
    label: "수동 실행",
    description: "사용자가 직접 트리거",
    icon: IconClock,
    color: "gray",
  },
} as const;

interface ScheduleNodeProps extends NodeProps<FlowNodeData> {
  onUpdate?: (data: FlowNodeData) => void;
}

export const ScheduleNode = memo(
  ({ data, selected, onUpdate }: ScheduleNodeProps) => {
    const scheduleType = data.scheduleParams?.scheduleType || "market_open";
    const config = SCHEDULE_CONFIG[scheduleType];
    const IconComponent = config.icon;

    const updateScheduleParams = (
      updates: Partial<typeof data.scheduleParams>
    ) => {
      if (onUpdate) {
        onUpdate({
          ...data,
          scheduleParams: { ...data.scheduleParams, ...updates },
        });
      }
    };

    const handleScheduleTypeChange = (value: string | null) => {
      if (value && value in SCHEDULE_CONFIG) {
        updateScheduleParams({ scheduleType: value as ScheduleType });
      }
    };

    return (
      <Card
        withBorder
        radius="md"
        p="md"
        style={{
          backgroundColor: selected ? "#e3f2fd" : "#ffffff",
          borderColor: selected ? "#2196f3" : "#dee2e6",
          borderWidth: selected ? 2 : 1,
          minWidth: 280,
        }}
      >
        {/* 입력 핸들 */}
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: "#6366f1",
            borderColor: "#4f46e5",
            width: 12,
            height: 12,
          }}
        />

        <Group gap="sm" mb="md">
          <ThemeIcon color={config.color} variant="light" size="lg">
            <IconComponent size={20} />
          </ThemeIcon>
          <div>
            <Text fw={600} size="sm">
              실행 일정
            </Text>
            <Text size="xs" c="dimmed">
              {data.label}
            </Text>
          </div>
        </Group>

        <Stack gap="sm">
          <Select
            label="실행 시점"
            placeholder="실행 시점을 선택하세요"
            value={scheduleType}
            onChange={handleScheduleTypeChange}
            data={Object.entries(SCHEDULE_CONFIG).map(([key, config]) => ({
              value: key,
              label: config.label,
            }))}
            size="sm"
          />

          {/* 주기적 실행일 때 간격 설정 */}
          {scheduleType === "interval" && (
            <NumberInput
              label="실행 간격 (분)"
              placeholder="예: 30"
              value={data.scheduleParams?.intervalMinutes || 30}
              onChange={(value) =>
                updateScheduleParams({ intervalMinutes: Number(value) || 30 })
              }
              min={1}
              max={1440}
              size="sm"
            />
          )}

          {/* 매일 실행일 때 시간 설정 */}
          {scheduleType === "daily" && (
            <Select
              label="실행 시간"
              placeholder="시간 선택"
              value={data.scheduleParams?.executionTime || "09:30"}
              onChange={(value) =>
                updateScheduleParams({ executionTime: value || "09:30" })
              }
              data={[
                { value: "09:00", label: "09:00 (장 시작)" },
                { value: "09:30", label: "09:30" },
                { value: "10:00", label: "10:00" },
                { value: "11:00", label: "11:00" },
                { value: "14:00", label: "14:00" },
                { value: "15:00", label: "15:00" },
                { value: "15:20", label: "15:20 (장 마감 전)" },
              ]}
              size="sm"
            />
          )}

          <Badge variant="light" color={config.color} size="sm">
            {config.label}
          </Badge>

          <Text size="xs" c="dimmed">
            {config.description}
          </Text>
        </Stack>

        {/* 출력 핸들 */}
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: "#6366f1",
            borderColor: "#4f46e5",
            width: 12,
            height: 12,
          }}
        />
      </Card>
    );
  }
);

ScheduleNode.displayName = "ScheduleNode";
