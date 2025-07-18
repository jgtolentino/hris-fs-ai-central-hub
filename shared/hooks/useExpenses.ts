import { useQuery } from '@tanstack/react-query'
import { trpc } from '@shared/lib/trpc'

interface UseExpensesOptions {
  limit?: number
  offset?: number
  status?: 'All' | 'Pending' | 'Approved' | 'Rejected'
}

export function useExpenses(options: UseExpensesOptions = {}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['expenses', options],
    queryFn: () => trpc.expense.list.query(options)
  })

  return {
    expenses: data?.items,
    total: data?.total,
    isLoading,
    error,
    refetch
  }
}
