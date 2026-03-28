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
            <Camera size={48} color="#FFD700" />
            <Text style={styles.captureButtonText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.captureButton}
            onPress={() => captureReceipt('gallery')}
          >
            <Upload size={48} color="#FFD700" />
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
            <ActivityIndicator color="black" />
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
          <ActivityIndicator size="large" color="#FFD700" />
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  progressStepCompleted: {
    backgroundColor: '#FFD700',
  },
  stepContainer: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  captureOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 32,
  },
  captureButton: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  captureButtonText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    marginVertical: 20,
    alignItems: 'center',
  },
  receiptImage: {
    width: 300,
    height: 400,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 8,
  },
  manualEntryContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  orText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  manualEntryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  manualEntryText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  ocrConfidence: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  confidenceText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  amountContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  amountInput: {
    flex: 1,
  },
  currencySelector: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  categoryChipTextSelected: {
    color: 'black',
    fontWeight: '600',
  },
  receiptPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
  },
  receiptPreviewText: {
    marginLeft: 8,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#FFD700',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  summaryCategory: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  summaryDescription: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  violationsContainer: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE69C',
    marginBottom: 20,
  },
  violationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  violationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#856404',
  },
  violationText: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 28,
    marginBottom: 4,
  },
});