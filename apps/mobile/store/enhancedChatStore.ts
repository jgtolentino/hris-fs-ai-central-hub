import { create } from "zustand";
import { Message, ChatState, WorkflowAction } from "@/types/chat";

interface EnhancedChatStore extends ChatState {
  sendMessage: (content: string) => Promise<{ workflowAction?: WorkflowAction; suggestions?: string[]; }>;
  processWorkflowRequest: (intent: string, parameters: any) => Promise<any>;
  clearChat: () => void;
  fetchSuggestedQuestions: () => Promise<void>;
  getWorkflowHelp: (workflowType: string) => Promise<string>;
}

export const useEnhancedChatStore = create<EnhancedChatStore>((set, get) => ({
  messages: [],
  isTyping: false,
  loading: false,
  suggestedQuestions: [
    "Request vacation leave",
    "Submit an expense report",
    "Fix my time entry",
    "Get IT support",
    "Check my leave balance",
    "What's the remote work policy?",
    "How do I request overtime?",
    "Submit a maintenance request"
  ],
  referencedDocuments: [],
  sessionId: null,

  sendMessage: async (content: string) => {
    const currentState = get();
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately
    set({
      messages: [...currentState.messages, userMessage],
      isTyping: true,
      loading: true,
    });

    try {
      // Simulate AI processing with workflow detection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response = await processMessageWithAI(content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        documentReferences: response.documentReferences,
        confidenceScore: response.confidenceScore,
        workflowActions: response.workflowActions,
      };

      set({
        messages: [...get().messages, assistantMessage],
        isTyping: false,
        loading: false,
        referencedDocuments: response.documentReferences || [],
        sessionId: response.sessionId || currentState.sessionId,
      });

      return {
        workflowAction: response.workflowAction ?? undefined,
        suggestions: response.suggestions ?? []
      };
    } catch (error) {
      console.error('Send message error:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "I'm sorry, I encountered an error. Please try again or contact support if the problem persists.",
        sender: 'system',
        timestamp: new Date().toISOString(),
      };

      set({
        messages: [...get().messages, errorMessage],
        isTyping: false,
        loading: false,
      });

      throw error;
    }
  },

  processWorkflowRequest: async (intent: string, parameters: any) => {
    try {
      // Mock workflow processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const workflowMessage: Message = {
        id: Date.now().toString(),
        content: `I'll help you with that ${intent}. Let me open the appropriate form for you.`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        workflowActions: [{
          type: intent,
          data: parameters,
          message: `Opening ${intent} form...`
        }],
      };

      set({
        messages: [...get().messages, workflowMessage],
      });

      return { success: true, action: intent, data: parameters };
    } catch (error) {
      console.error('Process workflow error:', error);
      throw error;
    }
  },

  getWorkflowHelp: async (workflowType: string) => {
    try {
      const helpContent = getWorkflowHelpContent(workflowType);
      
      const helpMessage: Message = {
        id: Date.now().toString(),
        content: helpContent,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      };

      set({
        messages: [...get().messages, helpMessage],
      });

      return helpContent;
    } catch (error) {
      console.error('Get workflow help error:', error);
      throw error;
    }
  },

  clearChat: () => {
    set({
      messages: [],
      referencedDocuments: [],
      sessionId: null,
    });
  },

  fetchSuggestedQuestions: async () => {
    // Questions are already set in initial state
  },
}));

