import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Receipt, Filter, Calendar } from 'lucide-react-native';
import { expenseService } from '@/app/services/supabase';
import { colors } from '@/constants/colors';

const statusColors = {
  draft: '#6B7280',
  pending: '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444',
  reimbursed: '#3B82F6',
};

export default function ExpenseListScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: expenses, isLoading, refetch } = useQuery({
    queryKey: ['expenses', filter],
    queryFn: () => expenseService.getExpenses(filter ? { status: filter } : undefined),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderExpenseItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.expenseCard}
      onPress={() => router.push(`/expense/${item.id}`)}
    >
      <View style={styles.expenseHeader}>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseTitle}>{item.title}</Text>
          <Text style={styles.expenseMerchant}>{item.merchant}</Text>
          <View style={styles.dateRow}>
            <Calendar size={14} color={colors.gray[500]} />
            <Text style={styles.expenseDate}>
              {format(new Date(item.date), 'MMM dd, yyyy')}
            </Text>
          </View>
        </View>
        <View style={styles.expenseRight}>
          <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
            <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>
      {item.category && (
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const FilterButton = ({ status, label }: { status: string | null; label: string }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === status && styles.filterButtonActive]}
      onPress={() => setFilter(filter === status ? null : status)}
    >
      <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Expenses</Text>
        <TouchableOpacity style={styles.filterIcon}>
          <Filter size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        <FilterButton status={null} label="All" />
        <FilterButton status="pending" label="Pending" />
        <FilterButton status="approved" label="Approved" />
        <FilterButton status="rejected" label="Rejected" />
        <FilterButton status="reimbursed" label="Reimbursed" />
      </ScrollView>

      <FlatList
        data={expenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Receipt size={64} color={colors.gray[400]} />
            <Text style={styles.emptyTitle}>No expenses found</Text>
            <Text style={styles.emptyText}>
              {filter ? `No ${filter} expenses` : 'Start by submitting your first expense'}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/expense/create')}
            >
              <Text style={styles.addButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  filterIcon: {
    padding: 8,
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 12,
    maxHeight: 50,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.gray[700],
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  listContainer: {
    padding: 20,
  },
  expenseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  expenseMerchant: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: colors.gray[500],
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTag: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  categoryText: {
    fontSize: 12,
    color: colors.gray[700],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray[600],
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});