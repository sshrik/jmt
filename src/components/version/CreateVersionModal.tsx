import {
  Modal,
  Stack,
  Textarea,
  Group,
  Button,
  Switch,
  Text,
  Alert,
  Badge,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState, useMemo } from "react";
import { IconGitBranch, IconAlertCircle } from "@tabler/icons-react";
import type {
  Project,
  Version,
  VersionCreationOptions,
} from "../../types/project";
import type { Strategy } from "../../types/strategy";
import { VersionStore } from "../../stores/versionStore";

interface CreateVersionModalProps {
  opened: boolean;
  onClose: () => void;
  project: Project;
  strategy: Strategy;
  onVersionCreated: (version: Version, shouldRunBacktest?: boolean) => void;
  initialDescription?: string;
}

export const CreateVersionModal = ({
  opened,
  onClose,
  project,
  strategy,
  onVersionCreated,
  initialDescription = "",
}: CreateVersionModalProps) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<VersionCreationOptions>({
    initialValues: {
      description: initialDescription,
      shouldRunBacktest: false,
    },
    validate: {
      description: (value) =>
        value.trim().length === 0 ? "버전 설명을 입력해주세요" : null,
    },
  });

  const latestVersion = VersionStore.getLatestVersion(project);
  const nextVersionName = VersionStore.generateVersionName(project.versions);

  // 변경사항 분석
  const hasChanges = useMemo(() => {
    if (!latestVersion || !latestVersion.strategy) {
      return true; // 최신 버전이 없으면 변경사항이 있다고 간주
    }

    try {
      // 전략 객체만 직접 비교
      const comparison = VersionStore.compareVersions(
        { ...latestVersion, strategy: latestVersion.strategy },
        { ...latestVersion, strategy }
      );
      return comparison.hasChanges;
    } catch (error) {
      console.warn("버전 비교 중 오류:", error);
      return true; // 에러 발생 시 변경사항이 있다고 간주
    }
  }, [latestVersion, strategy]);

  const handleSubmit = async (values: VersionCreationOptions) => {
    setLoading(true);

    try {
      const newVersion = VersionStore.createVersion(project, strategy, values);
      onVersionCreated(newVersion, values.shouldRunBacktest);
      onClose();
      form.reset();
    } catch (error) {
      console.error("버전 생성 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <IconGitBranch size={20} />
          <Text fw={600}>새 버전 생성</Text>
        </Group>
      }
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* 버전 정보 표시 */}
          <Group gap="sm">
            <Text size="sm" c="dimmed">
              생성될 버전:
            </Text>
            <Badge variant="light" color="blue">
              {nextVersionName}
            </Badge>
          </Group>

          {/* 변경사항 경고 */}
          {!hasChanges && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="변경사항 없음"
              color="yellow"
            >
              현재 전략은 최신 버전과 동일합니다. 정말 새 버전을
              생성하시겠습니까?
            </Alert>
          )}

          {/* 설명 입력 */}
          <Textarea
            label="버전 설명"
            placeholder="이 버전의 주요 변경사항이나 개선 내용을 설명해주세요"
            required
            rows={4}
            {...form.getInputProps("description")}
          />

          {/* 옵션들 */}
          <Switch
            label="버전 생성 후 백테스트 실행"
            description="새 버전이 생성된 후 자동으로 백테스트를 실행합니다"
            {...form.getInputProps("shouldRunBacktest", { type: "checkbox" })}
          />

          {/* 전략 정보 */}
          <Alert color="blue" title="현재 전략 정보">
            <Stack gap="xs">
              <Text size="sm">• 블록: {strategy.blocks.length}개</Text>
              <Text size="sm">
                • 조건 블록:{" "}
                {strategy.blocks.filter((b) => b.type === "condition").length}개
              </Text>
              <Text size="sm">
                • 액션 블록:{" "}
                {strategy.blocks.filter((b) => b.type === "action").length}개
              </Text>
              {strategy.description && (
                <Text size="sm" c="dimmed">
                  전략 설명: {strategy.description}
                </Text>
              )}
            </Stack>
          </Alert>

          {/* 버튼들 */}
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={handleClose} disabled={loading}>
              취소
            </Button>
            <Button
              type="submit"
              loading={loading}
              leftSection={<IconGitBranch size={16} />}
            >
              버전 생성
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
