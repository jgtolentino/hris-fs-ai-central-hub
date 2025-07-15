import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Receipt, Plus, TrendingUp, Clock, CheckCircle } from 'lucide-react-native';
import { DesignTokens } from '@/constants/designTokens';

export default function ExpensesScreen() {
  const router = useRouter();

  const stats = [
    { label: 'This Month', value: '$2,450', icon: TrendingUp, color: DesignTokens.colors.primary },
    { label: 'Pending', value: '$850', icon: Clock, color: DesignTokens.colors.warning },
    { label: 'Approved', value: '$1,600', icon: CheckCircle, color: DesignTokens.colors.success },
  ];

  const recentExpenses = [
    {
      id: '1',
      title: 'Client Lunch - Downtown',
      amount: '$125.50',
      date: 'Dec 14, 2024',
      status: 'pending',
      category: 'meals',
    },
    {
      id: '2',
      title: 'Taxi to Airport',
      amount: '$45.00',
      date: 'Dec 13, 2024',
      status: 'approved',
      category: 'transport',
    },
    {
      id: '3',
      title: 'Office Supplies',
      amount: '$85.75',
      date: 'Dec 12, 2024',
      status: 'pending',
      category: 'office',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return DesignTokens.colors.warning;
      case 'approved': return DesignTokens.colors.success;
      case 'rejected': return DesignTokens.colors.error;
      default: return DesignTokens.colors.textSecondary;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/expense/create')}
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <IconComponent size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/expense/create')}
        >
          <Receipt size={32} color={DesignTokens.colors.primary} />
          <Text style={styles.actionTitle}>New Expense</Text>
          <Text style={styles.actionDescription}>Submit a new expense claim</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/expense/list')}
        >
          <TrendingUp size={32} color={DesignTokens.colors.primary} />
          <Text style={styles.actionTitle}>All Expenses</Text>
          <Text style={styles.actionDescription}>View expense history</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          <TouchableOpacity onPress={() => router.push('/expense/list')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentExpenses.map((expense) => (
          <TouchableOpacity 
            key={expense.id} 
            style={styles.expenseItem}
            onPress={() => router.push(`/expense/${expense.id}`)}
          >
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseTitle}>{expense.title}</Text>
              <Text style={styles.expenseDate}>{expense.date}</Text>
            </View>
            <View style={styles.expenseRight}>
              <Text style={styles.expenseAmount}>{expense.amount}</Text>
              <Text style={[styles.expenseStatus, { color: getStatusColor(expense.status) }]}>
                {expense.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
    backgroundColor: DesignTokens.colors.surface,
    marginTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: DesignTokens.colors.text,
  },
  addButton: {
    backgroundColor: DesignTokens.colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.borderRadius.lg,
    alignItems: 'center',
    ...DesignTokens.shadows.small,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DesignTokens.colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: DesignTokens.colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.borderRadius.lg,
    alignItems: 'center',
    ...DesignTokens.shadows.small,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignTokens.colors.text,
    marginTop: DesignTokens.spacing.sm,
  },
  actionDescription: {
    fontSize: 12,
    color: DesignTokens.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  recentSection: {
    padding: DesignTokens.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: DesignTokens.colors.text,
  },
  viewAllText: {
    fontSize: 14,
    color: DesignTokens.colors.primary,
  },
  expenseItem: {
    flexDirection: 'row',
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.borderRadius.base,
    marginBottom: DesignTokens.spacing.sm,
    ...DesignTokens.shadows.small,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: DesignTokens.colors.text,
  },
  expenseDate: {
    fontSize: 14,
    color: DesignTokens.colors.textSecondary,
    marginTop: 4,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignTokens.colors.text,
  },
  expenseStatus: {
    fontSize: 12,
    textTransform: 'capitalize',
    marginTop: 4,
  },
});