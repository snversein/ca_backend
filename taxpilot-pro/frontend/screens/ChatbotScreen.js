import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chatbotService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const defaultQuickActions = [
  { id: '1', text: 'Tax Slabs', icon: 'bar-chart' },
  { id: '2', text: 'Section 80C', icon: 'cash' },
  { id: '3', text: 'Form 16 Help', icon: 'document-text' },
  { id: '4', text: 'ITR Filing', icon: 'filing' },
];

const localKnowledgeBase = {
  greeting: {
    patterns: ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good evening'],
    response: "Hello! Welcome to TaxPilot. I'm your AI tax assistant. I can help you with:\n\n• Tax calculations (Old vs New Regime)\n• Section 80C, 80D, 80G deductions\n• HRA claims\n• Form 16 help\n• ITR filing guidance\n• PAN card queries\n\nWhat would you like to know about?",
  },
  tax_slab: {
    patterns: ['tax slab', 'tax rate', 'income tax', 'tax brackets', 'new regime', 'old regime'],
    response: "**Income Tax Slabs (FY 2024-25)**\n\n**New Regime:**\n• Up to ₹3L: 0%\n• ₹3L - ₹7L: 5%\n• ₹7L - ₹10L: 10%\n• ₹10L - ₹12L: 15%\n• ₹12L - ₹15L: 20%\n• Above ₹15L: 30%\n\n**Old Regime** (with deductions):\n• Up to ₹2.5L: 0%\n• ₹2.5L - ₹5L: 5%\n• ₹5L - ₹10L: 20%\n• Above ₹10L: 30%\n\nStandard deduction: ₹75,000 (New), ₹50,000 (Old)",
  },
  section_80c: {
    patterns: ['80c', 'section 80c', '80 c', 'deduction 80c', 'invest 80c'],
    response: "**Section 80C - Deductions up to ₹1.5 Lakh**\n\nEligible investments/expenses:\n• ELSS mutual funds\n• PPF (Public Provident Fund)\n• NSC (National Savings Certificate)\n• Life insurance premium\n• EPF contribution\n• Home loan principal\n• Children's tuition fees\n• Sukanya Samriddhi Yojana\n\n🎯 Tip: Maximize 80C + 80CCD(1B) NPS for extra ₹50K deduction!",
  },
  section_80d: {
    patterns: ['80d', 'section 80d', '80 d', 'health insurance', 'medical insurance', 'health checkup'],
    response: "**Section 80D - Health Insurance Premium**\n\nDeduction limits:\n• Self/Family: ₹25,000\n• Senior Citizen: ₹50,000\n• Parents (below 60): ₹25,000\n• Parents (60+): ₹50,000\n• Preventive health checkup: ₹5,000 (within above limits)\n\n💡 Maximum: ₹1,00,000 for family + senior parents",
  },
  section_80g: {
    patterns: ['80g', 'section 80g', '80 g', 'donation', 'charity', 'political donation'],
    response: "**Section 80G - Charitable Donations**\n\n• 100% deduction: PM Relief Fund, National Defence Fund, recognized temples, etc.\n• 50% deduction: Some registered charities\n\nKeep donation receipts for ITR filing!",
  },
  hra: {
    patterns: ['hra', 'house rent', 'rent allowance', 'rent receipt', 'lta'],
    response: "**HRA (House Rent Allowance) Claim**\n\nYou can claim HRA if you receive HRA in your salary and pay rent.\n\nDeduction = Minimum of:\n• Actual HRA received\n• 50% of salary (metro) or 40% (non-metro)\n• Rent paid - 10% of basic salary\n\n**Documents needed:**\n• Rent receipts (with landlord PAN if > ₹1L/year)\n• Rent agreement\n• Landlord's rent payment proof",
  },
  form_16: {
    patterns: ['form 16', 'form16', 'tds certificate', 'salary certificate', 'employer tds'],
    response: "**Form 16** is a TDS certificate from your employer.\n\n**It contains:**\n• Part A: TAN, employee details, TDS summary\n• Part B: Salary breakup, deductions, taxable income\n\n**For ITR:**\n• Use Part B for income details\n• Check Section 80C-80U deductions\n• Match with Form 26AS\n\n💡 Download from TRACES portal if not received from employer.",
  },
  itr: {
    patterns: ['itr', 'income tax return', 'file itr', 'file return', 'return filing', ' itr '],
    response: "**ITR Filing Guide:**\n\n**Who must file:**\n• Income > ₹3L (New Regime)\n• Gross total income > ₹3L (Old Regime)\n• Business/profession income\n• Foreign income/assets\n\n**Steps:**\n1. Gather documents (Form 16, 26AS, Aadhaar)\n2. Choose regime\n3. Compute income & deductions\n4. File at incometax.gov.in\n5. Verify via Aadhaar OTP/net banking\n\n**Due dates:**\n• Individuals: July 31\n• Tax audit cases: October 31",
  },
  pan: {
    patterns: ['pan', 'pan card', 'pan number', 'apply pan'],
    response: "**PAN (Permanent Account Number):**\n\n• 10-digit alphanumeric number\n• Required for financial transactions > ₹50,000\n• Mandatory for ITR filing\n\n**Apply online:**\n• NSDL website (tin.nsdl.com)\n• UTIITSL website\n• Through UTORR portal\n\n**Documents needed:** Aadhaar, Photo, Address proof",
  },
  '26as': {
    patterns: ['26as', 'form 26as', 'tax credit', 'tds credit'],
    response: "**Form 26AS** - Your Tax Passbook\n\nShows all TDS and advance tax paid against your PAN.\n\n**Check at:** income tax portal > My Account > View Form 26AS\n\n**Match before filing ITR:**\n• TDS in 26AS = TDS in Form 16\n• If mismatch, raise correction with deductor",
  },
  nps: {
    patterns: ['nps', 'national pension', 'pension scheme', 'retirement', '80ccd'],
    response: "**NPS (National Pension System)**\n\n**Section 80CCD(1B):**\n• Extra ₹50,000 deduction over 80C limit\n• Only for NPS contributions\n\n**Tax benefit:**\n• Employer contribution: Up to 10% of salary (80CCD(2))\n• 60% of corpus is tax-free at maturity\n\n**Age to join:** 18-70 years",
  },
  default: {
    patterns: [],
    response: "I can help you with various tax topics:\n\n• **Tax Slabs** - Old vs New regime\n• **Section 80C/80D/80G** - Deductions\n• **HRA** - House rent claims\n• **Form 16** - TDS certificate\n• **ITR Filing** - Step by step\n• **PAN Card** - Apply/details\n• **NPS** - Pension scheme\n\nPlease ask about any specific topic or type your tax question!",
  },
};

