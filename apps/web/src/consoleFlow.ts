export type ConsoleStepId = "start" | "sources" | "configuration" | "handoff";

export type PrimaryActionId =
  | "completeBrief"
  | "addSources"
  | "connectLocal"
  | "createProject"
  | "launchAgent"
  | "reviewDelivery";

export type PreviewMode =
  | "webdeck"
  | "source"
  | "prompt"
  | "brief"
  | "extracted"
  | "manifest"
  | "codexTask"
  | "assetPlan"
  | "elementKit"
  | "checklist"
  | "qualityReport";

export type PreviewGroup = "user" | "agent" | "quality";

export interface ConsoleFlowInput {
  readiness: number;
  sourceCount: number;
  localConnected: boolean;
  helperAvailable: boolean;
  projectReady: boolean;
}

export interface ConsoleStep {
  id: ConsoleStepId;
  status: "complete" | "active" | "blocked" | "ready";
}

export function getPrimaryActionId(input: ConsoleFlowInput): PrimaryActionId {
  if (input.readiness < 70) return "completeBrief";
  if (input.sourceCount === 0) return "addSources";
  if (!input.localConnected) return "connectLocal";
  if (!input.projectReady) return "createProject";
  if (input.helperAvailable) return "launchAgent";
  return "reviewDelivery";
}

export function getConsoleSteps(input: ConsoleFlowInput): ConsoleStep[] {
  const briefDone = input.readiness >= 70;
  const sourcesDone = input.sourceCount > 0;
  const connected = input.localConnected;
  const delivered = input.projectReady;

  return [
    { id: "start", status: briefDone ? "complete" : "active" },
    { id: "sources", status: sourcesDone ? "complete" : briefDone ? "active" : "ready" },
    { id: "configuration", status: connected ? "complete" : sourcesDone ? "active" : "ready" },
    { id: "handoff", status: delivered ? "complete" : connected ? "active" : "blocked" }
  ];
}

export const previewGroupModes: Record<PreviewGroup, PreviewMode[]> = {
  user: ["webdeck", "source", "prompt"],
  agent: ["brief", "extracted", "manifest", "codexTask"],
  quality: ["assetPlan", "elementKit", "checklist", "qualityReport"]
};

export function previewGroupFor(mode: PreviewMode): PreviewGroup {
  if (previewGroupModes.agent.includes(mode)) return "agent";
  if (previewGroupModes.quality.includes(mode)) return "quality";
  return "user";
}
