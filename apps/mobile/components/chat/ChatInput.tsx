import { StyleSheet, View, TextInput, TouchableOpacity, Platform } from "react-native";
import React from "react";
import { Send } from "lucide-react-native";
import { DesignTokens } from "@/constants/designTokens";

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ 
  value, 
  onChangeText, 
  onSend, 
  disabled = false,
  placeholder = "Type your message..."
}: ChatInputProps) {
  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={DesignTokens.colors.textTertiary}
          multiline
          maxLength={1000}
          editable={!disabled}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!value.trim() || disabled) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={!value.trim() || disabled}
        >
          <Send 
            size={20} 
            color={
              (!value.trim() || disabled) 
                ? DesignTokens.colors.textTertiary 
                : DesignTokens.colors.background
            } 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    backgroundColor: DesignTokens.colors.background,
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.border,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: DesignTokens.colors.surface,
    borderRadius: DesignTokens.borderRadius.lg,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    gap: DesignTokens.spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text,
    maxHeight: 100,
    minHeight: 20,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DesignTokens.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: DesignTokens.colors.border,
  },
});

export default ChatInput;