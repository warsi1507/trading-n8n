export type WorkflowStatus = "DRAFT" | "DEPLOYED" | "PAUSED";
export interface WorkflowVersion {
    is_valid?: boolean;
    nodes: any[];
    edges: any[];
}
export interface Workflow {
    id: string;
    user_id: string;
    display_id: string;
    name: string;
    description: string;
    status: WorkflowStatus;
    is_active: boolean;
    draft_version: WorkflowVersion;
    deployed_version: WorkflowVersion | null;
    created_at: Date;
    updated_at: Date;
}
