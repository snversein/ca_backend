import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { TAX_CALENDAR_EVENTS } from '../services/notifications';

export default function TaxCalendarScreen({ navigation }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const getEventIcon = (type) => {
    switch (type) {
      case 'deadline':
        return 'alert-circle';
      case 'payment':
        return 'card';
      case 'document':
        return 'document-text';
      case 'reminder':
        return 'notifications';
      default:
        return 'calendar';
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'deadline':
        return '#e74c3c';
      case 'payment':
        return '#f39c12';
      case 'document':
        return '#3498db';
      case 'reminder':
        return '#27ae60';
      default:
        return '#7f8c8d';
    }
  };

  const getCurrentMonth = () => {
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[now.getMonth()];
  };

  const getUpcomingEvents = () => {
    return TAX_CALENDAR_EVENTS;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={[styles.monthBadge, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <Text style={[styles.monthText, { color: colors.primary }]}>{getCurrentMonth()} 2024</Text>
        </View>
        <Text style={styles.headerTitle}>Tax Calendar</Text>
        <Text style={styles.headerSubtitle}>Important dates for FY 2024-25</Text>
      </View>

      <View style={[styles.legendContainer, { backgroundColor: colors.card }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#e74c3c' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Deadline</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f39c12' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Payment</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3498db' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Document</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#27ae60' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Reminder</Text>
        </View>
      </View>

      <View style={styles.eventsContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Events</Text>
        
        {getUpcomingEvents().map((event) => (
          <View key={event.id} style={[styles.eventCard, { backgroundColor: colors.card }]}>
            <View style={[styles.eventIconContainer, { backgroundColor: getEventColor(event.type) + '20' }]}>
              <Ionicons 
                name={getEventIcon(event.type)} 
                size={24} 
                color={getEventColor(event.type)} 
              />
            </View>
            <View style={styles.eventInfo}>
              <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
              <Text style={[styles.eventDate, { color: colors.primary }]}>{event.date}</Text>
              <Text style={[styles.eventDescription, { color: colors.textSecondary }]}>{event.description}</Text>
            </View>
            <View style={[styles.eventBadge, { backgroundColor: getEventColor(event.type) }]}>
              <Text style={styles.eventBadgeText}>{event.type.toUpperCase()}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.tipsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Tips</Text>
        <View style={[styles.tipCard, { backgroundColor: colors.card }]}>
          <Ionicons name="bulb" size={24} color={colors.warning} />
          <View style={styles.tipContent}>
            <Text style={[styles.tipTitle, { color: colors.text }]}>Set Reminders</Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>Enable push notifications to get timely reminders for all tax deadlines.</Text>
          </View>
        </View>
        <View style={[styles.tipCard, { backgroundColor: colors.card }]}>
          <Ionicons name="cloud-upload" size={24} color={colors.primary} />
          <View style={styles.tipContent}>
            <Text style={[styles.tipTitle, { color: colors.text }]}>Upload Documents Early</Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>Start collecting Form 16 and investment proofs from April itself.</Text>
          </View>
        </View>
        <View style={[styles.tipCard, { backgroundColor: colors.card }]}>
          <Ionicons name="save" size={24} color={colors.success} />
          <View style={styles.tipContent}>
            <Text style={[styles.tipTitle, { color: colors.text }]}>Save for Taxes</Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>If you have tax liability, start saving monthly to pay advance tax.</Text>
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
    backgroundColor: '#2c3e50',
    padding: 20,
    paddingTop: 60,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  monthText: {
    fontWeight: '600',
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 5,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    marginHorizontal: 15,
    marginTop: -20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  eventsContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  eventCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  eventIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  eventDate: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  eventDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  eventBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  eventBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  tipsSection: {
    padding: 15,
    paddingBottom: 30,
  },
  tipCard: {
    flexDirection: 'row',
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
  },
  tipText: {
    fontSize: 14,
    marginTop: 4,
  },
});