// Mock AI processing function
async function processMessageWithAI(message: string) {
  const lowerMessage = message.toLowerCase();
  
  // Detect workflow intents
  let workflowAction = null;
  let content = "";
  
  if (lowerMessage.includes("vacation") || lowerMessage.includes("leave") || lowerMessage.includes("time off")) {
    workflowAction = {
      type: 'create_leave_request',
      data: { leaveType: 'vacation' },
      message: "I'll help you request vacation leave. Let me open the leave request form for you."
    };
    content = "I can help you request vacation leave! How many days do you need and what dates? I'll open the leave request form with the details we discuss.";
  } else if (lowerMessage.includes("expense") || lowerMessage.includes("receipt") || lowerMessage.includes("reimbursement")) {
    workflowAction = {
      type: 'create_expense',
      data: { category: 'general' },
      message: "I'll help you submit an expense report. Let me open the expense form for you."
    };
    content = "I'll help you submit your expense report! Do you have the receipt ready? I can guide you through the process and help with OCR scanning.";
  } else if (lowerMessage.includes("time") && (lowerMessage.includes("fix") || lowerMessage.includes("correct") || lowerMessage.includes("wrong"))) {
    workflowAction = {
      type: 'create_time_correction',
      data: { type: 'correction' },
      message: "I'll help you fix your time entry. Let me open the time correction form for you."
    };
    content = "I'll help you correct your time entry! What date needs to be fixed and what should the correct time be? Opening the time correction form...";
  } else if (lowerMessage.includes("it") || lowerMessage.includes("laptop") || lowerMessage.includes("computer") || lowerMessage.includes("software")) {
    workflowAction = {
      type: 'create_it_request',
      data: { category: 'hardware' },
      message: "I'll help you submit an IT request. Let me open the IT support form for you."
    };
    content = "I can help you with your IT request! What kind of support do you need - hardware, software, or access? I'll open the appropriate form.";
  } else if (lowerMessage.includes("balance") || lowerMessage.includes("how many")) {
    content = "I can help you check your leave balance! You currently have:\n\n• Vacation Leave: 8 days available\n• Sick Leave: 5 days available\n• Personal Leave: 3 days available\n\nWould you like to request any leave?";
  } else if (lowerMessage.includes("policy") || lowerMessage.includes("remote") || lowerMessage.includes("work from home")) {
    content = "According to our remote work policy:\n\n• Remote work is allowed up to 2 days per week\n• Must be pre-approved by your manager\n• Core hours (10 AM - 3 PM) must be observed\n• Regular check-ins are required\n\nWould you like me to help you submit a remote work request?";
  } else if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    content = "Hello! I'm your TBWA AI Assistant. I can help you with:\n\n• Submitting requests (leave, expenses, IT support)\n• Checking balances and status\n• Finding company policies\n• Fixing time entries\n• And much more!\n\nWhat can I help you with today?";
  } else {
    content = "I understand you're asking about something. I can help you with various HR tasks like:\n\n• Leave requests\n• Expense submissions\n• Time corrections\n• IT support\n• Policy questions\n• Balance checks\n\nCould you be more specific about what you need help with?";
  }

  return {
    content,
    timestamp: new Date().toISOString(),
    sessionId: 'session_' + Date.now(),
    workflowAction,
    workflowActions: workflowAction ? [workflowAction] : [],
    documentReferences: [],
    confidenceScore: 0.85,
    suggestions: [
      "Tell me more about this process",
      "What documents do I need?",
      "How long does approval take?",
      "Can I check the status later?"
    ]
  };
}

function getWorkflowHelpContent(workflowType: string): string {
  const helpContent: Record<string, string> = {
    leave_request: "To submit a leave request:\n\n1. Choose your leave type (vacation, sick, personal)\n2. Select your dates\n3. Provide a reason\n4. Upload medical certificate if required\n5. Submit for approval\n\nApproval typically takes 1-2 business days.",
    expense_submission: "To submit an expense:\n\n1. Take a photo of your receipt\n2. Fill in the expense details\n3. Select the appropriate category\n4. Add business purpose\n5. Submit for approval\n\nReceipts are processed with OCR for accuracy.",
    time_correction: "To correct your time entry:\n\n1. Select the date to correct\n2. Specify the correct clock in/out time\n3. Explain the reason for correction\n4. Submit for approval\n\nTime corrections are usually approved within 24 hours.",
    it_request: "To submit an IT request:\n\n1. Choose request type (hardware, software, access)\n2. Describe your requirements\n3. Set priority level\n4. Submit for processing\n\nIT requests are handled based on priority and availability."
  };

  return helpContent[workflowType as keyof typeof helpContent] || "I can provide help with various workflows. What specific process do you need help with?";
}