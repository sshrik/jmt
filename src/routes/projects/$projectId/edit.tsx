import React, { useState, useCallback, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  ActionIcon,
  Tooltip,
  LoadingOverlay,
  Card,
  Alert,
  Breadcrumbs,
  Anchor,
  Stack,
  TextInput,
  Textarea,
  Divider,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconInfoCircle,
  IconChartLine,
  IconDeviceFloppy,
  IconX,
} from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useProjectStore } from "../../../hooks/useProjectStore";
import { ProjectStore } from "../../../stores/projectStore";
import { StrategyEditor } from "../../../components/strategy/StrategyEditor";
import type { Strategy } from "../../../types/strategy";
import { notifications } from "@mantine/notifications";

export const Route = createFileRoute("/projects/$projectId/edit")({
  component: ProjectEdit,
});

function ProjectEdit() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const { loading, error, updateProject } = useProjectStore();

  const [isStrategyModified, setIsStrategyModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 현재 프로젝트 찾기
  const project = useMemo(() => {
    try {
      return ProjectStore.getProjectById(projectId);
    } catch {
      return null;
    }
  }, [projectId]);

  // 프로젝트 기본 정보 폼
  const form = useForm({
    initialValues: {
      name: project?.name || "",
      description: project?.description || "",
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

  // 프로젝트 정보가 로드되면 폼 값 업데이트
  React.useEffect(() => {
    if (project) {
      form.setValues({
        name: project.name,
        description: project.description,
      });
    }
  }, [project, form]);

  // 기본 전략 생성 (현재 버전)
  const strategy = useMemo((): Strategy => {
    if (!project) {
      return {
        id: "temp-strategy",
        projectId: projectId,
        versionId: "v1.0",
        name: "기본 전략",
        description: "이 프로젝트의 투자 전략입니다.",
        blocks: [],
        blockOrder: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };
    }

    return {
      id: `strategy-${project.id}`,
      projectId: project.id,
      versionId: project.versions[0]?.versionName || "v1.0",
      name: `${project.name} 전략`,
      description: project.description,
      blocks: [], // TODO: 실제 전략 데이터 연동
      blockOrder: [],
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      isActive: true,
    };
  }, [project, projectId]);

  // 전략 업데이트
  const handleStrategyUpdate = useCallback((updatedStrategy: Strategy) => {
    console.log("전략 업데이트:", updatedStrategy);
    setIsStrategyModified(true);
  }, []);

  // 백테스트 실행
  const handleBacktest = useCallback(() => {
    console.log("백테스트 실행:", strategy);
    notifications.show({
      title: "백테스트 실행",
      message: "백테스트 기능은 곧 구현 예정입니다!",
      color: "blue",
    });
  }, [strategy]);

  // 모든 변경사항 저장
  const handleSaveAll = useCallback(async () => {
    const validation = form.validate();
    if (validation.hasErrors) {
      notifications.show({
        title: "입력 오류",
        message: "프로젝트 정보를 올바르게 입력해주세요.",
        color: "red",
      });
      return;
    }

    try {
      setIsSaving(true);

      // 프로젝트 기본 정보 업데이트
      if (
        project &&
        (form.values.name !== project.name ||
          form.values.description !== project.description)
      ) {
        await updateProject(
          project.id,
          form.values.name,
          form.values.description
        );
      }

      // TODO: 전략 데이터 저장
      if (isStrategyModified) {
        console.log("전략 저장:", strategy);
        // ProjectStore.updateStrategy(projectId, strategy) 같은 함수 구현 예정
      }

      notifications.show({
        title: "저장 완료",
        message: "모든 변경사항이 성공적으로 저장되었습니다.",
        color: "green",
      });

      setIsStrategyModified(false);

      // 상세 페이지로 이동
      navigate({ to: `/projects/${projectId}` });
    } catch {
      notifications.show({
        title: "저장 실패",
        message: "변경사항 저장 중 오류가 발생했습니다.",
        color: "red",
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    form,
    project,
    updateProject,
    isStrategyModified,
    strategy,
    navigate,
    projectId,
  ]);

  // 취소 (변경사항 확인)
  const handleCancel = useCallback(() => {
    const hasChanges =
      project &&
      (form.values.name !== project.name ||
        form.values.description !== project.description ||
        isStrategyModified);

    if (hasChanges) {
      const confirmed = window.confirm(
        "변경사항이 저장되지 않습니다. 정말 취소하시겠습니까?"
      );
      if (!confirmed) return;
    }

    navigate({ to: `/projects/${projectId}` });
  }, [form.values, project, isStrategyModified, navigate, projectId]);

  // 로딩 상태
  if (loading) {
    return (
      <Container size="xl" style={{ position: "relative", minHeight: "400px" }}>
        <LoadingOverlay visible />
      </Container>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <Container size="xl">
        <Alert color="red" title="오류 발생">
          {error}
        </Alert>
      </Container>
    );
  }

  // 프로젝트를 찾을 수 없는 경우
  if (!project) {
    return (
      <Container size="xl">
        <Card padding="xl" withBorder style={{ textAlign: "center" }}>
          <IconChartLine
            size={48}
            style={{ margin: "0 auto", marginBottom: 16 }}
          />
          <Title order={3} mb="xs">
            프로젝트를 찾을 수 없습니다
          </Title>
          <Text c="dimmed" mb="lg">
            요청하신 프로젝트가 존재하지 않거나 삭제되었을 수 있습니다.
          </Text>
          <Button onClick={() => navigate({ to: "/" })}>
            프로젝트 목록으로 돌아가기
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="xl">
      {/* 네비게이션 */}
      <Group mb="lg">
        <Tooltip label="취소">
          <ActionIcon variant="subtle" size="lg" onClick={handleCancel}>
            <IconArrowLeft size={20} />
          </ActionIcon>
        </Tooltip>

        <Breadcrumbs>
          <Anchor onClick={() => navigate({ to: "/" })}>프로젝트 목록</Anchor>
          <Anchor onClick={() => navigate({ to: `/projects/${projectId}` })}>
            {project.name}
          </Anchor>
          <Text>편집</Text>
        </Breadcrumbs>
      </Group>

      {/* 페이지 헤더 */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>프로젝트 편집</Title>
          <Text c="dimmed" size="lg" mt="xs">
            프로젝트 정보와 투자 전략을 수정하세요
          </Text>
        </div>

        <Group>
          <Button
            variant="subtle"
            leftSection={<IconX size={16} />}
            onClick={handleCancel}
          >
            취소
          </Button>
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSaveAll}
            loading={isSaving}
          >
            저장
          </Button>
        </Group>
      </Group>

      <Stack gap="xl">
        {/* 프로젝트 기본 정보 섹션 */}
        <Card withBorder p="lg">
          <Title order={3} mb="md">
            프로젝트 기본 정보
          </Title>

          <Stack gap="md">
            <TextInput
              label="프로젝트 이름"
              placeholder="예: 삼성전자 단순매매 전략"
              required
              {...form.getInputProps("name")}
              disabled={isSaving}
            />

            <Textarea
              label="프로젝트 설명"
              placeholder="투자 전략에 대한 간단한 설명을 입력하세요"
              rows={3}
              {...form.getInputProps("description")}
              disabled={isSaving}
            />
          </Stack>
        </Card>

        <Divider />

        {/* 투자 전략 편집 섹션 */}
        <div>
          <Group justify="space-between" mb="lg">
            <div>
              <Title order={3}>투자 전략 편집</Title>
              <Text c="dimmed" size="sm" mt="xs">
                매매 조건과 액션을 설정하여 투자 전략을 구성하세요
              </Text>
            </div>
          </Group>

          <Alert
            icon={<IconInfoCircle size={16} />}
            color="blue"
            variant="light"
            mb="lg"
          >
            <Text size="sm">
              <strong>편집 도움말:</strong> 조건 블록에서 매매 조건을 설정하고,
              액션 블록에서 실행할 매매 행동을 정의하세요. 모든 변경사항은
              "저장" 버튼을 클릭해야 적용됩니다.
            </Text>
          </Alert>

          {/* 전략 에디터 */}
          <StrategyEditor
            strategy={strategy}
            onStrategyUpdate={handleStrategyUpdate}
            onBacktest={handleBacktest}
            readOnly={isSaving}
          />
        </div>

        {/* 변경사항 알림 */}
        {(isStrategyModified ||
          (project &&
            (form.values.name !== project.name ||
              form.values.description !== project.description))) && (
          <Alert color="orange">
            <Text size="sm">
              <strong>변경사항이 있습니다.</strong> "저장" 버튼을 클릭하여
              변경사항을 저장하세요.
            </Text>
          </Alert>
        )}
      </Stack>
    </Container>
  );
}
