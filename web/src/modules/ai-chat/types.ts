export type ChatRole = "user" | "assistant";
export type ChatScope = "learner" | "creator" | "admin";

export interface ChatPageContext {
  route: string;
  selected_quiz_id?: string;
  selected_knowledge_source_id?: string;
}

export interface ChatAction {
  id: string;
  label: string;
  kind: "navigate" | "prompt" | "approve";
  value: string;
  variant?: "primary" | "secondary" | "danger";
  icon?: string;
  disabled?: boolean;
}

export interface ChatFormSubmission {
  form_id: string;
  submission_id?: string;
  values: Record<string, string | number | boolean | null>;
}

export interface UIItem {
  label: string;
  value: string;
  description: string;
  badge: string;
}

export interface UIStat {
  label: string;
  value: string;
  trend: string;
}

export interface UIField {
  name: string;
  label: string;
  input_type: "text" | "number" | "textarea" | "select";
  required: boolean;
  placeholder: string;
  options: string[];
}

export interface UIBlock {
  id: string;
  type: "notice" | "list" | "table" | "stats" | "form";
  title: string;
  description: string;
  tone: "neutral" | "info" | "success" | "warning" | "danger";
  items: UIItem[];
  columns: string[];
  rows: string[][];
  stats: UIStat[];
  fields: UIField[];
  submit_label: string;
  submit_prompt: string;
}

export interface UISurface {
  title: string;
  description: string;
  blocks: UIBlock[];
  actions: ChatAction[];
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  isStreaming?: boolean;
  agent?: string;
  tool?: string;
  status?: string;
  surface?: UISurface;
  citations?: Citation[];
  traceId?: string;
  traceSteps?: GraphTraceStep[];
  error?: boolean;
}

export interface Citation {
  title: string;
  url: string;
  snippet: string;
}

export interface GraphTraceStep {
  trace_id: string;
  node: string;
  event: string;
  tool?: string;
}

export type AgentStreamEvent =
  | { type: "connected"; session_id: string }
  | { type: "status"; label: string; tool?: string }
  | { type: "token"; delta: string }
  | { type: "ui"; surface: UISurface }
  | { type: "citations"; items: Citation[] }
  | { type: "trace"; trace_id: string; node: string; event: string; tool?: string }
  | { type: "done"; intent: string; agent: string; tool?: string; tools?: string[]; trace_id?: string }
  | { type: "error"; message: string };
