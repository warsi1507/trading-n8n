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
  workflow_id: string; // Stored as string in common, ObjectId in DB schema
  user_id: string; // Stored as string in common, ObjectId in DB schema
  status: ExecutionStatus;
  started_at: Date;
  ended_at?: Date;
  nodes: INodeExecution[];
}
