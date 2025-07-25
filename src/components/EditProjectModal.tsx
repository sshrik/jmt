import { useState, useEffect } from "react";
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Stack,
  Group,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconEdit } from "@tabler/icons-react";

interface EditProjectModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => Promise<void>;
  loading?: boolean;
  project: {
    id: string;
    name: string;
    description: string;
  } | null;
}

interface ProjectForm {
  name: string;
  description: string;
}

export const EditProjectModal = ({
  opened,
  onClose,
  onSubmit,
  loading = false,
  project,
}: EditProjectModalProps) => {
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

  // 프로젝트 정보가 변경되면 폼 값 업데이트
  useEffect(() => {
    if (project) {
      form.setValues({
        name: project.name,
        description: project.description,
      });
    }
  }, [project]);

  const handleSubmit = async (values: ProjectForm) => {
    try {
      setIsSubmitting(true);
      await onSubmit(values.name, values.description);

      // 성공 시 모달 닫기 (폼 초기화는 부모에서 처리)
      onClose();
    } catch (error) {
      // 에러 처리는 부모 컴포넌트에서 처리됨 (notifications)
      console.error("프로젝트 수정 실패:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !loading) {
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="프로젝트 편집"
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
              leftSection={<IconEdit size={16} />}
              loading={isSubmitting || loading}
            >
              수정 완료
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
