export type ExecutionStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

export type NodeExecutionStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "SKIPPED";

export interface INodeExecution {
  node_id: string;
  status: NodeExecutionStatus;
  started_at?: Date;
  ended_at?: Date;
  output_data?: any;
  error?: string;
}

export interface IExecution {
  workflow_id: string;
  user_id: string;
  status: ExecutionStatus;
  started_at: Date;
  ended_at?: Date;
  nodes: INodeExecution[];
}