const getLocalResponse = (userMessage) => {
  const lowerMessage = userMessage.toLowerCase();
  
  for (const [key, data] of Object.entries(localKnowledgeBase)) {
    if (key === 'default') continue;
    for (const pattern of data.patterns) {
      if (lowerMessage.includes(pattern)) {
        return data.response;
      }
    }
  }
  
  return localKnowledgeBase.default.response;
};

export default function ChatbotScreen({ navigation }) {
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const colors = theme.colors;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Hello! I\'m My CA App\'s AI assistant. I can help you with:\n\n• Tax calculations\n• Tax saving tips (80C, 80D, HRA)\n• Form 16 queries\n• ITR filing guidance\n• PAN card information\n• Tax slab explanations\n\nHow can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!authLoading) {
      loadSuggestions();
    }
    loadChatHistory();
  }, [authLoading]);

  const loadSuggestions = async () => {
    try {
      const res = await chatbotService.getQuickActions();
      if (res.data.actions) {
        setSuggestions(res.data.actions.map((a) => ({
          id: a.id,
          text: a.title,
          icon: getIcon(a.icon),
        })));
      } else {
        setSuggestions(defaultQuickActions);
      }
    } catch (error) {
      const status = error.response?.status || error.status;
      if (status === 401) {
        setSuggestions(defaultQuickActions);
      } else {
        console.error('Load suggestions error:', error);
        setSuggestions(defaultQuickActions);
      }
    }
  };

  const loadChatHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('chatHistory');
      if (history) {
        const parsedHistory = JSON.parse(history);
        if (parsedHistory.length > 0) {
          setMessages(prev => [...prev, ...parsedHistory]);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const saveChatHistory = async (newMessages) => {
    try {
      const historyToSave = newMessages.slice(1).slice(-20);
      await AsyncStorage.setItem('chatHistory', JSON.stringify(historyToSave));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  const getIcon = (iconName) => {
    const iconMap = {
      calculator: 'calculator',
      document: 'document-text',
      info: 'information-circle',
      savings: 'wallet',
      help: 'help-circle',
      calendar: 'calendar',
    };
    return iconMap[iconName] || 'chatbubbles';
  };

  const sendMessage = async (text = message) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    if (!user) {
      setTimeout(() => {
        const botMessage = {
          id: (Date.now() + 1).toString(),
          text: getLocalResponse(text.trim()),
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 500);
      return;
    }

    try {
      const history = messages.slice(1).slice(-10).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await chatbotService.query(text.trim(), history);
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: res.data?.response || 'I received your message. Is there anything specific about taxes I can help you with?',
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => {
        const newMessages = [...prev, botMessage];
        saveChatHistory(newMessages);
        return newMessages;
      });
    } catch (error) {
      const status = error.response?.status || error.status;
      let errorText;
      
      if (status === 401) {
        errorText = getLocalResponse(text.trim());
      } else {
        const fallbackMessages = [
          'I apologize, but I\'m having trouble connecting right now. Please check your internet connection and try again.',
          'It seems the server is taking longer than expected. Would you like to try again in a moment?',
          'I\'m experiencing some technical difficulties. Please try asking again or contact support if the problem persists.',
        ];
        errorText = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
      }
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        sender: 'bot',
        timestamp: new Date(),
        isError: status !== 401,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        text: 'Chat cleared! How can I help you with your taxes today?',
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
    AsyncStorage.removeItem('chatHistory');
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageContainer, item.sender === 'user' && styles.userMessageContainer]}>
      {item.sender === 'bot' && (
        <View style={[styles.botAvatar, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="chatbubbles" size={18} color="#fff" />
        </View>
      )}
      <View style={[styles.messageBubble, item.sender === 'user' ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.messageText, { color: item.sender === 'user' ? '#fff' : theme.colors.text }]}>
          {item.text}
        </Text>
        <Text style={[styles.timestamp, { color: item.sender === 'user' ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary }]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
    </View>
  );

  const renderSuggestion = ({ item }) => (
    <TouchableOpacity style={[styles.suggestionChip, { backgroundColor: theme.colors.primary + '20' }]} onPress={() => sendMessage(item.text)}>
      <Ionicons name={item.icon} size={14} color={theme.colors.primary} />
      <Text style={[styles.suggestionText, { color: theme.colors.primary }]}>{item.text}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={[styles.header, { backgroundColor: theme.dark ? '#1a1a2e' : '#2c3e50' }]}>
        <View style={styles.headerContent}>
          <View style={[styles.headerIcon, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="chatbubbles" size={24} color="#fff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>MY CA APP</Text>
            <Text style={styles.headerSubtitle}>by Ankit Goyal</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {!user ? (
            <>
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
            </>
          ) : (
            <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
              <Ionicons name="trash-outline" size={22} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isTyping && (
        <View style={styles.typingIndicator}>
          <View style={[styles.typingDot, { backgroundColor: theme.colors.primary }]}></View>
          <View style={[styles.typingDot, styles.typingDot2, { backgroundColor: theme.colors.primary }]}></View>
          <View style={[styles.typingDot, styles.typingDot3, { backgroundColor: theme.colors.primary }]}></View>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        ListHeaderComponent={
          <View style={styles.suggestionsContainer}>
            <Text style={[styles.suggestionsLabel, { color: theme.colors.textSecondary }]}>Quick Actions:</Text>
            <FlatList
              data={suggestions}
              renderItem={renderSuggestion}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        }
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
          value={message}
          onChangeText={setMessage}
          placeholder="Ask about taxes..."
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
          onPress={() => sendMessage()}
          disabled={!message.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={22} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 15,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#bdc3c7',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
  clearBtn: {
    padding: 8,
  },
  typingIndicator: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
    opacity: 0.6,
  },
  typingDot2: {
    opacity: 0.8,
  },
  typingDot3: {
    opacity: 1,
  },
  suggestionsContainer: {
    paddingVertical: 12,
  },
  suggestionsLabel: {
    fontSize: 12,
    marginLeft: 15,
    marginBottom: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 10,
    marginLeft: 15,
  },
  suggestionText: {
    marginLeft: 6,
    fontSize: 13,
  },
  messagesList: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    flexDirection: 'row-reverse',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
});
