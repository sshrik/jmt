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
import type { Edge, Connection, ReactFlowInstance } from "reactflow";
import "reactflow/dist/style.css";

import { Card, Group, Stack, ThemeIcon, Text, Alert } from "@mantine/core";
import {
  IconPlayerPlay,
  IconClock,
  IconGitBranch,
  IconTarget,
  IconPlayerStop,
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

// ReactFlow 설정을 컴포넌트 외부에 정의하여 재생성 방지
const REACT_FLOW_FIT_VIEW_OPTIONS = {
  padding: 0.1,
  includeHiddenNodes: false,
  minZoom: 0.001, // 거의 무제한 축소
  maxZoom: 1.5,
} as const;

const REACT_FLOW_DELETE_KEY_CODE = ["Delete", "Backspace"] as const;
const REACT_FLOW_MULTI_SELECTION_KEY_CODE = ["Meta", "Ctrl"] as const;
const REACT_FLOW_DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 0.2 } as const;
const REACT_FLOW_STYLE = { width: "100%", height: "100%" } as const;
const MINI_MAP_STYLE = {
  nodeStrokeColor: "#374151",
  nodeColor: "#f3f4f6",
  nodeBorderRadius: 8,
  position: "bottom-right" as const,
};

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
  onFlowUpdate,
  readOnly = false,
}) => {
  // 모든 Hook들을 먼저 정의
  const defaultFlow = useMemo(() => createDefaultFlow(), []);

  // 현재 플로우 또는 기본 플로우 사용
  const currentFlow = flow || defaultFlow;

  const [nodes, setNodes, onNodesChange] = useNodesState(
    currentFlow.nodes || defaultFlow.nodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    currentFlow.edges || defaultFlow.edges
  );

  // 디버깅 정보 추가 (nodes, edges 정의 후)

  //   flow: flow ? "provided" : "null",
  //   currentFlow: currentFlow ? "valid" : "invalid",
  //   flowNodes: currentFlow?.nodes?.length || 0,
  //   flowEdges: currentFlow?.edges?.length || 0,
  //   readOnly,
  //   actualNodes: nodes.length,
  //   actualEdges: edges.length,
  // });

  const [draggedNodeType, setDraggedNodeType] = useState<FlowNodeType | null>(
    null
  );
  // const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  // ReactFlow 컨테이너와 인스턴스 참조
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const _reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // 노드가 변경될 때마다 자동으로 fitView 실행
  useEffect(() => {
    if (_reactFlowInstance.current && nodes.length > 0) {
      // 약간의 지연을 두고 fitView 실행 (렌더링 완료 대기)
      setTimeout(() => {
        _reactFlowInstance.current?.fitView({
          padding: 0.1,
          includeHiddenNodes: false,
          minZoom: 0.001, // 거의 무제한 축소
          maxZoom: 1,
          duration: 300,
        });
      }, 100);
    }
  }, [nodes.length, edges.length]);

  // 디버그 로그 추가 함수 (현재 비활성화)
  // const addDebugLog = useCallback((message: string) => {
  //   const timestamp = new Date().toLocaleTimeString();
  //   const logMessage = `[${timestamp}] ${message}`;

  //   setDebugInfo(prev => [...prev.slice(-4), logMessage]); // 최근 5개만 유지
  // }, []);

  // 마우스 기반 드래그 핸들러
  const handleMouseDown = useCallback(
    (nodeType: FlowNodeType, event: React.MouseEvent) => {
      event.preventDefault();
      setDraggedNodeType(nodeType);
      setIsDragging(true);
      setMousePosition({ x: event.clientX, y: event.clientY });
      document.body.style.cursor = "grabbing";
    },
    []
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (isDragging && draggedNodeType) {
        setMousePosition({ x: event.clientX, y: event.clientY });
      }
    },
    [isDragging, draggedNodeType]
  );

  const handleMouseUp = useCallback(
    (event: MouseEvent) => {
      if (isDragging && draggedNodeType && reactFlowWrapper.current) {
        const bounds = reactFlowWrapper.current.getBoundingClientRect();

        // 마우스가 ReactFlow 영역 내에 있는지 확인
        if (
          event.clientX >= bounds.left &&
          event.clientX <= bounds.right &&
          event.clientY >= bounds.top &&
          event.clientY <= bounds.bottom
        ) {
          const position = {
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
          };

          const newNode = createNode(draggedNodeType, position);
          setNodes((nds) => [...nds, newNode]);
        }
      }

      // 상태 정리
      setIsDragging(false);
      setDraggedNodeType(null);
      document.body.style.cursor = "";
    },
    [isDragging, draggedNodeType, setNodes, nodes.length]
  );

  // 전역 마우스 이벤트 리스너
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // ReactFlow가 마운트되었는지 확인
  const [_isReactFlowMounted, _setIsReactFlowMounted] = useState(false);

  // ReactFlow 초기화 콜백
  const onReactFlowInit = useCallback(() => {
    // ReactFlow 준비 완료
  }, []);

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

  // ReactFlow에 전달할 nodes를 메모이제이션하여 재생성 방지
  const memoizedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onUpdate: (data: FlowNodeData) => onNodeUpdate(node.id, data),
          onDelete: () => deleteNode(node.id),
        },
      })),
    [nodes, onNodeUpdate, deleteNode]
  );

  // nodeTypes도 메모이제이션하여 재생성 방지
  const memoizedNodeTypes = useMemo(() => FLOW_NODE_TYPES, []);

  // onInit 콜백도 메모이제이션
  const handleReactFlowInit = useCallback((rfInstance: ReactFlowInstance) => {
    _reactFlowInstance.current = rfInstance;
    onReactFlowInit();
  }, [onReactFlowInit]);

  useEffect(() => {
    // ReactFlow 컨테이너가 DOM에 마운트되었는지 확인
    const checkMount = () => {
      if (reactFlowWrapper.current) {
        // 컨테이너 준비 완료
      } else {
        setTimeout(checkMount, 100);
      }
    };
    checkMount();
  }, []);

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
        cursor: isDragging && draggedNodeType === type ? "grabbing" : "grab",
        userSelect: "none",
        width: "120px", // 고정 너비
        textAlign: "center",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        backgroundColor: draggedNodeType === type ? "#eff6ff" : "white",
        borderColor: draggedNodeType === type ? "#3b82f6" : "#e9ecef",
        position: "relative",
        borderWidth: draggedNodeType === type ? "3px" : "2px",
        borderStyle: "solid",
        opacity: isDragging && draggedNodeType === type ? 0.6 : 1,
        transform:
          isDragging && draggedNodeType === type
            ? "scale(0.9) rotate(1deg)"
            : "scale(1)",
        boxShadow:
          draggedNodeType === type
            ? "0 8px 25px rgba(59, 130, 246, 0.3)"
            : "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
      onMouseDown={(event) => handleMouseDown(type, event)}
      // HTML5 드래그 API 완전 비활성화
      draggable={false}
    >
      <Stack gap="xs" align="center">
        <ThemeIcon
          color={color}
          size="md"
          radius="md"
          style={{
            transition: "all 0.3s ease",
            transform: draggedNodeType === type ? "scale(1.1)" : "scale(1)",
          }}
        >
          <Icon size={16} />
        </ThemeIcon>
        <div>
          <Text
            size="xs"
            fw={draggedNodeType === type ? 600 : 500}
            lineClamp={1}
            style={{
              color: draggedNodeType === type ? "#1e40af" : "inherit",
              transition: "all 0.3s ease",
            }}
          >
            {label}
          </Text>
          <Text
            size="xs"
            c="dimmed"
            lineClamp={2}
            style={{
              fontSize: draggedNodeType === type ? "11px" : "10px",
              transition: "all 0.3s ease",
            }}
          >
            {description}
          </Text>
        </div>
      </Stack>
    </Card>
  );

  // 드래깅 중 시각적 커서 표시 (개선된 버전)
  const DragCursor = () => {
    if (!isDragging || !draggedNodeType) return null;

    // 노드 타입에 따른 정보 매핑
    const nodeInfo = DRAGGABLE_NODES.find(
      (node) => node.type === draggedNodeType
    );
    const Icon = nodeInfo?.icon;

    return (
      <div
        style={{
          position: "fixed",
          left: mousePosition.x + 15,
          top: mousePosition.y - 10,
          zIndex: 1000,
          pointerEvents: "none",
          padding: "8px 12px",
          backgroundColor: "rgba(59, 130, 246, 0.95)",
          color: "white",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: 500,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        {Icon && (
          <Icon
            size={16}
            style={{
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))",
            }}
          />
        )}
        <span>{nodeInfo?.label} 노드 추가</span>
        <div
          style={{
            width: "6px",
            height: "6px",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            borderRadius: "50%",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <style>
          {`
            @keyframes pulse {
              0%, 100% { opacity: 0.8; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.2); }
            }
          `}
        </style>
      </div>
    );
  };

  return (
    <Card withBorder p="lg" style={{ height: "100%", minHeight: "700px" }}>
      <Stack gap="lg" style={{ height: "100%", minHeight: "650px" }}>
        {/* 노드 팔레트 - 가로 배치 (편집 모드에서만 표시) */}
        {!readOnly && (
          <div>
            <Group gap="md" mb="lg">
              {DRAGGABLE_NODES.map((nodeType) => (
                <DraggableNode key={nodeType.type} {...nodeType} />
              ))}
            </Group>
          </div>
        )}

        {/* 메인 컨텐츠 - ReactFlow 차트 */}
        <div
          ref={reactFlowWrapper}
          style={{
            width: "100%",
            height: "600px",
            minHeight: "600px",
            border: "2px dashed #e0e7ff",
            borderRadius: "8px",
            position: "relative",
            flexGrow: 1,
          }}
        >
          <ReactFlow
            nodes={memoizedNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={handleReactFlowInit}
            nodeTypes={memoizedNodeTypes}
            fitView
            fitViewOptions={REACT_FLOW_FIT_VIEW_OPTIONS}
            minZoom={0.001}
            maxZoom={3}
            attributionPosition="bottom-left"
            deleteKeyCode={REACT_FLOW_DELETE_KEY_CODE}
            multiSelectionKeyCode={REACT_FLOW_MULTI_SELECTION_KEY_CODE}
            defaultViewport={REACT_FLOW_DEFAULT_VIEWPORT}
            style={REACT_FLOW_STYLE}
          >
            <Background />
            <Controls />
            <MiniMap {...MINI_MAP_STYLE} />
          </ReactFlow>
          <DragCursor />
        </div>

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
