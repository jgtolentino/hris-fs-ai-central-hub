import React from "react";
import { Stack } from "expo-router";
import ExpenseForm from "@/components/ExpenseForm";

export default function NewExpenseScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Add Expense" }} />
      <ExpenseForm />
    </>
  );
}