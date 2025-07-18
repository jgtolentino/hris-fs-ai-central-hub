#!/usr/bin/env bun
// scripts/fix-missing-screens.tsx
// Auto-creates missing screens to eliminate "Oops! This screen doesn't exist" error

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Define all expected routes based on your app structure
const TAB_ROUTES = [
  { name: 'index', displayName: 'Dashboard', icon: 'home' },
  { name: 'ai', displayName: 'AI Assistant', icon: 'message-circle' },
  { name: 'time', displayName: 'Time', icon: 'clock' },
  { name: 'requests', displayName: 'Requests', icon: 'file-text' },
  { name: 'more', displayName: 'More', icon: 'menu' }
]

const STACK_ROUTES = [
  { name: 'expenses', displayName: 'Expenses' },
  { name: 'leave', displayName: 'Leave' },
  { name: 'profile', displayName: 'Profile' },
  { name: 'settings', displayName: 'Settings' }
]

// Template for tab screens
const TAB_TEMPLATE = (name: string, displayName: string) => `import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ${displayName.replace(/\s/g, '')}Screen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>${displayName}</Text>
          <Text style={styles.subtitle}>This screen is under construction</Text>
        </View>
        
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🚧</Text>
          <Text style={styles.placeholderLabel}>Coming Soon</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  placeholderText: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderLabel: {
    fontSize: 18,
    color: '#999',
  },
});
`

// Template for stack screens
const STACK_TEMPLATE = (name: string, displayName: string) => `import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

export default function ${displayName.replace(/\s/g, '')}Screen() {
  const router = useRouter();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#000" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>${displayName}</Text>
        <Text style={styles.subtitle}>This feature is coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
`

// Check and create tab layout if missing
function ensureTabLayout() {
  const tabsDir = path.resolve(__dirname, '../app/(tabs)')
  const layoutFile = path.join(tabsDir, '_layout.tsx')
  
  if (!fs.existsSync(layoutFile)) {
    fs.mkdirSync(tabsDir, { recursive: true })
    
    const layoutContent = `import React from 'react';
import { Tabs } from 'expo-router';
import { Home, MessageCircle, Clock, FileText, Menu } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI Assistant',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="time"
        options={{
          title: 'Time',
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <Menu size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
`
    
    fs.writeFileSync(layoutFile, layoutContent)
    console.log(`✅ Created: ${layoutFile}`)
  }
}

// Main function to fix missing screens
function fixMissingScreens() {
  console.log('🔧 Fixing missing screens in TBWA HRIS app...\n')
  
  // Ensure tabs layout exists
  ensureTabLayout()
  
  // Fix tab routes
  console.log('📁 Checking tab routes:')
  TAB_ROUTES.forEach(route => {
    const tabsDir = path.resolve(__dirname, '../app/(tabs)')
    const file = path.join(tabsDir, `${route.name}.tsx`)
    
    if (!fs.existsSync(file)) {
      fs.mkdirSync(tabsDir, { recursive: true })
      fs.writeFileSync(file, TAB_TEMPLATE(route.name, route.displayName))
      console.log(`  ✅ Created: app/(tabs)/${route.name}.tsx`)
    } else {
      console.log(`  ✔️  Exists: app/(tabs)/${route.name}.tsx`)
    }
  })
  
  // Fix stack routes
  console.log('\n📁 Checking stack routes:')
  STACK_ROUTES.forEach(route => {
    const dir = path.resolve(__dirname, `../app/${route.name}`)
    const file = path.join(dir, 'index.tsx')
    
    if (!fs.existsSync(file)) {
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(file, STACK_TEMPLATE(route.name, route.displayName))
      console.log(`  ✅ Created: app/${route.name}/index.tsx`)
    } else {
      console.log(`  ✔️  Exists: app/${route.name}/index.tsx`)
    }
  })
  
  // Create root layout if missing
  const rootLayout = path.resolve(__dirname, '../app/_layout.tsx')
  if (!fs.existsSync(rootLayout)) {
    const rootLayoutContent = `import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="expenses" options={{ title: 'Expenses' }} />
        <Stack.Screen name="leave" options={{ title: 'Leave' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </>
  );
}
`
    fs.writeFileSync(rootLayout, rootLayoutContent)
    console.log(`\n✅ Created root layout: app/_layout.tsx`)
  }
  
  console.log('\n✨ All screens fixed! No more dead routes.')
  console.log('\n🔄 Next steps:')
  console.log('1. Restart your development server')
  console.log('2. Clear cache: bun run start --clear')
  console.log('3. Reload the app in your device/simulator')
}

// Run the fix
if (import.meta.main) {
  fixMissingScreens()
}

export { fixMissingScreens }