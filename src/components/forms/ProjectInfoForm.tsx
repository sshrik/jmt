import { useState, useCallback, useEffect, useRef } from "react";
import {
  TextInput,
  Textarea,
  Stack,
  Card,
  Alert,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import type { Project } from "../../types/project";

interface ProjectInfoFormProps {
  project: Project;
  onUpdate: (id: string, name: string, description: string) => Promise<void>;
  disabled?: boolean;
}

export const ProjectInfoForm = ({ 
  project, 
  onUpdate, 
  disabled = false 
}: ProjectInfoFormProps) => {
  // 독립적인 상태 관리 (완전 분리)
  const [projectName, setProjectName] = useState(project.name);
  const [projectDescription, setProjectDescription] = useState(project.description);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 타이머 관리
  const nameTimerRef = useRef<number>();
  const descTimerRef = useRef<number>();

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

  // 실시간 저장 함수
  const saveProjectInfo = useCallback(async (name: string, description: string) => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      await onUpdate(project.id, name, description);
      setLastSaved(new Date());
    } catch (error) {
      console.error("프로젝트 정보 저장 실패:", error);
      notifications.show({
        title: "저장 실패",
        message: "프로젝트 정보 저장 중 오류가 발생했습니다.",
        color: "red",
        autoClose: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  }, [project.id, onUpdate, isSaving]);

  // 프로젝트 이름 변경 처리
  const handleNameChange = useCallback((value: string) => {
    setProjectName(value);
    form.setFieldValue("name", value);
    
    // 기존 타이머 제거
    if (nameTimerRef.current) {
      window.clearTimeout(nameTimerRef.current);
    }
    
    // 500ms 후 자동 저장 (더 빠르게)
    nameTimerRef.current = window.setTimeout(() => {
      saveProjectInfo(value, projectDescription);
    }, 500);
  }, [saveProjectInfo, projectDescription, form]);

  // 프로젝트 설명 변경 처리
  const handleDescriptionChange = useCallback((value: string) => {
    setProjectDescription(value);
    form.setFieldValue("description", value);
    
    // 기존 타이머 제거
    if (descTimerRef.current) {
      window.clearTimeout(descTimerRef.current);
    }
    
    // 500ms 후 자동 저장 (더 빠르게)
    descTimerRef.current = window.setTimeout(() => {
      saveProjectInfo(projectName, value);
    }, 500);
  }, [saveProjectInfo, projectName, form]);

  // 타이머 정리
  useEffect(() => {
    return () => {
      if (nameTimerRef.current) {
        window.clearTimeout(nameTimerRef.current);
      }
      if (descTimerRef.current) {
        window.clearTimeout(descTimerRef.current);
      }
    };
  }, []);

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
          disabled={disabled || isSaving}
        />

        <Textarea
          label="프로젝트 설명"
          placeholder="투자 전략에 대한 간단한 설명을 입력하세요"
          rows={4}
          value={projectDescription}
          onChange={(event) => handleDescriptionChange(event.currentTarget.value)}
          onBlur={() => form.validateField("description")}
          error={form.errors.description}
          disabled={disabled || isSaving}
        />

        {form.errors.name && (
          <Alert color="red" variant="light">
            {form.errors.name}
          </Alert>
        )}

        {lastSaved && (
          <Text size="xs" c="dimmed">
            마지막 저장: {lastSaved.toLocaleTimeString()}
          </Text>
        )}
      </Stack>
    </Card>
  );
};