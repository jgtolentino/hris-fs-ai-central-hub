import { StyleSheet, View, KeyboardAvoidingView, Platform, FlatList } from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { Stack, router } from "expo-router";
import { DesignTokens } from "@/constants/designTokens";
import { useEnhancedChatStore } from "@/store/enhancedChatStore";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageBubble from "@/components/chat/MessageBubble";
import ChatInput from "@/components/chat/ChatInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import WelcomeScreen from "@/components/chat/WelcomeScreen";
import { Message } from "@/types/chat";

export default function EnhancedChatScreen() {
  const { 
    messages, 
    isTyping, 
    loading,
    suggestedQuestions,
    sendMessage, 
    clearChat,
    processWorkflowRequest
  } = useEnhancedChatStore();

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    setInputText('');
    try {
      const response = await sendMessage(text.trim());
      
      // Check if AI detected a workflow intent
      if (response.workflowAction) {
        handleWorkflowAction(response.workflowAction);
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const handleWorkflowAction = (action: any) => {
    switch (action.type) {
      case 'create_leave_request':
        router.push('/leave/create');
        break;
      case 'create_expense':
        router.push('/expenses/create');
        break;
      case 'create_time_correction':
        router.push('/requests/create?type=time_correction');
        break;
      case 'create_it_request':
        router.push('/requests/create?type=hardware_request');
        break;
      case 'check_leave_balance':
        router.push('/leave/balance');
        break;
      case 'view_timesheet':
        router.push('/time');
        break;
    }
  };

  const handleQuickAction = (action: string) => {
    const actionMessages: Record<string, string> = {
      time_correction: "I need to correct my time entry",
      leave_request: "I want to request time off",
      expense_submit: "How do I submit an expense?",
      it_support: "I need IT support",
      policy_question: "What's the company policy on remote work?",
      benefits_info: "Tell me about my benefits"
    };
    
    const message = actionMessages[action] || action;
    handleSendMessage(message);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <ChatHeader onClearChat={clearChat} />
      
      {messages.length === 0 && (
        <WelcomeScreen 
          onQuickAction={handleQuickAction}
          onSuggestionPress={handleSendMessage}
          suggestions={suggestedQuestions}
        />
      )}
    </View>
  );

  const renderMessage = ({ item, index }: { item: Message; index: number }) => (
    <MessageBubble 
      message={item}
      isLastMessage={index === messages.length - 1}
      onWorkflowAction={handleWorkflowAction}
    />
  );

  const renderFooter = () => (
    <View style={styles.footerContainer}>
      {isTyping && <TypingIndicator />}
    </View>
  );

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "AI Assistant",
          headerStyle: { backgroundColor: DesignTokens.colors.background },
          headerTintColor: DesignTokens.colors.text,
          headerShown: false,
        }} 
      />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSendMessage}
          disabled={loading || isTyping}
          placeholder="Ask about policies, submit requests, or get help..."
        />
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  headerContainer: {
    backgroundColor: DesignTokens.colors.background,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: DesignTokens.spacing.md,
  },
  footerContainer: {
    paddingHorizontal: DesignTokens.spacing.lg,
  },
});