import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Plus, 
  Search, 
  AlertCircle, 
  Clock, 
  CheckCircle,
  MessageSquare,
  Filter
} from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface Ticket {
  id: string;
  number: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'in-progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  assignee?: string;
  description: string;
}

const mockTickets: Ticket[] = [
  {
    id: '1',
    number: 'INC0001234',
    title: 'Cannot submit expense report',
    category: 'Expense',
    priority: 'high',
    status: 'in-progress',
    createdAt: new Date('2024-12-10'),
    updatedAt: new Date('2024-12-11'),
    assignee: 'IT Support',
    description: 'Getting error when trying to submit expense',
  },
  {
    id: '2',
    number: 'REQ0005678',
    title: 'Request for new laptop',
    category: 'Hardware',
    priority: 'medium',
    status: 'new',
    createdAt: new Date('2024-12-12'),
    updatedAt: new Date('2024-12-12'),
    description: 'Current laptop is slow and outdated',
  },
  {
    id: '3',
    number: 'INC0001235',
    title: 'Leave balance incorrect',
    category: 'HR',
    priority: 'low',
    status: 'resolved',
    createdAt: new Date('2024-12-08'),
    updatedAt: new Date('2024-12-10'),
    assignee: 'HR Team',
    description: 'My leave balance shows 5 days but should be 10',
  },
];

const priorityColors = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  critical: '#7C3AED',
};

const statusIcons = {
  'new': AlertCircle,
  'in-progress': Clock,
  'resolved': CheckCircle,
  'closed': CheckCircle,
};

export default function TicketsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [tickets] = useState<Ticket[]>(mockTickets);

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || ticket.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return colors.warning;
      case 'in-progress': return colors.info;
      case 'resolved': return colors.success;
      case 'closed': return colors.gray[500];
      default: return colors.gray[500];
    }
  };

  const renderTicket = (ticket: Ticket) => {
    const StatusIcon = statusIcons[ticket.status];
    
    return (
      <TouchableOpacity
        key={ticket.id}
        style={styles.ticketCard}
        onPress={() => router.push(`/tickets/${ticket.id}`)}
      >
        <View style={styles.ticketHeader}>
          <View style={styles.ticketNumberContainer}>
            <Text style={styles.ticketNumber}>{ticket.number}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: priorityColors[ticket.priority] + '20' }]}>
              <Text style={[styles.priorityText, { color: priorityColors[ticket.priority] }]}>
                {ticket.priority.toUpperCase()}
              </Text>
            </View>
          </View>
          <StatusIcon size={20} color={getStatusColor(ticket.status)} />
        </View>
        
        <Text style={styles.ticketTitle} numberOfLines={2}>{ticket.title}</Text>
        
        <View style={styles.ticketMeta}>
          <Text style={styles.categoryTag}>{ticket.category}</Text>
          <Text style={styles.statusText}>{ticket.status.replace('-', ' ')}</Text>
        </View>
        
        <View style={styles.ticketFooter}>
          <Text style={styles.dateText}>
            Updated {new Date(ticket.updatedAt).toLocaleDateString()}
          </Text>
          {ticket.assignee && (
            <Text style={styles.assigneeText}>{ticket.assignee}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Support Tickets</Text>
        <TouchableOpacity 
          style={styles.newButton}
          onPress={() => router.push('/tickets/create')}
        >
          <Plus size={20} color="white" />
          <Text style={styles.newButtonText}>New Ticket</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={colors.gray[500]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tickets..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {['all', 'new', 'in-progress', 'resolved', 'closed'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.ticketsList}>
        {filteredTickets.length > 0 ? (
          filteredTickets.map(renderTicket)
        ) : (
          <View style={styles.emptyState}>
            <MessageSquare size={64} color={colors.gray[400]} />
            <Text style={styles.emptyTitle}>No tickets found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try a different search' : 'Create your first support ticket'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  newButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxHeight: 60,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.gray[700],
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  ticketsList: {
    flex: 1,
    padding: 20,
  },
  ticketCard: {
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
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  ticketMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  categoryTag: {
    fontSize: 12,
    color: colors.gray[600],
    backgroundColor: colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: colors.gray[600],
    textTransform: 'capitalize',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  assigneeText: {
    fontSize: 12,
    color: colors.gray[600],
    fontWeight: '500',
  },
  emptyState: {
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
});