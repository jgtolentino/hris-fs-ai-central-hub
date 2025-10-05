import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Camera, Receipt, X, Check, AlertCircle, Upload } from 'lucide-react-native';
import { useExpenseStore } from '../../store/expense-store';
import { OCRService } from '../../services/ocr-service';
import { supabase } from '../../lib/supabase';
import { ConcurDesignTokens, formatCurrency } from '../../constants/concurDesignTokens';

interface ExpenseFormData {
  merchantName: string;
  amount: string;
  currency: string;
  category: string;
  expenseDate: Date;
  description: string;
  tripId?: string;
  projectId?: string;
  paymentMethod: string;
  hasReceipt: boolean;
  receiptUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

const EXPENSE_CATEGORIES = [
  'Meals',
  'Travel',
  'Accommodation',
  'Transportation',
  'Entertainment',
  'Office Supplies',
  'Training',
  'Communication',
  'Other',
];

const PAYMENT_METHODS = [
  'Credit Card',
  'Debit Card',
  'Cash',
  'Company Card',
  'Digital Wallet',
];

export const ExpenseSubmissionFlow: React.FC = () => {
  const [step, setStep] = useState<'capture' | 'review' | 'submit'>('capture');
  const [loading, setLoading] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [formData, setFormData] = useState<ExpenseFormData>({
    merchantName: '',
    amount: '',
    currency: 'USD',
    category: '',
    expenseDate: new Date(),
    description: '',
    paymentMethod: '',
    hasReceipt: false,
  });
  const [policyViolations, setPolicyViolations] = useState<any[]>([]);
  
  const { addExpense, syncOfflineExpenses } = useExpenseStore();
  const ocrService = new OCRService(supabase);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (cameraStatus !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to capture receipts');
    }
  };

  const captureReceipt = async (source: 'camera' | 'gallery') => {
    try {
      let result;
      
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setReceiptImage(result.assets[0].uri);
        await processReceipt(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture receipt');
    }
  };

  const processReceipt = async (imageUri: string) => {
    setLoading(true);
    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      
      // Process with OCR
      const ocrData = await ocrService.processReceipt(imageUri, {
        enhanceImage: true,
        detectCurrency: true,
        extractLineItems: true,
      });
      
      setOcrResult(ocrData);
      
      // Auto-fill form with OCR results
      setFormData({
        ...formData,
        merchantName: ocrData.merchantName || '',
        amount: ocrData.amount?.toString() || '',
        currency: ocrData.currency || 'USD',
        category: ocrData.category || '',
        expenseDate: ocrData.date || new Date(),
        paymentMethod: ocrData.paymentMethod || '',
        hasReceipt: true,
        receiptUrl: imageUri,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      });
      
      setStep('review');
    } catch (error) {
      console.error('OCR processing error:', error);
      Alert.alert(
        'Processing Error',
        'Could not extract receipt data. Please enter details manually.',
        [{ text: 'OK', onPress: () => setStep('review') }]
      );
    } finally {
      setLoading(false);
    }
  };

  const validateExpense = async () => {
    const violations = [];
    
    // Check required fields
    if (!formData.merchantName || !formData.amount || !formData.category) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return false;
    }
    
