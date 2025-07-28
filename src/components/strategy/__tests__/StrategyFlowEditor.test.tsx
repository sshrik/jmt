import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { StrategyFlowEditor } from "../StrategyFlowEditor";
import type { StrategyFlow } from "../../../types/strategy";

// ReactFlow를 모킹
jest.mock("reactflow", () => ({
  ReactFlow: ({
    children,
    onDrop,
    onDragOver,
    nodes,
    edges,
    ...props
  }: any) => (
    <div
      data-testid="react-flow-container"
      onDrop={onDrop}
      onDragOver={onDragOver}
      {...props}
    >
      <div data-testid="react-flow-nodes">{nodes?.length || 0} nodes</div>
      <div data-testid="react-flow-edges">{edges?.length || 0} edges</div>
      {children}
    </div>
  ),
  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
  MiniMap: () => <div data-testid="minimap" />,
  useNodesState: (initialNodes: any) => {
    const [nodes, setNodes] = require("react").useState(initialNodes);
    const onNodesChange = (changes: any) => {
      // 노드 변경 로직 시뮬레이션
    };
    return [nodes, setNodes, onNodesChange];
  },
  useEdgesState: (initialEdges: any) => {
    const [edges, setEdges] = require("react").useState(initialEdges);
    const onEdgesChange = (changes: any) => {
      // 엣지 변경 로직 시뮬레이션
    };
    return [edges, setEdges, onEdgesChange];
  },
  addEdge: jest.fn(),
}));

const mockFlow: StrategyFlow = {
  id: "test-flow",
  projectId: "test-project",
  versionId: "v1",
  name: "Test Flow",
  description: "Test Description",
  nodes: [],
  edges: [],
  executionSettings: {
    maxConcurrentActions: 1,
    errorHandling: "stop",
    retryCount: 3,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe("StrategyFlowEditor Drag and Drop", () => {
  beforeEach(() => {
    // 콘솔 로그 모킹
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should render draggable node blocks", () => {
    render(
      <TestWrapper>
        <StrategyFlowEditor flow={mockFlow} />
      </TestWrapper>
    );

    // 드래그 가능한 노드들이 렌더링되는지 확인
    expect(screen.getByText("시작")).toBeInTheDocument();
    expect(screen.getByText("실행 일정")).toBeInTheDocument();
    expect(screen.getByText("조건")).toBeInTheDocument();
    expect(screen.getByText("액션")).toBeInTheDocument();
    expect(screen.getByText("종료")).toBeInTheDocument();
  });

  test("should set dragged node type on drag start", () => {
    render(
      <TestWrapper>
        <StrategyFlowEditor flow={mockFlow} />
      </TestWrapper>
    );

    const conditionNode = screen
      .getByText("조건")
      .closest('[draggable="true"]');
    expect(conditionNode).toBeInTheDocument();

    // 드래그 시작 이벤트 시뮬레이션
    const dragStartEvent = new DragEvent("dragstart", {
      bubbles: true,
      cancelable: true,
    });

    // dataTransfer 모킹
    Object.defineProperty(dragStartEvent, "dataTransfer", {
      value: {
        setData: jest.fn(),
        effectAllowed: "",
      },
    });

    fireEvent(conditionNode!, dragStartEvent);

    // dataTransfer.setData가 올바른 값으로 호출되었는지 확인
    expect(dragStartEvent.dataTransfer.setData).toHaveBeenCalledWith(
      "application/reactflow-nodetype",
      "condition"
    );
  });

  test("should create node on successful drop", async () => {
    const mockOnFlowUpdate = jest.fn();

    render(
      <TestWrapper>
        <StrategyFlowEditor flow={mockFlow} onFlowUpdate={mockOnFlowUpdate} />
      </TestWrapper>
    );

    const conditionNode = screen
      .getByText("조건")
      .closest('[draggable="true"]');
    const reactFlowContainer = screen.getByTestId("react-flow-container");

    // 1. 드래그 시작
    const dragStartEvent = new DragEvent("dragstart", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(dragStartEvent, "dataTransfer", {
      value: {
        setData: jest.fn(),
        effectAllowed: "",
      },
    });
    fireEvent(conditionNode!, dragStartEvent);

    // 2. 드래그 오버
    const dragOverEvent = new DragEvent("dragover", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(dragOverEvent, "dataTransfer", {
      value: {
        dropEffect: "",
      },
    });
    fireEvent(reactFlowContainer, dragOverEvent);

    // 3. 드롭
    const dropEvent = new DragEvent("drop", {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 200,
    });
    Object.defineProperty(dropEvent, "dataTransfer", {
      value: {
        getData: jest.fn().mockReturnValue("condition"),
      },
    });

    // getBoundingClientRect 모킹
    jest.spyOn(reactFlowContainer, "getBoundingClientRect").mockReturnValue({
      left: 50,
      top: 100,
      width: 800,
      height: 600,
      right: 850,
      bottom: 700,
      x: 50,
      y: 100,
      toJSON: () => {},
    });

    fireEvent(reactFlowContainer, dropEvent);

    // 콘솔 로그에서 노드 생성 확인
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(
        "Creating node:",
        expect.objectContaining({
          nodeType: "condition",
          position: { x: 50, y: 100 },
        })
      );
    });
  });

  test("should handle first drag attempt correctly", async () => {
    const mockOnFlowUpdate = jest.fn();

    render(
      <TestWrapper>
        <StrategyFlowEditor flow={mockFlow} onFlowUpdate={mockOnFlowUpdate} />
      </TestWrapper>
    );

    const conditionNode = screen
      .getByText("조건")
      .closest('[draggable="true"]');
    const reactFlowContainer = screen.getByTestId("react-flow-container");

    // 첫 번째 드래그 앤 드롭 시뮬레이션
    const performDragDrop = () => {
      // 드래그 시작
      const dragStartEvent = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragStartEvent, "dataTransfer", {
        value: {
          setData: jest.fn(),
          effectAllowed: "",
        },
      });
      fireEvent(conditionNode!, dragStartEvent);

      // 드래그 오버 (ReactFlow가 준비되었는지 시뮬레이션)
      const dragOverEvent = new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragOverEvent, "dataTransfer", {
        value: { dropEffect: "" },
      });
      fireEvent(reactFlowContainer, dragOverEvent);

      // 드롭
      const dropEvent = new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 200,
      });
      Object.defineProperty(dropEvent, "dataTransfer", {
        value: {
          getData: jest.fn().mockReturnValue("condition"),
        },
      });

      jest.spyOn(reactFlowContainer, "getBoundingClientRect").mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      fireEvent(reactFlowContainer, dropEvent);
    };

    // 첫 번째 시도
    performDragDrop();

    // 첫 번째 시도에서 노드가 생성되어야 함
    await waitFor(
      () => {
        expect(console.log).toHaveBeenCalledWith(
          "Creating node:",
          expect.objectContaining({
            nodeType: "condition",
          })
        );
      },
      { timeout: 1000 }
    );
  });
});
