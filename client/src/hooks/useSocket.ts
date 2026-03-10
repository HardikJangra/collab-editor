import { useEffect, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket } from "@/services/socket";
import type { User, CursorUpdate } from "@/types/editorTypes";

interface UseSocketOptions {
  docId: string;
  username: string;
  onDocumentLoaded: (data: {
    content: string;
    title: string;
    version: number;
    lastSavedAt: string;
  }) => void;
  onEditorUpdate: (data: { content: string; userId: string }) => void;
  onTitleUpdate: (data: { title: string }) => void;
  onUsersUpdate: (users: User[]) => void;
  onDocumentSaved: (data: { timestamp: string }) => void;
  onConnected: () => void;
  onDisconnected: () => void;
  onError: (msg: string) => void;
}

export const useSocket = ({
  docId,
  username,
  onDocumentLoaded,
  onEditorUpdate,
  onTitleUpdate,
  onUsersUpdate,
  onDocumentSaved,
  onConnected,
  onDisconnected,
  onError,
}: UseSocketOptions) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      onConnected();
      socket.emit("join-document", { docId, username });
    });

    socket.on("disconnect", onDisconnected);
    socket.on("connect_error", () => onError("Connection failed. Retrying..."));
    socket.on("document-loaded", onDocumentLoaded);
    socket.on("editor-update", onEditorUpdate);
    socket.on("title-update", onTitleUpdate);
    socket.on("users-update", onUsersUpdate);
    socket.on("document-saved", onDocumentSaved);
    socket.on("error", (data: { message: string }) => onError(data.message));

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("document-loaded");
      socket.off("editor-update");
      socket.off("title-update");
      socket.off("users-update");
      socket.off("document-saved");
      socket.off("error");
      disconnectSocket();
    };
  }, [docId, username]);

  const emitChange = useCallback((content: string) => {
    socketRef.current?.emit("editor-change", { docId, content });
  }, [docId]);

  const emitTitleChange = useCallback((title: string) => {
    socketRef.current?.emit("title-change", { docId, title });
  }, [docId]);

  const emitSave = useCallback((content: string, title: string) => {
    socketRef.current?.emit("save-document", { docId, content, title });
  }, [docId]);

  return { emitChange, emitTitleChange, emitSave };
};
