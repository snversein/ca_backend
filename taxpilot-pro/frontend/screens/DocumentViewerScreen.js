import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Dimensions, TouchableOpacity, Alert, ScrollView, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { documentService } from '../services/api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const MIME_TO_EXTENSION = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
  'application/zip': 'zip',
  'application/json': 'json',
};

const getExtensionFromMimeType = (mimeType) => {
  if (!mimeType) return 'pdf';
  if (MIME_TO_EXTENSION[mimeType]) return MIME_TO_EXTENSION[mimeType];
  const parts = mimeType.split('/');
  if (parts.length === 2) return parts[1].split(';')[0];
  return 'pdf';
};

const getFileTypeLabel = (mimeType) => {
  if (!mimeType) return 'Document';
  if (mimeType.includes('pdf')) return 'PDF Document';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Word Document';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel Spreadsheet';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PowerPoint';
  if (mimeType.includes('image')) return 'Image';
  if (mimeType.includes('text')) return 'Text File';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'Archive';
  return 'Document';
};

export default function DocumentViewerScreen({ route, navigation }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { documentId, documentName, documentType } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [docData, setDocData] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [viewingMode, setViewingMode] = useState('loading');

  useEffect(() => {
    if (documentId) {
      loadDocument();
    } else {
      setLoading(false);
    }
  }, [documentId]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const response = await documentService.getDocument(documentId);
      if (response.data.document) {
        setDocData(response.data.document);
        
        const downloadRes = await documentService.getDownloadUrl(documentId);
        if (downloadRes.data.download_url) {
          setDownloadUrl(downloadRes.data.download_url);
        }
      }
    } catch (error) {
      console.log('Error loading document:', error);
      Alert.alert('Error', 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!downloadUrl) {
      Alert.alert('Error', 'Download URL not available');
      return;
    }

    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = docData?.name || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    setDownloading(true);
    
    try {
      const extension = getExtensionFromMimeType(docData?.mime_type);
      const originalName = docData?.name || `document_${documentId}`;
      const fileName = originalName.includes('.') ? originalName : `${originalName}.${extension}`;
      const fileUri = FileSystem.documentDirectory + fileName;

      const result = await FileSystem.downloadAsync(downloadUrl, fileUri);

      if (result.status === 200) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(result.uri, {
            mimeType: docData?.mime_type || 'application/pdf',
            dialogTitle: `Share ${docData?.name || 'Document'}`,
          });
        } else {
          Alert.alert('Downloaded', `File saved to: ${result.uri.split('/').pop()}`);
        }
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.log('Download error:', error);
      Alert.alert('Error', 'Failed to download document. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDocumentIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return 'document-text';
    if (mimeType?.includes('image')) return 'image';
    return 'document';
  };

  const getDocumentColor = (mimeType) => {
    if (mimeType?.includes('pdf')) return '#e74c3c';
    if (mimeType?.includes('image')) return '#27ae60';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return '#3498db';
    if (mimeType?.includes('excel') || mimeType?.includes('sheet')) return '#27ae60';
    if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return '#e67e22';
    return '#7f8c8d';
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading document...</Text>
      </View>
    );
  }

  if (!docData && !documentId) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="document-outline" size={80} color={theme.colors.textSecondary} />
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>No Document Selected</Text>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>Please select a document from the Documents screen to view it.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isImage = docData?.mime_type?.includes('image');

  const handleViewFile = async () => {
    if (!downloadUrl) {
      Alert.alert('Error', 'Document not loaded yet. Please wait.');
      return;
    }

    if (Platform.OS === 'web') {
      const isPDF = docData?.mime_type?.includes('pdf');
      if (isPDF) {
        window.open(downloadUrl, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = docData?.name || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      return;
    }

    setDownloading(true);
    
    try {
      const extension = getExtensionFromMimeType(docData?.mime_type);
      const originalName = docData?.name || `document_${documentId}`;
      const fileName = originalName.includes('.') ? originalName : `${originalName}.${extension}`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      const result = await FileSystem.downloadAsync(downloadUrl, fileUri);
      
      if (result.status === 200) {
        const isAvailable = await Sharing.isAvailableAsync();
        
        if (isAvailable) {
          await Sharing.shareAsync(result.uri, {
            mimeType: docData?.mime_type || 'application/pdf',
            dialogTitle: `Open ${docData?.name || 'Document'}`,
          });
        } else {
          Alert.alert('Success', 'Document saved. Open it from Downloads folder.');
        }
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.log('View error:', error);
      Alert.alert('Error', 'Unable to open file. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.dark ? '#1a1a2e' : '#2c3e50' }]}>
        <TouchableOpacity style={styles.headerBack} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{docData?.name || 'Document'}</Text>
          <Text style={styles.headerSubtitle}>{getFileTypeLabel(docData?.mime_type)}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.previewSection, { backgroundColor: theme.colors.card }]}>
          {isImage ? (
            <View style={[styles.imageContainer, { backgroundColor: theme.colors.background }]}>
              {downloadUrl ? (
                <Image 
                  source={{ uri: downloadUrl }} 
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.noPreview}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={[styles.noPreviewText, { color: theme.colors.textSecondary }]}>Loading preview...</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.genericContainer}>
              <View style={[styles.fileIconContainer, { backgroundColor: getDocumentColor(docData?.mime_type) + '20' }]}>
                <Ionicons 
                  name={getDocumentIcon(docData?.mime_type)} 
                  size={80} 
                  color={getDocumentColor(docData?.mime_type)} 
                />
              </View>
              <Text style={[styles.genericTitle, { color: theme.colors.text }]}>{getFileTypeLabel(docData?.mime_type)}</Text>
              <Text style={[styles.genericSubtitle, { color: theme.colors.textSecondary }]}>{docData?.name}</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.viewFileButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleViewFile}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="eye" size={24} color="#fff" />
                <Text style={styles.viewFileText}>View / Open File</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.detailsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Document Details</Text>
          
          <View style={[styles.detailCard, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.detailRow, { borderBottomColor: theme.colors.border }]}>
              <Ionicons name="document" size={20} color={theme.colors.primary} />
              <View style={styles.detailInfo}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>File Name</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{docData?.name || 'Unknown'}</Text>
              </View>
            </View>

            <View style={[styles.detailRow, { borderBottomColor: theme.colors.border }]}>
              <Ionicons name="grid" size={20} color={theme.colors.success} />
              <View style={styles.detailInfo}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Document Type</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{docData?.document_type || 'Other'}</Text>
              </View>
            </View>

            <View style={[styles.detailRow, { borderBottomColor: theme.colors.border }]}>
              <Ionicons name="calculator" size={20} color="#9b59b6" />
              <View style={styles.detailInfo}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>File Size</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatFileSize(docData?.file_size)}</Text>
              </View>
            </View>

            <View style={[styles.detailRow, { borderBottomColor: theme.colors.border }]}>
              <Ionicons name="calendar" size={20} color={theme.colors.warning} />
              <View style={styles.detailInfo}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Uploaded</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatDate(docData?.created_at)}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="file-tray" size={20} color={theme.colors.error} />
              <View style={styles.detailInfo}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Format</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{docData?.mime_type || 'Unknown'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Actions</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.downloadButton]} 
              onPress={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="download" size={24} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    {Platform.OS === 'ios' ? 'Save & Share' : 'Download'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.shareButton]}
              onPress={async () => {
                if (Platform.OS === 'web') {
                  const link = document.createElement('a');
                  link.href = downloadUrl;
                  link.download = docData?.name || 'document';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  return;
                }
                if (downloadUrl) {
                  try {
                    setDownloading(true);
                    const extension = getExtensionFromMimeType(docData?.mime_type);
                    const originalName = docData?.name || `document_${documentId}`;
                    const fileName = originalName.includes('.') ? originalName : `${originalName}.${extension}`;
                    const fileUri = FileSystem.documentDirectory + fileName;
                    const result = await FileSystem.downloadAsync(downloadUrl, fileUri);
                    
                    if (result.status === 200) {
                      const shareUri = Platform.OS === 'android' ? `file://${result.uri}` : result.uri;
                      if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(shareUri, {
                          mimeType: docData?.mime_type || 'application/pdf',
                          dialogTitle: `Share ${docData?.name || 'Document'}`,
                        });
                      } else {
                        Alert.alert('Downloaded', 'File saved. Please share manually.');
                      }
                    } else {
                      throw new Error('Download failed');
                    }
                  } catch (error) {
                    console.log('Share error:', error);
                    Alert.alert('Error', 'Unable to share document. Please try downloading first.');
                  } finally {
                    setDownloading(false);
                  }
                } else {
                  Alert.alert('Error', 'Document not available for sharing');
                }
              }}
            >
              <Ionicons name="share-social" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.infoCard, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              Tap "View File" to open this document in its default app (PDF, Word, Excel, etc.). 
              Or download and share it using the buttons below.
            </Text>
          </View>
        </View>
      </ScrollView>
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
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 50,
  },
  headerBack: {
    padding: 5,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#bdc3c7',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  previewSection: {
    margin: 15,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: height * 0.4,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  noPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPreviewText: {
    marginTop: 10,
    fontSize: 14,
  },
  genericContainer: {
    alignItems: 'center',
    padding: 40,
  },
  fileIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  genericTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  genericSubtitle: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  viewFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 15,
    marginTop: 0,
    borderRadius: 10,
  },
  viewFileText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  detailsSection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  detailCard: {
    borderRadius: 12,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  detailInfo: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 16,
    marginTop: 2,
  },
  actionsSection: {
    padding: 15,
    paddingBottom: 30,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
  },
  downloadButton: {
    backgroundColor: '#3498db',
  },
  shareButton: {
    backgroundColor: '#27ae60',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 15,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 10,
    lineHeight: 20,
  },
});
