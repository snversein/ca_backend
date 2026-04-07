import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { folderService, documentService, taxService } from '../services/api';
import { notificationService } from '../services/notifications';

export default function ProfileScreen({ navigation }) {
  const { user, updateProfile, logout } = useAuth();
  const { theme, themeMode, setThemePreference } = useTheme();
  const colors = theme.colors;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [pan, setPan] = useState(user?.pan || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ folders: 0, documents: 0, calculations: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [reminders, setReminders] = useState({
    itrReminder: true,
    advanceTaxReminder: true,
    documentUploadReminder: false,
  });

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setSaving(true);
    const result = await updateProfile({ name, pan: pan.toUpperCase(), phone });
    setSaving(false);

    if (result.success) {
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleLogout = () => {
    console.log('Logout button pressed');
    logout();
    console.log('Logout called - navigation will update automatically');
  };

  useEffect(() => {
    loadStats();
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    if (Platform.OS === 'web') {
      setNotificationPermission(false);
      return;
    }
    
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationPermission(status === 'granted');
      
      const savedReminders = await AsyncStorage.getItem('notificationReminders');
      if (savedReminders) {
        setReminders(JSON.parse(savedReminders));
      }
    } catch (error) {
      console.log('Error loading notification settings:', error);
    }
  };

  const handleNotificationToggle = async (key) => {
    if (Platform.OS === 'web') {
      Alert.alert('Info', 'Notifications are not supported on web');
      return;
    }
    
    if (!notificationPermission) {
      const result = await notificationService.requestPermissions();
      if (!result.success) {
        Alert.alert('Permission Required', 'Please enable notifications in your phone settings to receive tax reminders.');
        return;
      }
      setNotificationPermission(true);
    }
    
    const newReminders = { ...reminders, [key]: !reminders[key] };
    setReminders(newReminders);
    await AsyncStorage.setItem('notificationReminders', JSON.stringify(newReminders));
    
    if (newReminders[key]) {
      if (key === 'itrReminder') {
        await notificationService.scheduleITRReminder();
        Alert.alert('Reminder Set', 'You will receive ITR filing reminder before 31st July.');
      } else if (key === 'advanceTaxReminder') {
        await notificationService.scheduleAdvanceTaxReminder();
        Alert.alert('Reminder Set', 'You will receive advance tax payment reminders.');
      } else if (key === 'documentUploadReminder') {
        await notificationService.scheduleDocumentUploadReminder();
        Alert.alert('Reminder Set', 'You will receive document upload reminder tomorrow.');
      }
    } else {
      await notificationService.cancelAllNotifications();
      Alert.alert('Reminders Updated', 'Notification reminders have been updated.');
    }
  };

  const loadStats = async () => {
    try {
      const [foldersRes, docsRes, taxRes] = await Promise.all([
        folderService.getFolders().catch(() => ({ data: { folders: [] } })),
        documentService.getDocuments().catch(() => ({ data: { documents: [] } })),
        taxService.getTaxRecords().catch(() => ({ data: { records: [] } })),
      ]);
      setStats({
        folders: foldersRes.data.folders?.length || 0,
        documents: docsRes.data.documents?.length || 0,
        calculations: taxRes.data.records?.length || 0,
      });
    } catch (error) {
      console.log('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.dark ? '#1a1a2e' : '#2c3e50' }]}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="person" size={50} color="#fff" />
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={[styles.email, { color: theme.colors.textSecondary }]}>{user?.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.roleText}>{user?.role === 'admin' ? 'Admin' : 'Taxpayer'}</Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Personal Information</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Ionicons name={editing ? 'close' : 'create'} size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
          <View style={[styles.infoIcon, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Full Name</Text>
            {editing ? (
              <TextInput
                style={[styles.infoInput, { color: theme.colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.textSecondary}
              />
            ) : (
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user?.name || 'Not set'}</Text>
            )}
          </View>
        </View>

        <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
          <View style={[styles.infoIcon, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="card-outline" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>PAN Number</Text>
            {editing ? (
              <TextInput
                style={[styles.infoInput, { color: theme.colors.text }]}
                value={pan}
                onChangeText={setPan}
                placeholder="Enter PAN"
                autoCapitalize="characters"
                maxLength={10}
                placeholderTextColor={theme.colors.textSecondary}
              />
            ) : (
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user?.pan || 'Not set'}</Text>
            )}
          </View>
        </View>

        <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
          <View style={[styles.infoIcon, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Email</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Phone</Text>
            {editing ? (
              <TextInput
                style={[styles.infoInput, { color: theme.colors.text }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                placeholderTextColor={theme.colors.textSecondary}
              />
            ) : (
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user?.phone || 'Not set'}</Text>
            )}
          </View>
        </View>

        {editing && (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Ionicons name="save" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Settings</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => setShowThemeModal(true)}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: theme.colors.text + '20' }]}>
              <Ionicons name="moon" size={22} color={theme.colors.text} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Appearance</Text>
              <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
                {themeMode === 'system' ? 'System Default' : themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
          </View>
          <View style={styles.settingRight}>
            <View style={[styles.themeBadge, { backgroundColor: themeMode === 'dark' ? '#2c3e50' : themeMode === 'light' ? '#f39c12' : '#3498db' }]}>
              <Text style={styles.themeBadgeText}>
                {themeMode === 'system' ? '📱' : themeMode === 'dark' ? '🌙' : '☀️'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => setShowNotificationModal(true)}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: theme.colors.error + '20' }]}>
              <Ionicons name="notifications" size={22} color={theme.colors.error} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Notifications</Text>
              <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>Tax reminders</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name="share-social" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Share App</Text>
              <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>Invite friends</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: theme.colors.warning + '20' }]}>
              <Ionicons name="information-circle" size={22} color={theme.colors.warning} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>About</Text>
              <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>Version 1.0.0</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Modal visible={showThemeModal} transparent animationType="fade" onRequestClose={() => setShowThemeModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowThemeModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Choose Appearance</Text>
            
            <TouchableOpacity 
              style={[styles.themeOption, themeMode === 'system' && styles.themeOptionActive]}
              onPress={() => { setThemePreference('system'); setShowThemeModal(false); }}
            >
              <View style={styles.themeOptionLeft}>
                <Ionicons name="phone-portrait" size={24} color={theme.colors.primary} />
                <View style={styles.themeOptionInfo}>
                  <Text style={[styles.themeOptionTitle, { color: theme.colors.text }]}>System Default</Text>
                  <Text style={[styles.themeOptionDesc, { color: theme.colors.textSecondary }]}>Follow phone settings</Text>
                </View>
              </View>
              {themeMode === 'system' && <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.themeOption, themeMode === 'light' && styles.themeOptionActive]}
              onPress={() => { setThemePreference('light'); setShowThemeModal(false); }}
            >
              <View style={styles.themeOptionLeft}>
                <Ionicons name="sunny" size={24} color={theme.colors.warning} />
                <View style={styles.themeOptionInfo}>
                  <Text style={[styles.themeOptionTitle, { color: theme.colors.text }]}>Light Mode</Text>
                  <Text style={[styles.themeOptionDesc, { color: theme.colors.textSecondary }]}>Always light theme</Text>
                </View>
              </View>
              {themeMode === 'light' && <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.themeOption, themeMode === 'dark' && styles.themeOptionActive]}
              onPress={() => { setThemePreference('dark'); setShowThemeModal(false); }}
            >
              <View style={styles.themeOptionLeft}>
                <Ionicons name="moon" size={24} color={theme.colors.text} />
                <View style={styles.themeOptionInfo}>
                  <Text style={[styles.themeOptionTitle, { color: theme.colors.text }]}>Dark Mode</Text>
                  <Text style={[styles.themeOptionDesc, { color: theme.colors.textSecondary }]}>Always dark theme</Text>
                </View>
              </View>
              {themeMode === 'dark' && <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowThemeModal(false)}>
              <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showNotificationModal} transparent animationType="fade" onRequestClose={() => setShowNotificationModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNotificationModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Tax Reminders</Text>
            
            {Platform.OS === 'web' ? (
              <Text style={[styles.notificationInfo, { color: theme.colors.textSecondary }]}>
                Notifications are not supported on web. Please use the mobile app to receive tax reminders.
              </Text>
            ) : (
              <>
                <Text style={[styles.notificationInfo, { color: theme.colors.textSecondary }]}>
                  Receive timely reminders for important tax deadlines.
                </Text>

                <TouchableOpacity style={styles.notificationOption} onPress={() => handleNotificationToggle('itrReminder')}>
                  <View style={styles.notificationLeft}>
                    <Ionicons name="calendar" size={22} color={theme.colors.primary} />
                    <View style={styles.notificationText}>
                      <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>ITR Filing Reminder</Text>
                      <Text style={[styles.notificationDesc, { color: theme.colors.textSecondary }]}>Reminder before 31st July</Text>
                    </View>
                  </View>
                  <Switch
                    value={reminders.itrReminder}
                    onValueChange={() => handleNotificationToggle('itrReminder')}
                    trackColor={{ false: '#767577', true: theme.colors.primary }}
                    thumbColor="#fff"
                  />
                </TouchableOpacity>

                <TouchableOpacity style={styles.notificationOption} onPress={() => handleNotificationToggle('advanceTaxReminder')}>
                  <View style={styles.notificationLeft}>
                    <Ionicons name="card" size={22} color={theme.colors.warning} />
                    <View style={styles.notificationText}>
                      <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>Advance Tax Reminder</Text>
                      <Text style={[styles.notificationDesc, { color: theme.colors.textSecondary }]}>Quarterly tax payment reminders</Text>
                    </View>
                  </View>
                  <Switch
                    value={reminders.advanceTaxReminder}
                    onValueChange={() => handleNotificationToggle('advanceTaxReminder')}
                    trackColor={{ false: '#767577', true: theme.colors.primary }}
                    thumbColor="#fff"
                  />
                </TouchableOpacity>

                <TouchableOpacity style={styles.notificationOption} onPress={() => handleNotificationToggle('documentUploadReminder')}>
                  <View style={styles.notificationLeft}>
                    <Ionicons name="document-attach" size={22} color={theme.colors.success} />
                    <View style={styles.notificationText}>
                      <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>Document Upload Reminder</Text>
                      <Text style={[styles.notificationDesc, { color: theme.colors.textSecondary }]}>Daily reminder to upload documents</Text>
                    </View>
                  </View>
                  <Switch
                    value={reminders.documentUploadReminder}
                    onValueChange={() => handleNotificationToggle('documentUploadReminder')}
                    trackColor={{ false: '#767577', true: theme.colors.primary }}
                    thumbColor="#fff"
                  />
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowNotificationModal(false)}>
              <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Links</Text>
        
        <TouchableOpacity style={[styles.quickLinkCard, { backgroundColor: theme.colors.background }]} onPress={() => navigation.navigate('Documents', { initialTab: 'folders' })}>
          <View style={styles.quickLinkLeft}>
            <View style={[styles.quickLinkIcon, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name="folder" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.quickLinkInfo}>
              <Text style={[styles.quickLinkTitle, { color: theme.colors.text }]}>My Documents</Text>
              <Text style={[styles.quickLinkDesc, { color: theme.colors.textSecondary }]}>View all your documents & folders</Text>
            </View>
          </View>
          <View style={styles.quickLinkRight}>
            <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.badgeText}>{stats.documents}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.quickLinkCard, { backgroundColor: theme.colors.background }]} onPress={() => navigation.navigate('Documents', { initialTab: 'folders' })}>
          <View style={styles.quickLinkLeft}>
            <View style={[styles.quickLinkIcon, { backgroundColor: theme.colors.warning + '20' }]}>
              <Ionicons name="folder-open" size={24} color={theme.colors.warning} />
            </View>
            <View style={styles.quickLinkInfo}>
              <Text style={[styles.quickLinkTitle, { color: theme.colors.text }]}>Tax History</Text>
              <Text style={[styles.quickLinkDesc, { color: theme.colors.textSecondary }]}>Browse your folders from CA</Text>
            </View>
          </View>
          <View style={styles.quickLinkRight}>
            <View style={[styles.badge, { backgroundColor: theme.colors.warning }]}>
              <Text style={styles.badgeText}>{stats.folders}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.quickLinkCard, { backgroundColor: theme.colors.background }]} onPress={() => navigation.navigate('Calculator')}>
          <View style={styles.quickLinkLeft}>
            <View style={[styles.quickLinkIcon, { backgroundColor: theme.colors.success + '20' }]}>
              <Ionicons name="calculator" size={24} color={theme.colors.success} />
            </View>
            <View style={styles.quickLinkInfo}>
              <Text style={[styles.quickLinkTitle, { color: theme.colors.text }]}>Tax Calculator</Text>
              <Text style={[styles.quickLinkDesc, { color: theme.colors.textSecondary }]}>Calculate your tax liability</Text>
            </View>
          </View>
          <View style={styles.quickLinkRight}>
            <View style={[styles.badge, { backgroundColor: theme.colors.success }]}>
              <Text style={styles.badgeText}>{stats.calculations}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.quickLinkCard, { backgroundColor: theme.colors.background }]} onPress={() => navigation.navigate('AI Helper')}>
          <View style={styles.quickLinkLeft}>
            <View style={[styles.quickLinkIcon, { backgroundColor: '#00b89420' }]}>
              <Ionicons name="chatbubbles" size={24} color="#00b894" />
            </View>
            <View style={styles.quickLinkInfo}>
              <Text style={[styles.quickLinkTitle, { color: theme.colors.text }]}>AI Tax Help</Text>
              <Text style={[styles.quickLinkDesc, { color: theme.colors.textSecondary }]}>Get answers to tax questions</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.quickLinkCard, { backgroundColor: theme.colors.background }]} onPress={() => navigation.navigate('Contact')}>
          <View style={styles.quickLinkLeft}>
            <View style={[styles.quickLinkIcon, { backgroundColor: theme.colors.error + '20' }]}>
              <Ionicons name="call" size={24} color={theme.colors.error} />
            </View>
            <View style={styles.quickLinkInfo}>
              <Text style={[styles.quickLinkTitle, { color: theme.colors.text }]}>Contact CA</Text>
              <Text style={[styles.quickLinkDesc, { color: theme.colors.textSecondary }]}>Get in touch with your CA</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.logoutBtn, { borderColor: theme.colors.error }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
        <Text style={[styles.logoutBtnText, { color: theme.colors.error }]}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>My CA App v1.0.0</Text>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>Built for Smart Tax Management</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingTop: 50,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  email: {
    fontSize: 14,
    marginTop: 5,
  },
  roleBadge: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 10,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 15,
    marginTop: 20,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 16,
    marginTop: 2,
  },
  infoInput: {
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3498db',
    paddingVertical: 5,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: '#27ae60',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
  },
  callIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  callText: {
    fontSize: 16,
    fontWeight: '600',
  },
  callNumber: {
    fontSize: 14,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
  },
  quickLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  quickLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickLinkIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLinkInfo: {
    flex: 1,
    marginLeft: 12,
  },
  quickLinkTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickLinkDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  quickLinkRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 20,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
  },
  logoutBtnText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 12,
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  themeBadgeText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalContent: {
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionActive: {
    borderColor: '#3498db',
    backgroundColor: '#e8f4fd',
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeOptionInfo: {
    marginLeft: 15,
  },
  themeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeOptionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCancelBtn: {
    marginTop: 15,
    padding: 15,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  notificationInfo: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  notificationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationText: {
    marginLeft: 15,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  notificationDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 12,
  },
});
