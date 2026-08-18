import { Types, Document } from "mongoose";
import type { ExecutionStatus, INodeExecution } from "@trading-n8n/common";
export interface IExecutionModel extends Document {
    workflow_id: Types.ObjectId;
    user_id: Types.ObjectId;
    status: ExecutionStatus;
    started_at: Date;
    ended_at?: Date;
    nodes: INodeExecution[];
}
export declare const Execution: import("mongoose").Model<IExecutionModel, {}, {}, {}, Document<unknown, {}, IExecutionModel, {}, import("mongoose").DefaultSchemaOptions> & IExecutionModel & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IExecutionModel>;
