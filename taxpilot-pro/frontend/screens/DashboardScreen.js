import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { taxService, folderService, documentService } from '../services/api';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const colors = theme.colors;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIncome: 0,
    estimatedTax: 0,
    deductions: 0,
    folders: 0,
    documents: 0,
  });
  const [recentRecords, setRecentRecords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [taxRes, foldersRes, docsRes] = await Promise.all([
        taxService.getTaxRecords().catch(() => ({ data: { records: [] } })),
        folderService.getFolders().catch(() => ({ data: { folders: [] } })),
        documentService.getDocuments().catch(() => ({ data: { documents: [] } })),
      ]);

      const records = taxRes.data.records || [];
      
      const latestRecord = records.length > 0 ? records[records.length - 1] : null;
      
      const totalIncome = latestRecord?.total_income || 0;
      const estimatedTax = latestRecord?.estimated_tax || 0;
      const deductions = latestRecord?.total_deductions || 0;

      setStats({
        totalIncome,
        estimatedTax,
        deductions,
        folders: foldersRes.data.folders?.length || 0,
        documents: docsRes.data.documents?.length || 0,
      });

      setRecentRecords(records.slice(0, 3));
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    try {
      const num = Number(amount);
      if (isNaN(num) || !isFinite(num)) return '₹0';
      return '₹' + Math.round(num).toLocaleString('en-IN');
    } catch (e) {
      return '₹0';
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={[styles.header, { backgroundColor: theme.dark ? '#1a1a2e' : '#2c3e50' }]}>
        <View>
          <Text style={styles.greeting}>MY CA APP</Text>
          <Text style={styles.subGreeting}>by Ankit Goyal</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <TouchableOpacity style={[styles.statCard, { backgroundColor: theme.colors.card }]} onPress={() => navigation.navigate('Calculator')}>
          <View style={[styles.statIcon, { backgroundColor: theme.colors.income }]}>
            <Ionicons name="cash" size={24} color="#fff" />
          </View>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Income</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{formatCurrency(stats.totalIncome)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.statCard, { backgroundColor: theme.colors.card }]} onPress={() => navigation.navigate('Calculator')}>
          <View style={[styles.statIcon, { backgroundColor: theme.colors.tax }]}>
            <Ionicons name="calculator" size={24} color="#fff" />
          </View>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Est. Tax</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{formatCurrency(stats.estimatedTax)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.statCard, { backgroundColor: theme.colors.card }]} onPress={() => navigation.navigate('Calculator')}>
          <View style={[styles.statIcon, { backgroundColor: theme.colors.savings }]}>
            <Ionicons name="save" size={24} color="#fff" />
          </View>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Deductions</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{formatCurrency(stats.deductions)}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={[styles.actionItem, { backgroundColor: theme.colors.card }]} onPress={() => navigation.navigate('Calculator')}>
            <View style={styles.actionIcon}>
              <Ionicons name="calculator-outline" size={28} color={theme.colors.primary} />
            </View>
            <Text style={[styles.actionText, { color: theme.colors.text }]}>Calculate Tax</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionItem, { backgroundColor: theme.colors.card }]} onPress={() => navigation.navigate('Documents')}>
            <View style={styles.actionIcon}>
              <Ionicons name="document-attach-outline" size={28} color={theme.colors.primary} />
            </View>
            <Text style={[styles.actionText, { color: theme.colors.text }]}>Upload Doc</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionItem, { backgroundColor: theme.colors.card }]} onPress={() => navigation.navigate('AI Helper')}>
            <View style={styles.actionIcon}>
              <Ionicons name="chatbubbles-outline" size={28} color="#00b894" />
            </View>
            <Text style={[styles.actionText, { color: theme.colors.text }]}>Get Help</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionItem, { backgroundColor: theme.colors.card }]} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.actionIcon}>
              <Ionicons name="person-outline" size={28} color={theme.colors.primary} />
            </View>
            <Text style={[styles.actionText, { color: theme.colors.text }]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summarySection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Documents Summary</Text>
        <View style={styles.summaryRow}>
          <TouchableOpacity style={[styles.summaryCard, { backgroundColor: theme.colors.card }]} onPress={() => navigation.navigate('Documents', { initialTab: 'folders' })}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name="folder" size={28} color={theme.colors.primary} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Folders</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{stats.folders}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.summaryCard, { backgroundColor: theme.colors.card }]} onPress={() => navigation.navigate('Documents', { initialTab: 'documents' })}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.colors.success + '20' }]}>
              <Ionicons name="document-text" size={28} color={theme.colors.success} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Documents</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{stats.documents}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {recentRecords.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Calculations</Text>
          {recentRecords.map((record) => (
            <TouchableOpacity key={record.id} style={[styles.recordCard, { backgroundColor: theme.colors.card }]} onPress={() => navigation.navigate('Calculator')}>
              <View>
                <Text style={[styles.recordYear, { color: theme.colors.text }]}>{record.financial_year}</Text>
                <Text style={[styles.recordIncome, { color: theme.colors.textSecondary }]}>{formatCurrency(record.total_income)}</Text>
              </View>
              <View style={styles.recordTax}>
                <Text style={[styles.recordTaxLabel, { color: theme.colors.textSecondary }]}>Tax</Text>
                <Text style={[styles.recordTaxValue, { color: theme.colors.tax }]}>{formatCurrency(record.estimated_tax)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 50,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subGreeting: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    marginTop: -30,
  },
  statCard: {
    flex: 1,
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 11,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  quickActions: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: '48%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIcon: {
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  summarySection: {
    padding: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  recentSection: {
    padding: 15,
    paddingBottom: 30,
  },
  recordCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  recordYear: {
    fontSize: 16,
    fontWeight: '600',
  },
  recordIncome: {
    fontSize: 14,
    marginTop: 3,
  },
  recordTax: {
    alignItems: 'flex-end',
  },
  recordTaxLabel: {
    fontSize: 12,
  },
  recordTaxValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
