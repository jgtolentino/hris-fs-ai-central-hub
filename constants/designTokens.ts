import { Platform } from 'react-native';

export const DesignTokens = {
  colors: {
    // TBWA Brand Colors
    primary: '#000000',        // TBWA Black
    primaryLight: '#333333',   
    accent: '#FFD700',         // Electric Yellow
    secondary: '#0066CC',      // Corporate Blue
    
    // UI Colors
    background: '#FFFFFF',
    surface: '#F8F9FA',
    border: '#E1E5E9',
    text: '#212529',
    textSecondary: '#6C757D',
    textTertiary: '#9CA3AF',
    
    // Semantic Colors
    success: '#28A745',
    warning: '#FFC107', 
    error: '#DC3545',
    info: '#17A2B8',
    
    // Status Colors for workflows
    draft: '#F3F4F6',
    submitted: '#FEF3C7',
    approved: '#D1FAE5',
    rejected: '#FEE2E2',
    pending: '#E0E7FF',
    inProgress: '#DBEAFE',
    completed: '#D1FAE5',
    
    // Module Colors
    timeModule: '#10B981',
    expenseModule: '#8B5CF6',
    leaveModule: '#F59E0B',
    requestModule: '#EF4444',
    aiModule: '#FFD700',
  },
  
  typography: {
    fontFamily: {
      primary: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
      mono: Platform.OS === 'ios' ? 'SF Mono' : 'Roboto Mono',
    },
    fontSize: {
      xs: 12, 
      sm: 14, 
      base: 16, 
      lg: 18, 
      xl: 20, 
      xxl: 24, 
      xxxl: 30
    },
    fontWeight: {
      normal: '400' as const, 
      medium: '500' as const, 
      semibold: '600' as const, 
      bold: '700' as const
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    }
  }
};