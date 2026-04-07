import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function ToolsHomeScreen({ navigation }) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const tools = [
    { id: 'calendar', name: 'Tax Calendar', icon: 'calendar', color: '#3498db', screen: 'TaxCalendar', desc: 'Important dates' },
    { id: 'investment', name: 'Investment Tracker', icon: 'trending-up', color: '#27ae60', screen: 'InvestmentTracker', desc: '80C, 80D, NPS' },
    { id: 'hra', name: 'HRA Calculator', icon: 'home', color: '#9b59b6', screen: 'HRACalculator', desc: 'House Rent Allowance' },
    { id: 'scanner', name: 'Doc Scanner', icon: 'scan', color: '#e74c3c', screen: 'DocumentScanner', desc: 'Scan documents' },
    { id: 'history', name: 'Tax History', icon: 'time', color: '#f39c12', screen: 'TaxHistory', desc: 'Multi-year records' },
    { id: 'export', name: 'Export Report', icon: 'document-text', color: '#1abc9c', screen: 'ExportReport', desc: 'Generate PDF' },
    { id: 'chatbot', name: 'AI Assistant', icon: 'chatbubbles', color: '#00b894', screen: 'ChatbotScreen', desc: 'Tax queries help' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Tax Tools</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your tax documents and calculations</Text>
      </View>

      <View style={styles.grid}>
        {tools.map((tool) => (
          <TouchableOpacity 
            key={tool.id} 
            style={[styles.card, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate(tool.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: tool.color + '20' }]}>
              <Ionicons name={tool.icon} size={28} color={tool.color} />
            </View>
            <Text style={[styles.cardName, { color: colors.text }]}>{tool.name}</Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{tool.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    textAlign: 'center',
  },
});
