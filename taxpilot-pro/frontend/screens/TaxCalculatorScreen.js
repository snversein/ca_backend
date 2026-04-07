import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { taxService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function TaxCalculatorScreen({ navigation }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const colors = theme.colors;
  const [regime, setRegime] = useState('new');
  const [financialYear, setFinancialYear] = useState('2024-25');
  const [basicSalary, setBasicSalary] = useState('');
  const [houseRent, setHouseRent] = useState('');
  const [otherAllowances, setOtherAllowances] = useState('');
  const [professionalTax, setProfessionalTax] = useState('');
  const [section80C, setSection80C] = useState('');
  const [section80D, setSection80D] = useState('');
  const [section80G, setSection80G] = useState('');
  const [section80E, setSection80E] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    setThemeVersion(v => v + 1);
  }, [theme]);

  const defaultSuggestions = [
    { id: '1', section: 'Section 80C', max_saving: '₹1.5 Lakh', options: ['ELSS Mutual Funds', 'PPF', 'NSC', 'Life Insurance Premium', 'EPF Contribution', 'Home Loan Principal'] },
    { id: '2', section: 'Section 80D', max_saving: '₹50,000-₹1 Lakh', options: ['Health Insurance - Self', 'Health Insurance - Parents', 'Preventive Health Checkup'] },
    { id: '3', section: 'HRA Claim', max_saving: 'Up to 50% of Basic Salary', options: ['Claim if you receive HRA in salary', 'Keep rent receipts ready', 'Landlord PAN if rent > ₹1 Lakh'] },
    { id: '4', section: 'NPS 80CCD(1B)', max_saving: '₹50,000 Extra', options: ['NPS Tier 1 Account', 'Additional deduction over 80C limit'] },
    { id: '5', section: 'Section 80E', max_saving: 'No Limit', options: ['Education Loan Interest', 'No limit on interest amount', 'For self/spouse/children'] },
  ];

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const res = await taxService.getSuggestions();
      setSuggestions(res.data.suggestions || defaultSuggestions);
    } catch (error) {
      const status = error.response?.status || error.status;
      if (status === 401) {
        setSuggestions(defaultSuggestions);
      } else {
        console.error('Load suggestions error:', error);
        setSuggestions(defaultSuggestions);
      }
    }
  };

  const calculateTax = async () => {
    const totalIncome = parseFloat(basicSalary || 0) + parseFloat(houseRent || 0) + parseFloat(otherAllowances || 0);
    
    if (totalIncome <= 0) {
      Alert.alert('Error', 'Please enter your income details');
      return;
    }

    setCalculating(true);
    try {
      const data = {
        total_income: totalIncome,
        basic_salary: parseFloat(basicSalary || 0),
        house_rent_allowance: parseFloat(houseRent || 0),
        other_allowances: parseFloat(otherAllowances || 0),
        professional_tax: parseFloat(professionalTax || 0),
        section_80c: parseFloat(section80C || 0),
        section_80d: parseFloat(section80D || 0),
        section_80g: parseFloat(section80G || 0),
        section_80e: parseFloat(section80E || 0),
        financial_year: financialYear,
        regime,
      };

      const res = await taxService.calculateTax(data);
      setResult(res.data.calculation);
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate tax');
    } finally {
      setCalculating(false);
    }
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

  const renderInput = (label, value, setter, placeholder, icon) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
      <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Ionicons name={icon} size={20} color={colors.primary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={setter}
          placeholder={placeholder}
          keyboardType="numeric"
          placeholderTextColor={colors.textSecondary}
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.dark ? '#1a1a2e' : '#2c3e50' }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>MY CA APP</Text>
            <Text style={styles.headerSubtitle}>by Ankit Goyal</Text>
          </View>
          {!user && (
            <View style={styles.headerAuth}>
              <TouchableOpacity 
                style={styles.authBtn} 
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.authBtnText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.authBtn, styles.signupBtn]} 
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.authBtnText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.regimeToggle, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.regimeBtn, regime === 'new' && { backgroundColor: colors.primary }]}
          onPress={() => setRegime('new')}
        >
          <Text style={[styles.regimeBtnText, regime === 'new' && styles.regimeBtnTextActive]}>New Regime</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.regimeBtn, regime === 'old' && { backgroundColor: colors.primary }]}
          onPress={() => setRegime('old')}
        >
          <Text style={[styles.regimeBtnText, regime === 'old' && styles.regimeBtnTextActive]}>Old Regime</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Income Details</Text>
        {renderInput('Basic Salary', basicSalary, setBasicSalary, 'Enter basic salary', 'cash-outline')}
        {renderInput('House Rent Allowance', houseRent, setHouseRent, 'Enter HRA', 'home-outline')}
        {renderInput('Other Allowances', otherAllowances, setOtherAllowances, 'Enter other allowances', 'add-circle-outline')}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Deductions</Text>
        {renderInput('Professional Tax', professionalTax, setProfessionalTax, 'Enter PT', 'card-outline')}
        {regime === 'old' && (
          <>
            {renderInput('Section 80C', section80C, setSection80C, 'Max ₹1,50,000', 'trending-down-outline')}
            {renderInput('Section 80D', section80D, setSection80D, 'Health insurance', 'medkit-outline')}
            {renderInput('Section 80G', section80G, setSection80G, 'Donations', 'heart-outline')}
            {renderInput('Section 80E', section80E, setSection80E, 'Education loan', 'school-outline')}
          </>
        )}
      </View>

      <TouchableOpacity style={styles.calculateBtn} onPress={calculateTax} disabled={calculating}>
        {calculating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="calculator" size={20} color="#fff" />
            <Text style={styles.calculateBtnText}>Calculate Tax</Text>
          </>
        )}
      </TouchableOpacity>

      {result && (
        <View style={styles.resultSection}>
          <Text style={[styles.resultTitle, { color: colors.text }]}>Tax Calculation Result</Text>
          <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Gross Income</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>{formatCurrency(result.gross_income)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Total Deductions</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>{formatCurrency(result.total_deductions)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Taxable Income</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>{formatCurrency(result.taxable_income)}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Tax Amount</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>{formatCurrency(result.tax_before_cess)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Cess (4%)</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>{formatCurrency(result.cess)}</Text>
            </View>
            {result.rebate_87a > 0 && (
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Rebate 87A</Text>
                <Text style={[styles.resultValue, { color: colors.success }]}>-{formatCurrency(result.rebate_87a)}</Text>
              </View>
            )}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.resultRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total Tax Payable</Text>
              <Text style={[styles.totalValue, { color: colors.tax }]}>{formatCurrency(result.total_tax)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Effective Rate</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>{result.effective_rate}%</Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity style={[styles.suggestionsBtn, { backgroundColor: colors.card }]} onPress={() => setShowSuggestions(!showSuggestions)}>
        <Ionicons name="bulb" size={20} color={colors.warning} />
        <Text style={[styles.suggestionsBtnText, { color: colors.text }]}>Tax Saving Tips</Text>
        <Ionicons name={showSuggestions ? 'chevron-up' : 'chevron-down'} size={20} color={colors.warning} />
      </TouchableOpacity>

      {showSuggestions && (
        <View style={styles.suggestionsSection}>
          {suggestions.map((item, index) => (
            <View key={index} style={[styles.suggestionCard, { backgroundColor: colors.card }]}>
              <View style={styles.suggestionHeader}>
                <Text style={[styles.suggestionTitle, { color: colors.text }]}>{item.section}</Text>
                <Text style={[styles.suggestionMax, { color: colors.success }]}>Max: {item.max_saving}</Text>
              </View>
              {item.options.map((opt, i) => (
                <Text key={i} style={[styles.suggestionOption, { color: colors.textSecondary }]}>• {opt}</Text>
              ))}
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 30 }} />
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerAuth: {
    flexDirection: 'row',
  },
  authBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginLeft: 8,
  },
  signupBtn: {
    backgroundColor: '#27ae60',
  },
  authBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  regimeToggle: {
    flexDirection: 'row',
    margin: 15,
    borderRadius: 10,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  regimeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  regimeBtnActive: {
    backgroundColor: '#3498db',
  },
  regimeBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  regimeBtnTextActive: {
    color: '#fff',
  },
  section: {
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
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
    borderWidth: 1,
    borderRadius: 10,
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  calculateBtn: {
    flexDirection: 'row',
    backgroundColor: '#3498db',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calculateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  resultSection: {
    marginHorizontal: 15,
    marginBottom: 15,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  resultCard: {
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultLabel: {
    fontSize: 14,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  suggestionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  suggestionsBtnText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  suggestionsSection: {
    marginHorizontal: 15,
  },
  suggestionCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionMax: {
    fontSize: 12,
    fontWeight: '500',
  },
  suggestionOption: {
    fontSize: 14,
    marginTop: 5,
    marginLeft: 10,
  },
});
