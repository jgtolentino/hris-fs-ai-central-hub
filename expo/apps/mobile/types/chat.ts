export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: string;
  documentReferences?: DocumentReference[];
  confidenceScore?: number;
  workflowActions?: WorkflowAction[];
}

export interface DocumentReference {
  id: string;
  title: string;
  type: string;
  url?: string;
  relevanceScore?: number;
}

export interface WorkflowAction {
  type: string;
  data: any;
  message: string;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  loading: boolean;
  suggestedQuestions: string[];
  referencedDocuments: DocumentReference[];
  sessionId: string | null;
}

export interface ChatResponse {
  messageId: string;
  content: string;
  timestamp: string;
  sessionId: string;
  documentReferences?: DocumentReference[];
  confidenceScore?: number;
  workflowAction?: WorkflowAction;
  suggestions?: string[];
}