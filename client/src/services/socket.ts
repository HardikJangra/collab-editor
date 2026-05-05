import { io, Socket } from "socket.io-client";

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  if (import.meta.env.VITE_API_URL) {
    const apiUrl = new URL(import.meta.env.VITE_API_URL, window.location.origin);
    apiUrl.pathname = apiUrl.pathname.replace(/\/api\/?$/, "");
    return apiUrl.origin;
  }

  return import.meta.env.PROD ? window.location.origin : "http://localhost:3001";
};

const SOCKET_URL = getSocketUrl();

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"], // 🔥 FIXED
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = (): Socket => {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

export default getSocket;