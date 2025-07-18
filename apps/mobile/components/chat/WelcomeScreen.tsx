import { StyleSheet, View, Text } from "react-native";
import React from "react";
import { Bot, Sparkles } from "lucide-react-native";
import { DesignTokens } from "@/constants/designTokens";
import QuickActionButtons from "./QuickActionButtons";
import WorkflowSuggestions from "./WorkflowSuggestions";

interface WelcomeScreenProps {
  onQuickAction: (action: string) => void;
  onSuggestionPress: (suggestion: string) => void;
  suggestions: string[];
}

export function WelcomeScreen({ 
  onQuickAction, 
  onSuggestionPress, 
  suggestions 
}: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.heroSection}>
        <View style={styles.iconContainer}>
          <Bot size={48} color={DesignTokens.colors.primary} />
          <View style={styles.sparkleIcon}>
            <Sparkles size={16} color={DesignTokens.colors.accent} />
          </View>
        </View>
        
        <Text style={styles.welcomeTitle}>👋 Hi! I'm your TBWA Assistant</Text>
        <Text style={styles.welcomeSubtitle}>
          I can help you with HR policies, submit requests, check balances, and more!
        </Text>
      </View>

      <QuickActionButtons onActionPress={onQuickAction} />
      
      <WorkflowSuggestions 
        suggestions={suggestions}
        onSuggestionPress={onSuggestionPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: DesignTokens.spacing.xl,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: DesignTokens.spacing.xl,
  },
  iconContainer: {
    position: "relative",
    marginBottom: DesignTokens.spacing.lg,
  },
  sparkleIcon: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: DesignTokens.colors.background,
    borderRadius: 12,
    padding: 2,
  },
  welcomeTitle: {
    fontSize: DesignTokens.typography.fontSize.xl,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text,
    textAlign: "center",
    marginBottom: DesignTokens.spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.textSecondary,
    textAlign: "center",
    lineHeight: DesignTokens.typography.lineHeight.relaxed * DesignTokens.typography.fontSize.base,
    paddingHorizontal: DesignTokens.spacing.lg,
  },
});

export default WelcomeScreen;