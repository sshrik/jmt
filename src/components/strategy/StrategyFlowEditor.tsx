import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
} from "reactflow";
import type { Edge, Connection } from "reactflow";
import "reactflow/dist/style.css";

import {
  Card,
  Title,
  Group,
  Stack,
  Badge,
  Text,
  Paper,
  Alert,
  ThemeIcon,
} from "@mantine/core";
import {
  IconPlayerPlay,
  IconClock,
  IconGitBranch,
  IconTarget,
  IconPlayerStop,
  IconInfoCircle,
} from "@tabler/icons-react";

import { FLOW_NODE_TYPES } from "./flow-nodes";
import type {
  StrategyFlow,
  StrategyFlowNode,
  StrategyFlowEdge,
  FlowNodeData,
  FlowNodeType,
} from "../../types/strategy";

interface StrategyFlowEditorProps {
  flow?: StrategyFlow;
  onFlowUpdate?: (flow: StrategyFlow) => void;
  readOnly?: boolean;
}

// 기본 플로우 생성 (더 넓은 간격)
const createDefaultFlow = (): {
  nodes: StrategyFlowNode[];
  edges: StrategyFlowEdge[];
} => {
  const nodes: StrategyFlowNode[] = [
    {
      id: "start",
      type: "start",
      position: { x: 400, y: 100 },
      data: {
        id: "start",
        label: "전략 시작",
        type: "start",
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    {
      id: "schedule",
      type: "schedule",
      position: { x: 400, y: 400 }, // 시작에서 300px 간격
      data: {
        id: "schedule",
        label: "실행 일정",
        type: "schedule",
        enabled: true,
        scheduleParams: {
          scheduleType: "daily",
          executionTime: "09:30",
          description: "매일 09:30에 실행",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    {
      id: "condition-1",
      type: "condition",
      position: { x: 200, y: 800 }, // 스케줄에서 400px 아래
      data: {
        id: "condition-1",
        label: "투자 조건",
        type: "condition",
        enabled: true,
        conditionType: "close_price_change",
        conditionParams: {
          priceChangePercent: 5,
          priceChangeDirection: "up",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    {
      id: "action-1",
      type: "action",
      position: { x: 200, y: 1300 }, // 조건에서 500px 아래
      data: {
        id: "action-1",
        label: "투자 액션",
        type: "action",
        enabled: true,
        actionType: "buy_percent_cash",
        actionParams: {
          percentCash: 30,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    {
      id: "end",
      type: "end",
      position: { x: 400, y: 1800 }, // 액션에서 500px 아래
      data: {
        id: "end",
        label: "전략 종료",
        type: "end",
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  ];

  const edges: StrategyFlowEdge[] = [
    {
      id: "start-schedule",
      source: "start",
      target: "schedule",
      animated: true,
    },
    {
      id: "schedule-condition",
      source: "schedule",
      target: "condition-1",
      animated: true,
    },
    {
      id: "condition-action",
      source: "condition-1",
      target: "action-1",
      animated: true,
    },
    {
      id: "action-end",
      source: "action-1",
      target: "end",
      animated: true,
    },
  ];

  return { nodes, edges };
};

// 노드 생성 헬퍼
const createNode = (
  type: FlowNodeType,
  position: { x: number; y: number }
): StrategyFlowNode => {
  const id = `${type}-${Date.now()}`;

  const baseData: FlowNodeData = {
    id,
    label: getNodeTypeLabel(type),
    type,
    description: getNodeTypeDescription(type),
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 타입별 기본 설정
  switch (type) {
    case "schedule":
      baseData.scheduleParams = {
        scheduleType: "market_open",
        description: "장 시작 시 실행",
      };
      break;
    case "condition":
      baseData.conditionType = "close_price_change";
      baseData.conditionParams = {
        priceChangeDirection: "up",
        priceChangePercent: 5,
      };
      break;
    case "action":
      baseData.actionType = "buy_percent_cash";
      baseData.actionParams = {
        percentCash: 30,
      };
      break;
  }

  return {
    id,
    type,
    position,
    data: baseData,
  };
};

const getNodeTypeLabel = (type: FlowNodeType): string => {
  const labels = {
    start: "전략 시작",
    schedule: "실행 일정",
    condition: "조건",
    action: "액션",
    end: "전략 종료",
    decision: "분기점",
  };
  return labels[type];
};

const getNodeTypeDescription = (type: FlowNodeType): string => {
  const descriptions = {
    start: "투자 전략이 시작되는 지점입니다.",
    schedule: "언제 전략을 실행할지 정의합니다.",
    condition: "투자 조건을 정의합니다.",
    action: "실행할 투자 액션을 정의합니다.",
    end: "투자 전략이 종료되는 지점입니다.",
    decision: "조건에 따라 흐름을 분기합니다.",
  };
  return descriptions[type];
};

export const StrategyFlowEditor = ({
  flow,
  onFlowUpdate,
  readOnly = false,
}: StrategyFlowEditorProps) => {
  const defaultFlow = useMemo(() => createDefaultFlow(), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(
    flow?.nodes || defaultFlow.nodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    flow?.edges || defaultFlow.edges
  );

  const [draggedNodeType, setDraggedNodeType] = useState<FlowNodeType | null>(
    null
  );
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // 엣지 연결 핸들러
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        // 액션 노드로의 연결 제한 (1개만 허용)
        const targetNode = nodes.find((node) => node.id === connection.target);
        if (targetNode?.type === "action") {
          // 이미 연결된 액션 노드인지 확인
          const existingConnection = edges.find(
            (edge) =>
              edge.target === connection.target &&
              edge.targetHandle === connection.targetHandle
          );
          if (existingConnection) {
            return; // 연결 차단
          }
        }

        const newEdge: Edge = {
          id: `${connection.source}-${connection.target}`,
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
          animated: true,
        };
        setEdges((eds) => addEdge(newEdge, eds));
      }
    },
    [setEdges, nodes, edges]
  );

  // 노드 업데이트 핸들러
  const onNodeUpdate = useCallback(
    (nodeId: string, newData: FlowNodeData) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: { ...newData, updatedAt: new Date() },
              }
            : node
        )
      );
    },
    [setNodes]
  );

  // 노드 추가 (드래그앤드롭) - React Flow 내부에서 실행
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!draggedNodeType || !reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode = createNode(draggedNodeType, position);
      setNodes((nds) => [...nds, newNode]);
      setDraggedNodeType(null);
    },
    [draggedNodeType, setNodes]
  );

  // 노드 삭제
  const deleteNode = useCallback(
    (nodeId: string) => {
      // 시작과 종료 노드는 삭제 불가
      const nodeToDelete = nodes.find((n) => n.id === nodeId);
      if (nodeToDelete?.type === "start" || nodeToDelete?.type === "end") {
        return;
      }

      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
    },
    [nodes, setNodes, setEdges]
  );

  // 키보드 단축키로 삭제
  const onKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Delete" || event.key === "Backspace") {
      // 선택된 노드들 삭제 (향후 구현)
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  // 플로우 변경사항 자동 저장 (무한 루프 방지)
  useEffect(() => {
    // 초기 로딩 시에는 저장하지 않음
    if (!onFlowUpdate) return;

    // 실제로 노드나 엣지가 변경되었을 때만 저장
    const hasChanges = nodes.length > 0 || edges.length > 0;
    if (!hasChanges) return;

    // 디바운싱으로 빈번한 업데이트 방지
    const timeoutId = setTimeout(() => {
      const updatedFlow: StrategyFlow = {
        id: flow?.id || `flow-${Date.now()}`,
        projectId: flow?.projectId || "",
        versionId: flow?.versionId || "",
        name: flow?.name || "새 플로우 전략",
        description: flow?.description || "",
        nodes: nodes as StrategyFlowNode[],
        edges: edges as StrategyFlowEdge[],
        executionSettings: flow?.executionSettings,
        createdAt: flow?.createdAt || new Date(),
        updatedAt: new Date(),
        isActive: flow?.isActive || true,
      };

      onFlowUpdate(updatedFlow);
    }, 500); // 500ms 디바운싱

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, onFlowUpdate]); // flow 의존성 제거

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // 플로우 내보내기 - 제거됨 (상위 컴포넌트에서 자동 저장)
  // const exportFlow = useCallback(() => {
  //   if (onFlowUpdate && flow) {
  //     const updatedFlow: StrategyFlow = {
  //       ...flow,
  //       nodes: nodes as StrategyFlowNode[],
  //       edges: edges as StrategyFlowEdge[],
  //       updatedAt: new Date(),
  //     };
  //     onFlowUpdate(updatedFlow);
  //   }
  // }, [flow, nodes, edges, onFlowUpdate]);

  // 통계 정보
  const flowStats = useMemo(() => {
    const nodesByType = nodes.reduce(
      (acc, node) => {
        acc[node.type as FlowNodeType] =
          (acc[node.type as FlowNodeType] || 0) + 1;
        return acc;
      },
      {} as Record<FlowNodeType, number>
    );

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodesByType,
      isValid:
        nodes.some((n) => n.type === "start") &&
        nodes.some((n) => n.type === "end"),
    };
  }, [nodes, edges]);

  return (
    <Card withBorder p="lg" style={{ height: "800px" }}>
      <Stack gap="lg" style={{ height: "100%" }}>
        {/* 헤더 */}
        <Group justify="space-between">
          <Title order={2}>투자 전략 플로우 차트</Title>
          <Group gap="sm">
            <Badge variant="light" color="blue">
              노드 {flowStats.totalNodes}개
            </Badge>
            <Badge variant="light" color="green">
              연결 {flowStats.totalEdges}개
            </Badge>
            <Badge
              variant="light"
              color={flowStats.isValid ? "green" : "orange"}
            >
              {flowStats.isValid ? "유효함" : "불완전"}
            </Badge>
          </Group>
        </Group>

        {/* 설명 */}
        {!readOnly && (
          <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
            <Text size="sm">
              <strong>사용 방법:</strong> 왼쪽 패널에서 노드를 드래그하여 차트에
              추가하고, 노드 간을 연결하여 투자 전략 플로우를 구성하세요.
            </Text>
          </Alert>
        )}

        <Group align="flex-start" style={{ height: "100%", flexGrow: 1 }}>
          {/* 노드 팔레트 */}
          {!readOnly && (
            <Paper p="md" withBorder style={{ width: 250, minHeight: 400 }}>
              <Title order={4} mb="md">
                노드 추가
              </Title>
              <Text size="xs" c="dimmed" mb="md">
                노드를 드래그하여 차트에 추가하세요
              </Text>
              <Stack gap="sm">
                {[
                  {
                    type: "start" as FlowNodeType,
                    icon: IconPlayerPlay,
                    color: "green",
                    label: "시작",
                    description: "전략 시작점",
                  },
                  {
                    type: "schedule" as FlowNodeType,
                    icon: IconClock,
                    color: "blue",
                    label: "일정",
                    description: "실행 일정 설정",
                  },
                  {
                    type: "condition" as FlowNodeType,
                    icon: IconGitBranch,
                    color: "purple",
                    label: "조건",
                    description: "투자 조건 확인",
                  },
                  {
                    type: "action" as FlowNodeType,
                    icon: IconTarget,
                    color: "orange",
                    label: "액션",
                    description: "투자 액션 실행",
                  },
                  {
                    type: "end" as FlowNodeType,
                    icon: IconPlayerStop,
                    color: "red",
                    label: "종료",
                    description: "전략 종료점",
                  },
                ].map(({ type, icon: Icon, color, label, description }) => (
                  <Card
                    key={type}
                    p="sm"
                    withBorder
                    style={{
                      cursor: "grab",
                      transition: "all 0.2s",
                      backgroundColor:
                        draggedNodeType === type ? "#f0f9ff" : "white",
                    }}
                    onDragStart={(e) => {
                      setDraggedNodeType(type);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => setDraggedNodeType(null)}
                    draggable
                  >
                    <Group gap="sm">
                      <ThemeIcon color={color} variant="light" size="sm">
                        <Icon size={16} />
                      </ThemeIcon>
                      <div>
                        <Text size="sm" fw={500}>
                          {label}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {description}
                        </Text>
                      </div>
                    </Group>
                  </Card>
                ))}
              </Stack>

              <Alert color="blue" variant="light" mt="md">
                <Text size="xs">
                  <strong>사용 팁:</strong>
                  <br />• 노드를 끌어서 차트에 추가
                  <br />• 노드 클릭으로 설정 변경
                  <br />• 연결점을 드래그하여 노드 연결
                  <br />• 시작/종료 노드는 삭제 불가
                </Text>
              </Alert>
            </Paper>
          )}

          {/* React Flow 차트 */}
          <div
            ref={reactFlowWrapper}
            style={{
              flexGrow: 1,
              width: "100%",
              height: "calc(100vh - 200px)", // 명시적인 height 설정
              minHeight: "600px",
              border: "1px solid #e0e7ff",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <ReactFlow
              nodes={nodes.map((node) => ({
                ...node,
                data: {
                  ...node.data,
                  onUpdate: (data: FlowNodeData) => onNodeUpdate(node.id, data),
                  onDelete: () => deleteNode(node.id),
                },
              }))}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={FLOW_NODE_TYPES}
              fitView
              fitViewOptions={{ padding: 0.1 }}
              attributionPosition="bottom-left"
              deleteKeyCode={["Delete", "Backspace"]}
              multiSelectionKeyCode={["Meta", "Ctrl"]}
            >
              <Background />
              <Controls />
              <MiniMap
                nodeStrokeColor="#374151"
                nodeColor="#f3f4f6"
                nodeBorderRadius={8}
                position="bottom-right"
              />
            </ReactFlow>
          </div>
        </Group>

        {/* 유효성 검사 */}
        {!flowStats.isValid && (
          <Alert color="orange" variant="light">
            <Text size="sm">
              <strong>불완전한 플로우:</strong> 시작 노드와 종료 노드가 모두
              필요합니다.
            </Text>
          </Alert>
        )}
      </Stack>
    </Card>
  );
};
