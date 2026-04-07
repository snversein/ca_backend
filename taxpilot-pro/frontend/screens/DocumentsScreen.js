import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, ActivityIndicator, Modal, TextInput } from 'react-native';
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

export default function DocumentsScreen({ navigation, route }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(route.params?.initialTab || 'documents');
  const [uploading, setUploading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedType, setSelectedType] = useState('other');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [assignedFolder, setAssignedFolder] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [foldersRes, docsRes] = await Promise.all([
        folderService.getFolders(),
        documentService.getDocuments(),
      ]);
      const foldersList = foldersRes.data.folders || [];
      setFolders(foldersList);
      setDocuments(docsRes.data.documents || []);
      
      if (foldersList.length === 1) {
        setAssignedFolder(foldersList[0]);
        setSelectedFolder(foldersList[0].id);
      } else if (foldersList.length > 1) {
        const assigned = foldersList.find(f => f.is_assigned || f.is_default);
        if (assigned) {
          setAssignedFolder(assigned);
          setSelectedFolder(assigned.id);
        } else {
          setSelectedFolder(foldersList[0].id);
        }
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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
      if (selectedFolder) {
        formData.append('folder_id', selectedFolder);
      }

      await documentService.uploadDocument(formData);
      Alert.alert('Success', 'Document uploaded successfully');
      setUploadModalVisible(false);
      setSelectedFile(null);
      setSelectedType('other');
      setSelectedFolder(null);
      loadData();
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (id) => {
    Alert.alert('Delete Document', 'Are you sure you want to delete this document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await documentService.deleteDocument(id);
            loadData();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete document');
          }
        },
      },
    ]);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return 'document-text';
    if (mimeType?.includes('image')) return 'image';
    return 'document';
  };

  const renderFolder = ({ item }) => (
    <TouchableOpacity
      style={[styles.folderCard, { backgroundColor: theme.colors.card }]}
      onPress={() => navigation.navigate('FolderDetail', { folderId: item.id, folderName: item.name })}
    >
      <View style={styles.folderIcon}>
        <Ionicons name="folder" size={32} color={theme.colors.primary} />
      </View>
      <View style={styles.folderInfo}>
        <Text style={[styles.folderName, { color: theme.colors.text }]}>{item.name}</Text>
        <Text style={[styles.folderMeta, { color: theme.colors.textSecondary }]}>{item.document_count || 0} documents</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderDocument = ({ item }) => (
    <TouchableOpacity 
      style={[styles.documentCard, { backgroundColor: theme.colors.card }]}
      onPress={() => navigation.navigate('DocumentViewer', { documentId: item.id, documentName: item.name })}
    >
      <View style={styles.documentIcon}>
        <Ionicons name={getFileIcon(item.mime_type)} size={28} color="#e74c3c" />
      </View>
      <View style={styles.documentInfo}>
        <Text style={[styles.documentName, { color: theme.colors.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.documentMeta, { color: theme.colors.textSecondary }]}>
          {item.document_type} • {formatFileSize(item.file_size || 0)}
        </Text>
      </View>
      <TouchableOpacity onPress={() => deleteDocument(item.id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={20} color="#e74c3c" />
      </TouchableOpacity>
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
      <View style={[styles.tabBar, { backgroundColor: theme.colors.card }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'documents' && { backgroundColor: theme.colors.primary }]}
          onPress={() => setActiveTab('documents')}
        >
          <Text style={[styles.tabText, activeTab === 'documents' && styles.activeTabText]}>Documents</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'folders' && { backgroundColor: theme.colors.primary }]}
          onPress={() => setActiveTab('folders')}
        >
          <Text style={[styles.tabText, activeTab === 'folders' && styles.activeTabText]}>Folders</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'documents' ? (
        <FlatList
          data={documents}
          renderItem={renderDocument}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>No documents yet</Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Upload your tax documents</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={folders}
          renderItem={renderFolder}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>No folders yet</Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Your CA will share folders with you</Text>
            </View>
          }
        />
      )}

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
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Upload Document</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {selectedFile && (
              <View style={[styles.filePreview, { backgroundColor: theme.colors.background }]}>
                <Ionicons name={getFileIcon(selectedFile.mimeType)} size={40} color="#e74c3c" />
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

            {assignedFolder && (
              <View style={[styles.assignedFolderBanner, { backgroundColor: theme.colors.success + '20' }]}>
                <Ionicons name="folder" size={20} color={theme.colors.success} />
                <Text style={[styles.assignedFolderText, { color: theme.colors.text }]}>
                  Your documents will be saved in: <Text style={{ fontWeight: 'bold' }}>{assignedFolder.name}</Text>
                </Text>
              </View>
            )}

            {!assignedFolder && folders.length > 0 && (
              <TouchableOpacity style={[styles.pickerButton, { backgroundColor: theme.colors.background }]} onPress={() => setShowFolderPicker(true)}>
                <Text style={[styles.pickerLabel, { color: theme.colors.textSecondary }]}>Select Folder</Text>
                <View style={styles.pickerValue}>
                  <Text style={[styles.pickerText, { color: theme.colors.text }]}>
                    {selectedFolder ? folders.find(f => f.id === selectedFolder)?.name : 'Select a folder'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
                </View>
              </TouchableOpacity>
            )}

            {assignedFolder && (
              <View style={[styles.selectedFolderDisplay, { backgroundColor: theme.colors.background }]}>
                <Ionicons name="folder" size={24} color={theme.colors.primary} />
                <View style={styles.selectedFolderInfo}>
                  <Text style={[styles.selectedFolderName, { color: theme.colors.text }]}>{assignedFolder.name}</Text>
                  <Text style={[styles.selectedFolderHint, { color: theme.colors.textSecondary }]}>Documents will be saved here automatically</Text>
                </View>
              </View>
            )}

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

      <Modal visible={showFolderPicker} transparent animationType="fade" onRequestClose={() => setShowFolderPicker(false)}>
        <TouchableOpacity style={styles.pickerModalOverlay} activeOpacity={1} onPress={() => setShowFolderPicker(false)}>
          <View style={[styles.pickerModalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.pickerModalTitle, { color: theme.colors.text }]}>Select Folder</Text>
            <TouchableOpacity
              style={[styles.pickerOption, { borderBottomColor: theme.colors.border }]}
              onPress={() => {
                setSelectedFolder(null);
                setShowFolderPicker(false);
              }}
            >
              <Text style={[styles.pickerOptionText, { color: theme.colors.text }, selectedFolder === null && { color: theme.colors.primary }]}>No Folder</Text>
              {selectedFolder === null && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
            </TouchableOpacity>
            {folders.map((folder) => (
              <TouchableOpacity
                key={folder.id}
                style={[styles.pickerOption, { borderBottomColor: theme.colors.border }]}
                onPress={() => {
                  setSelectedFolder(folder.id);
                  setShowFolderPicker(false);
                }}
              >
                <Text style={[styles.pickerOptionText, { color: theme.colors.text }, selectedFolder === folder.id && { color: theme.colors.primary }]}>
                  {folder.name}
                </Text>
                {selectedFolder === folder.id && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: { flexDirection: 'row', padding: 5, margin: 15, borderRadius: 10 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#3498db' },
  tabText: { fontSize: 14, fontWeight: '500' },
  activeTabText: { color: '#fff' },
  listContent: { padding: 15, paddingBottom: 100 },
  folderCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 15, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  folderIcon: { marginRight: 15 },
  folderInfo: { flex: 1 },
  folderName: { fontSize: 16, fontWeight: '600' },
  folderMeta: { fontSize: 12, marginTop: 3 },
  documentCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 15, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  documentIcon: { marginRight: 15 },
  documentInfo: { flex: 1 },
  documentName: { fontSize: 16, fontWeight: '600' },
  documentMeta: { fontSize: 12, marginTop: 3 },
  deleteBtn: { padding: 5 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 15 },
  emptySubtext: { fontSize: 14, marginTop: 5 },
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
  uploadButton: { backgroundColor: '#27ae60', borderRadius: 10, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  assignedFolderBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 15, marginBottom: 15 },
  assignedFolderText: { flex: 1, marginLeft: 10, fontSize: 14 },
  selectedFolderDisplay: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 15, marginBottom: 15 },
  selectedFolderInfo: { flex: 1, marginLeft: 12 },
  selectedFolderName: { fontSize: 16, fontWeight: '600' },
  selectedFolderHint: { fontSize: 12, marginTop: 2 },
  uploadButtonText: { color: '#fff', fontSize: 18, fontWeight: '600', marginLeft: 10 },
  pickerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 40 },
  pickerModalContent: { borderRadius: 15, padding: 20, width: '100%', maxHeight: '70%' },
  pickerModalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  pickerOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  pickerOptionText: { fontSize: 16 },
  pickerOptionSelected: { fontWeight: '600' },
});
