import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { format } from "date-fns";
import { useExpenseStore } from "@/store/expenseStore";
import { categories } from "@/constants/categories";
import { colors } from "@/constants/colors";
import { Edit, Trash } from "lucide-react-native";

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getExpenseById, deleteExpense } = useExpenseStore();
  
  const expense = getExpenseById(id);
  
  if (!expense) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Expense not found</Text>
      </View>
    );
  }
  
  const category = categories.find((c) => c.id === expense.category);
  
  const handleDelete = () => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => {
            deleteExpense(id);
            router.back();
          },
          style: "destructive",
        },
      ]
    );
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          title: "Expense Details",
          headerRight: () => (
            <View style={styles.headerButtons}>
              <Pressable
                style={styles.headerButton}
                onPress={() => router.push(`/expense/edit/${id}`)}
              >
                <Edit size={20} color={colors.primary} />
              </Pressable>
              <Pressable style={styles.headerButton} onPress={handleDelete}>
                <Trash size={20} color={colors.danger} />
              </Pressable>
            </View>
          ),
        }}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amount}>${expense.amount.toFixed(2)}</Text>
        </View>
        
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>{expense.description}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <View style={styles.categoryContainer}>
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: category?.color },
                ]}
              />
              <Text style={styles.detailValue}>
                {category?.name || "Uncategorized"}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {format(new Date(expense.date), "MMMM d, yyyy")}
            </Text>
          </View>
        </View>
        
        {expense.receiptUrl && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Receipt</Text>
            <Pressable style={styles.receiptButton}>
              <Text style={styles.receiptButtonText}>View Receipt</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButtons: {
    flexDirection: "row",
  },
  headerButton: {
    marginLeft: 16,
  },
  amountContainer: {
    padding: 24,
    alignItems: "center",
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  amountLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  amount: {
    fontSize: 36,
    fontWeight: "bold",
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  receiptButton: {
    backgroundColor: colors.gray[200],
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  receiptButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    textAlign: "center",
    marginTop: 24,
  },
});