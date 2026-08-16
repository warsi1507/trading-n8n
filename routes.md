# API Routes Architecture

This document outlines the RESTful API endpoints for the Trading n8n backend. All endpoints are prefixed with `/api` and require a valid Clerk authentication token unless specified otherwise.

## 1. Workflows CRUD

These are the primary routes for the frontend dashboard and canvas editor.

### `GET /workflows`
- **Purpose**: Fetch a list of all workflows for the authenticated user.
- **Used by**: The main dashboard page (`/workflows`).
- **Response**: Array of lightweight workflow objects (omits heavy `nodes` and `edges` arrays to load fast).

### `POST /workflows`
- **Purpose**: Create a brand new, empty workflow.
- **Payload**: `{ "name": "string", "description": "string" }`
- **Response**: Returns the newly created workflow, crucially including the `display_id`.
- **Flow**: The frontend calls this, receives the `display_id`, and immediately redirects the user to `/workflows/:display_id`.

### `GET /workflows/:display_id`
- **Purpose**: Fetch the full data of a specific workflow.
- **Used by**: The canvas editor page.
- **Response**: The complete workflow object including the full `draft_version` (nodes and edges) to render the ReactFlow canvas.

### `PUT /workflows/:display_id`
- **Purpose**: Save the user's canvas. 
- **Payload**: `{ "nodes": [...], "edges": [...] }`
- **Behavior**: This strictly overwrites the `draft_version`. If the workflow was `DEPLOYED`, this action changes the status to `IN_EDIT` (as discussed).

### `DELETE /workflows/:display_id`
- **Purpose**: Permanently delete a workflow. (For future implementation).

---

## 2. Workflow Actions

These routes handle specific lifecycle events or actions that aren't just "saving data".

### `POST /workflows/:display_id/publish`
- **Purpose**: Take the current `draft_version` and copy it into the `deployed_version`.
- **Behavior**: Changes the status to `DEPLOYED`. This is the version the backend engine will actually use to execute live trades.
- **Validation Guard**: This route will throw a `400 Bad Request` if the `draft_version.is_valid` is false.

---

## 3. Workflow Graph Validation

As discussed in `db.md`, we never let broken workflows get deployed.

- **When does it happen?**: Validation happens seamlessly in the background during the `PUT /api/workflows/:display_id` (Save Draft) route.
- **How it works**: When the frontend sends the array of `nodes` and `edges`, the backend controller will run our logic to ensure the graph makes sense (e.g., "Does it have a trigger?", "Are the required inputs filled?").
- **The Result**: The backend calculates true/false and forcibly overwrites the `is_valid` flag in the database. The frontend never sends the `is_valid` flag—the backend dictates it based on the graph data.

---

## 4. Executions *(Future)*

### `GET /workflows/:display_id/executions`
- **Purpose**: Fetch the history logs of when this workflow ran, whether it succeeded, failed, and what trades it executed.

---

## 5. Frontend Implementation Notes

To integrate with these routes, the frontend architecture will shift to a single, powerful editor component:

1. **Routing Strategy**:
   - The standalone `/createworkflow` route is removed.
   - We use a single dynamic route: `/workflows/:display_id` (the current `CreateWorkflow` page will be renamed and reused here).
   - If it's a newly created workflow, the canvas is empty.
   - If it's an existing workflow, it loads either the `draft_version` or `deployed_version` depending on its state.

2. **The "Three Button" State Machine**:
   - **`Validate` Button**: Shown if the workflow is in DRAFT (or IN_EDIT) and has not been validated.
   - **`Deploy` Button**: Shown if the workflow is VALIDATED and no new edits have been made since validation.
   - **`Edit` Button**: Shown if the workflow is DEPLOYED. By default, opening a deployed workflow shows the locked `deployed_version`. Clicking "Edit" swaps the canvas to the persistent `in_edit` (`draft_version`) state and reveals the Validate/Deploy buttons again.

3. **When to call `PUT /workflows/:display_id` (Update API)**:
   To prevent blasting the backend with hundreds of API calls, we will strictly control when updates fire:
   - **Title Change**: Use a *debounce* (wait 1 second after typing stops) OR trigger strictly on `onBlur` (when the user clicks outside the text box).
   - **Description Change**: Trigger exactly when the user clicks the "Save" button on the description modal.
   - **Node Deletion**: Trigger immediately when the user clicks the delete node button.
   - **Node Configuration**: Trigger exactly when the user clicks "Save Changes" or "Create" on the side sheet.
   - *(Suggested)* **Edge Connection**: Trigger immediately when the user successfully drops a new connection line between two nodes (`onConnect` event).
   - *(Suggested)* **Edge Deletion**: Trigger immediately when an edge is deleted.
   - *(Suggested)* **Node Dragging**: Trigger strictly on `onNodeDragStop` (when the user *lets go* of the mouse). **Never** trigger on `onNodeDrag` (which fires 60 times a second!).
