import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { taxService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function TaxHistoryScreen({ navigation }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadTaxRecords();
  }, []);

  const loadTaxRecords = async () => {
    try {
      const response = await taxService.getTaxRecords();
      const data = response.data.records || [];
      setRecords(data);
      
      if (data.length > 0) {
        calculateSummary(data);
      }
    } catch (error) {
      console.log('Error loading tax records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data) => {
    const totalIncome = data.reduce((sum, r) => sum + (r.total_income || 0), 0);
    const totalTax = data.reduce((sum, r) => sum + (r.estimated_tax || 0), 0);
    const totalDeductions = data.reduce((sum, r) => sum + (r.total_deductions || 0), 0);
    const avgTaxRate = totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0;

    setSummary({
      totalIncome,
      totalTax,
      totalDeductions,
      avgTaxRate: avgTaxRate.toFixed(2),
      yearsCount: data.length,
      maxIncome: Math.max(...data.map(r => r.total_income || 0)),
      minIncome: Math.min(...data.map(r => r.total_income || 0)),
    });
  };

  const formatCurrency = (amount) => {
    return '₹' + Math.round(amount).toLocaleString('en-IN');
  };

  const getFinancialYear = (record) => {
    return record.financial_year || 'FY 2023-24';
  };

  const getTaxStatus = (tax) => {
    if (tax <= 0) return { label: 'No Tax', color: '#27ae60' };
    if (tax <= 50000) return { label: 'Low Tax', color: '#3498db' };
    if (tax <= 200000) return { label: 'Moderate', color: '#f39c12' };
    return { label: 'High Tax', color: '#e74c3c' };
  };

  const getComparisonWithPrevious = (current, index) => {
    if (index === 0) return null;
    const previous = records[index - 1];
    const diff = current.total_income - (previous.total_income || 0);
    const percent = previous.total_income > 0 ? ((diff / previous.total_income) * 100).toFixed(1) : 0;
    return { diff, percent, isIncrease: diff > 0 };
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading tax history...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.dark ? '#1a1a2e' : '#2c3e50' }]}>
        <Text style={styles.headerTitle}>Tax History</Text>
        <Text style={styles.headerSubtitle}>Your multi-year tax records</Text>
      </View>

      {summary && (
        <View style={styles.summarySection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Overall Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.summaryIcon, { backgroundColor: theme.colors.income + '20' }]}>
                <Ionicons name="wallet" size={24} color={theme.colors.income} />
              </View>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Total Income</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{formatCurrency(summary.totalIncome)}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.summaryIcon, { backgroundColor: theme.colors.tax + '20' }]}>
                <Ionicons name="card" size={24} color={theme.colors.tax} />
              </View>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Total Tax Paid</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{formatCurrency(summary.totalTax)}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.summaryIcon, { backgroundColor: theme.colors.success + '20' }]}>
                <Ionicons name="save" size={24} color={theme.colors.success} />
              </View>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Deductions</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{formatCurrency(summary.totalDeductions)}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.summaryIcon, { backgroundColor: '#9b59b620' }]}>
                <Ionicons name="trending-up" size={24} color="#9b59b6" />
              </View>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Avg Tax Rate</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{summary.avgTaxRate}%</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.recordsSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Year-wise Breakdown</Text>
        
        {records.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="document-text-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>No tax records yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Start calculating your taxes to see history here</Text>
            <TouchableOpacity style={styles.calculateButton} onPress={() => navigation.navigate('Calculator')}>
              <Text style={styles.calculateButtonText}>Calculate Tax</Text>
            </TouchableOpacity>
          </View>
        ) : (
          records.map((record, index) => {
            const comparison = getComparisonWithPrevious(record, index);
            const status = getTaxStatus(record.estimated_tax || 0);
            const isExpanded = selectedYear === record.id;

            return (
              <TouchableOpacity
                key={record.id}
                style={[styles.recordCard, { backgroundColor: theme.colors.card }]}
                onPress={() => setSelectedYear(isExpanded ? null : record.id)}
              >
                <View style={styles.recordHeader}>
                  <View style={styles.recordYearBadge}>
                    <Ionicons name="calendar" size={16} color={theme.colors.primary} />
                    <Text style={[styles.recordYear, { color: theme.colors.text }]}>{getFinancialYear(record)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>

                <View style={styles.recordMain}>
                  <View style={styles.recordItem}>
                    <Text style={[styles.recordLabel, { color: theme.colors.textSecondary }]}>Total Income</Text>
                    <Text style={[styles.recordValue, { color: theme.colors.text }]}>{formatCurrency(record.total_income || 0)}</Text>
                  </View>
                  <View style={styles.recordItem}>
                    <Text style={[styles.recordLabel, { color: theme.colors.textSecondary }]}>Estimated Tax</Text>
                    <Text style={[styles.recordValue, { color: theme.colors.tax }]}>
                      {formatCurrency(record.estimated_tax || 0)}
                    </Text>
                  </View>
                </View>

                {comparison && (
                  <View style={[styles.comparisonBar, { backgroundColor: theme.colors.background }]}>
                    <Ionicons
                      name={comparison.isIncrease ? 'trending-up' : 'trending-down'}
                      size={16}
                      color={comparison.isIncrease ? theme.colors.tax : theme.colors.success}
                    />
                    <Text style={[styles.comparisonText, { color: comparison.isIncrease ? theme.colors.tax : theme.colors.success }]}>
                      {comparison.isIncrease ? '+' : ''}{formatCurrency(comparison.diff)} ({comparison.percent}%)
                    </Text>
                    <Text style={[styles.comparisonLabel, { color: theme.colors.textSecondary }]}>vs previous year</Text>
                  </View>
                )}

                {isExpanded && (
                  <View style={[styles.expandedContent, { borderTopColor: theme.colors.border }]}>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Gross Income</Text>
                      <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatCurrency(record.gross_income || 0)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Deductions (80C-80U)</Text>
                      <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatCurrency(record.total_deductions || 0)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Taxable Income</Text>
                      <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatCurrency(record.taxable_income || 0)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Rebate 87A</Text>
                      <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatCurrency(record.rebate_87a || 0)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Cess 4%</Text>
                      <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatCurrency(record.cess || 0)}</Text>
                    </View>

                    <TouchableOpacity style={[styles.viewDetailsButton, { backgroundColor: theme.colors.primary + '20' }]} onPress={() => navigation.navigate('Calculator')}>
                      <Ionicons name="eye" size={16} color={theme.colors.primary} />
                      <Text style={[styles.viewDetailsText, { color: theme.colors.primary }]}>View Full Details</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={[styles.expandHint, { borderTopColor: theme.colors.border }]}>
                  <Text style={[styles.expandHintText, { color: theme.colors.textSecondary }]}>{isExpanded ? 'Tap to collapse' : 'Tap for details'}</Text>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.textSecondary} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {records.length > 0 && (
        <View style={styles.tipsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tax Planning Tips</Text>
          <View style={[styles.tipCard, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="trending-up" size={24} color={theme.colors.primary} />
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: theme.colors.text }]}>Year-over-Year Growth</Text>
              <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                Your income has grown {summary?.yearsCount || 0} times over {records.length} financial years.
                Consider increasing your tax-saving investments accordingly.
              </Text>
            </View>
          </View>
          <View style={[styles.tipCard, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="save" size={24} color={theme.colors.success} />
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: theme.colors.text }]}>Maximize Deductions</Text>
              <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                You claimed {formatCurrency(summary?.totalDeductions || 0)} in deductions.
                The maximum limit under Section 80C is ₹1,50,000.
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  header: {
    backgroundColor: '#2c3e50',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 5,
  },
  summarySection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryIcon: {
    width: 45,
    height: 45,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 4,
  },
  recordsSection: {
    padding: 15,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
    textAlign: 'center',
  },
  calculateButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordYearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordYear: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recordMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recordItem: {},
  recordLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  recordValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 2,
  },
  comparisonBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  comparisonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 6,
  },
  expandedContent: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f4fd',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
    marginLeft: 6,
  },
  expandHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  expandHintText: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  tipsSection: {
    padding: 15,
    paddingBottom: 30,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  tipText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
    lineHeight: 20,
  },
});