    // Check amount format
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return false;
    }
    
    // Check policy violations (this would normally call backend)
    if (formData.category === 'Meals' && amount > 150) {
      violations.push({
        type: 'max_amount_exceeded',
        message: 'Meal expenses over $150 require special approval',
      });
    }
    
    if (amount > 25 && !formData.hasReceipt) {
      violations.push({
        type: 'receipt_required',
        message: 'Receipt required for expenses over $25',
      });
    }
    
    setPolicyViolations(violations);
    return violations.length === 0 || await confirmWithViolations(violations);
  };

  const confirmWithViolations = async (violations: any[]): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Policy Violations Detected',
        violations.map(v => v.message).join('\n'),
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Submit Anyway', onPress: () => resolve(true), style: 'destructive' },
        ]
      );
    });
  };

  const submitExpense = async () => {
    if (!await validateExpense()) return;
    
    setLoading(true);
    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        status: 'Submitted',
        ocrConfidence: ocrResult?.confidence,
        ocrMetadata: ocrResult?.metadata,
        policyViolations,
      };
      
      // Try to submit online
      const result = await addExpense(expenseData);
      
      if (result.success) {
        Alert.alert('Success', 'Expense submitted successfully', [
          { text: 'OK', onPress: () => resetForm() }
        ]);
      } else if (result.offline) {
        Alert.alert(
          'Offline Mode',
          'Expense saved offline. It will be submitted when connection is restored.',
          [{ text: 'OK', onPress: () => resetForm() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit expense');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('capture');
    setReceiptImage(null);
    setOcrResult(null);
    setFormData({
      merchantName: '',
      amount: '',
      currency: 'USD',
      category: '',
      expenseDate: new Date(),
      description: '',
      paymentMethod: '',
      hasReceipt: false,
    });
    setPolicyViolations([]);
  };

  const renderCaptureStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Capture Receipt</Text>
      <Text style={styles.stepDescription}>
        Take a photo or upload an image of your receipt
      </Text>
      
      {receiptImage ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: receiptImage }} style={styles.receiptImage} />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => setReceiptImage(null)}
          >
            <X size={20} color="white" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.captureOptions}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={() => captureReceipt('camera')}
          >
            <Camera size={48} color={ConcurDesignTokens.colors.primary} />
            <Text style={styles.captureButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={() => captureReceipt('gallery')}
          >
            <Upload size={48} color={ConcurDesignTokens.colors.primary} />
            <Text style={styles.captureButtonText}>Upload Image</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.manualEntryContainer}>
        <Text style={styles.orText}>OR</Text>
        <TouchableOpacity
          onPress={() => setStep('review')}
          style={styles.manualEntryButton}
        >
          <Text style={styles.manualEntryText}>Enter Manually</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Review Expense</Text>
      
      {ocrResult && (
        <View style={styles.ocrConfidence}>
          <Text style={styles.confidenceText}>
            OCR Confidence: {Math.round(ocrResult.confidence * 100)}%
          </Text>
        </View>
      )}
      
      <View style={styles.formSection}>
        <Text style={styles.label}>Merchant Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.merchantName}
          onChangeText={(text) => setFormData({ ...formData, merchantName: text })}
          placeholder="Enter merchant name"
        />
      </View>
      
      <View style={styles.formSection}>
        <Text style={styles.label}>Amount *</Text>
        <View style={styles.amountContainer}>
          <TextInput
            style={[styles.input, styles.amountInput]}
            value={formData.amount}
            onChangeText={(text) => setFormData({ ...formData, amount: text })}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
          <TouchableOpacity style={styles.currencySelector}>
            <Text style={styles.currencyText}>{formData.currency}</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.formSection}>
        <Text style={styles.label}>Category *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {EXPENSE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                formData.category === cat && styles.categoryChipSelected,
              ]}
              onPress={() => setFormData({ ...formData, category: cat })}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  formData.category === cat && styles.categoryChipTextSelected,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.formSection}>
        <Text style={styles.label}>Payment Method</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.categoryChip,
                formData.paymentMethod === method && styles.categoryChipSelected,
              ]}
              onPress={() => setFormData({ ...formData, paymentMethod: method })}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  formData.paymentMethod === method && styles.categoryChipTextSelected,
                ]}
              >
                {method}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.formSection}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="Add notes or description"
          multiline
          numberOfLines={3}
        />
      </View>
      
      {receiptImage && (
        <View style={styles.receiptPreview}>
          <Receipt size={20} color="#666" />
          <Text style={styles.receiptPreviewText}>Receipt attached</Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => setStep('capture')}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => setStep('submit')}
        >
          <Text style={styles.primaryButtonText}>Review & Submit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderSubmitStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Confirm Submission</Text>
      
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{formData.merchantName}</Text>
        <Text style={styles.summaryAmount}>
          {formData.currency} {formData.amount}
        </Text>
        <Text style={styles.summaryCategory}>{formData.category}</Text>
        
        {formData.description && (
          <Text style={styles.summaryDescription}>{formData.description}</Text>
        )}
      </View>
      
      {policyViolations.length > 0 && (
        <View style={styles.violationsContainer}>
          <View style={styles.violationHeader}>
            <AlertCircle size={20} color="#FF6B6B" />
            <Text style={styles.violationTitle}>Policy Violations</Text>
          </View>
          {policyViolations.map((violation, index) => (
            <Text key={index} style={styles.violationText}>
              • {violation.message}
            </Text>
          ))}
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => setStep('review')}
        >
          <Text style={styles.secondaryButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={submitExpense}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={ConcurDesignTokens.colors.textOnPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>Submit Expense</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && step === 'capture') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ConcurDesignTokens.colors.primary} />
          <Text style={styles.loadingText}>Processing receipt...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Expense</Text>
        <TouchableOpacity onPress={resetForm}>
          <X size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.progressBar}>
        <View style={[styles.progressStep, step !== 'capture' && styles.progressStepCompleted]} />
        <View style={[styles.progressStep, step === 'submit' && styles.progressStepCompleted]} />
        <View style={[styles.progressStep]} />
      </View>
      
      {step === 'capture' && renderCaptureStep()}
      {step === 'review' && renderReviewStep()}
      {step === 'submit' && renderSubmitStep()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ConcurDesignTokens.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ConcurDesignTokens.spacing.base,
    backgroundColor: ConcurDesignTokens.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ConcurDesignTokens.colors.border,
    ...ConcurDesignTokens.shadows.sm,
  },
  headerTitle: {
    fontSize: ConcurDesignTokens.typography.fontSize.xl,
    fontWeight: ConcurDesignTokens.typography.fontWeight.bold,
    color: ConcurDesignTokens.colors.text,
  },
  progressBar: {
    flexDirection: 'row',
    padding: ConcurDesignTokens.spacing.base,
    gap: ConcurDesignTokens.spacing.sm,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: ConcurDesignTokens.colors.border,
    borderRadius: ConcurDesignTokens.borderRadius.sm,
  },
  progressStepCompleted: {
    backgroundColor: ConcurDesignTokens.colors.primary,
  },
  stepContainer: {
    flex: 1,
    padding: ConcurDesignTokens.spacing.base,
  },
  stepTitle: {
    fontSize: ConcurDesignTokens.typography.fontSize.xxl,
    fontWeight: ConcurDesignTokens.typography.fontWeight.bold,
    color: ConcurDesignTokens.colors.text,
    marginBottom: ConcurDesignTokens.spacing.sm,
  },
  stepDescription: {
    fontSize: ConcurDesignTokens.typography.fontSize.base,
    color: ConcurDesignTokens.colors.textSecondary,
    marginBottom: ConcurDesignTokens.spacing.xl,
  },
  captureOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: ConcurDesignTokens.spacing.xxl,
  },
  captureButton: {
    alignItems: 'center',
    padding: ConcurDesignTokens.spacing.lg,
    backgroundColor: ConcurDesignTokens.colors.surface,
    borderRadius: ConcurDesignTokens.borderRadius.lg,
    ...ConcurDesignTokens.shadows.md,
  },
  captureButtonText: {
    marginTop: ConcurDesignTokens.spacing.sm,
    fontSize: ConcurDesignTokens.typography.fontSize.base,
    fontWeight: ConcurDesignTokens.typography.fontWeight.semibold,
    color: ConcurDesignTokens.colors.text,
  },
  imageContainer: {
    position: 'relative',
    marginVertical: ConcurDesignTokens.spacing.lg,
    alignItems: 'center',
  },
  receiptImage: {
    width: 300,
    height: 400,
    borderRadius: ConcurDesignTokens.borderRadius.lg,
  },
  removeImageButton: {
    position: 'absolute',
    top: ConcurDesignTokens.spacing.md,
    right: ConcurDesignTokens.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: ConcurDesignTokens.borderRadius.full,
    padding: ConcurDesignTokens.spacing.sm,
  },
  manualEntryContainer: {
    alignItems: 'center',
    marginTop: ConcurDesignTokens.spacing.xxl,
  },
  orText: {
    fontSize: ConcurDesignTokens.typography.fontSize.sm,
    color: ConcurDesignTokens.colors.textTertiary,
    marginBottom: ConcurDesignTokens.spacing.md,
  },
  manualEntryButton: {
    paddingVertical: ConcurDesignTokens.spacing.md,
    paddingHorizontal: ConcurDesignTokens.spacing.xl,
  },
  manualEntryText: {
    fontSize: ConcurDesignTokens.typography.fontSize.base,
    color: ConcurDesignTokens.colors.primary,
    fontWeight: ConcurDesignTokens.typography.fontWeight.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: ConcurDesignTokens.spacing.base,
    fontSize: ConcurDesignTokens.typography.fontSize.base,
    color: ConcurDesignTokens.colors.textSecondary,
  },
  ocrConfidence: {
    backgroundColor: ConcurDesignTokens.colors.successLight,
    padding: ConcurDesignTokens.spacing.md,
    borderRadius: ConcurDesignTokens.borderRadius.lg,
    marginBottom: ConcurDesignTokens.spacing.base,
  },
  confidenceText: {
    color: ConcurDesignTokens.colors.success,
    fontSize: ConcurDesignTokens.typography.fontSize.sm,
    fontWeight: ConcurDesignTokens.typography.fontWeight.medium,
  },
  formSection: {
    marginBottom: ConcurDesignTokens.spacing.lg,
  },
  label: {
    fontSize: ConcurDesignTokens.typography.fontSize.base,
    fontWeight: ConcurDesignTokens.typography.fontWeight.semibold,
    color: ConcurDesignTokens.colors.text,
    marginBottom: ConcurDesignTokens.spacing.sm,
  },
  input: {
    backgroundColor: ConcurDesignTokens.colors.surface,
    borderWidth: 1,
    borderColor: ConcurDesignTokens.colors.border,
    borderRadius: ConcurDesignTokens.borderRadius.lg,
    padding: ConcurDesignTokens.spacing.md,
    fontSize: ConcurDesignTokens.typography.fontSize.base,
    color: ConcurDesignTokens.colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  amountContainer: {
    flexDirection: 'row',
    gap: ConcurDesignTokens.spacing.sm,
  },
  amountInput: {
    flex: 1,
  },
  currencySelector: {
    backgroundColor: ConcurDesignTokens.colors.surface,
    borderWidth: 1,
    borderColor: ConcurDesignTokens.colors.border,
    borderRadius: ConcurDesignTokens.borderRadius.lg,
    paddingHorizontal: ConcurDesignTokens.spacing.base,
    justifyContent: 'center',
  },
  currencyText: {
    fontSize: ConcurDesignTokens.typography.fontSize.base,
    fontWeight: ConcurDesignTokens.typography.fontWeight.semibold,
    color: ConcurDesignTokens.colors.text,
  },
  categoryChip: {
    paddingHorizontal: ConcurDesignTokens.spacing.base,
    paddingVertical: ConcurDesignTokens.spacing.sm,
    backgroundColor: ConcurDesignTokens.colors.surface,
    borderWidth: 1,
    borderColor: ConcurDesignTokens.colors.border,
    borderRadius: ConcurDesignTokens.borderRadius.full,
    marginRight: ConcurDesignTokens.spacing.sm,
  },
  categoryChipSelected: {
    backgroundColor: ConcurDesignTokens.colors.primary,
    borderColor: ConcurDesignTokens.colors.primary,
  },
  categoryChipText: {
    fontSize: ConcurDesignTokens.typography.fontSize.sm,
    color: ConcurDesignTokens.colors.textSecondary,
  },
  categoryChipTextSelected: {
    color: ConcurDesignTokens.colors.textOnPrimary,
    fontWeight: ConcurDesignTokens.typography.fontWeight.semibold,
  },
  receiptPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ConcurDesignTokens.colors.infoLight,
    padding: ConcurDesignTokens.spacing.md,
    borderRadius: ConcurDesignTokens.borderRadius.lg,
    marginVertical: ConcurDesignTokens.spacing.base,
  },
  receiptPreviewText: {
    marginLeft: ConcurDesignTokens.spacing.sm,
    color: ConcurDesignTokens.colors.textSecondary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: ConcurDesignTokens.spacing.md,
    marginTop: ConcurDesignTokens.spacing.xl,
  },
  button: {
    flex: 1,
    paddingVertical: ConcurDesignTokens.spacing.base,
    borderRadius: ConcurDesignTokens.borderRadius.lg,
    alignItems: 'center',
    ...ConcurDesignTokens.shadows.sm,
  },
  primaryButton: {
    backgroundColor: ConcurDesignTokens.colors.primary,
  },
  primaryButtonText: {
    fontSize: ConcurDesignTokens.typography.fontSize.base,
    fontWeight: ConcurDesignTokens.typography.fontWeight.semibold,
    color: ConcurDesignTokens.colors.textOnPrimary,
  },
  secondaryButton: {
    backgroundColor: ConcurDesignTokens.colors.surface,
    borderWidth: 1,
    borderColor: ConcurDesignTokens.colors.border,
  },
  secondaryButtonText: {
    fontSize: ConcurDesignTokens.typography.fontSize.base,
    fontWeight: ConcurDesignTokens.typography.fontWeight.semibold,
    color: ConcurDesignTokens.colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: ConcurDesignTokens.colors.surface,
    padding: ConcurDesignTokens.spacing.lg,
    borderRadius: ConcurDesignTokens.borderRadius.xl,
    marginBottom: ConcurDesignTokens.spacing.lg,
    ...ConcurDesignTokens.shadows.md,
  },
  summaryTitle: {
    fontSize: ConcurDesignTokens.typography.fontSize.xl,
    fontWeight: ConcurDesignTokens.typography.fontWeight.bold,
    color: ConcurDesignTokens.colors.text,
    marginBottom: ConcurDesignTokens.spacing.sm,
  },
  summaryAmount: {
    fontSize: ConcurDesignTokens.typography.fontSize.xxxl,
    fontWeight: ConcurDesignTokens.typography.fontWeight.bold,
    color: ConcurDesignTokens.colors.primary,
    marginBottom: ConcurDesignTokens.spacing.xs,
  },
  summaryCategory: {
    fontSize: ConcurDesignTokens.typography.fontSize.base,
    color: ConcurDesignTokens.colors.textSecondary,
    marginBottom: ConcurDesignTokens.spacing.sm,
  },
  summaryDescription: {
    fontSize: ConcurDesignTokens.typography.fontSize.sm,
    color: ConcurDesignTokens.colors.textTertiary,
    marginTop: ConcurDesignTokens.spacing.sm,
  },
  violationsContainer: {
    backgroundColor: ConcurDesignTokens.colors.warningLight,
    padding: ConcurDesignTokens.spacing.base,
    borderRadius: ConcurDesignTokens.borderRadius.lg,
    borderWidth: 1,
    borderColor: ConcurDesignTokens.colors.warning,
    marginBottom: ConcurDesignTokens.spacing.lg,
  },
  violationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ConcurDesignTokens.spacing.sm,
  },
  violationTitle: {
    fontSize: ConcurDesignTokens.typography.fontSize.base,
    fontWeight: ConcurDesignTokens.typography.fontWeight.semibold,
    marginLeft: ConcurDesignTokens.spacing.sm,
    color: ConcurDesignTokens.colors.warning,
  },
  violationText: {
    fontSize: ConcurDesignTokens.typography.fontSize.sm,
    color: ConcurDesignTokens.colors.warning,
    marginLeft: ConcurDesignTokens.spacing.xxl,
    marginBottom: ConcurDesignTokens.spacing.xs,
  },
});