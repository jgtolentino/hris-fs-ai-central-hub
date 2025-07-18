import { Tabs } from "expo-router";
import { Home, MessageSquare, Clock, FileText, MoreHorizontal, Sparkles } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import { DesignTokens } from "@/constants/designTokens";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: DesignTokens.colors.primary,
        tabBarInactiveTintColor: DesignTokens.colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: DesignTokens.colors.background,
          borderTopColor: DesignTokens.colors.border,
          paddingBottom: 8,
          height: 90, // Taller for AI prominence
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size, focused }) => (
            <Home color={color} size={focused ? 26 : size} />
          ),
        }}
      />
      
      {/* AI ASSISTANT - CENTRAL HUB */}
      <Tabs.Screen
        name="chat"
        options={{
          title: "AI Assistant",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: focused ? DesignTokens.colors.accent : 'transparent',
              borderRadius: 20,
              width: focused ? 40 : 32,
              height: focused ? 40 : 32,
            }}>
              <MessageSquare 
                color={focused ? DesignTokens.colors.primary : color} 
                size={focused ? 22 : size} 
              />
              {focused && (
                <Sparkles 
                  color={DesignTokens.colors.primary} 
                  size={12} 
                  style={{ position: 'absolute', top: 2, right: 2 }}
                />
              )}
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{
              fontSize: focused ? 12 : 11,
              fontWeight: focused ? '600' : '500',
              color: focused ? DesignTokens.colors.primary : DesignTokens.colors.textSecondary,
              marginTop: 2,
            }}>
              🤖 AI Help
            </Text>
          ),
          tabBarBadge: '✨',
        }}
      />
      
      <Tabs.Screen
        name="time"
        options={{
          title: "Time",
          tabBarIcon: ({ color, size, focused }) => (
            <Clock color={focused ? DesignTokens.colors.timeModule : color} size={focused ? 26 : size} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",
          tabBarIcon: ({ color, size, focused }) => (
            <FileText color={focused ? DesignTokens.colors.requestModule : color} size={focused ? 26 : size} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size, focused }) => (
            <MoreHorizontal color={color} size={focused ? 26 : size} />
          ),
        }}
      />
    </Tabs>
  );
}