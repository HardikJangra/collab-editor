export interface User {
  socketId: string;
  username: string;
  color: string;
  joinedAt: string;
}

export interface Document {
  docId: string;
  title: string;
  content: string;
  version: number;
  lastSavedAt: string;
  updatedAt?: string;
}

export interface EditorState {
  content: string;
  title: string;
  isSaving: boolean;
  lastSaved: Date | null;
  version: number;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface CursorUpdate {
  socketId: string;
  username: string;
  position: number;
  color: string;
}

export interface ToolbarAction {
  label: string;
  icon: string;
  prefix: string;
  suffix?: string;
  block?: boolean;
}
