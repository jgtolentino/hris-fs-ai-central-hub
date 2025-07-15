import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, CheckCircle, XCircle, AlertCircle, ChevronRight } from 'lucide-react-native';
import { DesignTokens } from '@/constants/designTokens';
import { OrgRequest } from '@/store/requestStore';

interface RequestCardProps {
  request: OrgRequest;
  onPress: () => void;
}

export default function RequestCard({ request, onPress }: RequestCardProps) {
  const getStatusIcon = () => {
    switch (request.status) {
      case 'approved':
        return <CheckCircle size={16} color={DesignTokens.colors.success} />;
      case 'rejected':
        return <XCircle size={16} color={DesignTokens.colors.error} />;
      case 'submitted':
      case 'in_review':
        return <Clock size={16} color={DesignTokens.colors.warning} />;
      default:
        return <AlertCircle size={16} color={DesignTokens.colors.textTertiary} />;
    }
  };

  const getStatusColor = () => {
    switch (request.status) {
      case 'approved':
        return DesignTokens.colors.approved;
      case 'rejected':
        return DesignTokens.colors.rejected;
      case 'submitted':
      case 'in_review':
        return DesignTokens.colors.pending;
      default:
        return DesignTokens.colors.draft;
    }
  };

  const getStatusText = () => {
    switch (request.status) {
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Submitted';
      case 'in_review':
        return 'In Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'completed':
        return 'Completed';
      default:
        return request.status;
    }
  };

  const getPriorityColor = () => {
    switch (request.priority) {
      case 'urgent':
        return DesignTokens.colors.error;
      case 'high':
        return DesignTokens.colors.warning;
      case 'normal':
        return DesignTokens.colors.info;
      case 'low':
        return DesignTokens.colors.textTertiary;
      default:
        return DesignTokens.colors.textTertiary;
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.requestNumber}>{request.requestNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            {getStatusIcon()}
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>
        <ChevronRight size={16} color={DesignTokens.colors.textTertiary} />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {request.title}
      </Text>

      {request.description && (
        <Text style={styles.description} numberOfLines={2}>
          {request.description}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.metaInfo}>
          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor() }]} />
          <Text style={styles.priority}>{request.priority.toUpperCase()}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.date}>
            {new Date(request.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {request.dueDate && (
          <Text style={styles.dueDate}>
            Due: {new Date(request.dueDate).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: DesignTokens.colors.surface,
    borderRadius: DesignTokens.borderRadius.md,
    padding: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.md,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DesignTokens.spacing.sm,
  },
  titleSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  requestNumber: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.borderRadius.sm,
    gap: DesignTokens.spacing.xs,
  },
  statusText: {
    fontSize: DesignTokens.typography.fontSize.xs,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.text,
  },
  title: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text,
    marginBottom: DesignTokens.spacing.sm,
    lineHeight: DesignTokens.typography.lineHeight.normal * DesignTokens.typography.fontSize.base,
  },
  description: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.textSecondary,
    marginBottom: DesignTokens.spacing.md,
    lineHeight: DesignTokens.typography.lineHeight.normal * DesignTokens.typography.fontSize.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priority: {
    fontSize: DesignTokens.typography.fontSize.xs,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.textSecondary,
  },
  separator: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.textTertiary,
  },
  date: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.textSecondary,
  },
  dueDate: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.warning,
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
});