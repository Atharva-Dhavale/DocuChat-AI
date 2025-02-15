export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  confidence?: number;
  bookmarked?: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: number;
}

export interface ChatState {
  messages: Message[];
  files: UploadedFile[];
  isDetailedMode: boolean;
}