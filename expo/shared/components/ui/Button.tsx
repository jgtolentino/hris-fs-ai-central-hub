import React from 'react'
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native'
import { cn } from '@shared/lib/utils'

interface ButtonProps {
  onPress: () => void
  title: string
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle
}: ButtonProps) {
  const baseStyle = 'rounded-lg items-center justify-center'
  
  const variants = {
    primary: 'bg-tbwa-yellow',
    secondary: 'bg-gray-200 dark:bg-gray-700',
    danger: 'bg-red-500'
  }
  
  const sizes = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4'
  }
  
  const textVariants = {
    primary: 'text-black font-semibold',
    secondary: 'text-gray-800 dark:text-gray-200',
    danger: 'text-white font-semibold'
  }
  
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        style,
        { opacity: disabled || loading ? 0.6 : 1 }
      ]}
      className={cn(baseStyle, variants[variant], sizes[size])}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#000' : '#fff'} />
      ) : (
        <Text 
          style={textStyle}
          className={cn(textVariants[variant], textSizes[size])}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}

// Web-compatible version
export function WebButton(props: ButtonProps) {
  // Implementation for web using regular button element
  return <Button {...props} />
}
