import { Types } from "mongoose";
import type { WorkflowStatus, WorkflowVersion } from "@trading-n8n/common";
export interface IWorkflow {
    user_id: Types.ObjectId;
    display_id: string;
    name: string;
    description: string;
    status: WorkflowStatus;
    is_active: boolean;
    is_archived: boolean;
    archived_at: Date | null;
    draft_version: WorkflowVersion;
    deployed_version: WorkflowVersion | null;
    created_at: Date;
    updated_at: Date;
}
export declare const Workflow: import("mongoose").Model<IWorkflow, {}, {}, {}, import("mongoose").Document<unknown, {}, IWorkflow, {}, import("mongoose").DefaultSchemaOptions> & IWorkflow & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, IWorkflow>;
