export interface RequestCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
}

export interface RequestType {
  id: string;
  categoryId: string;
  code: string;
  name: string;
  description: string;
  formSchema: any;
  approvalWorkflow: any;
  slaHours: number;
  requiresAttachments: boolean;
  autoApproveConditions?: any;
  isActive: boolean;
}

export interface OrgRequest {
  id: string;
  requestNumber: string;
  requestTypeId: string;
  employeeId: string;
  title: string;
  description: string;
  formData: any;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'completed';
  currentApproverId?: string;
  approvalStep: number;
  totalSteps: number;
  dueDate?: string;
  completedAt?: string;
  estimatedCost?: number;
  actualCost?: number;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  
  // Populated fields
  requestType?: RequestType;
  category?: RequestCategory;
  approvals?: RequestApproval[];
}

export interface RequestApproval {
  id: string;
  requestId: string;
  stepNumber: number;
  approverId: string;
  approverRole: string;
  status: 'pending' | 'approved' | 'rejected' | 'delegated';
  comments?: string;
  approvedAt?: string;
  rejectedAt?: string;
  delegatedTo?: string;
  createdAt: string;
}

export interface CreateRequestData {
  requestTypeId: string;
  title: string;
  description: string;
  formData: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  estimatedCost?: number;
}