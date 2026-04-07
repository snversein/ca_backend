import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function HRACalculatorScreen({ navigation }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [basicSalary, setBasicSalary] = useState('');
  const [dearnessAllowance, setDearnessAllowance] = useState('');
  const [hraReceived, setHraReceived] = useState('');
  const [rentPaid, setRentPaid] = useState('');
  const [metroCity, setMetroCity] = useState(true);

  const calculateHRA = () => {
    const basic = parseFloat(basicSalary) || 0;
    const da = parseFloat(dearnessAllowance) || 0;
    const hra = parseFloat(hraReceived) || 0;
    const rent = parseFloat(rentPaid) || 0;

    const salary = basic + da;
    const annualSalary = salary * 12;

    const hraExemption1 = hra;
    const hraExemption2 = rent - (annualSalary * 0.1);
    const hraExemption3 = metroCity ? (annualSalary * 0.5) : (annualSalary * 0.4);
    
    const hraExemption = Math.min(hraExemption1, hraExemption2 > 0 ? hraExemption2 : 0, hraExemption3);
    const taxableHRA = Math.max(0, hra - hraExemption);
    const annualRent = rent * 12;
    const annualHraReceived = hra * 12;

    return {
      annualSalary,
      annualHraReceived,
      annualRent,
      hraExemption: Math.round(hraExemption),
      taxableHRA: Math.round(taxableHRA),
      savings: Math.round(taxableHRA * 0.3),
    };
  };

  const formatCurrency = (amount) => {
    return '₹' + Math.round(amount).toLocaleString('en-IN');
  };

  const result = calculateHRA();
  const hasData = basicSalary && hraReceived && rentPaid;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.dark ? '#1a1a2e' : '#2c3e50' }]}>
        <Text style={styles.headerTitle}>HRA Calculator</Text>
        <Text style={styles.headerSubtitle}>Calculate your House Rent Allowance exemption</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.infoCard, { backgroundColor: theme.colors.primary + '20' }]}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
          <Text style={[styles.infoText, { color: theme.colors.text }]}>
            HRA exemption is calculated as the minimum of: HRA received, Rent paid - 10% of salary, 
            or 50% (metro) / 40% (non-metro) of salary.
          </Text>
        </View>

        <View style={[styles.formSection, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Enter Details</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Basic Salary (Monthly)</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.inputPrefix, { color: theme.colors.textSecondary }]}>₹</Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                value={basicSalary}
                onChangeText={setBasicSalary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Dearness Allowance (Monthly)</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.inputPrefix, { color: theme.colors.textSecondary }]}>₹</Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                value={dearnessAllowance}
                onChangeText={setDearnessAllowance}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>HRA Received (Monthly)</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.inputPrefix, { color: theme.colors.textSecondary }]}>₹</Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                value={hraReceived}
                onChangeText={setHraReceived}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Rent Paid (Monthly)</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.inputPrefix, { color: theme.colors.textSecondary }]}>₹</Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                value={rentPaid}
                onChangeText={setRentPaid}
              />
            </View>
          </View>

          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Do you live in a Metro City?</Text>
            <View style={styles.switchRow}>
              <TouchableOpacity
                style={[styles.switchButton, { backgroundColor: theme.colors.background }, metroCity && { backgroundColor: theme.colors.primary }]}
                onPress={() => setMetroCity(true)}
              >
                <Text style={[styles.switchText, { color: theme.colors.textSecondary }, metroCity && styles.switchTextActive]}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.switchButton, { backgroundColor: theme.colors.background }, !metroCity && { backgroundColor: theme.colors.primary }]}
                onPress={() => setMetroCity(false)}
              >
                <Text style={[styles.switchText, { color: theme.colors.textSecondary }, !metroCity && styles.switchTextActive]}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {hasData && (
          <View style={styles.resultSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your HRA Exemption</Text>

            <View style={[styles.resultCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.resultMain}>
                <Ionicons name="checkmark-circle" size={40} color={theme.colors.success} />
                <View style={styles.resultMainText}>
                  <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>Exempt from Tax</Text>
                  <Text style={[styles.resultValue, { color: theme.colors.success }]}>{formatCurrency(result.hraExemption)}</Text>
                </View>
              </View>

              <View style={[styles.resultDivider, { backgroundColor: theme.colors.border }]} />

              <View style={styles.resultRow}>
                <View style={styles.resultItem}>
                  <Text style={[styles.resultItemLabel, { color: theme.colors.textSecondary }]}>HRA Received</Text>
                  <Text style={[styles.resultItemValue, { color: theme.colors.text }]}>{formatCurrency(result.annualHraReceived)}</Text>
                </View>
                <View style={styles.resultItem}>
                  <Text style={[styles.resultItemLabel, { color: theme.colors.textSecondary }]}>Taxable HRA</Text>
                  <Text style={[styles.resultItemValue, { color: theme.colors.tax }]}>
                    {formatCurrency(result.taxableHRA)}
                  </Text>
                </View>
              </View>

              <View style={styles.resultRow}>
                <View style={styles.resultItem}>
                  <Text style={[styles.resultItemLabel, { color: theme.colors.textSecondary }]}>Annual Salary</Text>
                  <Text style={[styles.resultItemValue, { color: theme.colors.text }]}>{formatCurrency(result.annualSalary)}</Text>
                </View>
                <View style={styles.resultItem}>
                  <Text style={[styles.resultItemLabel, { color: theme.colors.textSecondary }]}>Annual Rent</Text>
                  <Text style={[styles.resultItemValue, { color: theme.colors.text }]}>{formatCurrency(result.annualRent)}</Text>
                </View>
              </View>

              <View style={[styles.savingsCard, { backgroundColor: theme.colors.success + '20' }]}>
                <Ionicons name="wallet" size={24} color={theme.colors.success} />
                <View style={styles.savingsContent}>
                  <Text style={[styles.savingsLabel, { color: theme.colors.textSecondary }]}>Potential Tax Savings</Text>
                  <Text style={[styles.savingsValue, { color: theme.colors.success }]}>{formatCurrency(result.savings)}</Text>
                  <Text style={[styles.savingsNote, { color: theme.colors.textSecondary }]}>at 30% tax bracket</Text>
                </View>
              </View>
            </View>

            <View style={[styles.tipCard, { backgroundColor: theme.colors.warning + '20' }]}>
              <Ionicons name="bulb" size={20} color={theme.colors.warning} />
              <Text style={[styles.tipText, { color: theme.colors.text }]}>
                Keep rent receipts and landlord PAN (if rent > ₹1 lakh/year) for ITR filing.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.breakdownSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>How HRA is Calculated</Text>
          
          <View style={[styles.breakdownCard, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.breakdownItem, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>1. HRA Received</Text>
              <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
                {formatCurrency(result.annualHraReceived)} /year
              </Text>
            </View>
            <View style={[styles.breakdownItem, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>2. Rent - 10% of Salary</Text>
              <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
                {formatCurrency(Math.max(0, result.annualRent - result.annualSalary * 0.1))} /year
              </Text>
            </View>
            <View style={[styles.breakdownItem, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>3. {metroCity ? '50%' : '40%'} of Salary</Text>
              <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
                {formatCurrency(metroCity ? result.annualSalary * 0.5 : result.annualSalary * 0.4)} /year
              </Text>
            </View>
            <View style={styles.breakdownResult}>
              <Text style={[styles.breakdownResultLabel, { color: theme.colors.text }]}>Final Exemption (Minimum)</Text>
              <Text style={[styles.breakdownResultValue, { color: theme.colors.success }]}>{formatCurrency(result.hraExemption)}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
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
  content: {
    padding: 15,
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  formSection: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  inputPrefix: {
    fontSize: 16,
    marginRight: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  switchContainer: {
    marginTop: 5,
  },
  switchRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 5,
  },
  switchActive: {
    backgroundColor: '#3498db',
  },
  switchText: {
    fontSize: 14,
    fontWeight: '500',
  },
  switchTextActive: {
    color: '#fff',
  },
  resultSection: {
    marginBottom: 20,
  },
  resultCard: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  resultMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultMainText: {
    marginLeft: 15,
  },
  resultLabel: {
    fontSize: 14,
  },
  resultValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  resultDivider: {
    height: 1,
    marginVertical: 15,
  },
  resultRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  resultItem: {
    flex: 1,
  },
  resultItemLabel: {
    fontSize: 12,
  },
  resultItemValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  savingsCard: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    alignItems: 'center',
  },
  savingsContent: {
    marginLeft: 12,
  },
  savingsLabel: {
    fontSize: 12,
  },
  savingsValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  savingsNote: {
    fontSize: 10,
  },
  tipCard: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  breakdownSection: {
    marginBottom: 30,
  },
  breakdownCard: {
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  breakdownLabel: {
    fontSize: 14,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  breakdownResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    marginTop: 5,
  },
  breakdownResultLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  breakdownResultValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
