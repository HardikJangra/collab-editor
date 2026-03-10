const API_URL =
  import.meta.env.VITE_API_URL || "/api";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const handleResponse = async <T>(res: Response): Promise<T> => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "An error occurred");
  }
  return data as T;
};

export const createDocument = async (title?: string) => {
  const res = await fetch(`${API_URL}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return handleResponse<{ docId: string; title: string }>(res);
};

export const getDocument = async (docId: string) => {
  const res = await fetch(`${API_URL}/documents/${docId}`);
  return handleResponse<{
    docId: string;
    title: string;
    content: string;
    version: number;
    lastSavedAt: string;
  }>(res);
};

export const saveDocument = async (
  docId: string,
  content: string,
  title?: string
) => {
  const res = await fetch(`${API_URL}/documents/${docId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, title }),
  });
  return handleResponse<{ docId: string; version: number; lastSavedAt: string }>(res);
};
