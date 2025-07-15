import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Clock, Calendar, CreditCard, Laptop } from 'lucide-react-native';
import { DesignTokens } from '@/constants/designTokens';

interface QuickActionButtonsProps {
  onActionPress: (action: string) => void;
}

export default function QuickActionButtons({ onActionPress }: QuickActionButtonsProps) {
  const quickActions = [
    {
      id: 'time_correction',
      title: 'Fix Time',
      icon: Clock,
      color: DesignTokens.colors.warning,
      description: 'Correct bundy logs'
    },
    {
      id: 'leave_request', 
      title: 'Time Off',
      icon: Calendar,
      color: DesignTokens.colors.success,
      description: 'Request leave'
    },
    {
      id: 'expense_submit',
      title: 'Expense',
      icon: CreditCard,
      color: DesignTokens.colors.secondary,
      description: 'Submit expense'
    },
    {
      id: 'it_support',
      title: 'IT Help',
      icon: Laptop,
      color: DesignTokens.colors.error,
      description: 'Get IT support'
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.actionsScroll}
      >
        <View style={styles.actionsContainer}>
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <TouchableOpacity
                key={action.id}
                onPress={() => onActionPress(action.id)}
                style={[styles.actionButton, { borderColor: action.color }]}
              >
                <View style={styles.actionContent}>
                  <View style={[styles.iconContainer, { backgroundColor: action.color }]}>
                    <IconComponent 
                      size={20} 
                      color={DesignTokens.colors.background} 
                    />
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: DesignTokens.spacing.lg,
  },
  title: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text,
    marginBottom: DesignTokens.spacing.md,
    textAlign: 'center',
  },
  actionsScroll: {
    flexGrow: 0,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.sm,
  },
  actionButton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderRadius: DesignTokens.borderRadius.lg,
    backgroundColor: DesignTokens.colors.background,
  },
  actionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignTokens.spacing.xs,
  },
  actionTitle: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.textSecondary,
    textAlign: 'center',
  },
});