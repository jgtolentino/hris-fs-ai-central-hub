import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DesignTokens } from '@/constants/designTokens';

interface WorkflowSuggestionsProps {
  suggestions: string[];
  onSuggestionPress: (suggestion: string) => void;
}

export default function WorkflowSuggestions({ suggestions, onSuggestionPress }: WorkflowSuggestionsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Try asking me:</Text>
      <View style={styles.suggestionsList}>
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionButton}
            onPress={() => onSuggestionPress(suggestion)}
          >
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: DesignTokens.spacing.lg,
  },
  title: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text,
    marginBottom: DesignTokens.spacing.md,
  },
  suggestionsList: {
    gap: DesignTokens.spacing.sm,
  },
  suggestionButton: {
    backgroundColor: DesignTokens.colors.surface,
    borderRadius: DesignTokens.borderRadius.md,
    padding: DesignTokens.spacing.md,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
  },
  suggestionText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text,
  },
});