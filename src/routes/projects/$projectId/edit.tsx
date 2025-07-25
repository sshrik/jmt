import { useState, useCallback, useMemo, useEffect } from "react";
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
  Badge,
  Progress,
  Kbd,
  Modal,
  Tabs,
  Affix,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconInfoCircle,
  IconChartLine,
  IconDeviceFloppy,
  IconX,
  IconCloudCheck,
  IconCloudX,
  IconKeyboard,
  IconEye,
  IconEdit,
  IconHistory,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useHotkeys, useDisclosure, useInterval } from "@mantine/hooks";
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

  // 상태 관리
  const [isStrategyModified, setIsStrategyModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>("basic");
  const [currentStrategy, setCurrentStrategy] = useState<Strategy | null>(null);

  // 모달 상태
  const [previewOpened, { open: openPreview, close: closePreview }] =
    useDisclosure(false);
  const [helpOpened, { open: openHelp, close: closeHelp }] =
    useDisclosure(false);
  const [
    exitConfirmOpened,
    { open: openExitConfirm, close: closeExitConfirm },
  ] = useDisclosure(false);

  // 자동 저장 상태
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const autoSaveInterval = useInterval(() => {
    if (autoSaveEnabled && hasUnsavedChanges && !isSaving) {
      handleAutoSave();
    }
  }, 30000); // 30초마다 자동 저장

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
        if (value.length > 500) return "설명은 500글자를 초과할 수 없습니다";
        return null;
      },
    },
    onValuesChange: () => {
      setHasUnsavedChanges(true);
    },
  });

  // 프로젝트 정보가 로드되면 폼 값 업데이트
  useEffect(() => {
    if (project) {
      form.setValues({
        name: project.name,
        description: project.description,
      });
      form.resetDirty();
    }
  }, [project]);

  // 자동 저장 시작/중지
  useEffect(() => {
    if (autoSaveEnabled) {
      autoSaveInterval.start();
    } else {
      autoSaveInterval.stop();
    }
    return autoSaveInterval.stop;
  }, [autoSaveEnabled]);

  // 기본 전략 생성 (현재 버전)
  const baseStrategy = useMemo((): Strategy => {
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
      // @ts-expect-error - 타입 불일치 임시 해결
      blocks: project.versions[0]?.strategy || [], // 실제 전략 데이터 연동
      blockOrder: [],
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      isActive: true,
    };
  }, [project, projectId]);

  // 현재 사용할 전략 (수정된 전략이 있으면 그것을, 없으면 기본 전략)
  const strategy = currentStrategy || baseStrategy;

  // 기본 전략이 로드되면 현재 전략으로 설정
  useEffect(() => {
    if (!currentStrategy && baseStrategy) {
      setCurrentStrategy(baseStrategy);
    }
  }, [baseStrategy, currentStrategy]);

  // 전략 업데이트
  const handleStrategyUpdate = useCallback((updatedStrategy: Strategy) => {
    console.log("전략 업데이트:", updatedStrategy);
    setCurrentStrategy(updatedStrategy);
    setIsStrategyModified(true);
    setHasUnsavedChanges(true);
  }, []);

  // 백테스트 실행
  const handleBacktest = useCallback(() => {
    console.log("백테스트 실행:", strategy);
    notifications.show({
      title: "백테스트 실행",
      message: "백테스트 기능은 곧 구현 예정입니다!",
      color: "blue",
      icon: <IconChartLine size={16} />,
    });
  }, [strategy]);

  // 자동 저장
  const handleAutoSave = useCallback(async () => {
    if (!project || isSaving) return;

    try {
      setIsSaving(true);
      setSaveProgress(0);

      // 프로젝트 기본 정보 업데이트
      if (form.isDirty()) {
        setSaveProgress(30);
        await updateProject(
          project.id,
          form.values.name,
          form.values.description
        );
      }

      // 전략 데이터 저장
      if (isStrategyModified) {
        setSaveProgress(60);
        const currentProject = project;
        if (!currentProject) {
          throw new Error("프로젝트를 찾을 수 없습니다.");
        }

        const strategyBlocks = (currentStrategy || strategy).blocks.map(
          (block) => ({
            ...block,
            position: { x: 0, y: 0 },
            connections: [],
          })
        );

        ProjectStore.updateProjectStrategy(projectId, strategyBlocks);
      }

      setSaveProgress(100);
      setIsStrategyModified(false);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      form.resetDirty();

      notifications.show({
        title: "자동 저장 완료",
        message: "변경사항이 자동으로 저장되었습니다.",
        color: "green",
        icon: <IconCloudCheck size={16} />,
        autoClose: 2000,
      });
    } catch (error) {
      console.error("자동 저장 실패:", error);
      notifications.show({
        title: "자동 저장 실패",
        message: "변경사항 저장 중 오류가 발생했습니다.",
        color: "red",
        icon: <IconCloudX size={16} />,
      });
    } finally {
      setIsSaving(false);
      setSaveProgress(0);
    }
  }, [form, project, updateProject, isStrategyModified, strategy, projectId]);

  // 수동 저장
  const handleSaveAll = useCallback(async () => {
    const validation = form.validate();
    if (validation.hasErrors) {
      notifications.show({
        title: "입력 오류",
        message: "프로젝트 정보를 올바르게 입력해주세요.",
        color: "red",
        icon: <IconAlertTriangle size={16} />,
      });
      return;
    }

    await handleAutoSave();

    notifications.show({
      title: "저장 완료",
      message: "모든 변경사항이 성공적으로 저장되었습니다.",
      color: "green",
      icon: <IconCheck size={16} />,
    });

    navigate({ to: `/projects/${projectId}` });
  }, [form, handleAutoSave, navigate, projectId]);

  // 취소 (변경사항 확인)
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      openExitConfirm();
    } else {
      navigate({ to: `/projects/${projectId}` });
    }
  }, [hasUnsavedChanges, navigate, projectId, openExitConfirm]);

  // 강제 종료
  const handleForceExit = useCallback(() => {
    navigate({ to: `/projects/${projectId}` });
  }, [navigate, projectId]);

  // 키보드 단축키
  useHotkeys([
    [
      "mod+S",
      (e) => {
        e.preventDefault();
        handleSaveAll();
      },
    ],
    [
      "mod+K",
      (e) => {
        e.preventDefault();
        openHelp();
      },
    ],
    [
      "Escape",
      () => {
        handleCancel();
      },
    ],
    [
      "mod+Enter",
      () => {
        handleBacktest();
      },
    ],
    [
      "mod+P",
      (e) => {
        e.preventDefault();
        openPreview();
      },
    ],
  ]);

  // 브라우저 종료 시 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

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
        <Alert
          color="red"
          title="오류 발생"
          icon={<IconAlertTriangle size={16} />}
        >
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
      {/* 진행률 표시 */}
      {isSaving && (
        <Affix position={{ top: 0, left: 0, right: 0 }}>
          <Progress
            value={saveProgress}
            color="blue"
            size="xs"
            striped
            animated
          />
        </Affix>
      )}

      {/* 네비게이션 */}
      <Group mb="lg">
        <Tooltip label="뒤로 가기 (Esc)">
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
          <Group>
            <Title order={1}>프로젝트 저장</Title>
            {hasUnsavedChanges && (
              <Badge color="orange" variant="light" size="sm">
                저장되지 않음
              </Badge>
            )}
          </Group>
          <Group mt="xs">
            <Text c="dimmed" size="sm">
              {project.versions[0]?.versionName || "v1.0"} 버전 편집 중
            </Text>
            {lastSaved && (
              <Text c="dimmed" size="sm">
                • 마지막 저장: {lastSaved.toLocaleTimeString("ko-KR")}
              </Text>
            )}
          </Group>
        </div>

        <Group>
          <Tooltip label="키보드 단축키 (⌘+K)">
            <Button
              variant="subtle"
              onClick={openHelp}
              leftSection={<IconKeyboard size={16} />}
            >
              도움말
            </Button>
          </Tooltip>
          <Tooltip label="미리보기 (⌘+P)">
            <Button
              variant="subtle"
              onClick={openPreview}
              leftSection={<IconEye size={16} />}
            >
              미리보기
            </Button>
          </Tooltip>
          <Tooltip label="취소 (Esc)">
            <Button
              variant="subtle"
              leftSection={<IconX size={16} />}
              onClick={handleCancel}
            >
              취소
            </Button>
          </Tooltip>
          <Tooltip label="저장하기 (⌘+S)">
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleSaveAll}
              loading={isSaving}
            >
              저장하기
            </Button>
          </Tooltip>
        </Group>
      </Group>

      {/* 자동 저장 상태 */}
      <Alert
        variant="light"
        color={autoSaveEnabled ? "green" : "gray"}
        icon={
          autoSaveEnabled ? (
            <IconCloudCheck size={16} />
          ) : (
            <IconCloudX size={16} />
          )
        }
        mb="lg"
        style={{ cursor: "pointer" }}
        onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
      >
        <Group justify="space-between">
          <Text size="sm">
            자동 저장: {autoSaveEnabled ? "활성화됨 (30초마다)" : "비활성화됨"}
          </Text>
          <Text size="xs" c="dimmed">
            클릭하여 {autoSaveEnabled ? "비활성화" : "활성화"}
          </Text>
        </Group>
      </Alert>

      {/* 탭 메뉴 */}
      <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="basic" leftSection={<IconEdit size={16} />}>
            기본 정보
          </Tabs.Tab>
          <Tabs.Tab value="strategy" leftSection={<IconChartLine size={16} />}>
            투자 전략
          </Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
            버전 히스토리
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="basic">
          <Card withBorder p="lg">
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
                rows={4}
                {...form.getInputProps("description")}
                disabled={isSaving}
              />

              {form.errors.name && (
                <Alert color="red" variant="light">
                  {form.errors.name}
                </Alert>
              )}
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="strategy">
          <Stack gap="lg">
            {isStrategyModified && (
              <Alert
                color="orange"
                variant="light"
                icon={<IconInfoCircle size={16} />}
              >
                <Text size="sm">
                  전략이 수정되었습니다. 변경사항을 저장하려면 "저장하기" 버튼을
                  클릭하세요.
                </Text>
              </Alert>
            )}

            <Alert
              icon={<IconInfoCircle size={16} />}
              color="blue"
              variant="light"
              mb="lg"
            >
              <Text size="sm">
                <strong>블록 추가 방법:</strong> 아래 "조건 추가" 또는 "액션
                추가" 버튼을 클릭하여 새로운 전략 블록을 추가할 수 있습니다.
                조건 블록은 매매 조건을, 액션 블록은 실행할 행동을 정의합니다.
              </Text>
            </Alert>

            <StrategyEditor
              strategy={strategy}
              onStrategyUpdate={handleStrategyUpdate}
              onBacktest={handleBacktest}
              readOnly={isSaving}
            />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="history">
          <Card withBorder p="lg">
            <Title order={4} mb="md">
              버전 히스토리
            </Title>
            <Text c="dimmed">버전 관리 기능은 곧 구현 예정입니다.</Text>
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* 미리보기 모달 */}
      <Modal
        opened={previewOpened}
        onClose={closePreview}
        title="프로젝트 미리보기"
        size="lg"
      >
        <Stack gap="md">
          <div>
            <Text fw={500} mb="xs">
              프로젝트 이름
            </Text>
            <Text>{form.values.name || "프로젝트 이름 없음"}</Text>
          </div>
          <div>
            <Text fw={500} mb="xs">
              설명
            </Text>
            <Text>{form.values.description || "설명 없음"}</Text>
          </div>
          <div>
            <Text fw={500} mb="xs">
              전략 상태
            </Text>
            <Badge color={strategy.blocks.length > 0 ? "green" : "orange"}>
              {strategy.blocks.length > 0 ? "전략 설정됨" : "전략 없음"}
            </Badge>
          </div>
        </Stack>
      </Modal>

      {/* 도움말 모달 */}
      <Modal
        opened={helpOpened}
        onClose={closeHelp}
        title="키보드 단축키"
        size="md"
      >
        <Stack gap="md">
          <Group justify="space-between">
            <Text>저장</Text>
            <Group gap="xs">
              <Kbd>⌘</Kbd> + <Kbd>S</Kbd>
            </Group>
          </Group>
          <Group justify="space-between">
            <Text>도움말</Text>
            <Group gap="xs">
              <Kbd>⌘</Kbd> + <Kbd>K</Kbd>
            </Group>
          </Group>
          <Group justify="space-between">
            <Text>미리보기</Text>
            <Group gap="xs">
              <Kbd>⌘</Kbd> + <Kbd>P</Kbd>
            </Group>
          </Group>
          <Group justify="space-between">
            <Text>백테스트</Text>
            <Group gap="xs">
              <Kbd>⌘</Kbd> + <Kbd>Enter</Kbd>
            </Group>
          </Group>
          <Group justify="space-between">
            <Text>취소</Text>
            <Kbd>Esc</Kbd>
          </Group>
        </Stack>
      </Modal>

      {/* 종료 확인 모달 */}
      <Modal
        opened={exitConfirmOpened}
        onClose={closeExitConfirm}
        title="저장되지 않은 변경사항"
        centered
      >
        <Stack gap="md">
          <Text>
            저장되지 않은 변경사항이 있습니다. 정말로 편집을 종료하시겠습니까?
          </Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeExitConfirm}>
              계속 편집
            </Button>
            <Button color="red" onClick={handleForceExit}>
              변경사항 버리고 나가기
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
