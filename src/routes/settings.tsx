import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Container,
  Title,
  Text,
  Card,
  Button,
  Group,
  Alert,
  Modal,
  Stack,
  Switch,
  Select,
  NumberInput,
  Badge,
} from "@mantine/core";
import {
  IconTrash,
  IconInfoCircle,
  IconDownload,
  IconUpload,
  IconDatabase,
  IconPalette,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [clearDataModalOpened, setClearDataModalOpened] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // 앱 설정 상태
  const [notifications_enabled, setNotificationsEnabled] = useState(
    localStorage.getItem("notifications_enabled") !== "false"
  );
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "system");
  const [autoSaveInterval, setAutoSaveInterval] = useState(
    parseInt(localStorage.getItem("autoSaveInterval") || "30")
  );

  // 로컬 스토리지 정보
  const getStorageInfo = () => {
    const projects = JSON.parse(localStorage.getItem("jmt_projects") || "[]");
    const stockData = Object.keys(localStorage).filter((key) =>
      key.startsWith("stock_")
    ).length;
    const totalKeys = Object.keys(localStorage).length;

    return {
      projects: projects.length,
      stockData,
      totalKeys,
      totalSize: JSON.stringify(localStorage).length,
    };
  };

  const storageInfo = getStorageInfo();

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      // 모든 로컬 스토리지 데이터 삭제
      localStorage.clear();

      notifications.show({
        title: "데이터 초기화 완료",
        message: "모든 로컬 데이터가 삭제되었습니다.",
        color: "green",
      });

      setClearDataModalOpened(false);

      // 페이지 새로고침으로 상태 초기화
      window.location.reload();
    } catch (_error) {
      notifications.show({
        title: "오류 발생",
        message: "데이터 삭제 중 오류가 발생했습니다.",
        color: "red",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        projects: JSON.parse(localStorage.getItem("jmt_projects") || "[]"),
        settings: {
          notifications_enabled,
          theme,
          autoSaveInterval,
        },
        exportDate: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `jmt-backup-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      notifications.show({
        title: "데이터 내보내기 완료",
        message: "데이터가 성공적으로 내보내졌습니다.",
        color: "green",
      });
    } catch (_error) {
      notifications.show({
        title: "내보내기 오류",
        message: "데이터 내보내기 중 오류가 발생했습니다.",
        color: "red",
      });
    }
  };

  const handleImportData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedData = JSON.parse(e.target?.result as string);

            if (importedData.projects) {
              localStorage.setItem(
                "jmt_projects",
                JSON.stringify(importedData.projects)
              );
            }

            if (importedData.settings) {
              const settings = importedData.settings;
              localStorage.setItem(
                "notifications_enabled",
                settings.notifications_enabled.toString()
              );
              localStorage.setItem("theme", settings.theme);
              localStorage.setItem(
                "autoSaveInterval",
                settings.autoSaveInterval.toString()
              );

              setNotificationsEnabled(settings.notifications_enabled);
              setTheme(settings.theme);
              setAutoSaveInterval(settings.autoSaveInterval);
            }

            notifications.show({
              title: "데이터 가져오기 완료",
              message: "데이터가 성공적으로 가져와졌습니다.",
              color: "green",
            });

            // 페이지 새로고침으로 변경사항 반영
            setTimeout(() => window.location.reload(), 1000);
          } catch (_error) {
            notifications.show({
              title: "가져오기 오류",
              message: "파일 형식이 올바르지 않습니다.",
              color: "red",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleSettingChange = (
    key: string,
    value: string | number | boolean
  ) => {
    localStorage.setItem(key, value.toString());

    switch (key) {
      case "notifications_enabled":
        setNotificationsEnabled(value as boolean);
        break;
      case "theme":
        setTheme(value as string);
        break;
      case "autoSaveInterval":
        setAutoSaveInterval(value as number);
        break;
    }
  };

  return (
    <Container size="md">
      {/* 페이지 헤더 */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>환경설정</Title>
          <Text c="dimmed" size="lg" mt="xs">
            앱 설정을 관리하고 데이터를 백업하세요
          </Text>
        </div>
      </Group>

      <Stack gap="lg">
        {/* 앱 설정 */}
        <Card withBorder p="lg">
          <Group justify="space-between" mb="md">
            <div>
              <Group gap="xs" mb="xs">
                <IconPalette size={20} />
                <Text fw={500} size="lg">
                  앱 설정
                </Text>
              </Group>
              <Text size="sm" c="dimmed">
                사용자 인터페이스 및 동작 설정
              </Text>
            </div>
          </Group>

          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Text size="sm" fw={500}>
                  알림 사용
                </Text>
                <Text size="xs" c="dimmed">
                  백테스트 완료 등 알림 표시
                </Text>
              </div>
              <Switch
                checked={notifications_enabled}
                onChange={(e) =>
                  handleSettingChange(
                    "notifications_enabled",
                    e.currentTarget.checked
                  )
                }
              />
            </Group>

            <Group justify="space-between">
              <div>
                <Text size="sm" fw={500}>
                  테마
                </Text>
                <Text size="xs" c="dimmed">
                  앱 테마 설정
                </Text>
              </div>
              <Select
                value={theme}
                onChange={(value) =>
                  value && handleSettingChange("theme", value)
                }
                data={[
                  { value: "light", label: "라이트" },
                  { value: "dark", label: "다크" },
                  { value: "system", label: "시스템" },
                ]}
                w={120}
              />
            </Group>

            <Group justify="space-between">
              <div>
                <Text size="sm" fw={500}>
                  자동 저장 간격
                </Text>
                <Text size="xs" c="dimmed">
                  프로젝트 자동 저장 간격 (초)
                </Text>
              </div>
              <NumberInput
                value={autoSaveInterval}
                onChange={(value) =>
                  typeof value === "number" &&
                  handleSettingChange("autoSaveInterval", value)
                }
                min={10}
                max={300}
                w={100}
              />
            </Group>
          </Stack>
        </Card>

        {/* 데이터 관리 */}
        <Card withBorder p="lg">
          <Group justify="space-between" mb="md">
            <div>
              <Group gap="xs" mb="xs">
                <IconDatabase size={20} />
                <Text fw={500} size="lg">
                  데이터 관리
                </Text>
              </Group>
              <Text size="sm" c="dimmed">
                로컬 데이터 백업 및 관리
              </Text>
            </div>
          </Group>

          {/* 저장된 데이터 정보 */}
          <Alert icon={<IconInfoCircle size="1rem" />} mb="md">
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                현재 저장된 데이터
              </Text>
              <Group gap="md">
                <Badge variant="light" color="blue">
                  프로젝트: {storageInfo.projects}개
                </Badge>
                <Badge variant="light" color="green">
                  주식 데이터: {storageInfo.stockData}개
                </Badge>
                <Badge variant="light" color="gray">
                  총 {storageInfo.totalKeys}개 항목
                </Badge>
                <Badge variant="light" color="orange">
                  {(storageInfo.totalSize / 1024).toFixed(1)}KB
                </Badge>
              </Group>
            </Stack>
          </Alert>

          <Group gap="sm">
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={handleExportData}
              variant="outline"
            >
              데이터 내보내기
            </Button>
            <Button
              leftSection={<IconUpload size={16} />}
              onClick={handleImportData}
              variant="outline"
            >
              데이터 가져오기
            </Button>
            <Button
              leftSection={<IconTrash size={16} />}
              onClick={() => setClearDataModalOpened(true)}
              color="red"
              variant="outline"
            >
              모든 데이터 삭제
            </Button>
          </Group>
        </Card>

        {/* 개발자 정보 */}
        <Card withBorder p="lg">
          <Group gap="xs" mb="md">
            <IconInfoCircle size={20} />
            <Text fw={500} size="lg">
              개발자 정보
            </Text>
          </Group>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text size="sm">개발자</Text>
              <Text
                size="sm"
                c="blue"
                style={{ cursor: "pointer" }}
                onClick={() =>
                  window.open("https://github.com/sshrik", "_blank")
                }
              >
                @sshrik
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm">GitHub</Text>
              <Text
                size="sm"
                c="blue"
                style={{ cursor: "pointer", textDecoration: "underline" }}
                onClick={() =>
                  window.open("https://github.com/sshrik", "_blank")
                }
              >
                github.com/sshrik
              </Text>
            </Group>
          </Stack>
        </Card>
      </Stack>

      {/* 데이터 삭제 확인 모달 */}
      <Modal
        opened={clearDataModalOpened}
        onClose={() => setClearDataModalOpened(false)}
        title="모든 데이터 삭제"
        centered
      >
        <Alert color="red" icon={<IconInfoCircle size="1rem" />} mb="md">
          <Text fw={500} mb="xs">
            주의!
          </Text>
          <Text size="sm">
            이 작업은 되돌릴 수 없습니다. 모든 프로젝트, 설정, 주식 데이터가
            영구적으로 삭제됩니다.
          </Text>
        </Alert>

        <Text mb="lg">정말로 모든 데이터를 삭제하시겠습니까?</Text>

        <Group justify="flex-end">
          <Button
            variant="outline"
            onClick={() => setClearDataModalOpened(false)}
            disabled={isClearing}
          >
            취소
          </Button>
          <Button color="red" onClick={handleClearAllData} loading={isClearing}>
            모든 데이터 삭제
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
