import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import React from "react";
import { Stack, router } from "expo-router";
import { 
  User, 
  CreditCard, 
  Calendar, 
  Settings, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  BarChart3,
  FileText
} from "lucide-react-native";
import { DesignTokens } from "@/constants/designTokens";

export default function MoreScreen() {
  const menuSections = [
    {
      title: "Employee Services",
      items: [
        {
          id: "expenses",
          title: "Expenses",
          subtitle: "Submit and track expenses",
          icon: CreditCard,
          route: "/expenses",
          color: DesignTokens.colors.expenseModule,
        },
        {
          id: "leave",
          title: "Leave Management",
          subtitle: "Request time off, view balance",
          icon: Calendar,
          route: "/leave",
          color: DesignTokens.colors.leaveModule,
        },
        {
          id: "reports",
          title: "Reports",
          subtitle: "View your activity reports",
          icon: BarChart3,
          route: "/reports",
          color: DesignTokens.colors.info,
        },
      ]
    },
    {
      title: "Account & Settings",
      items: [
        {
          id: "profile",
          title: "Profile",
          subtitle: "Personal information",
          icon: User,
          route: "/profile",
          color: DesignTokens.colors.primary,
        },
        {
          id: "notifications",
          title: "Notifications",
          subtitle: "Manage your alerts",
          icon: Bell,
          route: "/notifications",
          color: DesignTokens.colors.warning,
        },
        {
          id: "security",
          title: "Security",
          subtitle: "Privacy and security settings",
          icon: Shield,
          route: "/security",
          color: DesignTokens.colors.success,
        },
        {
          id: "settings",
          title: "Settings",
          subtitle: "App preferences",
          icon: Settings,
          route: "/settings",
          color: DesignTokens.colors.textSecondary,
        },
      ]
    },
    {
      title: "Support",
      items: [
        {
          id: "help",
          title: "Help & Support",
          subtitle: "Get help and contact support",
          icon: HelpCircle,
          route: "/help",
          color: DesignTokens.colors.secondary,
        },
        {
          id: "policies",
          title: "Policies & Documents",
          subtitle: "Company policies and forms",
          icon: FileText,
          route: "/policies",
          color: DesignTokens.colors.info,
        },
      ]
    }
  ];

  const handleMenuPress = (route: string) => {
    router.push(route as any);
  };

  const handleLogout = () => {
    // Handle logout logic
    console.log("Logout pressed");
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "More",
          headerStyle: { backgroundColor: DesignTokens.colors.background },
          headerTintColor: DesignTokens.colors.text,
        }} 
      />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* User Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <User size={32} color={DesignTokens.colors.background} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>John Doe</Text>
              <Text style={styles.profileRole}>Software Developer</Text>
              <Text style={styles.profileDepartment}>Technology Department</Text>
              <Text style={styles.profileId}>Employee ID: EMP-2024-001</Text>
            </View>
          </View>

          {/* Menu Sections */}
          {menuSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.menuSection}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionContent}>
                {section.items.map((item, itemIndex) => {
                  const IconComponent = item.icon;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.menuItem,
                        itemIndex === section.items.length - 1 && styles.lastMenuItem
                      ]}
                      onPress={() => handleMenuPress(item.route)}
                    >
                      <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                        <IconComponent size={20} color={DesignTokens.colors.background} />
                      </View>
                      <View style={styles.menuContent}>
                        <Text style={styles.menuTitle}>{item.title}</Text>
                        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                      </View>
                      <ChevronRight size={20} color={DesignTokens.colors.textTertiary} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color={DesignTokens.colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.appName}>TBWA HRIS</Text>
            <Text style={styles.versionText}>Version 2.0.0</Text>
            <Text style={styles.buildText}>Build 2025.01.15</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  content: {
    padding: DesignTokens.spacing.lg,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: DesignTokens.spacing.xl,
    backgroundColor: DesignTokens.colors.surface,
    borderRadius: DesignTokens.borderRadius.lg,
    marginBottom: DesignTokens.spacing.xl,
    ...DesignTokens.shadows.sm,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: DesignTokens.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    marginLeft: DesignTokens.spacing.lg,
    flex: 1,
  },
  profileName: {
    fontSize: DesignTokens.typography.fontSize.xl,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text,
  },
  profileRole: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.textSecondary,
    marginTop: 2,
  },
  profileDepartment: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.textTertiary,
    marginTop: 2,
  },
  profileId: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.textTertiary,
    marginTop: 4,
  },
  menuSection: {
    marginBottom: DesignTokens.spacing.xl,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: DesignTokens.spacing.md,
  },
  sectionContent: {
    backgroundColor: DesignTokens.colors.background,
    borderRadius: DesignTokens.borderRadius.lg,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    ...DesignTokens.shadows.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: DesignTokens.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.border,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  menuContent: {
    flex: 1,
    marginLeft: DesignTokens.spacing.md,
  },
  menuTitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.text,
  },
  menuSubtitle: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: DesignTokens.spacing.lg,
    backgroundColor: DesignTokens.colors.surface,
    borderRadius: DesignTokens.borderRadius.md,
    marginBottom: DesignTokens.spacing.xl,
    gap: DesignTokens.spacing.sm,
    borderWidth: 1,
    borderColor: DesignTokens.colors.error,
  },
  logoutText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.error,
  },
  appInfo: {
    alignItems: "center",
    paddingVertical: DesignTokens.spacing.lg,
  },
  appName: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text,
  },
  versionText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.textSecondary,
    marginTop: 4,
  },
  buildText: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.textTertiary,
    marginTop: 2,
  },
});