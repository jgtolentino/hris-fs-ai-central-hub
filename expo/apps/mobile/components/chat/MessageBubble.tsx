import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";
import { ExternalLink } from "lucide-react-native";
import { DesignTokens } from "@/constants/designTokens";
import { Message, DocumentReference, WorkflowAction } from "@/types/chat";

interface MessageBubbleProps {
  message: Message;
  isLastMessage?: boolean;
  onWorkflowAction?: (action: WorkflowAction) => void;
}

export default function MessageBubble({ message, isLastMessage, onWorkflowAction }: MessageBubbleProps) {
  const isUser = message.sender === "user";
  const isSystem = message.sender === "system";

  return (
    <View style={[
      styles.container, 
      isUser ? styles.userContainer : styles.aiContainer,
      isLastMessage && styles.lastMessage
    ]}>
      <View style={[
        styles.bubble, 
        isUser ? styles.userBubble : isSystem ? styles.systemBubble : styles.aiBubble
      ]}>
        <Text style={[
          styles.text, 
          isUser ? styles.userText : isSystem ? styles.systemText : styles.aiText
        ]}>
          {message.content}
        </Text>
        
        {/* Document References */}
        {message.documentReferences && message.documentReferences.length > 0 && (
          <View style={styles.referencesContainer}>
            <Text style={styles.referencesTitle}>Referenced Documents:</Text>
            {message.documentReferences.map((doc: DocumentReference, index: number) => (
              <TouchableOpacity key={index} style={styles.referenceItem}>
                <ExternalLink size={12} color={DesignTokens.colors.secondary} />
                <Text style={styles.referenceText}>{doc.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Workflow Actions */}
        {message.workflowActions && message.workflowActions.length > 0 && onWorkflowAction && (
          <View style={styles.actionsContainer}>
            {message.workflowActions.map((action: WorkflowAction, index: number) => (
              <TouchableOpacity
                key={index}
                style={styles.actionButton}
                onPress={() => onWorkflowAction(action)}
              >
                <Text style={styles.actionButtonText}>{action.message}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Confidence Score */}
        {message.confidenceScore && message.confidenceScore < 0.7 && (
          <Text style={styles.confidenceWarning}>
            I'm not entirely sure about this answer. Please verify with HR if needed.
          </Text>
        )}
      </View>
      
      <Text style={styles.timestamp}>
        {new Date(message.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: DesignTokens.spacing.xs,
    maxWidth: "85%",
    paddingHorizontal: DesignTokens.spacing.lg,
  },
  lastMessage: {
    marginBottom: DesignTokens.spacing.lg,
  },
  userContainer: {
    alignSelf: "flex-end",
  },
  aiContainer: {
    alignSelf: "flex-start",
  },
  bubble: {
    borderRadius: DesignTokens.borderRadius.lg,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.xs,
  },
  userBubble: {
    backgroundColor: DesignTokens.colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: DesignTokens.colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
  },
  systemBubble: {
    backgroundColor: DesignTokens.colors.warning,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: DesignTokens.typography.fontSize.base,
    lineHeight: DesignTokens.typography.lineHeight.relaxed * DesignTokens.typography.fontSize.base,
  },
  userText: {
    color: DesignTokens.colors.background,
  },
  aiText: {
    color: DesignTokens.colors.text,
  },
  systemText: {
    color: DesignTokens.colors.background,
  },
  timestamp: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.textTertiary,
    alignSelf: "flex-end",
  },
  referencesContainer: {
    marginTop: DesignTokens.spacing.sm,
    paddingTop: DesignTokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.border,
  },
  referencesTitle: {
    fontSize: DesignTokens.typography.fontSize.xs,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.textSecondary,
    marginBottom: DesignTokens.spacing.xs,
  },
  referenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
    marginBottom: DesignTokens.spacing.xs,
  },
  referenceText: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.secondary,
  },
  actionsContainer: {
    marginTop: DesignTokens.spacing.sm,
    gap: DesignTokens.spacing.xs,
  },
  actionButton: {
    backgroundColor: DesignTokens.colors.accent,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.borderRadius.sm,
  },
  actionButtonText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.primary,
    textAlign: 'center',
  },
  confidenceWarning: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.warning,
    fontStyle: 'italic',
    marginTop: DesignTokens.spacing.xs,
  },
});