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
import { ConcurDesignTokens, getStatusBadgeStyle, formatCurrency } from '../../constants/concurDesignTokens';

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
      case 'high': return ConcurDesignTokens.colors.error;
      case 'normal': return ConcurDesignTokens.colors.warning;
      case 'low': return ConcurDesignTokens.colors.success;
      default: return ConcurDesignTokens.colors.textTertiary;
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
          <ActivityIndicator size="large" color={ConcurDesignTokens.colors.primary} />
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
    backgroundColor: ConcurDesignTokens.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: ConcurDesignTokens.spacing.base,
    backgroundColor: ConcurDesignTokens.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ConcurDesignTokens.colors.border,
    ...ConcurDesignTokens.shadows.sm,
  },
  headerTitle: {
    fontSize: ConcurDesignTokens.typography.fontSize.xxl,
    fontWeight: ConcurDesignTokens.typography.fontWeight.bold,
    color: ConcurDesignTokens.colors.text,
  },
  headerBadge: {
    backgroundColor: ConcurDesignTokens.colors.primary,
    borderRadius: ConcurDesignTokens.borderRadius.xl,
    paddingHorizontal: ConcurDesignTokens.spacing.md,
    paddingVertical: ConcurDesignTokens.spacing.xs,
  },
  headerBadgeText: {
    fontSize: ConcurDesignTokens.typography.fontSize.base,
    fontWeight: ConcurDesignTokens.typography.fontWeight.bold,
    color: ConcurDesignTokens.colors.textOnPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: ConcurDesignTokens.spacing.base,
    gap: ConcurDesignTokens.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: ConcurDesignTokens.colors.surface,
    padding: ConcurDesignTokens.spacing.md,
    borderRadius: ConcurDesignTokens.borderRadius.lg,
    alignItems: 'center',
    ...ConcurDesignTokens.shadows.md,
  },
  statValue: {
    fontSize: ConcurDesignTokens.typography.fontSize.xl,
    fontWeight: ConcurDesignTokens.typography.fontWeight.bold,
    color: ConcurDesignTokens.colors.primary,
  },
  statLabel: {
    fontSize: ConcurDesignTokens.typography.fontSize.xs,
    color: ConcurDesignTokens.colors.textSecondary,
    marginTop: ConcurDesignTokens.spacing.xs,
  },
  expenseList: {
    flex: 1,
    padding: ConcurDesignTokens.spacing.base,
  },
  expenseCard: {
    backgroundColor: ConcurDesignTokens.colors.surface,
    borderRadius: ConcurDesignTokens.borderRadius.xl,
    padding: ConcurDesignTokens.spacing.base,
    marginBottom: ConcurDesignTokens.spacing.md,
    ...ConcurDesignTokens.shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConcurDesignTokens.spacing.sm,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ConcurDesignTokens.spacing.xs,
  },
  employeeName: {
    fontSize: ConcurDesignTokens.typography.fontSize.sm,
    fontWeight: ConcurDesignTokens.typography.fontWeight.semibold,
    color: ConcurDesignTokens.colors.text,
  },
  employeeId: {
    fontSize: ConcurDesignTokens.typography.fontSize.xs,
    color: ConcurDesignTokens.colors.textSecondary,
  },
  urgencyBadge: {
    paddingHorizontal: ConcurDesignTokens.spacing.sm,
    paddingVertical: ConcurDesignTokens.spacing.xs,
    borderRadius: ConcurDesignTokens.borderRadius.xl,
  },
  urgencyText: {
    fontSize: ConcurDesignTokens.typography.fontSize.xs,
    fontWeight: ConcurDesignTokens.typography.fontWeight.bold,
    color: ConcurDesignTokens.colors.textOnPrimary,
  },
  merchantName: {
    fontSize: ConcurDesignTokens.typography.fontSize.lg,
    fontWeight: ConcurDesignTokens.typography.fontWeight.bold,
    color: ConcurDesignTokens.colors.text,
    marginBottom: ConcurDesignTokens.spacing.xs,
  },
  amount: {
    fontSize: ConcurDesignTokens.typography.fontSize.xxl,
    fontWeight: ConcurDesignTokens.typography.fontWeight.bold,
    color: ConcurDesignTokens.colors.primary,
    marginBottom: ConcurDesignTokens.spacing.sm,
  },
  cardDetails: {
    flexDirection: 'row',
    gap: ConcurDesignTokens.spacing.base,
    marginBottom: ConcurDesignTokens.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ConcurDesignTokens.spacing.xs,
  },
  detailText: {
    fontSize: ConcurDesignTokens.typography.fontSize.xs,
    color: ConcurDesignTokens.colors.textSecondary,
  },
  violationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ConcurDesignTokens.spacing.xs,
    backgroundColor: ConcurDesignTokens.colors.errorLight,
    paddingHorizontal: ConcurDesignTokens.spacing.sm,
    paddingVertical: ConcurDesignTokens.spacing.xs,
    borderRadius: ConcurDesignTokens.borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: ConcurDesignTokens.spacing.md,
  },
  violationText: {
    fontSize: ConcurDesignTokens.typography.fontSize.xs,
    color: ConcurDesignTokens.colors.error,
    fontWeight: ConcurDesignTokens.typography.fontWeight.medium,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: ConcurDesignTokens.spacing.md,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: ConcurDesignTokens.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  rejectButton: {
    borderColor: ConcurDesignTokens.colors.error,
    backgroundColor: ConcurDesignTokens.colors.errorLight,
  },
  approveButton: {
    borderColor: ConcurDesignTokens.colors.success,
    backgroundColor: ConcurDesignTokens.colors.successLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: ConcurDesignTokens.spacing.base,
    fontSize: ConcurDesignTokens.typography.fontSize.md,
    color: ConcurDesignTokens.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: ConcurDesignTokens.spacing.xxxl,
  },
  emptyStateText: {
    fontSize: ConcurDesignTokens.typography.fontSize.xl,
    fontWeight: ConcurDesignTokens.typography.fontWeight.bold,
    marginTop: ConcurDesignTokens.spacing.base,
    color: ConcurDesignTokens.colors.text,
  },
  emptyStateSubtext: {
    fontSize: ConcurDesignTokens.typography.fontSize.md,
    color: ConcurDesignTokens.colors.textSecondary,
    marginTop: ConcurDesignTokens.spacing.sm,
  },
  detailContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: ConcurDesignTokens.colors.surface,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ConcurDesignTokens.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: ConcurDesignTokens.colors.border,
  },
  detailTitle: {
    fontSize: ConcurDesignTokens.typography.fontSize.xl,
    fontWeight: ConcurDesignTokens.typography.fontWeight.bold,
    marginLeft: ConcurDesignTokens.spacing.base,
  },
  detailCard: {
    padding: ConcurDesignTokens.spacing.base,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: ConcurDesignTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConcurDesignTokens.colors.backgroundAlt,
  },
  detailLabel: {
    fontSize: ConcurDesignTokens.typography.fontSize.sm,
    color: ConcurDesignTokens.colors.textSecondary,
  },
  detailValue: {
    fontSize: ConcurDesignTokens.typography.fontSize.sm,
    color: ConcurDesignTokens.colors.text,
    fontWeight: ConcurDesignTokens.typography.fontWeight.medium,
    flex: 1,
    textAlign: 'right',
  },
  amountText: {
    fontSize: ConcurDesignTokens.typography.fontSize.lg,
    fontWeight: ConcurDesignTokens.typography.fontWeight.bold,
    color: ConcurDesignTokens.colors.primary,
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ConcurDesignTokens.spacing.sm,
    backgroundColor: ConcurDesignTokens.colors.backgroundAlt,
    padding: ConcurDesignTokens.spacing.base,
    marginHorizontal: ConcurDesignTokens.spacing.base,
    borderRadius: ConcurDesignTokens.borderRadius.md,
  },
  receiptButtonText: {
    fontSize: ConcurDesignTokens.typography.fontSize.md,
    color: ConcurDesignTokens.colors.info,
    fontWeight: ConcurDesignTokens.typography.fontWeight.semibold,
  },
  violationsCard: {
    backgroundColor: ConcurDesignTokens.colors.warningLight,
    padding: ConcurDesignTokens.spacing.base,
    margin: ConcurDesignTokens.spacing.base,
    borderRadius: ConcurDesignTokens.borderRadius.md,
    borderWidth: 1,
    borderColor: ConcurDesignTokens.colors.warning,
  },
  violationsTitle: {
    fontSize: ConcurDesignTokens.typography.fontSize.md,
    fontWeight: ConcurDesignTokens.typography.fontWeight.bold,
    color: ConcurDesignTokens.colors.warningDark,
    marginBottom: ConcurDesignTokens.spacing.sm,
  },
  violationItem: {
    fontSize: ConcurDesignTokens.typography.fontSize.sm,
    color: ConcurDesignTokens.colors.warningDark,
    marginBottom: ConcurDesignTokens.spacing.xxs,
  },
  approvalSection: {
    padding: ConcurDesignTokens.spacing.base,
  },
  approvalLabel: {
    fontSize: ConcurDesignTokens.typography.fontSize.md,
    fontWeight: ConcurDesignTokens.typography.fontWeight.semibold,
    marginBottom: ConcurDesignTokens.spacing.sm,
  },
  commentInput: {
    backgroundColor: ConcurDesignTokens.colors.backgroundAlt,
    borderWidth: 1,
    borderColor: ConcurDesignTokens.colors.border,
    borderRadius: ConcurDesignTokens.borderRadius.md,
    padding: ConcurDesignTokens.spacing.md,
    fontSize: ConcurDesignTokens.typography.fontSize.sm,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: ConcurDesignTokens.spacing.base,
  },
  approvalActions: {
    flexDirection: 'row',
    gap: ConcurDesignTokens.spacing.md,
  },
  approvalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ConcurDesignTokens.spacing.sm,
    paddingVertical: ConcurDesignTokens.spacing.base,
    borderRadius: ConcurDesignTokens.borderRadius.md,
  },
  rejectActionButton: {
    backgroundColor: ConcurDesignTokens.colors.error,
  },
  approveActionButton: {
    backgroundColor: ConcurDesignTokens.colors.success,
  },
  approvalButtonText: {
    fontSize: ConcurDesignTokens.typography.fontSize.md,
    fontWeight: ConcurDesignTokens.typography.fontWeight.bold,
    color: ConcurDesignTokens.colors.surface,
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
    backgroundColor: ConcurDesignTokens.colors.surface,
    borderRadius: ConcurDesignTokens.borderRadius.lg,
    padding: ConcurDesignTokens.spacing.xl,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: ConcurDesignTokens.typography.fontSize.xl,
    fontWeight: ConcurDesignTokens.typography.fontWeight.bold,
    marginBottom: ConcurDesignTokens.spacing.sm,
  },
  modalSubtitle: {
    fontSize: ConcurDesignTokens.typography.fontSize.sm,
    color: ConcurDesignTokens.colors.textSecondary,
    marginBottom: ConcurDesignTokens.spacing.base,
  },
  rejectionInput: {
    backgroundColor: ConcurDesignTokens.colors.backgroundAlt,
    borderWidth: 1,
    borderColor: ConcurDesignTokens.colors.border,
    borderRadius: ConcurDesignTokens.borderRadius.md,
    padding: ConcurDesignTokens.spacing.md,
    fontSize: ConcurDesignTokens.typography.fontSize.sm,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: ConcurDesignTokens.spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: ConcurDesignTokens.spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: ConcurDesignTokens.spacing.md,
    borderRadius: ConcurDesignTokens.borderRadius.md,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: ConcurDesignTokens.colors.backgroundAlt,
  },
  modalCancelText: {
    fontSize: ConcurDesignTokens.typography.fontSize.md,
    fontWeight: ConcurDesignTokens.typography.fontWeight.semibold,
    color: ConcurDesignTokens.colors.textSecondary,
  },
  modalRejectButton: {
    backgroundColor: ConcurDesignTokens.colors.error,
  },
  modalRejectText: {
    fontSize: ConcurDesignTokens.typography.fontSize.md,
    fontWeight: ConcurDesignTokens.typography.fontWeight.semibold,
    color: ConcurDesignTokens.colors.surface,
  },
});