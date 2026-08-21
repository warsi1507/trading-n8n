export class ExecutionContext {
  private state: Record<string, any> = {};

  constructor(initialState?: Record<string, any>) {
    if (initialState) {
      this.state = { ...initialState };
    }
  }

  /**
   * Store data produced by a specific node.
   */
  setNodeData(nodeId: string, data: any): void {
    this.state[nodeId] = data;
  }

  /**
   * Retrieve data produced by a specific node.
   */
  getNodeData(nodeId: string): any {
    return this.state[nodeId];
  }

  /**
   * Returns a snapshot of the entire execution state.
   */
  getState(): Record<string, any> {
    return { ...this.state };
  }
}
