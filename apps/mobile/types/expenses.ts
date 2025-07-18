export interface Expense {
  id: string;
  userId: string;
  expenseNumber: string;
  title: string;
  totalAmount: number;
  currency: string;
  exchangeRate: number;
  projectId?: string;
  departmentId?: string;
  submissionDate?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  paidAt?: string;
  createdAt: string;
  
  // Populated fields
  items?: ExpenseItem[];
}

export interface ExpenseItem {
  id: string;
  expenseId: string;
  categoryId: string;
  amount: number;
  currency: string;
  description: string;
  expenseDate: string;
  vendor?: string;
  location?: string;
  businessPurpose?: string;
  attendees?: string;
  mileageMiles?: number;
  mileageRate?: number;
  createdAt: string;
  
  // Populated fields
  receipts?: Receipt[];
  category?: ExpenseCategory;
}

export interface Receipt {
  id: string;
  expenseItemId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  ocrData?: any;
  ocrConfidence?: number;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  requiresReceipt: boolean;
  maxAmount?: number;
}

export interface CreateExpenseData {
  title: string;
  items: {
    categoryId: string;
    amount: number;
    description: string;
    expenseDate: string;
    vendor?: string;
    location?: string;
    businessPurpose?: string;
  }[];
}