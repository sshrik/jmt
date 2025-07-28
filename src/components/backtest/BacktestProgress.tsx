import {
  Modal,
  Stack,
  Text,
  Progress,
  Group,
  ThemeIcon,
  Alert,
  Button,
} from "@mantine/core";
import {
  IconChartLine,
  IconCheck,
  IconX,
  IconLoader,
  IconInfoCircle,
} from "@tabler/icons-react";
import type { BacktestProgress as BacktestProgressType } from "../../types/backtest";

interface BacktestProgressProps {
  progress: BacktestProgressType | null;
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => void;
}

export const BacktestProgress = ({
  progress,
  isOpen,
  onClose,
  onCancel,
}: BacktestProgressProps) => {
  if (!progress) return null;

  const getStatusIcon = () => {
    switch (progress.status) {
      case "preparing":
        return <IconLoader size={20} className="animate-spin" />;
      case "running":
        return <IconChartLine size={20} color="blue" />;
      case "completed":
        return <IconCheck size={20} color="green" />;
      case "error":
        return <IconX size={20} color="red" />;
      default:
        return <IconLoader size={20} />;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case "preparing":
        return "gray";
      case "running":
        return "blue";
      case "completed":
        return "green";
      case "error":
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case "preparing":
        return "백테스트 준비 중...";
      case "running":
        return "백테스트 실행 중...";
      case "completed":
        return "백테스트 완료!";
      case "error":
        return "백테스트 실패";
      default:
        return "상태 불명";
    }
  };

  const progressPercentage =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  const canCancel =
    progress.status === "preparing" || progress.status === "running";
  const isCompleted =
    progress.status === "completed" || progress.status === "error";

  return (
    <Modal
      opened={isOpen}
      onClose={isCompleted ? onClose : () => {}}
      title="백테스트 진행 상황"
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={isCompleted}
      size="md"
    >
      <Stack gap="lg">
        {/* 상태 헤더 */}
        <Group gap="md">
          <ThemeIcon size="lg" color={getStatusColor()} variant="light">
            {getStatusIcon()}
          </ThemeIcon>
          <div>
            <Text fw={500} size="lg">
              {getStatusText()}
            </Text>
            {progress.currentDate && (
              <Text size="sm" c="dimmed">
                현재 처리 중: {progress.currentDate}
              </Text>
            )}
          </div>
        </Group>

        {/* 진행률 표시 */}
        {progress.status !== "error" && (
          <div>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>
                진행률
              </Text>
              <Text size="sm" c="dimmed">
                {progress.current} / {progress.total} ({progressPercentage}%)
              </Text>
            </Group>
            <Progress
              value={progressPercentage}
              color={getStatusColor()}
              size="lg"
              animated={progress.status === "running"}
            />
          </div>
        )}

        {/* 메시지 */}
        {progress.message && (
          <Alert
            icon={<IconInfoCircle size={16} />}
            color={getStatusColor()}
            variant="light"
          >
            {progress.message}
          </Alert>
        )}

        {/* 상태별 안내 메시지 */}
        {progress.status === "preparing" && (
          <Alert color="blue" variant="light">
            <Text size="sm">
              주식 데이터를 로드하고 백테스트 환경을 준비하고 있습니다...
            </Text>
          </Alert>
        )}

        {progress.status === "running" && (
          <Alert color="blue" variant="light">
            <Text size="sm">
              전략을 실행하며 일별 거래를 시뮬레이션하고 있습니다. 데이터가 많을
              경우 시간이 소요될 수 있습니다.
            </Text>
          </Alert>
        )}

        {progress.status === "error" && (
          <Alert color="red" variant="light">
            <Text size="sm">
              백테스트 실행 중 오류가 발생했습니다. 설정을 확인하고 다시
              시도해주세요.
            </Text>
          </Alert>
        )}

        {/* 액션 버튼 */}
        <Group justify="flex-end" gap="sm">
          {canCancel && onCancel && (
            <Button variant="outline" color="red" onClick={onCancel}>
              취소
            </Button>
          )}

          {isCompleted && (
            <Button onClick={onClose}>
              {progress.status === "completed" ? "결과 보기" : "닫기"}
            </Button>
          )}
        </Group>

        {/* 성능 팁 */}
        {progress.status === "running" && progress.total > 500 && (
          <Alert color="yellow" variant="light">
            <Text size="xs">
              <strong>팁:</strong> 백테스트 기간이 길수록 시간이 많이 걸립니다.
              테스트 목적이라면 더 짧은 기간으로 먼저 시도해보세요.
            </Text>
          </Alert>
        )}
      </Stack>
    </Modal>
  );
};
