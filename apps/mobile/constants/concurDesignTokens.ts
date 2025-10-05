/**
 * SAP Concur-Inspired Design Tokens
 * Professional expense management UI styling
 * Reference: https://www.concur.com/en-us/expense-management
 */

import { Platform } from 'react-native';

export const ConcurDesignTokens = {
  colors: {
    // Primary - Professional Blue (SAP Concur brand)
    primary: '#0070F2',           // Concur Blue
    primaryLight: '#3D8FFF',      // Lighter blue for hover
    primaryDark: '#005BBB',       // Darker blue for pressed states

    // Secondary - Supporting colors
    secondary: '#6C757D',         // Professional gray
    secondaryLight: '#9CA3AF',    // Light gray for borders
    accent: '#FFD700',            // Yellow for highlights/warnings

    // Backgrounds
    background: '#F8F9FA',        // Light gray background
    surface: '#FFFFFF',           // White cards/surfaces
    surfaceElevated: '#FEFEFE',   // Slightly elevated surfaces

    // Borders & Dividers
    border: '#E5E7EB',            // Light gray borders
    borderDark: '#D1D5DB',        // Darker borders for emphasis
    divider: '#F3F4F6',           // Subtle dividers

    // Text
    text: '#1F2937',              // Primary text (dark gray, not pure black)
    textSecondary: '#6B7280',     // Secondary text
    textTertiary: '#9CA3AF',      // Tertiary text (lightest)
    textOnPrimary: '#FFFFFF',     // Text on primary blue

    // Status Colors (Expense Workflow)
    draft: '#F3F4F6',             // Draft state (light gray)
    submitted: '#FEF3C7',         // Submitted (light yellow)
    pending: '#E0E7FF',           // Pending approval (light blue)
    approved: '#D1FAE5',          // Approved (light green)
    rejected: '#FEE2E2',          // Rejected (light red)
    reimbursed: '#DBEAFE',        // Reimbursed (light blue)

    // Status Text Colors (for badges)
    statusDraftText: '#6B7280',
    statusSubmittedText: '#D97706',
    statusPendingText: '#3B82F6',
    statusApprovedText: '#059669',
    statusRejectedText: '#DC2626',
    statusReimbursedText: '#0284C7',

    // Semantic Colors
    success: '#10B981',           // Green
    successLight: '#D1FAE5',      // Light green background
    warning: '#F59E0B',           // Amber
    warningLight: '#FEF3C7',      // Light amber background
    error: '#EF4444',             // Red
    errorLight: '#FEE2E2',        // Light red background
    info: '#3B82F6',              // Blue
    infoLight: '#DBEAFE',         // Light blue background

    // Module Colors
    expenseModule: '#8B5CF6',     // Purple
    timeModule: '#10B981',        // Green
    leaveModule: '#F59E0B',       // Amber
    requestModule: '#EF4444',     // Red
    aiModule: '#FFD700',          // Yellow

    // Interactive Elements
    linkText: '#0070F2',          // Link color
    linkHover: '#005BBB',         // Link hover
    focus: '#0070F2',             // Focus outline
    disabled: '#E5E7EB',          // Disabled state
    disabledText: '#9CA3AF',      // Disabled text

    // Overlay & Modals
    overlay: 'rgba(0, 0, 0, 0.5)',
    modalBackground: '#FFFFFF',
  },

  typography: {
    fontFamily: {
      // Enterprise-grade fonts
      primary: Platform.select({
        ios: 'SF Pro Display',
        android: 'Roboto',
        default: 'SF Pro Display'
      }),
      secondary: Platform.select({
        ios: 'SF Pro Text',
        android: 'Roboto',
        default: 'SF Pro Text'
      }),
      mono: Platform.select({
        ios: 'SF Mono',
        android: 'Roboto Mono',
        default: 'SF Mono'
      }),
    },
    fontSize: {
      xs: 11,       // Helper text, captions
      sm: 13,       // Secondary text, labels
      base: 15,     // Body text
      md: 16,       // Input text
      lg: 18,       // Section headers
      xl: 20,       // Card titles
      xxl: 24,      // Page titles
      xxxl: 28,     // Hero text
      hero: 32,     // Large displays
    },
    fontWeight: {
      light: '300' as const,
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      heavy: '800' as const,
    },
    lineHeight: {
      tight: 1.2,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },

  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
    huge: 48,
  },

  borderRadius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    xxl: 16,
    full: 9999,
  },

  shadows: {
    // SAP Concur-style shadows (subtle, professional)
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    xs: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
    },
  },

  // Component-specific tokens
  components: {
    button: {
      height: {
        sm: 32,
        md: 40,
        lg: 48,
      },
      paddingHorizontal: {
        sm: 12,
        md: 16,
        lg: 24,
      },
    },
    input: {
      height: {
        sm: 36,
        md: 44,
        lg: 52,
      },
      paddingHorizontal: 12,
    },
    card: {
      padding: 16,
      borderRadius: 8,
      backgroundColor: '#FFFFFF',
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      fontSize: 12,
    },
  },

  // Status badge configurations
  statusBadges: {
    draft: {
      backgroundColor: '#F3F4F6',
      color: '#6B7280',
      borderColor: '#E5E7EB',
    },
    submitted: {
      backgroundColor: '#FEF3C7',
      color: '#D97706',
      borderColor: '#FCD34D',
    },
    pending: {
      backgroundColor: '#E0E7FF',
      color: '#3B82F6',
      borderColor: '#BFDBFE',
    },
    approved: {
      backgroundColor: '#D1FAE5',
      color: '#059669',
      borderColor: '#A7F3D0',
    },
    rejected: {
      backgroundColor: '#FEE2E2',
      color: '#DC2626',
      borderColor: '#FCA5A5',
    },
    reimbursed: {
      backgroundColor: '#DBEAFE',
      color: '#0284C7',
      borderColor: '#BFDBFE',
    },
  },
};

// Helper function to get status badge styles
export const getStatusBadgeStyle = (status: string) => {
  const normalizedStatus = status.toLowerCase().replace(/[_\s]/g, '');
  return ConcurDesignTokens.statusBadges[normalizedStatus as keyof typeof ConcurDesignTokens.statusBadges] ||
         ConcurDesignTokens.statusBadges.draft;
};

// Helper function to format currency
export const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper function to format date
export const formatDate = (date: string | Date, format: 'short' | 'long' = 'short') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (format === 'long') {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

export default ConcurDesignTokens;
