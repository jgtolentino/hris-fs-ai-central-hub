import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Check, 
  X, 
  Clock, 
  DollarSign, 
  Calendar, 
  MapPin, 
  FileText,
  AlertCircle,
  MessageSquare,
  User,
  Briefcase,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useExpenseStore } from '../../store/expense-store';
import { sendPushNotification } from '../../services/notification-service';

interface PendingApproval {
  id: string;
  employeeName: string;
  employeeId: string;
  merchantName: string;
  amount: number;
  currency: string;
  category: string;
  expenseDate: Date;
  submittedDate: Date;
  description?: string;
  hasReceipt: boolean;
  receiptUrl?: string;
  tripName?: string;
  projectName?: string;
  policyViolations: any[];
  urgency: 'low' | 'normal' | 'high';
  daysWaiting: number;
}

export const ManagerApprovalFlow: React.FC = () => {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<PendingApproval | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [stats, setStats] = useState({
    totalPending: 0,
    totalAmount: 0,
    oldestDays: 0,
    violations: 0,
  });

  useEffect(() => {
    fetchPendingApprovals();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('expense-approvals')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'expenses',
          filter: 'status=eq.Pending Approval',
        },
        (payload) => {
          // Refresh when new expense submitted
          fetchPendingApprovals();
          sendPushNotification({
            title: 'New Expense Approval',
            body: 'You have a new expense to review',
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const fetchPendingApprovals = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Fetch expenses pending approval
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select(`
          *,
          profiles!expenses_user_id_fkey (
            full_name,
            employee_id,
            department
          ),
          business_trips (
            trip_name
          ),
          projects (
            project_name
          )
        `)
        .eq('status', 'Pending Approval')
        .eq('assigned_to', userData.user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform data
      const approvals = expenses.map((expense) => {
        const daysWaiting = Math.floor(
          (new Date().getTime() - new Date(expense.created_at).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        
        return {
          id: expense.id,
          employeeName: expense.profiles.full_name,
          employeeId: expense.profiles.employee_id,
          merchantName: expense.merchant_name,
          amount: expense.amount,
          currency: expense.currency,
          category: expense.expense_category,
          expenseDate: new Date(expense.expense_date),
          submittedDate: new Date(expense.created_at),
          description: expense.description,
          hasReceipt: expense.has_receipt,
          receiptUrl: expense.receipt_url,
          tripName: expense.business_trips?.trip_name,
          projectName: expense.projects?.project_name,
          policyViolations: expense.policy_violations || [],
          urgency: daysWaiting > 5 ? 'high' : daysWaiting > 2 ? 'normal' : 'low',
          daysWaiting,
        };
      });

      setPendingApprovals(approvals);
      
      // Calculate stats
      const totalAmount = approvals.reduce((sum, exp) => sum + exp.amount, 0);
      const violations = approvals.filter(exp => exp.policyViolations.length > 0).length;
      const oldestDays = Math.max(...approvals.map(exp => exp.daysWaiting), 0);
      
      setStats({
        totalPending: approvals.length,
        totalAmount,
        oldestDays,
        violations,
      });
    } catch (error) {
      console.error('Error fetching approvals:', error);
      Alert.alert('Error', 'Failed to load pending approvals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (expenseId: string) => {
    setProcessingId(expenseId);
    
    try {
      // Create approval record
      const { error: approvalError } = await supabase
        .from('expense_approvals')
        .insert({
          expense_id: expenseId,
          approver_id: (await supabase.auth.getUser()).data.user?.id,
          status: 'Approved',
          comments: approvalComment,
          approved_at: new Date(),
        });

      if (approvalError) throw approvalError;

      // Update expense status
      const { error: updateError } = await supabase
        .from('expenses')
        .update({
          status: 'Approved',
          approved_at: new Date(),
        })
        .eq('id', expenseId);

      if (updateError) throw updateError;

      // Send notification to employee
      await sendEmployeeNotification(expenseId, 'approved');

      // Trigger ServiceNow integration if needed
      await triggerServiceNowIntegration(expenseId);

      Alert.alert('Success', 'Expense approved successfully', [
        { text: 'OK', onPress: () => {
          setSelectedExpense(null);
          setApprovalComment('');
          fetchPendingApprovals();
        }}
      ]);
    } catch (error) {
      console.error('Error approving expense:', error);
      Alert.alert('Error', 'Failed to approve expense');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection');
      return;
    }

    if (!selectedExpense) return;
    
    setProcessingId(selectedExpense.id);
    
    try {
      // Create rejection record
      const { error: approvalError } = await supabase
        .from('expense_approvals')
        .insert({
          expense_id: selectedExpense.id,
          approver_id: (await supabase.auth.getUser()).data.user?.id,
          status: 'Rejected',
          comments: rejectionReason,
          approved_at: new Date(),
        });

      if (approvalError) throw approvalError;

      // Update expense status
      const { error: updateError } = await supabase
        .from('expenses')
        .update({
          status: 'Rejected',
        })
        .eq('id', selectedExpense.id);

      if (updateError) throw updateError;

      // Send notification to employee
      await sendEmployeeNotification(selectedExpense.id, 'rejected', rejectionReason);

      Alert.alert('Expense Rejected', 'The employee has been notified', [
        { text: 'OK', onPress: () => {
          setSelectedExpense(null);
          setRejectionReason('');
          setShowRejectModal(false);
          fetchPendingApprovals();
        }}
      ]);
    } catch (error) {
      console.error('Error rejecting expense:', error);
      Alert.alert('Error', 'Failed to reject expense');
    } finally {
      setProcessingId(null);
    }
  };

  const sendEmployeeNotification = async (
    expenseId: string, 
    action: 'approved' | 'rejected',
    reason?: string
  ) => {
    // Implementation would send push notification or email
    console.log(`Notifying employee: Expense ${expenseId} ${action}`);
  };

  const triggerServiceNowIntegration = async (expenseId: string) => {
    // Implementation would create ServiceNow ticket for finance
    console.log(`Creating ServiceNow ticket for expense ${expenseId}`);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#FF6B6B';
      case 'normal': return '#FFD93D';
      case 'low': return '#6BCF7F';
      default: return '#999';
    }
  };

  const renderExpenseCard = (expense: PendingApproval) => (
    <TouchableOpacity
      key={expense.id}
      style={styles.expenseCard}
      onPress={() => setSelectedExpense(expense)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.employeeInfo}>
          <User size={16} color="#666" />
          <Text style={styles.employeeName}>{expense.employeeName}</Text>
          <Text style={styles.employeeId}>({expense.employeeId})</Text>
        </View>
        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(expense.urgency) }]}>
          <Text style={styles.urgencyText}>{expense.daysWaiting}d</Text>
        </View>
      </View>
      
      <Text style={styles.merchantName}>{expense.merchantName}</Text>
      <Text style={styles.amount}>
        {expense.currency} {expense.amount.toFixed(2)}
      </Text>
      
      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <Calendar size={14} color="#666" />
          <Text style={styles.detailText}>
            {format(expense.expenseDate, 'MMM dd, yyyy')}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Briefcase size={14} color="#666" />
          <Text style={styles.detailText}>{expense.category}</Text>
        </View>
      </View>
      
      {expense.policyViolations.length > 0 && (
        <View style={styles.violationBadge}>
          <AlertCircle size={14} color="#FF6B6B" />
          <Text style={styles.violationText}>Policy Violation</Text>
        </View>
      )}
      
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => {
            setSelectedExpense(expense);
            setShowRejectModal(true);
          }}
        >
          <X size={18} color="#FF6B6B" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApprove(expense.id)}
          disabled={processingId === expense.id}
        >
          {processingId === expense.id ? (
            <ActivityIndicator size="small" color="#4CAF50" />
          ) : (
            <Check size={18} color="#4CAF50" />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderExpenseDetail = () => {
    if (!selectedExpense) return null;

    return (
      <ScrollView style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setSelectedExpense(null)}>
            <X size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.detailTitle}>Expense Details</Text>
        </View>
        
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Employee</Text>
            <Text style={styles.detailValue}>
              {selectedExpense.employeeName} ({selectedExpense.employeeId})
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Merchant</Text>
            <Text style={styles.detailValue}>{selectedExpense.merchantName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={[styles.detailValue, styles.amountText]}>
              {selectedExpense.currency} {selectedExpense.amount.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{selectedExpense.category}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {format(selectedExpense.expenseDate, 'MMMM dd, yyyy')}
            </Text>
          </View>
          
          {selectedExpense.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{selectedExpense.description}</Text>
            </View>
          )}
          
          {selectedExpense.tripName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Business Trip</Text>
              <Text style={styles.detailValue}>{selectedExpense.tripName}</Text>
            </View>
          )}
          
          {selectedExpense.projectName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Project</Text>
              <Text style={styles.detailValue}>{selectedExpense.projectName}</Text>
            </View>
          )}
        </View>
        
        {selectedExpense.hasReceipt && (
          <TouchableOpacity style={styles.receiptButton}>
            <FileText size={20} color="#007AFF" />
            <Text style={styles.receiptButtonText}>View Receipt</Text>
          </TouchableOpacity>
        )}
        
        {selectedExpense.policyViolations.length > 0 && (
          <View style={styles.violationsCard}>
            <Text style={styles.violationsTitle}>Policy Violations</Text>
            {selectedExpense.policyViolations.map((violation, index) => (
              <Text key={index} style={styles.violationItem}>
                • {violation.message || violation.type}
              </Text>
            ))}
          </View>
        )}
        
        <View style={styles.approvalSection}>
          <Text style={styles.approvalLabel}>Add Comment (Optional)</Text>
          <TextInput
            style={styles.commentInput}
            value={approvalComment}
            onChangeText={setApprovalComment}
            placeholder="Add a comment for the employee..."
            multiline
            numberOfLines={3}
          />
          
          <View style={styles.approvalActions}>
            <TouchableOpacity 
              style={[styles.approvalButton, styles.rejectActionButton]}
              onPress={() => setShowRejectModal(true)}
            >
              <X size={20} color="white" />
              <Text style={styles.approvalButtonText}>Reject</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.approvalButton, styles.approveActionButton]}
              onPress={() => handleApprove(selectedExpense.id)}
              disabled={processingId === selectedExpense.id}
            >
              {processingId === selectedExpense.id ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Check size={20} color="white" />
                  <Text style={styles.approvalButtonText}>Approve</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading approvals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expense Approvals</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{stats.totalPending}</Text>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalPending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${stats.totalAmount.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Total Amount</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.oldestDays}d</Text>
          <Text style={styles.statLabel}>Oldest</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.violations}</Text>
          <Text style={styles.statLabel}>Violations</Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.expenseList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchPendingApprovals();
            }}
          />
        }
      >
        {pendingApprovals.length === 0 ? (
          <View style={styles.emptyState}>
            <Check size={48} color="#6BCF7F" />
            <Text style={styles.emptyStateText}>All caught up!</Text>
            <Text style={styles.emptyStateSubtext}>No expenses pending approval</Text>
          </View>
        ) : (
          pendingApprovals.map(renderExpenseCard)
        )}
      </ScrollView>
      
      {selectedExpense && renderExpenseDetail()}
      
      {showRejectModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Expense</Text>
            <Text style={styles.modalSubtitle}>
              Please provide a reason for rejection
            </Text>
            <TextInput
              style={styles.rejectionInput}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Enter rejection reason..."
              multiline
              numberOfLines={4}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalRejectButton]}
                onPress={handleReject}
                disabled={!rejectionReason.trim() || processingId !== null}
              >
                {processingId ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalRejectText}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  headerBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  expenseList: {
    flex: 1,
    padding: 16,
  },
  expenseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  employeeId: {
    fontSize: 12,
    color: '#666',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  merchantName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  cardDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  violationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  violationText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  rejectButton: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFE5E5',
  },
  approveButton: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  detailContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  detailCard: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0F0F0',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  receiptButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  violationsCard: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  violationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  violationItem: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
  approvalSection: {
    padding: 16,
  },
  approvalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  approvalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 8,
  },
  rejectActionButton: {
    backgroundColor: '#FF6B6B',
  },
  approveActionButton: {
    backgroundColor: '#4CAF50',
  },
  approvalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  rejectionInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F0F0F0',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalRejectButton: {
    backgroundColor: '#FF6B6B',
  },
  modalRejectText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});