import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { X, Paperclip, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '@/constants/colors';

interface TicketForm {
  title: string;
  category: string;
  priority: string;
  description: string;
}

const categories = [
  { id: 'it', label: 'IT Support', icon: '💻' },
  { id: 'hr', label: 'HR', icon: '👥' },
  { id: 'expense', label: 'Expense', icon: '💰' },
  { id: 'facilities', label: 'Facilities', icon: '🏢' },
  { id: 'other', label: 'Other', icon: '📋' },
];

const priorities = [
  { id: 'low', label: 'Low', color: '#10B981' },
  { id: 'medium', label: 'Medium', color: '#F59E0B' },
  { id: 'high', label: 'High', color: '#EF4444' },
  { id: 'critical', label: 'Critical', color: '#7C3AED' },
];

export default function CreateTicketScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('it');
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [attachments, setAttachments] = useState<any[]>([]);

  const { control, handleSubmit, formState: { errors } } = useForm<TicketForm>({
    defaultValues: {
      title: '',
      category: 'it',
      priority: 'medium',
      description: '',
    }
  });

  const onSubmit = (data: TicketForm) => {
    // Submit to backend
    Alert.alert(
      'Success',
      'Your ticket has been submitted successfully. Ticket #INC0001236',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setAttachments([...attachments, ...result.assets]);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: true,
    });

    if (!result.canceled) {
      setAttachments([...attachments, ...result.assets]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>New Support Ticket</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
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
                placeholder="Brief description of your issue"
              />
              {errors.title && <Text style={styles.error}>{errors.title.message}</Text>}
            </View>
          )}
        />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.optionsContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.optionButton,
                    selectedCategory === cat.id && styles.optionSelected
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={styles.optionIcon}>{cat.icon}</Text>
                  <Text style={[
                    styles.optionText,
                    selectedCategory === cat.id && styles.optionTextSelected
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityContainer}>
            {priorities.map((priority) => (
              <TouchableOpacity
                key={priority.id}
                style={[
                  styles.priorityButton,
                  selectedPriority === priority.id && { 
                    backgroundColor: priority.color + '20',
                    borderColor: priority.color 
                  }
                ]}
                onPress={() => setSelectedPriority(priority.id)}
              >
                <View style={[styles.priorityDot, { backgroundColor: priority.color }]} />
                <Text style={[
                  styles.priorityText,
                  selectedPriority === priority.id && { color: priority.color }
                ]}>
                  {priority.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Controller
          control={control}
          name="description"
          rules={{ required: 'Description is required' }}
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={value}
                onChangeText={onChange}
                placeholder="Provide detailed information about your issue..."
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              {errors.description && <Text style={styles.error}>{errors.description.message}</Text>}
            </View>
          )}
        />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Attachments (Optional)</Text>
          <View style={styles.attachmentButtons}>
            <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
              <Camera size={20} color={colors.primary} />
              <Text style={styles.attachButtonText}>Add Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachButton} onPress={pickDocument}>
              <Paperclip size={20} color={colors.primary} />
              <Text style={styles.attachButtonText}>Add File</Text>
            </TouchableOpacity>
          </View>
          
          {attachments.length > 0 && (
            <View style={styles.attachmentsList}>
              {attachments.map((attachment, index) => (
                <View key={index} style={styles.attachmentItem}>
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {attachment.name || `Image ${index + 1}`}
                  </Text>
                  <TouchableOpacity onPress={() => removeAttachment(index)}>
                    <X size={16} color={colors.gray[600]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.submitText}>Submit Ticket</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  optionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  optionText: {
    fontSize: 12,
    color: colors.gray[600],
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 14,
    color: colors.gray[700],
    fontWeight: '500',
  },
  attachmentButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  attachButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  attachmentsList: {
    marginTop: 12,
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray[100],
    padding: 12,
    borderRadius: 8,
  },
  attachmentName: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[700],
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  cancelText: {
    color: colors.gray[600],
    fontSize: 16,
  },
});