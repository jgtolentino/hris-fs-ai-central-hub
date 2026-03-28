export interface LeaveType {
  id: string;
  code: string;
  name: string;
  description?: string;
  maxDaysPerYear?: number;
  requiresMedicalCert: boolean;
  isActive: boolean;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
  lastUpdated: string;
  
  // Populated fields
  leaveType?: LeaveType;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  medicalCertUrl?: string;
  createdAt: string;
  
  // Populated fields
  leaveType?: LeaveType;
}

export interface CreateLeaveRequestData {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  medicalCertUrl?: string;
}