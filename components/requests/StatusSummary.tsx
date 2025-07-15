import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, CheckCircle, XCircle, FileText } from 'lucide-react-native';
import { DesignTokens } from '@/constants/designTokens';

interface StatusSummaryProps {
  pendingCount: number;
  totalCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export default function StatusSummary({ 
  pendingCount, 
  totalCount, 
  approvedCount, 
  rejectedCount 
}: StatusSummaryProps) {
  const statusItems = [
    {
      label: 'Pending',
      count: pendingCount,
      icon: Clock,
      color: DesignTokens.colors.warning,
      bgColor: DesignTokens.colors.pending,
    },
    {
      label: 'Approved',
      count: approvedCount,
      icon: CheckCircle,
      color: DesignTokens.colors.success,
      bgColor: DesignTokens.colors.approved,
    },
    {
      label: 'Rejected',
      count: rejectedCount,
      icon: XCircle,
      color: DesignTokens.colors.error,
      bgColor: DesignTokens.colors.rejected,
    },
    {
      label: 'Total',
      count: totalCount,
      icon: FileText,
      color: DesignTokens.colors.primary,
      bgColor: DesignTokens.colors.surface,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Request Summary</Text>
      <View style={styles.statusGrid}>
        {statusItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <View key={item.label} style={[styles.statusCard, { backgroundColor: item.bgColor }]}>
              <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                <IconComponent size={16} color={DesignTokens.colors.background} />
              </View>
              <Text style={styles.statusCount}>{item.count}</Text>
              <Text style={styles.statusLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: DesignTokens.spacing.xl,
  },
  title: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text,
    marginBottom: DesignTokens.spacing.md,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.sm,
  },
  statusCard: {
    flex: 1,
    borderRadius: DesignTokens.borderRadius.md,
    padding: DesignTokens.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  statusCount: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text,
  },
  statusLabel: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.textSecondary,
    marginTop: DesignTokens.spacing.xs,
  },
});