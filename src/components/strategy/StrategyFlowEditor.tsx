import { useCallback, useMemo, useState } from "react";
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
  Button,
  Stack,
  Badge,
  Text,
  Paper,
  Alert,
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

// 기본 플로우 템플릿
const createDefaultFlow = (): {
  nodes: StrategyFlowNode[];
  edges: StrategyFlowEdge[];
} => {
  const startNode: StrategyFlowNode = {
    id: "start-1",
    type: "start",
    position: { x: 100, y: 50 },
    data: {
      id: "start-1",
      label: "전략 시작",
      type: "start",
      description: "투자 전략이 시작되는 지점입니다.",
    },
  };

  const scheduleNode: StrategyFlowNode = {
    id: "schedule-1",
    type: "schedule",
    position: { x: 100, y: 200 },
    data: {
      id: "schedule-1",
      label: "실행 일정",
      type: "schedule",
      scheduleParams: {
        scheduleType: "market_open",
        description: "장 시작 시 실행",
      },
      description: "전략 실행 일정을 설정합니다.",
    },
  };

  const endNode: StrategyFlowNode = {
    id: "end-1",
    type: "end",
    position: { x: 100, y: 600 },
    data: {
      id: "end-1",
      label: "전략 종료",
      type: "end",
      description: "투자 전략이 종료되는 지점입니다.",
    },
  };

  const startEdge: StrategyFlowEdge = {
    id: "start-schedule",
    source: "start-1",
    target: "schedule-1",
    animated: true,
  };

  return {
    nodes: [startNode, scheduleNode, endNode],
    edges: [startEdge],
  };
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

  // 엣지 연결 핸들러
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
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
    [setEdges]
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

  // 노드 추가 (드래그앤드롭)
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!draggedNodeType) return;

      const position = {
        x: event.clientX - 200,
        y: event.clientY - 100,
      };

      const newNode = createNode(draggedNodeType, position);
      setNodes((nds) => [...nds, newNode]);
      setDraggedNodeType(null);
    },
    [draggedNodeType, setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // 노드 삭제 (현재 미사용이지만 향후 사용 예정)
  // const deleteNode = useCallback(
  //   (nodeId: string) => {
  //     setNodes((nds) => nds.filter((node) => node.id !== nodeId));
  //     setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  //   },
  //   [setNodes, setEdges]
  // );

  // 플로우 내보내기
  const exportFlow = useCallback(() => {
    if (onFlowUpdate && flow) {
      const updatedFlow: StrategyFlow = {
        ...flow,
        nodes: nodes as StrategyFlowNode[],
        edges: edges as StrategyFlowEdge[],
        updatedAt: new Date(),
      };
      onFlowUpdate(updatedFlow);
    }
  }, [flow, nodes, edges, onFlowUpdate]);

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
            {!readOnly && (
              <Button size="sm" variant="light" onClick={exportFlow}>
                저장
              </Button>
            )}
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
            <Paper p="md" withBorder style={{ width: 200, minHeight: 400 }}>
              <Title order={4} mb="md">
                노드 추가
              </Title>
              <Stack gap="sm">
                {[
                  {
                    type: "start" as FlowNodeType,
                    icon: IconPlayerPlay,
                    color: "green",
                    label: "시작",
                  },
                  {
                    type: "schedule" as FlowNodeType,
                    icon: IconClock,
                    color: "blue",
                    label: "일정",
                  },
                  {
                    type: "condition" as FlowNodeType,
                    icon: IconGitBranch,
                    color: "purple",
                    label: "조건",
                  },
                  {
                    type: "action" as FlowNodeType,
                    icon: IconTarget,
                    color: "orange",
                    label: "액션",
                  },
                  {
                    type: "end" as FlowNodeType,
                    icon: IconPlayerStop,
                    color: "red",
                    label: "종료",
                  },
                ].map(({ type, icon: Icon, color, label }) => (
                  <Button
                    key={type}
                    variant="light"
                    color={color}
                    leftSection={<Icon size={16} />}
                    size="sm"
                    style={{ justifyContent: "flex-start" }}
                    draggable
                    onDragStart={() => setDraggedNodeType(type)}
                  >
                    {label}
                  </Button>
                ))}
              </Stack>
            </Paper>
          )}

          {/* React Flow 차트 */}
          <div style={{ flexGrow: 1, height: "100%", minHeight: 400 }}>
            <ReactFlow
              nodes={nodes.map((node) => ({
                ...node,
                data: {
                  ...node.data,
                  onUpdate: (data: FlowNodeData) => onNodeUpdate(node.id, data),
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
              attributionPosition="bottom-left"
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
