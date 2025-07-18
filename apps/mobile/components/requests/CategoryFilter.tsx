import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { User, CreditCard, Laptop, Building, Shield } from 'lucide-react-native';
import { DesignTokens } from '@/constants/designTokens';
import { RequestCategory } from '@/store/requestStore';

interface CategoryFilterProps {
  categories: RequestCategory[];
  selectedCategory: string | null;
  onCategorySelect: (categoryCode: string | null) => void;
}

const categoryIcons = {
  hr: User,
  finance: CreditCard,
  it: Laptop,
  admin: Building,
  compliance: Shield,
} as const;

export default function CategoryFilter({ 
  categories, 
  selectedCategory, 
  onCategorySelect 
}: CategoryFilterProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filter by Category</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              !selectedCategory && styles.filterButtonActive
            ]}
            onPress={() => onCategorySelect(null)}
          >
            <Text style={[
              styles.filterText,
              !selectedCategory && styles.filterTextActive
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          {categories.map((category) => {
            const IconComponent = categoryIcons[category.code as keyof typeof categoryIcons] || User;
            const isSelected = selectedCategory === category.code;
            
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.filterButton,
                  isSelected && styles.filterButtonActive,
                  { borderColor: category.color }
                ]}
                onPress={() => onCategorySelect(isSelected ? null : category.code)}
              >
                <IconComponent 
                  size={16} 
                  color={isSelected ? DesignTokens.colors.background : category.color} 
                />
                <Text style={[
                  styles.filterText,
                  isSelected && styles.filterTextActive
                ]}>
                  {category.name.split('/')[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: DesignTokens.spacing.xl,
  },
  title: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text,
    marginBottom: DesignTokens.spacing.md,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.xs,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.borderRadius.full,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    backgroundColor: DesignTokens.colors.background,
    gap: DesignTokens.spacing.xs,
  },
  filterButtonActive: {
    backgroundColor: DesignTokens.colors.primary,
    borderColor: DesignTokens.colors.primary,
  },
  filterText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.text,
  },
  filterTextActive: {
    color: DesignTokens.colors.background,
  },
});