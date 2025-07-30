import { useState, useCallback, useMemo, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  LoadingOverlay,
  Alert,
  Breadcrumbs,
  Anchor,
  Stack,
  Badge,
  Progress,
  Kbd,
  Modal,
  Tabs,
  Affix,
  Menu,
  ActionIcon,
} from "@mantine/core";
import {
  IconInfoCircle,
  IconChartLine,
  IconCloudCheck,
  IconCloudX,
  IconKeyboard,
  IconEye,
  IconEdit,
  IconCheck,
  IconAlertTriangle,
  IconTrendingUp,
  IconDots,
  IconGitBranch,
} from "@tabler/icons-react";

import { useHotkeys, useDisclosure, useInterval } from "@mantine/hooks";
import { useProjectStore } from "../../../hooks/useProjectStore";
import { ProjectStore } from "../../../stores/projectStore";
import { StrategyEditor } from "../../../components/strategy/StrategyEditor";
import { BacktestRunner } from "../../../components/backtest/BacktestRunner";
import { CreateVersionModal } from "../../../components/version/CreateVersionModal";
import { ProjectInfoForm } from "../../../components/forms/ProjectInfoForm";
import type { Strategy } from "../../../types/strategy";
import type { Version } from "../../../types/project";
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
    createVersionOpened,
    { open: openCreateVersion, close: closeCreateVersion },
  ] = useDisclosure(false);

  // 자동 저장 상태 (프로젝트 정보와 전략 분리)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // 실시간 저장으로 대체되었으므로 주석 처리
  // const projectInfoAutoSave = useInterval(() => {
  //   if (form.isDirty() && !isSaving) {
  //     handleSaveProjectInfo();
  //   }
  // }, 5000);

  // 전략 자동 저장 (느린 주기, 조건 유지)
  const strategyAutoSave = useInterval(() => {
    if (autoSaveEnabled && isStrategyModified && !isSaving) {
      handleAutoSave();
    }
  }, 120000); // 2분마다 전략 자동 저장

  // 현재 프로젝트 찾기
  const project = useMemo(() => {
    try {
      return ProjectStore.getProjectById(projectId);
    } catch {
      return null;
    }
  }, [projectId]);



  // 자동 저장 시작/중지 (전략만 - 프로젝트 정보는 실시간 저장)
  useEffect(() => {
    // 전략 자동 저장만 관리 (프로젝트 정보는 실시간 저장으로 대체)
    if (autoSaveEnabled) {
      strategyAutoSave.start();
    } else {
      strategyAutoSave.stop();
    }

    return () => {
      strategyAutoSave.stop();
    };
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

    // 기존 블록 타입 마이그레이션
    const rawStrategy = project.versions[0]?.strategy;
    const rawBlocks = Array.isArray(rawStrategy)
      ? rawStrategy
      : rawStrategy?.blocks || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const migratedBlocks = rawBlocks.map((block: any) => {
      // 기존 price_change_percent를 close_price_change로 마이그레이션
      if (block.conditionType === "price_change_percent") {
        return {
          ...block,
          conditionType: "close_price_change",
        };
      }
      return block;
    });

    // blockOrder가 없으면 blocks의 id로 자동 생성
    const blockOrder = migratedBlocks.map((block) => block.id);

    const strategy: Strategy = {
      id: `strategy-${project.id}`,
      projectId: project.id,
      versionId: project.versions[0]?.versionName || "v1.0",
      name: `${project.name} 전략`,
      description: project.description,
      blocks: migratedBlocks, // 마이그레이션된 전략 데이터
      blockOrder: blockOrder, // 블록 ID 순서대로 자동 생성
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      isActive: true,
    };

    return strategy;
  }, [project, projectId]);

  // 현재 사용할 전략 (수정된 전략이 있으면 그것을, 없으면 기본 전략)
  const strategy = currentStrategy || baseStrategy;

  // 기본 전략이 로드되면 현재 전략으로 설정 (매번 최신 데이터로 업데이트)
  useEffect(() => {
    if (baseStrategy) {
      setCurrentStrategy(baseStrategy);
    }
  }, [baseStrategy]);

  // 전략 업데이트
  const handleStrategyUpdate = useCallback((updatedStrategy: Strategy) => {
    setCurrentStrategy(updatedStrategy);
    setIsStrategyModified(true);
    setHasUnsavedChanges(true);
  }, []);

  // 백테스트 실행
  const handleBacktest = useCallback(() => {
    notifications.show({
      title: "백테스트 실행",
      message: "백테스트 기능은 곧 구현 예정입니다!",
      color: "blue",
      icon: <IconTrendingUp size={16} />,
    });
  }, [strategy]);

  // 전략만 저장하는 자동 저장 함수 (프로젝트 정보와 분리)
  const handleAutoSave = useCallback(async () => {
    if (!project || isSaving || !isStrategyModified) return;

    try {
      setIsSaving(true);
      setSaveProgress(0);

      // 전략 데이터만 자동 저장
      const currentStrategyToSave = currentStrategy || strategy;
      if (currentStrategyToSave.blocks.length > 0) {
        setSaveProgress(60);

        // 불필요한 객체 생성 최소화
        const strategyBlocks = currentStrategyToSave.blocks.map((block) => ({
          ...block,
          position: { x: 0, y: 0 },
          connections: [],
        }));

        try {
          ProjectStore.updateProjectStrategy(projectId, strategyBlocks);

          // 저장 확인
          const savedProject = ProjectStore.getProjectById(projectId);
          const savedStrategy = savedProject?.versions[0]?.strategy;
          const savedBlocks = Array.isArray(savedStrategy)
            ? savedStrategy
            : savedStrategy?.blocks || [];
          if (!savedStrategy || savedBlocks.length !== strategyBlocks.length) {
            throw new Error("전략 저장에 실패했습니다.");
          }

          setSaveProgress(100);
          setIsStrategyModified(false);
          setLastSaved(new Date());
          setCurrentStrategy(null);

          notifications.show({
            title: "전략 자동 저장 완료",
            message: "투자 전략이 자동으로 저장되었습니다.",
            color: "green",
            icon: <IconCloudCheck size={16} />,
            autoClose: 2000,
          });
        } catch (error) {
          console.error("전략 자동 저장 중 오류:", error);
          throw error;
        }
      }
    } catch (error) {
      console.error("전략 자동 저장 실패:", error);
      notifications.show({
        title: "전략 자동 저장 실패",
        message: "전략 저장 중 오류가 발생했습니다.",
        color: "red",
        icon: <IconCloudX size={16} />,
      });
    } finally {
      setIsSaving(false);
      setSaveProgress(0);
    }
  }, [project?.id, isStrategyModified, currentStrategy, strategy, projectId]);

  // 수동 저장 (전략 + 프로젝트 정보 저장)
  const handleSaveAll = useCallback(async () => {
    try {
      setIsSaving(true);
      setSaveProgress(0);

      // 프로젝트 기본 정보 저장 (변경사항이 있으면)
      if (pendingProjectInfo && project) {
        setSaveProgress(30);
        await updateProject(
          project.id,
          pendingProjectInfo.name,
          pendingProjectInfo.description
        );
        // 저장 후 pending 상태 클리어
        setPendingProjectInfo(null);
      }

      // 전략 데이터 저장 (블록이 있으면 저장)
      const shouldSaveStrategy =
        (currentStrategy || strategy).blocks.length > 0;

      if (shouldSaveStrategy) {
        setSaveProgress(60);

        const strategyBlocks = (currentStrategy || strategy).blocks.map(
          (block) => ({
            ...block,
            position: { x: 0, y: 0 },
            connections: [],
          })
        );

        try {
          ProjectStore.updateProjectStrategy(projectId, strategyBlocks);

          // 저장 확인
          const savedProject = ProjectStore.getProjectById(projectId);
          const savedStrategy = savedProject?.versions[0]?.strategy;
          const savedBlocks = Array.isArray(savedStrategy)
            ? savedStrategy
            : savedStrategy?.blocks || [];
          if (!savedStrategy || savedBlocks.length !== strategyBlocks.length) {
            throw new Error("전략 저장에 실패했습니다.");
          }
        } catch (error) {
          console.error("저장 중 오류:", error);
          throw error;
        }
      }

      setSaveProgress(100);
      setIsStrategyModified(false);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());

      // 저장 후 현재 전략 상태 초기화하여 새로 로드되도록 함
      setCurrentStrategy(null);

      // 저장 완료 후 새 버전으로 저장 모달 열기
      openCreateVersion();
    } catch (error) {
      console.error("저장 실패:", error);
      notifications.show({
        title: "저장 실패",
        message:
          error instanceof Error
            ? error.message
            : "저장 중 오류가 발생했습니다.",
        color: "red",
        icon: <IconAlertTriangle size={16} />,
      });
    } finally {
      setIsSaving(false);
      setSaveProgress(0);
    }
  }, [
    pendingProjectInfo,
    project,
    updateProject,
    isStrategyModified,
    currentStrategy,
    strategy,
    projectId,
    openCreateVersion,
  ]);

  // 버전 생성 완료 핸들러
  const handleVersionCreated = useCallback(
    (newVersion: Version, shouldRunBacktest?: boolean) => {
      const message = shouldRunBacktest
        ? `${newVersion.versionName} 버전이 생성되었습니다. 백테스트를 시작합니다.`
        : `${newVersion.versionName} 버전이 생성되었습니다.`;

      notifications.show({
        title: "저장 및 버전 생성 완료",
        message,
        color: "green",
        icon: <IconCheck size={16} />,
      });
      closeCreateVersion();

      // 프로젝트 상세 페이지로 이동 (백테스트 자동 실행 여부를 state로 전달)
      navigate({
        to: `/projects/${projectId}/`,
        search: shouldRunBacktest
          ? { autoBacktest: "true", versionId: newVersion.id }
          : undefined,
      });
    },
    [closeCreateVersion, navigate, projectId]
  );

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
        <Breadcrumbs>
          <Anchor onClick={() => navigate({ to: "/" })}>프로젝트 목록</Anchor>
          <Anchor onClick={() => navigate({ to: `/projects/${projectId}/` })}>
            {project.name}
          </Anchor>
          <Text>편집</Text>
        </Breadcrumbs>
      </Group>

      {/* 페이지 헤더 */}
      <Group justify="space-between" mb="xl">
        <div>
          <Group>
            <Title order={1}>{project.name} 수정</Title>
            {hasUnsavedChanges && (
              <Badge color="orange" variant="light" size="sm">
                저장되지 않음
              </Badge>
            )}
          </Group>
          <Group mt="xs">
            <Text c="dimmed" size="sm">
              다음 저장 시 새 버전으로 생성됩니다
            </Text>
            {lastSaved && (
              <Text c="dimmed" size="sm">
                • 마지막 저장: {lastSaved.toLocaleTimeString("ko-KR")}
              </Text>
            )}
          </Group>
        </div>

        <Group>
          <Menu shadow="md" width={250}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>도구</Menu.Label>
              <Menu.Item
                leftSection={<IconKeyboard size={16} />}
                onClick={openHelp}
              >
                키보드 단축키 (⌘+K)
              </Menu.Item>
              <Menu.Item
                leftSection={<IconEye size={16} />}
                onClick={openPreview}
              >
                미리보기 (⌘+P)
              </Menu.Item>

              <Menu.Divider />

              <Menu.Label>설정</Menu.Label>
              <Menu.Item
                leftSection={
                  autoSaveEnabled ? (
                    <IconCloudCheck size={16} />
                  ) : (
                    <IconCloudX size={16} />
                  )
                }
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                rightSection={
                  <Text size="xs" c="dimmed">
                    {autoSaveEnabled ? "30초마다" : "비활성화"}
                  </Text>
                }
              >
                자동 저장
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <Button
            leftSection={<IconGitBranch size={16} />}
            onClick={handleSaveAll}
            loading={isSaving}
          >
            새 버전으로 저장
          </Button>
        </Group>
      </Group>

      {/* 탭 메뉴 */}
      <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="basic" leftSection={<IconEdit size={16} />}>
            기본 정보
          </Tabs.Tab>
          <Tabs.Tab value="strategy" leftSection={<IconChartLine size={16} />}>
            투자 전략
          </Tabs.Tab>
          <Tabs.Tab value="backtest" leftSection={<IconTrendingUp size={16} />}>
            백테스트
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="basic" pt="lg">
          {project && (
            <ProjectInfoForm
              project={project}
              onChange={handleProjectInfoChange}
              disabled={isSaving}
            />
          )}
        </Tabs.Panel>

        <Tabs.Panel value="strategy" pt="lg">
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

            <div
              style={{ height: "70vh", minHeight: "500px", maxHeight: "800px" }}
            >
              <StrategyEditor
                strategy={strategy}
                onStrategyUpdate={handleStrategyUpdate}
                readOnly={isSaving}
              />
            </div>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="backtest" pt="lg">
          <Stack gap="lg">
            <Alert
              icon={<IconInfoCircle size={16} />}
              color="blue"
              variant="light"
              mb="lg"
            >
              <Text size="sm">
                <strong>백테스트 기능:</strong> 설정한 투자 전략을 실제 주식
                데이터로 테스트해보세요. 과거 데이터를 기반으로 전략의 성과를
                분석할 수 있습니다.
              </Text>
            </Alert>
            <BacktestRunner
              strategy={strategy}
              projectId={projectId}
              versionId={project?.versions?.[0]?.id}
            />
          </Stack>
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
            <Text>{pendingProjectInfo?.name || project?.name || "프로젝트 이름 없음"}</Text>
          </div>
          <div>
            <Text fw={500} mb="xs">
              설명
            </Text>
            <Text>{pendingProjectInfo?.description || project?.description || "설명 없음"}</Text>
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

      {/* 새 버전 생성 모달 */}
      {project && strategy && (
        <CreateVersionModal
          opened={createVersionOpened}
          onClose={closeCreateVersion}
          project={project}
          strategy={strategy}
          onVersionCreated={handleVersionCreated}
          initialDescription="프로젝트 수정 사항 반영"
        />
      )}
    </Container>
  );
}
