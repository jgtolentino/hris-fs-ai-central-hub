import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { formatCurrency, formatDate } from '@shared/lib/formatters'

interface ExpenseCardProps {
  expense: {
    id: string
    merchant_name: string
    amount: number
    expense_date: string
    expense_category: string
    status: 'Pending' | 'Approved' | 'Rejected'
    receipt_url?: string
  }
  onPress?: () => void
}

export function ExpenseCard({ expense, onPress }: ExpenseCardProps) {
  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800'
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 shadow-sm"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            {expense.merchant_name}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {expense.expense_category}
          </Text>
        </View>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(expense.amount)}
        </Text>
      </View>
      
      <View className="flex-row justify-between items-center">
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(expense.expense_date)}
        </Text>
        <View className={`px-3 py-1 rounded-full ${statusColors[expense.status]}`}>
          <Text className="text-xs font-medium">{expense.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}
