import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { useExpenseStore } from '@/store/expenseStore';
import { colors } from '@/constants/colors';

interface ExpenseFormData {
  title: string;
  amount: string;
  category: string;
  description: string;
  merchant: string;
  date: string;
}

const categories = [
  { id: 'meals', label: 'Meals & Entertainment', icon: '🍽️' },
  { id: 'transport', label: 'Transportation', icon: '🚗' },
  { id: 'accommodation', label: 'Accommodation', icon: '🏨' },
  { id: 'office', label: 'Office Supplies', icon: '📎' },
  { id: 'client', label: 'Client Meeting', icon: '🤝' },
  { id: 'other', label: 'Other', icon: '📋' },
];

export default function CreateExpenseScreen() {
  const router = useRouter();
  const { addExpense } = useExpenseStore();
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('meals');
  
  const { control, handleSubmit, formState: { errors } } = useForm<ExpenseFormData>({
    defaultValues: {
      title: '',
      amount: '',
      category: 'meals',
      description: '',
      merchant: '',
      date: new Date().toISOString().split('T')[0],
    }
  });

  const pickImage = async (useCamera: boolean) => {
    const result = await (useCamera 
      ? ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        })
      : ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        }));

    if (!result.canceled) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const onSubmit = (data: ExpenseFormData) => {
    if (!receiptImage) {
      Alert.alert('Receipt Required', 'Please attach a receipt for this expense.');
      return;
    }

    const expense = {
      id: Date.now().toString(),
      title: data.title,
      amount: parseFloat(data.amount),
      category: selectedCategory,
      description: data.description,
      merchant: data.merchant,
      date: new Date(data.date),
      receiptUrl: receiptImage,
      status: 'pending' as const,
      createdAt: new Date(),
    };

    addExpense(expense);
    Alert.alert(
      'Success',
      'Expense submitted successfully!',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>New Expense</Text>
        <Text style={styles.subtitle}>Submit your expense claim</Text>
      </View>

      {/* Receipt Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Receipt</Text>
        {receiptImage ? (
          <View style={styles.receiptContainer}>
            <Image source={{ uri: receiptImage }} style={styles.receiptImage} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => setReceiptImage(null)}
            >
              <X size={20} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadContainer}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickImage(true)}
            >
              <Camera size={24} color={colors.primary} />
              <Text style={styles.uploadText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickImage(false)}
            >
              <ImageIcon size={24} color={colors.primary} />
              <Text style={styles.uploadText}>Choose from Library</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Form Fields */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expense Details</Text>
        
        <Controller
          control={control}
          name="title"
          rules={{ required: 'Title is required' }}
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder="e.g., Client Lunch at Downtown"
              />
              {errors.title && <Text style={styles.error}>{errors.title.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="amount"
          rules={{ 
            required: 'Amount is required',
            pattern: {
              value: /^\d+(\.\d{1,2})?$/,
              message: 'Enter a valid amount'
            }
          }}
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount ($)</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
              {errors.amount && <Text style={styles.error}>{errors.amount.message}</Text>}
            </View>
          )}
        />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat.id && styles.categorySelected
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === cat.id && styles.categoryTextSelected
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <Controller
          control={control}
          name="merchant"
          rules={{ required: 'Merchant name is required' }}
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Merchant</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder="e.g., Starbucks"
              />
              {errors.merchant && <Text style={styles.error}>{errors.merchant.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={value}
                onChangeText={onChange}
                placeholder="Add any additional details..."
                multiline
                numberOfLines={3}
              />
            </View>
          )}
        />
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit(onSubmit)}
      >
        <Text style={styles.submitText}>Submit Expense</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[600],
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  uploadContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
  },
  receiptContainer: {
    position: 'relative',
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  categorySelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: colors.gray[600],
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    marginBottom: 40,
  },
  cancelText: {
    color: colors.gray[600],
    fontSize: 16,
  },
});