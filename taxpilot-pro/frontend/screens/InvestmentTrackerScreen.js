import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INVESTMENT_CATEGORIES = [
  { id: '80c', name: 'Section 80C', limit: 150000, color: '#3498db' },
  { id: '80d', name: 'Section 80D', limit: 50000, color: '#27ae60' },
  { id: '80e', name: 'Section 80E', limit: 0, color: '#9b59b6' },
  { id: '80g', name: 'Section 80G', limit: 0, color: '#e74c3c' },
  { id: '80ccd', name: 'NPS 80CCD(1B)', limit: 50000, color: '#f39c12' },
  { id: '24b', name: 'Home Loan Interest', limit: 200000, color: '#1abc9c' },
];

export default function InvestmentTrackerScreen({ navigation }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { user } = useAuth();
  const [investments, setInvestments] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    try {
      const saved = await AsyncStorage.getItem('investments');
      if (saved) {
        setInvestments(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Error loading investments:', error);
    }
  };

  const saveInvestments = async (newInvestments) => {
    try {
      await AsyncStorage.setItem('investments', JSON.stringify(newInvestments));
      setInvestments(newInvestments);
    } catch (error) {
      console.log('Error saving investments:', error);
    }
  };

  const getTotalForCategory = (categoryId) => {
    const categoryData = investments[categoryId] || [];
    return categoryData.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  };

  const getRemainingForCategory = (category) => {
    const total = getTotalForCategory(category.id);
    if (category.limit === 0) return 'Unlimited';
    return Math.max(0, category.limit - total);
  };

  const getProgressPercentage = (category) => {
    if (category.limit === 0) return 100;
    const total = getTotalForCategory(category.id);
    return Math.min(100, (total / category.limit) * 100);
  };

  const openAddModal = (category) => {
    setSelectedCategory(category);
    setAmount('');
    setDescription('');
    setModalVisible(true);
  };

  const addInvestment = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const newInvestment = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      description: description || selectedCategory.name,
      date: new Date().toISOString(),
    };

    const newInvestments = {
      ...investments,
      [selectedCategory.id]: [...(investments[selectedCategory.id] || []), newInvestment],
    };

    saveInvestments(newInvestments);
    setModalVisible(false);
    Alert.alert('Success', `${selectedCategory.name} investment added!`);
  };

  const deleteInvestment = (categoryId, investmentId) => {
    Alert.alert('Delete', 'Are you sure you want to delete this investment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const newInvestments = {
            ...investments,
            [categoryId]: investments[categoryId].filter(inv => inv.id !== investmentId),
          };
          saveInvestments(newInvestments);
        },
      },
    ]);
  };

  const getGrandTotal = () => {
    return Object.keys(investments).reduce((total, catId) => {
      return total + getTotalForCategory(catId);
    }, 0);
  };

  const formatCurrency = (amount) => {
    return '₹' + Math.round(amount).toLocaleString('en-IN');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.dark ? '#1a1a2e' : '#2c3e50' }]}>
        <Text style={styles.headerTitle}>Investment Tracker</Text>
        <Text style={styles.headerSubtitle}>Track your tax-saving investments</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Total Investment</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{formatCurrency(getGrandTotal())}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Tax Benefit</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
                Up to {formatCurrency(Math.min(getGrandTotal(), 500000))}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tax Saving Sections</Text>
          
          {INVESTMENT_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryCard, { backgroundColor: theme.colors.card }]}
              onPress={() => openAddModal(category)}
            >
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                  <Ionicons name="trending-up" size={24} color={category.color} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, { color: theme.colors.text }]}>{category.name}</Text>
                  <Text style={[styles.categoryLimit, { color: theme.colors.textSecondary }]}>
                    {category.limit > 0 ? `Limit: ${formatCurrency(category.limit)}` : 'No limit'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => openAddModal(category)}>
                  <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${getProgressPercentage(category)}%`, backgroundColor: category.color },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                  {formatCurrency(getTotalForCategory(category.id))} / {formatCurrency(category.limit)}
                </Text>
              </View>

              <View style={styles.remainingContainer}>
                <Text style={[styles.remainingLabel, { color: theme.colors.textSecondary }]}>Remaining:</Text>
                <Text style={[styles.remainingValue, { color: category.color }]}>
                  {formatCurrency(getRemainingForCategory(category))}
                </Text>
              </View>

              {(investments[category.id] || []).length > 0 && (
                <View style={[styles.investmentsList, { borderTopColor: theme.colors.border }]}>
                  {(investments[category.id] || []).slice(-2).map((inv) => (
                    <View key={inv.id} style={styles.investmentItem}>
                      <Text style={[styles.investmentDesc, { color: theme.colors.textSecondary }]}>{inv.description}</Text>
                      <Text style={[styles.investmentAmount, { color: theme.colors.text }]}>{formatCurrency(inv.amount)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add Investment</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {selectedCategory && (
              <View style={[styles.selectedCategory, { borderColor: selectedCategory.color }]}>
                <Text style={[styles.selectedCategoryName, { color: theme.colors.text }]}>{selectedCategory.name}</Text>
                {selectedCategory.limit > 0 && (
                  <Text style={[styles.selectedCategoryLimit, { color: theme.colors.textSecondary }]}>
                    Max: {formatCurrency(selectedCategory.limit)}
                  </Text>
                )}
              </View>
            )}

            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
              placeholder="Amount (₹)"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
              placeholder="Description (optional)"
              placeholderTextColor={theme.colors.textSecondary}
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity style={styles.addButton} onPress={addInvestment}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Investment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
    flex: 1,
  },
  summaryCard: {
    margin: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  categoryCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryLimit: {
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 15,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'right',
  },
  remainingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  remainingLabel: {
    fontSize: 12,
  },
  remainingValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  investmentsList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  investmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  investmentDesc: {
    fontSize: 14,
    flex: 1,
  },
  investmentAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  selectedCategory: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  selectedCategoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedCategoryLimit: {
    fontSize: 12,
    marginTop: 2,
  },
  input: {
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#27ae60',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
