import React from 'react'
import { View, Text, ScrollView, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, ExpenseCard } from '@shared/components/ui'
import { useExpenses } from '@shared/hooks/useExpenses'
import { useAuth } from '@shared/hooks/useAuth'
import { formatCurrency } from '@shared/lib/formatters'

export function DashboardScreen() {
  const { user } = useAuth()
  const { expenses, isLoading, refetch } = useExpenses({ limit: 5 })
  
  const totalPending = expenses
    ?.filter(e => e.status === 'Pending')
    .reduce((sum, e) => sum + e.amount, 0) || 0

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View className="px-4 py-6">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name || 'Employee'}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 mt-1">
            Here's your activity summary
          </Text>
        </View>
        
        {/* Stats Cards */}
        <View className="px-4 mb-6">
          <View className="bg-tbwa-yellow rounded-lg p-4 mb-3">
            <Text className="text-sm font-medium text-black/70">
              Pending Expenses
            </Text>
            <Text className="text-2xl font-bold text-black mt-1">
              {formatCurrency(totalPending)}
            </Text>
          </View>
          
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4">
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                This Month
              </Text>
              <Text className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(1250.50)}
              </Text>
            </View>
            <View className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4">
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Days Present
              </Text>
              <Text className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                15/20
              </Text>
            </View>
          </View>
        </View>
        
        {/* Recent Expenses */}
        <View className="px-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Expenses
            </Text>
            <Button
              title="View All"
              variant="secondary"
              size="sm"
              onPress={() => {}}
            />
          </View>
          
          {expenses?.slice(0, 5).map(expense => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onPress={() => {}}
            />
          ))}
        </View>
        
        {/* Quick Actions */}
        <View className="px-4 py-6">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Quick Actions
          </Text>
          <View className="gap-3">
            <Button
              title="Submit New Expense"
              variant="primary"
              onPress={() => {}}
            />
            <Button
              title="Clock In/Out"
              variant="secondary"
              onPress={() => {}}
            />
            <Button
              title="Ask AI Assistant"
              variant="secondary"
              onPress={() => {}}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
