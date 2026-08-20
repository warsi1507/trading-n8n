export type ExecutionStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELED" | "UNKNOWN";
export type NodeExecutionStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED" | "UNKNOWN";
export interface INodeExecution {
    node_id: string;
    status: NodeExecutionStatus;
    started_at?: Date;
    ended_at?: Date;
    duration_ms?: number;
    input_data?: any;
    output_data?: any;
    error?: any;
}
export interface IExecution {
    display_id: string;
    workflow_id: string;
    user_id: string;
    status: ExecutionStatus;
    started_at: Date;
    ended_at?: Date;
    nodes: INodeExecution[];
    workflow_deleted?: boolean;
}
