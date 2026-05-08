import { useEffect, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";
import getSocket from "@/services/socket";
import type { User } from "@/types/editorTypes";

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

type DocumentLoadedPayload =
  Parameters<UseSocketOptions["onDocumentLoaded"]>[0];

type EditorUpdatePayload =
  Parameters<UseSocketOptions["onEditorUpdate"]>[0];

type TitleUpdatePayload =
  Parameters<UseSocketOptions["onTitleUpdate"]>[0];

type DocumentSavedPayload =
  Parameters<UseSocketOptions["onDocumentSaved"]>[0];

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

  const handlersRef = useRef({
    onDocumentLoaded,
    onEditorUpdate,
    onTitleUpdate,
    onUsersUpdate,
    onDocumentSaved,
    onConnected,
    onDisconnected,
    onError,
  });

  useEffect(() => {
    handlersRef.current = {
      onDocumentLoaded,
      onEditorUpdate,
      onTitleUpdate,
      onUsersUpdate,
      onDocumentSaved,
      onConnected,
      onDisconnected,
      onError,
    };
  });

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    // ─── Handlers ─────────────────────────────────────────────
    const handleConnect = () => {
      console.log("✅ Socket connected:", socket.id);

      handlersRef.current.onConnected();

      socket.emit("join-document", {
        docId,
        username,
      });
    };

    const handleDisconnect = () => {
      console.log("❌ Socket disconnected");
      handlersRef.current.onDisconnected();
    };

    const handleConnectError = (err: Error) => {
      console.error("❌ Socket connection error:", err.message);

      handlersRef.current.onError(
        "Connection failed. Retrying..."
      );
    };

    const handleDocumentLoaded = (
      data: DocumentLoadedPayload
    ) => {
      handlersRef.current.onDocumentLoaded(data);
    };

    const handleEditorUpdate = (
      data: EditorUpdatePayload
    ) => {
      handlersRef.current.onEditorUpdate(data);
    };

    const handleTitleUpdate = (
      data: TitleUpdatePayload
    ) => {
      handlersRef.current.onTitleUpdate(data);
    };

    const handleUsersUpdate = (users: User[]) => {
      handlersRef.current.onUsersUpdate(users);
    };

    const handleDocumentSaved = (
      data: DocumentSavedPayload
    ) => {
      handlersRef.current.onDocumentSaved(data);
    };

    const handleSocketError = (data: {
      message: string;
    }) => {
      handlersRef.current.onError(data.message);
    };

    const handleDocumentSaveError = (data: {
      message: string;
    }) => {
      handlersRef.current.onError(data.message);
    };

    // ─── Register Events ─────────────────────────────────────
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    socket.on("document-loaded", handleDocumentLoaded);
    socket.on("editor-update", handleEditorUpdate);
    socket.on("title-update", handleTitleUpdate);
    socket.on("users-update", handleUsersUpdate);
    socket.on("document-saved", handleDocumentSaved);

    socket.on("document-save-error", handleDocumentSaveError);
    socket.on("error", handleSocketError);

    // ─── Connect Socket ──────────────────────────────────────
    socket.connect();

    // ─── Cleanup ─────────────────────────────────────────────
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);

      socket.off("document-loaded", handleDocumentLoaded);
      socket.off("editor-update", handleEditorUpdate);
      socket.off("title-update", handleTitleUpdate);
      socket.off("users-update", handleUsersUpdate);
      socket.off("document-saved", handleDocumentSaved);

      socket.off(
        "document-save-error",
        handleDocumentSaveError
      );

      socket.off("error", handleSocketError);
    };
  }, [docId, username]);

  // ─── Emitters ─────────────────────────────────────────────
  const emitChange = useCallback(
    (content: string) => {
      socketRef.current?.emit("editor-change", {
        docId,
        content,
      });
    },
    [docId]
  );

  const emitTitleChange = useCallback(
    (title: string) => {
      socketRef.current?.emit("title-change", {
        docId,
        title,
      });
    },
    [docId]
  );

  const emitSave = useCallback(
    (content: string, title: string) => {
      socketRef.current?.emit("save-document", {
        docId,
        content,
        title,
      });
    },
    [docId]
  );

  return {
    emitChange,
    emitTitleChange,
    emitSave,
  };
};