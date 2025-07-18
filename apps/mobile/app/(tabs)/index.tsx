import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import React, { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { 
  Clock, 
  FileText, 
  CreditCard, 
  Calendar, 
  MessageSquare,
  ChevronRight,
  User,
  TrendingUp,
  Bell,
  CheckCircle,
  AlertCircle
} from "lucide-react-native";
import { DesignTokens } from "@/constants/designTokens";
import { useTimeStore } from "@/store/timeStore";
import { useRequestStore } from "@/store/requestStore";
import { useExpenseStore } from "@/store/expenseStore";
import { useLeaveStore } from "@/store/leaveStore";

export default function DashboardScreen() {
  const { isClocked, currentEntry, todaysEntries } = useTimeStore();
  const { pendingCount, fetchRequests } = useRequestStore();
  const { expenses, fetchExpenses } = useExpenseStore();
  const { requests: leaveRequests, fetchLeaveRequests } = useLeaveStore();
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchExpenses();
    fetchLeaveRequests();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchRequests(),
      fetchExpenses(),
      fetchLeaveRequests(),
    ]);
    setRefreshing(false);
  };

  const quickActions = [
    {
      id: "chat",
      title: "AI Assistant",
      subtitle: "Get help with anything",
      icon: MessageSquare,
      color: DesignTokens.colors.aiModule,
      route: "/chat",
      badge: "✨",
    },
    {
      id: "time",
      title: "Time Tracking",
      subtitle: isClocked ? "Currently clocked in" : "Clock in to start",
      icon: Clock,
      color: isClocked ? DesignTokens.colors.success : DesignTokens.colors.timeModule,
      route: "/time",
    },
    {
      id: "requests",
      title: "Requests",
      subtitle: `${pendingCount} pending requests`,
      icon: FileText,
      color: DesignTokens.colors.requestModule,
      route: "/requests",
      badge: pendingCount > 0 ? pendingCount.toString() : undefined,
    },
    {
      id: "expenses",
      title: "Expenses",
      subtitle: "Submit expense reports",
      icon: CreditCard,
      color: DesignTokens.colors.expenseModule,
      route: "/expenses",
    },
  ];

  const getTotalHoursToday = () => {
    return todaysEntries.reduce((total, entry) => {
      return total + (entry.totalHours || 0);
    }, 0);
  };

  const getRecentActivity = () => {
    const activities = [];
    
    // Recent requests
    if (pendingCount > 0) {
      activities.push({
        id: 'requests',
        title: `${pendingCount} pending request${pendingCount > 1 ? 's' : ''}`,
        subtitle: 'Awaiting approval',
        icon: FileText,
        color: DesignTokens.colors.warning,
        time: 'Recent',
      });
    }

    // Recent expenses
    const pendingExpenses = expenses.filter(e => e.status === 'submitted').length;
    if (pendingExpenses > 0) {
      activities.push({
        id: 'expenses',
        title: `${pendingExpenses} expense${pendingExpenses > 1 ? 's' : ''} submitted`,
        subtitle: 'Under review',
        icon: CreditCard,
        color: DesignTokens.colors.info,
        time: 'Today',
      });
    }

    // Recent leave requests
    const pendingLeave = leaveRequests.filter(r => r.status === 'pending').length;
    if (pendingLeave > 0) {
      activities.push({
        id: 'leave',
        title: `${pendingLeave} leave request${pendingLeave > 1 ? 's' : ''}`,
        subtitle: 'Pending approval',
        icon: Calendar,
        color: DesignTokens.colors.leaveModule,
        time: 'Yesterday',
      });
    }

    return activities.slice(0, 3); // Show max 3 activities
  };

  const recentActivity = getRecentActivity();

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Dashboard",
          headerStyle: { backgroundColor: DesignTokens.colors.background },
          headerTintColor: DesignTokens.colors.text,
          headerRight: () => (
            <TouchableOpacity style={styles.notificationButton}>
              <Bell size={24} color={DesignTokens.colors.text} />
              {pendingCount > 0 && <View style={styles.notificationBadge} />}
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* Welcome Header */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Good morning,</Text>
            <Text style={styles.userName}>John Doe</Text>
            <Text style={styles.welcomeSubtitle}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>

          {/* Status Cards */}
          <View style={styles.statusGrid}>
            <View style={styles.statusCard}>
              <View style={[styles.statusIcon, { backgroundColor: DesignTokens.colors.timeModule }]}>
                <Clock size={20} color={DesignTokens.colors.background} />
              </View>
              <Text style={styles.statusValue}>{getTotalHoursToday().toFixed(1)}h</Text>
              <Text style={styles.statusLabel}>Today</Text>
            </View>

            <View style={styles.statusCard}>
              <View style={[styles.statusIcon, { backgroundColor: DesignTokens.colors.requestModule }]}>
                <FileText size={20} color={DesignTokens.colors.background} />
              </View>
              <Text style={styles.statusValue}>{pendingCount}</Text>
              <Text style={styles.statusLabel}>Pending</Text>
            </View>

            <View style={styles.statusCard}>
              <View style={[styles.statusIcon, { backgroundColor: DesignTokens.colors.success }]}>
                <TrendingUp size={20} color={DesignTokens.colors.background} />
              </View>
              <Text style={styles.statusValue}>40h</Text>
              <Text style={styles.statusLabel}>This Week</Text>
            </View>
          </View>

          {/* Current Status */}
          {isClocked && currentEntry && (
            <View style={styles.currentStatus}>
              <View style={styles.statusHeader}>
                <View style={styles.statusIndicator} />
                <Text style={styles.statusTitle}>Currently Working</Text>
                <CheckCircle size={16} color={DesignTokens.colors.success} />
              </View>
              <Text style={styles.statusTime}>
                Started at {new Date(currentEntry.clockIn).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.actionCard}
                    onPress={() => router.push(action.route as any)}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                      <IconComponent size={20} color={DesignTokens.colors.background} />
                      {action.badge && (
                        <View style={styles.actionBadge}>
                          <Text style={styles.actionBadgeText}>{action.badge}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionTitle}>{action.title}</Text>
                      <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                    </View>
                    <ChevronRight size={16} color={DesignTokens.colors.textTertiary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <View key={activity.id} style={styles.activityCard}>
                    <View style={[styles.activityIcon, { backgroundColor: activity.color }]}>
                      <IconComponent size={16} color={DesignTokens.colors.background} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                    </View>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyActivity}>
                <AlertCircle size={32} color={DesignTokens.colors.textTertiary} />
                <Text style={styles.emptyActivityText}>No recent activity</Text>
                <Text style={styles.emptyActivitySubtext}>
                  Your recent requests and updates will appear here
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  content: {
    padding: DesignTokens.spacing.lg,
  },
  notificationButton: {
    padding: DesignTokens.spacing.sm,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DesignTokens.colors.error,
  },
  welcomeSection: {
    marginBottom: DesignTokens.spacing.xl,
  },
  welcomeText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.textSecondary,
  },
  userName: {
    fontSize: DesignTokens.typography.fontSize.xxl,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text,
    marginTop: 4,
  },
  welcomeSubtitle: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.textSecondary,
    marginTop: 4,
  },
  statusGrid: {
    flexDirection: "row",
    gap: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.xl,
  },
  statusCard: {
    flex: 1,
    backgroundColor: DesignTokens.colors.surface,
    borderRadius: DesignTokens.borderRadius.md,
    padding: DesignTokens.spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignTokens.spacing.sm,
  },
  statusValue: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text,
  },
  statusLabel: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.textSecondary,
    marginTop: 2,
  },
  currentStatus: {
    backgroundColor: DesignTokens.colors.approved,
    borderRadius: DesignTokens.borderRadius.md,
    padding: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.xl,
    borderWidth: 1,
    borderColor: DesignTokens.colors.success,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: DesignTokens.spacing.sm,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DesignTokens.colors.success,
  },
  statusTitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text,
    flex: 1,
  },
  statusTime: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.textSecondary,
  },
  section: {
    marginBottom: DesignTokens.spacing.xl,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text,
    marginBottom: DesignTokens.spacing.md,
  },
  actionsGrid: {
    gap: DesignTokens.spacing.sm,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: DesignTokens.spacing.lg,
    backgroundColor: DesignTokens.colors.surface,
    borderRadius: DesignTokens.borderRadius.md,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: DesignTokens.spacing.md,
    position: 'relative',
  },
  actionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: DesignTokens.colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  actionBadgeText: {
    fontSize: 10,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.background,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.text,
  },
  actionSubtitle: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.textSecondary,
    marginTop: 2,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: DesignTokens.spacing.md,
    backgroundColor: DesignTokens.colors.background,
    borderRadius: DesignTokens.borderRadius.sm,
    marginBottom: DesignTokens.spacing.sm,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
  },
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: DesignTokens.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.text,
  },
  activitySubtitle: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.textSecondary,
    marginTop: 2,
  },
  activityTime: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.textTertiary,
  },
  emptyActivity: {
    alignItems: "center",
    padding: DesignTokens.spacing.xl,
  },
  emptyActivityText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.text,
    marginTop: DesignTokens.spacing.sm,
  },
  emptyActivitySubtext: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.textSecondary,
    textAlign: "center",
    marginTop: DesignTokens.spacing.xs,
  },
});