export interface ChatMessage {
  id: number;
  username: string;
  role: "admin" | "user";
  message: string;
  createdAt: string;
}

const API = "https://fleetmaster-server.onrender.com/api/chat";

export const getMessages = async (): Promise<ChatMessage[]> => {
  const response = await fetch(API);

  if (!response.ok) {
    throw new Error("Failed to load messages");
  }

  return response.json();
};

export const sendMessage = async (message: string): Promise<void> => {
  const response = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error("Failed to send message");
  }
};

export const deleteMessage = async (id: number): Promise<void> => {
  const response = await fetch(`${API}/${id}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error("Failed to delete message");
  }
};
