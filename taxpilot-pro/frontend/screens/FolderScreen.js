import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { folderService, documentService } from '../services/api';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../context/ThemeContext';

const DOCUMENT_TYPES = [
  { id: 'form16', name: 'Form 16' },
  { id: 'form26as', name: 'Form 26AS' },
  { id: 'itr', name: 'ITR Receipt' },
  { id: 'investment', name: 'Investment Proof' },
  { id: 'pan_card', name: 'PAN Card' },
  { id: 'aadhar', name: 'Aadhar Card' },
  { id: 'salary_slip', name: 'Salary Slip' },
  { id: 'bank_statement', name: 'Bank Statement' },
  { id: 'other', name: 'Other' },
];

export default function FolderScreen({ route, navigation }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { folderId, folderName } = route.params;
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedType, setSelectedType] = useState('other');
  const [showTypePicker, setShowTypePicker] = useState(false);

  useEffect(() => {
    loadFolderData();
  }, [folderId]);

  const loadFolderData = async () => {
    try {
      const res = await folderService.getFolderDocuments(folderId);
      setFolder(res.data.folder);
      setDocuments(res.data.documents || []);
    } catch (error) {
      console.error('Load folder data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        setUploadModalVisible(true);
      }
    } catch (error) {
      console.error('Document pick error:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/octet-stream',
      });
      formData.append('document_type', selectedType);
      formData.append('folder_id', folderId);

      await documentService.uploadDocument(formData);
      Alert.alert('Success', 'Document uploaded to ' + folderName);
      setUploadModalVisible(false);
      setSelectedFile(null);
      setSelectedType('other');
      loadFolderData();
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return 'document-text';
    if (mimeType?.includes('image')) return 'image';
    return 'document';
  };

  const getFileColor = (mimeType) => {
    if (mimeType?.includes('pdf')) return '#e74c3c';
    if (mimeType?.includes('image')) return '#27ae60';
    return '#3498db';
  };

  const renderDocument = ({ item }) => (
    <TouchableOpacity 
      style={[styles.documentCard, { backgroundColor: theme.colors.card }]}
      onPress={() => navigation.navigate('DocumentViewer', { documentId: item.id, documentName: item.name })}
    >
      <View style={[styles.fileIcon, { backgroundColor: getFileColor(item.mime_type) + '20' }]}>
        <Ionicons name={getFileIcon(item.mime_type)} size={28} color={getFileColor(item.mime_type)} />
      </View>
      <View style={styles.documentInfo}>
        <Text style={[styles.documentName, { color: theme.colors.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.documentMeta, { color: theme.colors.textSecondary }]}>
          {item.document_type} • {formatFileSize(item.file_size)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.folderHeader, { backgroundColor: theme.colors.card }]}>
        <View style={[styles.folderIcon, { backgroundColor: theme.colors.primary + '20' }]}>
          <Ionicons name="folder" size={40} color={theme.colors.primary} />
        </View>
        <View style={styles.folderInfo}>
          <Text style={[styles.folderName, { color: theme.colors.text }]}>{folderName}</Text>
          <Text style={[styles.folderMeta, { color: theme.colors.textSecondary }]}>{documents.length} documents</Text>
        </View>
      </View>

      {folder?.description && (
        <View style={[styles.descriptionContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{folder.description}</Text>
        </View>
      )}

      <FlatList
        data={documents}
        renderItem={renderDocument}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>No documents in this folder</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Upload documents to this folder</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={pickDocument} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons name="add" size={30} color="#fff" />
        )}
      </TouchableOpacity>

      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Upload to {folderName}</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {selectedFile && (
              <View style={[styles.filePreview, { backgroundColor: theme.colors.background }]}>
                <Ionicons name="document" size={40} color="#e74c3c" />
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileName, { color: theme.colors.text }]} numberOfLines={1}>{selectedFile.name}</Text>
                  <Text style={[styles.fileSize, { color: theme.colors.textSecondary }]}>{formatFileSize(selectedFile.size || 0)}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={[styles.pickerButton, { backgroundColor: theme.colors.background }]} onPress={() => setShowTypePicker(true)}>
              <Text style={[styles.pickerLabel, { color: theme.colors.textSecondary }]}>Document Type</Text>
              <View style={styles.pickerValue}>
                <Text style={[styles.pickerText, { color: theme.colors.text }]}>
                  {DOCUMENT_TYPES.find(t => t.id === selectedType)?.name || 'Select Type'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>

            <View style={[styles.folderInfoBanner, { backgroundColor: theme.colors.primary + '15' }]}>
              <Ionicons name="folder" size={20} color={theme.colors.primary} />
              <Text style={[styles.folderInfoText, { color: theme.colors.text }]}>
                This document will be saved in: <Text style={{ fontWeight: 'bold' }}>{folderName}</Text>
              </Text>
            </View>

            <TouchableOpacity style={styles.uploadButton} onPress={handleUpload} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={20} color="#fff" />
                  <Text style={styles.uploadButtonText}>Upload</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showTypePicker} transparent animationType="fade" onRequestClose={() => setShowTypePicker(false)}>
        <TouchableOpacity style={styles.pickerModalOverlay} activeOpacity={1} onPress={() => setShowTypePicker(false)}>
          <View style={[styles.pickerModalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.pickerModalTitle, { color: theme.colors.text }]}>Select Document Type</Text>
            {DOCUMENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[styles.pickerOption, { borderBottomColor: theme.colors.border }]}
                onPress={() => {
                  setSelectedType(type.id);
                  setShowTypePicker(false);
                }}
              >
                <Text style={[styles.pickerOptionText, { color: theme.colors.text }, selectedType === type.id && { color: theme.colors.primary }]}>
                  {type.name}
                </Text>
                {selectedType === type.id && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 10,
  },
  folderIcon: {
    width: 70,
    height: 70,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  folderMeta: {
    fontSize: 14,
    marginTop: 5,
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  listContent: {
    padding: 15,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  fileIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
  },
  documentMeta: {
    fontSize: 12,
    marginTop: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 5,
  },
  fab: { position: 'absolute', right: 20, bottom: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#3498db', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  filePreview: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 15, marginBottom: 20 },
  fileInfo: { flex: 1, marginLeft: 15 },
  fileName: { fontSize: 16, fontWeight: '600' },
  fileSize: { fontSize: 12, marginTop: 3 },
  pickerButton: { borderRadius: 10, padding: 15, marginBottom: 15 },
  pickerLabel: { fontSize: 12, marginBottom: 5 },
  pickerValue: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerText: { fontSize: 16 },
  folderInfoBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 15, marginBottom: 15 },
  folderInfoText: { flex: 1, marginLeft: 10, fontSize: 14 },
  uploadButton: { backgroundColor: '#27ae60', borderRadius: 10, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  uploadButtonText: { color: '#fff', fontSize: 18, fontWeight: '600', marginLeft: 10 },
  pickerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 40 },
  pickerModalContent: { borderRadius: 15, padding: 20, width: '100%', maxHeight: '70%' },
  pickerModalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  pickerOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  pickerOptionText: { fontSize: 16 },
});
