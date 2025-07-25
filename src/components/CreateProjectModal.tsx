import { useState } from "react";
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Stack,
  Group,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconPlus } from "@tabler/icons-react";

interface CreateProjectModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => Promise<void>;
  loading?: boolean;
}

interface ProjectForm {
  name: string;
  description: string;
}

export const CreateProjectModal = ({
  opened,
  onClose,
  onSubmit,
  loading = false,
}: CreateProjectModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProjectForm>({
    initialValues: {
      name: "",
      description: "",
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return "프로젝트 이름을 입력해주세요";
        if (value.length < 2)
          return "프로젝트 이름은 최소 2글자 이상이어야 합니다";
        if (value.length > 50)
          return "프로젝트 이름은 50글자를 초과할 수 없습니다";
        return null;
      },
      description: (value) => {
        if (value.length > 200) return "설명은 200글자를 초과할 수 없습니다";
        return null;
      },
    },
  });

  const handleSubmit = async (values: ProjectForm) => {
    try {
      setIsSubmitting(true);
      await onSubmit(values.name, values.description);

      // 성공 시 폼 초기화 및 모달 닫기
      form.reset();
      onClose();
    } catch (error) {
      // 에러 처리는 부모 컴포넌트에서 처리됨 (notifications)
      console.error("프로젝트 생성 실패:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !loading) {
      form.reset();
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="새 프로젝트 만들기"
      size="md"
      centered
      closeOnClickOutside={!isSubmitting && !loading}
      closeOnEscape={!isSubmitting && !loading}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="프로젝트 이름"
            placeholder="예: 삼성전자 단순매매 전략"
            required
            {...form.getInputProps("name")}
            disabled={isSubmitting || loading}
            data-autofocus
          />

          <Textarea
            label="프로젝트 설명"
            placeholder="투자 전략에 대한 간단한 설명을 입력하세요"
            rows={4}
            {...form.getInputProps("description")}
            disabled={isSubmitting || loading}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={handleClose}
              disabled={isSubmitting || loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              leftSection={<IconPlus size={16} />}
              loading={isSubmitting || loading}
            >
              프로젝트 생성
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
