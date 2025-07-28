import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
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

export const StrategyFlowEditor: React.FC<StrategyFlowEditorProps> = ({
  flow,
  onFlowUpdate, // 디버깅을 위해 일시적으로 사용하지 않음
  readOnly = false,
}) => {
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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // 디버그 로그 추가 함수
  const addDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDebugInfo((prev) => [...prev.slice(-4), logMessage]); // 최근 5개만 유지
  }, []);

  // ReactFlow가 마운트되었는지 확인
  const [_isReactFlowMounted, _setIsReactFlowMounted] = useState(false);

  // ReactFlow 초기화 상태 추가
  const [isReactFlowReady, setIsReactFlowReady] = useState(false);

  // ReactFlow 초기화 콜백
  const onReactFlowInit = useCallback(() => {
    setIsReactFlowReady(true);
    addDebugLog("🎪 ReactFlow fully initialized and ready");
  }, [addDebugLog]);

  // 강제 드롭 처리 (백업 메커니즘)
  const forceCreateNode = useCallback(
    (nodeType: FlowNodeType, clientX: number, clientY: number) => {
      if (!reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: clientX - reactFlowBounds.left,
        y: clientY - reactFlowBounds.top,
      };

      addDebugLog(
        `🚑 Force creating node: ${nodeType} at (${position.x}, ${position.y})`
      );
      const newNode = createNode(nodeType, position);
      setNodes((nds) => [...nds, newNode]);
      setDraggedNodeType(null);
    },
    [addDebugLog, setNodes]
  );

  // 개선된 onDrop with 백업 메커니즘
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      addDebugLog(
        `🎯 onDrop called - event type: ${event.type}, ready: ${isReactFlowReady}`
      );

      // 드롭 영역 스타일 복원
      if (reactFlowWrapper.current) {
        reactFlowWrapper.current.style.backgroundColor = "";
        reactFlowWrapper.current.style.borderColor = "#e0e7ff";
      }

      // dataTransfer와 상태 둘 다 체크
      const nodeTypeFromTransfer = event.dataTransfer.getData(
        "application/reactflow-nodetype"
      ) as FlowNodeType;
      const nodeType = nodeTypeFromTransfer || draggedNodeType;

      addDebugLog(
        `📦 Node types - transfer: "${nodeTypeFromTransfer}", state: "${draggedNodeType}", final: "${nodeType}"`
      );
      addDebugLog(
        `🏗️ ReactFlow status - wrapper: ${!!reactFlowWrapper.current}, mounted: ${_isReactFlowMounted}, ready: ${isReactFlowReady}`
      );

      if (!nodeType) {
        addDebugLog(`❌ Drop failed - no nodeType available`);
        return;
      }

      if (!reactFlowWrapper.current) {
        addDebugLog(`❌ Drop failed - no ReactFlow wrapper`);
        return;
      }

      // ReactFlow가 준비되지 않았지만 nodeType이 있다면 강제 생성
      if (!isReactFlowReady && nodeType) {
        addDebugLog(`⚠️ ReactFlow not ready, using force create`);
        forceCreateNode(nodeType, event.clientX, event.clientY);
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      addDebugLog(
        `📍 Position calculated - x: ${position.x}, y: ${position.y}`
      );
      addDebugLog(
        `✅ Creating node: ${nodeType} at (${position.x}, ${position.y})`
      );

      const newNode = createNode(nodeType, position);
      setNodes((nds) => {
        addDebugLog(`📋 Adding node to ${nds.length} existing nodes`);
        return [...nds, newNode];
      });

      // 상태 정리
      setDraggedNodeType(null);
      addDebugLog("🧹 Drag state cleared");
    },
    [
      draggedNodeType,
      setNodes,
      addDebugLog,
      _isReactFlowMounted,
      isReactFlowReady,
      forceCreateNode,
    ]
  );

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

  const onDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      addDebugLog(
        `🔄 onDragOver - draggedNodeType: ${draggedNodeType}, mounted: ${_isReactFlowMounted}`
      );

      // 드롭 영역 시각적 피드백
      if (reactFlowWrapper.current) {
        reactFlowWrapper.current.style.backgroundColor =
          "rgba(59, 130, 246, 0.05)";
        reactFlowWrapper.current.style.borderColor = "#3b82f6";
      }
    },
    [draggedNodeType, addDebugLog, _isReactFlowMounted]
  );

  const onDragLeave = useCallback(
    (event: React.DragEvent) => {
      addDebugLog("🚪 onDragLeave");
      // 드롭 영역에서 벗어났을 때 스타일 복원
      if (
        reactFlowWrapper.current &&
        !event.currentTarget.contains(event.relatedTarget as Node)
      ) {
        reactFlowWrapper.current.style.backgroundColor = "";
        reactFlowWrapper.current.style.borderColor = "#e0e7ff";
      }
    },
    [addDebugLog]
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

  useEffect(() => {
    // ReactFlow 컨테이너가 DOM에 마운트되었는지 확인
    const checkMount = () => {
      if (reactFlowWrapper.current) {
        addDebugLog("✅ ReactFlow container mounted");
      } else {
        setTimeout(checkMount, 100);
      }
    };
    checkMount();
  }, [addDebugLog]);

  // 전역 드래그 이벤트 추적 (디버깅용)
  useEffect(() => {
    const handleDocumentDragOver = (e: DragEvent) => {
      addDebugLog(
        `🌍 Document dragover - target: ${(e.target as Element)?.tagName}`
      );
    };

    const handleDocumentDrop = (e: DragEvent) => {
      addDebugLog(
        `🌍 Document drop - target: ${(e.target as Element)?.tagName}`
      );
    };

    const handleDocumentDragEnd = (e: DragEvent) => {
      addDebugLog(
        `🌍 Document dragend - target: ${(e.target as Element)?.tagName}`
      );
    };

    document.addEventListener("dragover", handleDocumentDragOver);
    document.addEventListener("drop", handleDocumentDrop);
    document.addEventListener("dragend", handleDocumentDragEnd);

    return () => {
      document.removeEventListener("dragover", handleDocumentDragOver);
      document.removeEventListener("drop", handleDocumentDrop);
      document.removeEventListener("dragend", handleDocumentDragEnd);
    };
  }, [addDebugLog]);

  // ReactFlow 컨테이너에 직접 이벤트 리스너 추가
  useEffect(() => {
    const container = reactFlowWrapper.current;
    if (!container) return;

    const handleContainerDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addDebugLog(
        `🎯 Container dragover - dataTransfer types: ${Array.from(e.dataTransfer?.types || []).join(", ")}`
      );
    };

    const handleContainerDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addDebugLog(
        `🎯 Container drop - clientX: ${e.clientX}, clientY: ${e.clientY}`
      );

      // 직접 노드 생성 로직 실행
      const nodeTypeFromTransfer = e.dataTransfer?.getData(
        "application/reactflow-nodetype"
      ) as FlowNodeType;
      const nodeType = nodeTypeFromTransfer || draggedNodeType;

      addDebugLog(
        `📦 Manual node creation - transfer: "${nodeTypeFromTransfer}", state: "${draggedNodeType}", final: "${nodeType}"`
      );

      if (!nodeType) {
        addDebugLog(`❌ Manual drop failed - no nodeType available`);
        return;
      }

      const reactFlowBounds = container.getBoundingClientRect();
      const position = {
        x: e.clientX - reactFlowBounds.left,
        y: e.clientY - reactFlowBounds.top,
      };

      addDebugLog(
        `✅ Manual creating node: ${nodeType} at (${position.x}, ${position.y})`
      );
      const newNode = createNode(nodeType, position);
      setNodes((nds) => [...nds, newNode]);
      setDraggedNodeType(null);
      addDebugLog("🧹 Manual drag state cleared");
    };

    const handleContainerDragEnter = (e: DragEvent) => {
      e.preventDefault();
      addDebugLog(`🎯 Container dragenter`);
    };

    const handleContainerDragLeave = (_e: DragEvent) => {
      addDebugLog(`🎯 Container dragleave`);
    };

    // 직접 이벤트 리스너 추가
    container.addEventListener("dragover", handleContainerDragOver);
    container.addEventListener("drop", handleContainerDrop);
    container.addEventListener("dragenter", handleContainerDragEnter);
    container.addEventListener("dragleave", handleContainerDragLeave);

    addDebugLog(`🔗 Direct event listeners attached to container`);

    return () => {
      container.removeEventListener("dragover", handleContainerDragOver);
      container.removeEventListener("drop", handleContainerDrop);
      container.removeEventListener("dragenter", handleContainerDragEnter);
      container.removeEventListener("dragleave", handleContainerDragLeave);
    };
  }, [addDebugLog, draggedNodeType, setNodes]);

  // 플로우 변경사항 자동 저장 (개선된 무한 루프 방지)
  useEffect(() => {
    // 초기 로딩 시에는 저장하지 않음
    if (!onFlowUpdate) return;

    // 실제로 노드나 엣지가 변경되었을 때만 저장
    const hasChanges = nodes.length > 0 || edges.length > 0;
    if (!hasChanges) return;

    // 더 긴 디바운싱으로 빈번한 업데이트 방지
    const timeoutId = setTimeout(() => {
      // 플로우가 없으면 저장하지 않음
      if (!flow) return;

      const updatedFlow: StrategyFlow = {
        id: flow.id,
        projectId: flow.projectId,
        versionId: flow.versionId,
        name: flow.name,
        description: flow.description,
        nodes: nodes as StrategyFlowNode[],
        edges: edges as StrategyFlowEdge[],
        executionSettings: flow.executionSettings,
        createdAt: flow.createdAt,
        updatedAt: new Date(),
        isActive: flow.isActive,
      };

      onFlowUpdate(updatedFlow);
    }, 2000); // 2초 디바운싱으로 증가

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, onFlowUpdate, flow?.id]); // flow 전체가 아닌 flow.id만 의존성에 포함

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

  const DRAGGABLE_NODES = [
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
      label: "실행 일정",
      description: "언제 실행할지 설정",
    },
    {
      type: "condition" as FlowNodeType,
      icon: IconGitBranch,
      color: "orange",
      label: "조건",
      description: "매매 조건 설정",
    },
    {
      type: "action" as FlowNodeType,
      icon: IconTarget,
      color: "red",
      label: "액션",
      description: "실행할 행동 설정",
    },
    {
      type: "end" as FlowNodeType,
      icon: IconPlayerStop,
      color: "gray",
      label: "종료",
      description: "전략 종료점",
    },
  ];

  interface DraggableNodeProps {
    type: FlowNodeType;
    icon: React.ComponentType<{ size?: number | string }>;
    color: string;
    label: string;
    description: string;
  }

  const DraggableNode = ({
    type,
    icon: Icon,
    color,
    label,
    description,
  }: DraggableNodeProps) => (
    <Card
      p="xs"
      withBorder
      style={{
        cursor: "grab",
        userSelect: "none",
        minWidth: "80px",
        maxWidth: "120px",
        textAlign: "center",
        transition: "all 0.2s",
        backgroundColor: draggedNodeType === type ? "#f0f9ff" : "white",
        borderColor: draggedNodeType === type ? "#3b82f6" : "#e9ecef",
        position: "relative",
        borderWidth: "2px",
        borderStyle: "solid",
        opacity: 1,
      }}
      onDragStart={(event) => {
        event.dataTransfer.setData("application/reactflow-nodetype", type);
        setDraggedNodeType(type);
        addDebugLog(`🚀 Drag started: ${type}`);

        // 드래그 중 커서 변경
        document.body.style.cursor = "grabbing";
      }}
      onDragEnd={() => {
        document.body.style.cursor = "";
        addDebugLog(`🏁 Drag ended: ${type}`);
        // 드래그 종료 시 상태 정리
        setDraggedNodeType(null);
      }}
      onMouseDown={(event) => {
        // 마우스 다운 시 드래그 준비
        event.currentTarget.style.cursor = "grabbing";
      }}
      onMouseUp={(event) => {
        // 마우스 업 시 커서 복원
        event.currentTarget.style.cursor = "grab";
      }}
      onMouseEnter={(event) => {
        // 호버 시 시각적 피드백
        if (draggedNodeType !== type) {
          event.currentTarget.style.borderColor = "#3b82f6";
          event.currentTarget.style.backgroundColor = "#f8fafc";
        }
      }}
      onMouseLeave={(event) => {
        // 호버 해제 시 원래 스타일로 + 커서 복원
        if (draggedNodeType !== type) {
          event.currentTarget.style.borderColor = "#e9ecef";
          event.currentTarget.style.backgroundColor = "white";
        }
        event.currentTarget.style.cursor = "grab";
      }}
      draggable={true}
    >
      <Stack gap="xs" align="center" style={{ pointerEvents: "none" }}>
        <ThemeIcon color={color} size="md" radius="md">
          <Icon size={16} />
        </ThemeIcon>
        <div>
          <Text size="xs" fw={500} lineClamp={1}>
            {label}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={2}>
            {description}
          </Text>
        </div>
      </Stack>
    </Card>
  );

  return (
    <Card withBorder p="lg" style={{ height: "100%" }}>
      <Stack gap="lg" style={{ height: "100%", minHeight: "600px" }}>
        {/* 헤더와 통계 */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={3} mb="xs">
              플로우 차트 에디터
            </Title>
            <Group gap="lg">
              <Group gap="xs">
                <Text size="sm" c="dimmed">
                  노드:
                </Text>
                <Badge variant="light" color="blue">
                  {flowStats.totalNodes}개
                </Badge>
              </Group>
              <Group gap="xs">
                <Text size="sm" c="dimmed">
                  연결:
                </Text>
                <Badge variant="light" color="green">
                  {flowStats.totalEdges}개
                </Badge>
              </Group>
              <Group gap="xs">
                <Text size="sm" c="dimmed">
                  상태:
                </Text>
                <Badge
                  variant="light"
                  color={flowStats.isValid ? "green" : "orange"}
                >
                  {flowStats.isValid ? "완료" : "불완전"}
                </Badge>
              </Group>
            </Group>
          </div>
        </Group>

        {/* 디버그 정보 표시 */}
        {debugInfo.length > 0 && (
          <Paper
            withBorder
            p="xs"
            style={{ fontSize: "10px", maxHeight: "100px", overflow: "auto" }}
          >
            <Text size="xs" fw={500} mb="xs">
              디버그 로그:
            </Text>
            {debugInfo.map((log, index) => (
              <Text
                key={index}
                size="xs"
                c="dimmed"
                style={{ fontFamily: "monospace" }}
              >
                {log}
              </Text>
            ))}
          </Paper>
        )}

        {/* 노드 팔레트 - 가로 배치 (편집 모드에서만 표시) */}
        {!readOnly && (
          <div>
            <Text size="sm" fw={500} c="dimmed" mb="sm">
              노드 추가 (드래그하여 차트에 추가)
            </Text>
            <Group gap="md" mb="lg">
              {DRAGGABLE_NODES.map((nodeType) => (
                <DraggableNode key={nodeType.type} {...nodeType} />
              ))}
            </Group>
          </div>
        )}

        {/* 메인 컨텐츠 - 원래 Group 구조로 복원 */}
        <Group
          align="flex-start"
          style={{ flexGrow: 1, height: "100%" }}
          gap="lg"
        >
          {/* React Flow 차트 */}
          <div
            ref={reactFlowWrapper}
            style={{
              flexGrow: 1,
              width: "100%",
              height: "500px", // 높이 증가
              minHeight: "500px",
              border: "1px solid #e0e7ff",
              borderRadius: "8px",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* 단축키 안내 오버레이 */}
            {!readOnly && (
              <Paper
                withBorder
                p="sm"
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  zIndex: 10,
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  minWidth: "200px",
                }}
              >
                <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                  <Text size="xs" mb="xs">
                    <strong>단축키:</strong>
                  </Text>
                  <Text size="xs">• Del/Backspace: 노드 삭제</Text>
                  <Text size="xs">• Ctrl/Cmd + 클릭: 다중 선택</Text>
                  <Text size="xs">• 마우스 휠: 확대/축소</Text>
                </Alert>
              </Paper>
            )}

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
              onDragLeave={onDragLeave}
              onInit={onReactFlowInit}
              nodeTypes={FLOW_NODE_TYPES}
              fitView
              fitViewOptions={{
                padding: 0.2,
                includeHiddenNodes: false,
                minZoom: 0.1,
                maxZoom: 2,
              }}
              attributionPosition="bottom-left"
              deleteKeyCode={["Delete", "Backspace"]}
              multiSelectionKeyCode={["Meta", "Ctrl"]}
              defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
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
