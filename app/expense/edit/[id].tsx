import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useExpenseStore } from "@/store/expenseStore";
import ExpenseForm from "@/components/ExpenseForm";
import { colors } from "@/constants/colors";

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getExpenseById } = useExpenseStore();
  
  const expense = getExpenseById(id);
  
  if (!expense) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Expense not found</Text>
      </View>
    );
  }
  
  const initialValues = {
    amount: expense.amount.toString(),
    description: expense.description,
    date: expense.date,
    category: expense.category,
    receiptUrl: expense.receiptUrl,
  };
  
  return (
    <>
      <Stack.Screen options={{ title: "Edit Expense" }} />
      <ExpenseForm initialValues={initialValues} expenseId={id} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
  },
});