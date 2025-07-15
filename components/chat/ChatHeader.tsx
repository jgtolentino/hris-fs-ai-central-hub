import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { Trash2, MessageSquare } from "lucide-react-native";
import { DesignTokens } from "@/constants/designTokens";

interface ChatHeaderProps {
  onClearChat: () => void;
}

export default function ChatHeader({ onClearChat }: ChatHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleSection}>
        <View style={styles.iconContainer}>
          <MessageSquare size={24} color={DesignTokens.colors.primary} />
        </View>
        <View>
          <Text style={styles.title}>AI Assistant</Text>
          <Text style={styles.subtitle}>Your TBWA helper</Text>
        </View>
      </View>
      
      <TouchableOpacity onPress={onClearChat} style={styles.clearButton}>
        <Trash2 size={20} color={DesignTokens.colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: DesignTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.border,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignTokens.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text,
  },
  subtitle: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.textSecondary,
  },
  clearButton: {
    padding: DesignTokens.spacing.sm,
  },
});