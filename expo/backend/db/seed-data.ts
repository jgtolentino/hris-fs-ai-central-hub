export const sampleExpenses = [
  {
    id: '1',
    user_id: 'user123',
    merchant_name: 'Starbucks',
    amount: 15.50,
    expense_date: '2024-01-15',
    expense_category: 'Meals',
    status: 'Approved',
    receipt_url: 'https://example.com/receipt1.jpg',
    description: 'Client meeting coffee'
  },
  {
    id: '2',
    user_id: 'user123',
    merchant_name: 'Uber',
    amount: 35.00,
    expense_date: '2024-01-16',
    expense_category: 'Transportation',
    status: 'Pending',
    receipt_url: 'https://example.com/receipt2.jpg',
    description: 'Airport to office'
  },
  {
    id: '3',
    user_id: 'user123',
    merchant_name: 'Marriott Hotel',
    amount: 250.00,
    expense_date: '2024-01-14',
    expense_category: 'Accommodation',
    status: 'Approved',
    receipt_url: 'https://example.com/receipt3.jpg',
    description: 'Business trip - NYC'
  }
]

export const sampleAttendance = [
  {
    id: '1',
    user_id: 'user123',
    date: '2024-01-17',
    clock_in: '2024-01-17T09:00:00Z',
    clock_out: '2024-01-17T18:00:00Z',
    office: 'Manila',
    status: 'Present'
  },
  {
    id: '2',
    user_id: 'user123',
    date: '2024-01-16',
    clock_in: '2024-01-16T08:45:00Z',
    clock_out: '2024-01-16T17:30:00Z',
    office: 'Manila',
    status: 'Present'
  }
]

export const sampleTickets = [
  {
    id: '1',
    user_id: 'user123',
    title: 'New laptop request',
    category: 'IT',
    priority: 'Medium',
    status: 'Open',
    description: 'Current laptop is 4 years old and running slow'
  },
  {
    id: '2',
    user_id: 'user123',
    title: 'Update emergency contact',
    category: 'HR',
    priority: 'Low',
    status: 'Resolved',
    description: 'Need to update spouse phone number'
  }
]
