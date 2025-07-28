// Flow Node Components
export { StartNode } from "./StartNode";
export { ScheduleNode } from "./ScheduleNode";
export { FlowConditionNode } from "./FlowConditionNode";
export { FlowActionNode } from "./FlowActionNode";
export { EndNode } from "./EndNode";

// Node Types for React Flow
import { StartNode } from "./StartNode";
import { ScheduleNode } from "./ScheduleNode";
import { FlowConditionNode } from "./FlowConditionNode";
import { FlowActionNode } from "./FlowActionNode";
import { EndNode } from "./EndNode";

export const FLOW_NODE_TYPES = {
  start: StartNode,
  schedule: ScheduleNode,
  condition: FlowConditionNode,
  action: FlowActionNode,
  end: EndNode,
} as const;
