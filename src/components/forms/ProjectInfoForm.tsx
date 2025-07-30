import { useState, useCallback, useEffect } from "react";
import {
  TextInput,
  Textarea,
  Stack,
  Card,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import type { Project } from "../../types/project";

interface ProjectInfoFormProps {
  project: Project;
  onChange?: (name: string, description: string) => void;
  disabled?: boolean;
}

export const ProjectInfoForm = ({ 
  project, 
  onChange, 
  disabled = false 
}: ProjectInfoFormProps) => {
  // 독립적인 상태 관리 (UI만 담당, 저장은 상위에서)
  const [projectName, setProjectName] = useState(project.name);
  const [projectDescription, setProjectDescription] = useState(project.description);

  // 검증 함수들 (메모이제이션)
  const nameValidator = useCallback((value: string) => {
    if (!value?.trim()) return "프로젝트 이름을 입력해주세요";
    if (value.length < 2) return "프로젝트 이름은 최소 2글자 이상이어야 합니다";
    if (value.length > 50) return "프로젝트 이름은 50글자를 초과할 수 없습니다";
    return null;
  }, []);

  const descriptionValidator = useCallback((value: string) => {
    if (value?.length > 500) return "설명은 500글자를 초과할 수 없습니다";
    return null;
  }, []);

  // 가벼운 폼 (검증만)
  const form = useForm({
    initialValues: {
      name: project.name,
      description: project.description,
    },
    validate: {
      name: nameValidator,
      description: descriptionValidator,
    },
    validateInputOnBlur: true,
    validateInputOnChange: false,
  });

  // 프로젝트 정보가 변경되면 상태 동기화
  useEffect(() => {
    setProjectName(project.name);
    setProjectDescription(project.description);
    form.setValues({
      name: project.name,
      description: project.description,
    });
  }, [project.id, project.name, project.description]);

  // 프로젝트 이름 변경 처리 (즉시 UI 반영, 저장은 상위에서)
  const handleNameChange = useCallback((value: string) => {
    setProjectName(value);
    form.setFieldValue("name", value);
    
    // 상위 컴포넌트에 변경 사항 알림 (저장은 상위에서 담당)
    if (onChange) {
      onChange(value, projectDescription);
    }
  }, [onChange, projectDescription, form]);

  // 프로젝트 설명 변경 처리 (즉시 UI 반영, 저장은 상위에서)
  const handleDescriptionChange = useCallback((value: string) => {
    setProjectDescription(value);
    form.setFieldValue("description", value);
    
    // 상위 컴포넌트에 변경 사항 알림 (저장은 상위에서 담당)
    if (onChange) {
      onChange(projectName, value);
    }
  }, [onChange, projectName, form]);

  return (
    <Card withBorder p="lg">
      <Stack gap="md">
        <TextInput
          label="프로젝트 이름"
          placeholder="예: 삼성전자 단순매매 전략"
          required
          value={projectName}
          onChange={(event) => handleNameChange(event.currentTarget.value)}
          onBlur={() => form.validateField("name")}
          error={form.errors.name}
          disabled={disabled}
        />

        <Textarea
          label="프로젝트 설명"
          placeholder="투자 전략에 대한 간단한 설명을 입력하세요"
          rows={4}
          value={projectDescription}
          onChange={(event) => handleDescriptionChange(event.currentTarget.value)}
          onBlur={() => form.validateField("description")}
          error={form.errors.description}
          disabled={disabled}
        />

        <Text size="xs" c="dimmed">
          프로젝트 정보는 새 버전으로 저장할 때 함께 저장됩니다.
        </Text>
      </Stack>
    </Card>
  );
};