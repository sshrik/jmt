import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Card,
  Alert,
  Stack,
  Select,
  Badge,
} from "@mantine/core";
import {
  IconInfoCircle,
  IconDownload,
  IconUpload,
  IconRefresh,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { StrategyFlowEditor } from "../components/strategy/StrategyFlowEditor";
import type { StrategyFlow } from "../types/strategy";

export const Route = createFileRoute("/flowchart")({
  component: FlowchartPage,
});

function FlowchartPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("basic");
  const [currentFlow, setCurrentFlow] = useState<StrategyFlow | undefined>(
    undefined
  );

  // 템플릿 전략들
  const templates = [
    {
      value: "basic",
      label: "기본 매수/매도 전략",
      description: "단순한 가격 변동 기반 매매 전략",
    },
    {
      value: "momentum",
      label: "모멘텀 전략",
      description: "상승 추세를 따라가는 모멘텀 전략",
    },
    {
      value: "contrarian",
      label: "역추세 전략",
      description: "시장 반대 방향으로 투자하는 전략",
    },
    {
      value: "custom",
      label: "사용자 정의",
      description: "처음부터 새로 만드는 전략",
    },
  ];

  const handleFlowUpdate = (updatedFlow: StrategyFlow) => {
    setCurrentFlow(updatedFlow);
  };

  const handleTemplateChange = (template: string | null) => {
    if (template) {
      setSelectedTemplate(template);
      // TODO: 템플릿에 따른 기본 플로우 설정
    }
  };

  const handleExportFlow = () => {
    if (currentFlow) {
      const dataStr = JSON.stringify(currentFlow, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `strategy-flow-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportFlow = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedFlow = JSON.parse(e.target?.result as string);
            setCurrentFlow(importedFlow);
          } catch (error) {
            console.error("파일 import 실패:", error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <Container size="xl">
      {/* 페이지 헤더 */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>주식 흐름도</Title>
          <Text c="dimmed" size="lg" mt="xs">
            시각적으로 투자 전략을 설계하고 테스트해보세요
          </Text>
        </div>

        <Group gap="sm">
          <Button
            variant="outline"
            leftSection={<IconUpload size={16} />}
            onClick={handleImportFlow}
          >
            가져오기
          </Button>
          <Button
            variant="outline"
            leftSection={<IconDownload size={16} />}
            onClick={handleExportFlow}
            disabled={!currentFlow}
          >
            내보내기
          </Button>
          <Button
            variant="outline"
            leftSection={<IconRefresh size={16} />}
            onClick={() => setCurrentFlow(undefined)}
          >
            초기화
          </Button>
        </Group>
      </Group>

      {/* 템플릿 선택 */}
      <Card withBorder mb="xl" p="lg">
        <Group justify="space-between" mb="md">
          <div>
            <Text fw={500} mb="xs">
              전략 템플릿
            </Text>
            <Text size="sm" c="dimmed">
              기본 템플릿을 선택하거나 처음부터 새로 만드세요
            </Text>
          </div>
          <Badge variant="light" color="blue">
            {templates.find((t) => t.value === selectedTemplate)?.label}
          </Badge>
        </Group>

        <Select
          placeholder="전략 템플릿을 선택하세요"
          data={templates.map((template) => ({
            value: template.value,
            label: template.label,
          }))}
          value={selectedTemplate}
          onChange={handleTemplateChange}
          description={
            templates.find((t) => t.value === selectedTemplate)?.description
          }
        />
      </Card>

      {/* 안내 사항 */}
      <Alert
        icon={<IconInfoCircle size={16} />}
        color="blue"
        variant="light"
        mb="xl"
      >
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            주식 흐름도 사용 방법
          </Text>
          <Text size="sm">
            • <strong>드래그 앤 드롭:</strong> 왼쪽에서 블록을 끌어서 추가하세요
          </Text>
          <Text size="sm">
            • <strong>연결:</strong> 블록 간의 연결점을 드래그해서 연결하세요
          </Text>
          <Text size="sm">
            • <strong>편집:</strong> 블록을 클릭해서 조건과 액션을 설정하세요
          </Text>
          <Text size="sm">
            • <strong>삭제:</strong> 블록의 휴지통 아이콘을 클릭하세요
          </Text>
        </Stack>
      </Alert>

      {/* 플로우 에디터 */}
      <Card withBorder>
        <Group justify="space-between" mb="md">
          <div>
            <Text fw={500} mb="xs">
              전략 흐름도
            </Text>
            <Text size="sm" c="dimmed">
              블록을 추가하고 연결해서 투자 전략을 설계하세요
            </Text>
          </div>
          <Group gap="sm">
            <Button
              size="sm"
              variant="light"
              leftSection={<IconPlayerPlay size={14} />}
              disabled={!currentFlow || !currentFlow.nodes.length}
            >
              미리보기
            </Button>
          </Group>
        </Group>

        <div style={{ height: "calc(100vh - 400px)", minHeight: "600px" }}>
          <StrategyFlowEditor
            flow={currentFlow}
            onFlowUpdate={handleFlowUpdate}
          />
        </div>
      </Card>

      {/* 플로우 정보 */}
      {currentFlow && (
        <Card withBorder mt="xl" p="lg">
          <Title order={4} mb="md">
            현재 플로우 정보
          </Title>
          <Group gap="xl">
            <div>
              <Text size="sm" c="dimmed">
                총 블록 수
              </Text>
              <Text fw={500}>{currentFlow.nodes.length}개</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                연결 수
              </Text>
              <Text fw={500}>{currentFlow.edges.length}개</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                마지막 수정
              </Text>
              <Text fw={500}>
                {new Date(currentFlow.updatedAt).toLocaleString("ko-KR")}
              </Text>
            </div>
          </Group>
        </Card>
      )}
    </Container>
  );
}
