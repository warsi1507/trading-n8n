import { Schema, model, Types } from 'mongoose';
import type { AppNode, AppEdge, WorkflowStatus, WorkflowVersion } from '@trading-n8n/common';

/**
 * Sub-schema for ReactFlow nodes.
 * Strictly bound to AppNode type to ensure DB and frontend match.
 */
const nodeSchema = new Schema<AppNode>(
  {
    id: { 
      type: String, 
      required: true 
    },
    type: { 
      type: String, 
      required: true 
    },
    position: {
      x: { 
        type: Number, 
        required: true 
      },
      y: { 
        type: Number, 
        required: true 
      }
    },
    data: {
      name: { 
        type: String, 
        required: true 
      },
      description: { 
        type: String, 
        required: true 
      },
      kind: { 
        type: String, 
        enum: ["action", "trigger"], 
        required: true 
      },
      metadata: { 
        type: Schema.Types.Mixed, 
        required: true 
      }
    }
  },
  { _id: false }
);

/**
 * Sub-schema for ReactFlow edges.
 */
const edgeSchema = new Schema<AppEdge>(
  {
    id: { 
      type: String, 
      required: true
    },
    source: { 
      type: String, 
      required: true
    },
    target: { 
      type: String, 
      required: true
    },
    sourceHandle: { 
      type: String, 
      default: null 
    },
    targetHandle: { 
      type: String, 
      default: null 
    }
  },
  { _id: false }
);

/**
 * Workflow version container embedding the nodes and edges graph.
 */
const workflowVersionSchema = new Schema<WorkflowVersion>(
  {
    is_valid: { 
      type: Boolean, 
      required: true, 
      default: false 
    },
    nodes: [nodeSchema],
    edges: [edgeSchema]
  },
  { _id: false }
);

export interface IWorkflow {
  user_id: Types.ObjectId;
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

/**
 * Main Workflow Schema containing embedded draft and deployed versions
 * for atomic deployment operations.
 */
const workflowSchema = new Schema<IWorkflow>(
  {
    user_id: {
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    display_id: { 
      type: String, 
      required: true, 
      unique: true 
    },
    name: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String, 
      default: '' 
    },
    status: { 
      type: String, 
      enum: ["DRAFT", "DEPLOYED", "IN_EDIT"], 
      required: true, default: "DRAFT" 
    },
    is_active: { 
      type: Boolean, 
      required: true, 
      default: false 
    },
    draft_version: { 
      type: workflowVersionSchema, 
      required: true 
    },
    deployed_version: { 
      type: workflowVersionSchema, 
      default: null 
    }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const Workflow = model<IWorkflow>('Workflow', workflowSchema);
