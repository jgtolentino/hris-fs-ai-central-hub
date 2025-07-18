import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import React, { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { Plus, Filter } from "lucide-react-native";
import { DesignTokens } from "@/constants/designTokens";
import { useRequestStore, OrgRequest, RequestCategory } from "@/store/requestStore";
import RequestCard from "@/components/requests/RequestCard";
import CategoryFilter from "@/components/requests/CategoryFilter";
import StatusSummary from "@/components/requests/StatusSummary";

export default function RequestsScreen() {
  const { 
    requests, 
    categories, 
    pendingCount, 
    loading, 
    fetchRequests, 
    fetchCategories 
  } = useRequestStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchCategories();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  const filteredRequests = selectedCategory 
    ? requests.filter((request: OrgRequest) => {
        const category = categories.find((c: RequestCategory) => c.id === request.requestTypeId);
        return category?.code === selectedCategory;
      })
    : requests;

  const handleCreateRequest = () => {
    router.push("/requests/create");
  };

  const handleRequestPress = (requestId: string) => {
    router.push(`/requests/${requestId}`);
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Requests",
          headerStyle: { backgroundColor: DesignTokens.colors.background },
          headerTintColor: DesignTokens.colors.text,
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleCreateRequest}
              style={styles.headerButton}
            >
              <Plus size={24} color={DesignTokens.colors.primary} />
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
          {/* Status Summary */}
          <StatusSummary 
            pendingCount={pendingCount}
            totalCount={requests.length}
            approvedCount={requests.filter((r: OrgRequest) => r.status === 'approved').length}
            rejectedCount={requests.filter((r: OrgRequest) => r.status === 'rejected').length}
          />

          {/* Category Filter */}
          <CategoryFilter 
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />

          {/* Quick Create Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionButtons}>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => router.push("/requests/create?type=time_correction")}
              >
                <Text style={styles.quickActionText}>Fix Time Entry</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => router.push("/requests/create?type=coe_request")}
              >
                <Text style={styles.quickActionText}>Request COE</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => router.push("/requests/create?type=hardware_request")}
              >
                <Text style={styles.quickActionText}>IT Support</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Requests List */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedCategory ? `${selectedCategory.toUpperCase()} Requests` : 'All Requests'}
              </Text>
              <TouchableOpacity style={styles.filterButton}>
                <Filter size={16} color={DesignTokens.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {loading && requests.length === 0 ? (
              <View style={styles.loadingState}>
                <Text style={styles.loadingText}>Loading requests...</Text>
              </View>
            ) : filteredRequests.length > 0 ? (
              filteredRequests.map((request: OrgRequest) => (
                <RequestCard 
                  key={request.id} 
                  request={request}
                  onPress={() => handleRequestPress(request.id)}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No requests found</Text>
                <Text style={styles.emptySubtitle}>
                  {selectedCategory 
                    ? `No ${selectedCategory} requests yet`
                    : "Tap the + button to create your first request"
                  }
                </Text>
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={handleCreateRequest}
                >
                  <Plus size={16} color={DesignTokens.colors.background} />
                  <Text style={styles.createButtonText}>Create Request</Text>
                </TouchableOpacity>
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
  headerButton: {
    padding: DesignTokens.spacing.sm,
  },
  quickActions: {
    marginBottom: DesignTokens.spacing.xl,
  },
  quickActionButtons: {
    flexDirection: "row",
    gap: DesignTokens.spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.borderRadius.md,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
  },
  quickActionText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.text,
    textAlign: "center",
  },
  section: {
    marginBottom: DesignTokens.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DesignTokens.spacing.md,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text,
  },
  filterButton: {
    padding: DesignTokens.spacing.sm,
  },
  loadingState: {
    alignItems: "center",
    padding: DesignTokens.spacing.xl,
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    padding: DesignTokens.spacing.xl,
  },
  emptyTitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text,
    marginBottom: DesignTokens.spacing.sm,
  },
  emptySubtitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.textSecondary,
    textAlign: "center",
    marginBottom: DesignTokens.spacing.lg,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DesignTokens.colors.primary,
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.borderRadius.md,
    gap: DesignTokens.spacing.sm,
  },
  createButtonText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.background,
  },
});