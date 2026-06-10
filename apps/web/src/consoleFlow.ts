export type CodexFlowState =
  | "needs_input"
  | "needs_bridge"
  | "ready_to_create"
  | "creating"
  | "ready_for_codex"
  | "error";

export type CodexPrimaryAction =
  | "complete_input"
  | "start_bridge"
  | "create_project"
  | "creating"
  | "copy_codex_command"
  | "retry";

export interface CodexFlowInput {
  hasUsableInput: boolean;
  bridgeConnected: boolean;
  creating: boolean;
  projectReady: boolean;
  hasError: boolean;
}

export function getCodexFlowState(input: CodexFlowInput): CodexFlowState {
  if (input.hasError) return "error";
  if (input.creating) return "creating";
  if (input.projectReady) return "ready_for_codex";
  if (!input.hasUsableInput) return "needs_input";
  if (!input.bridgeConnected) return "needs_bridge";
  return "ready_to_create";
}

export function getCodexPrimaryAction(state: CodexFlowState): CodexPrimaryAction {
  const actionByState: Record<CodexFlowState, CodexPrimaryAction> = {
    needs_input: "complete_input",
    needs_bridge: "start_bridge",
    ready_to_create: "create_project",
    creating: "creating",
    ready_for_codex: "copy_codex_command",
    error: "retry"
  };
  return actionByState[state];
}
