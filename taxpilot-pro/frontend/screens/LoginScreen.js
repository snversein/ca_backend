import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await login(identifier, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.error);
    }
  };

  const isEmail = identifier.includes('@');
  const keyboardType = isEmail ? 'email-address' : 'phone-pad';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: theme.dark ? '#1a1a2e' : '#2c3e50' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>MY CA APP</Text>
          <Text style={[styles.tagline, { color: theme.colors.primary }]}>by Ankit Goyal</Text>
        </View>

        <View style={[styles.guestButtonsContainer, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
          <Text style={styles.guestTitle}>Use without login:</Text>
          <View style={styles.guestButtons}>
            <TouchableOpacity 
              style={[styles.guestButton, { backgroundColor: theme.colors.card }]}
              onPress={() => navigation.navigate('GuestTabs', { screen: 'Calculator' })}
            >
              <Ionicons name="calculator" size={24} color={theme.colors.success} />
              <Text style={[styles.guestButtonText, { color: theme.colors.text }]}>Calculator</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.guestButton, { backgroundColor: theme.colors.card }]}
              onPress={() => navigation.navigate('GuestTabs', { screen: 'Chatbot' })}
            >
              <Ionicons name="chatbubbles" size={24} color={theme.colors.primary} />
              <Text style={[styles.guestButtonText, { color: theme.colors.text }]}>AI Help</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.formContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Sign in to continue</Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Email or Mobile</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Enter email or mobile number"
              placeholderTextColor={theme.colors.textSecondary}
              value={identifier}
              onChangeText={setIdentifier}
              keyboardType={keyboardType}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Enter your password"
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: theme.colors.textSecondary }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerLink, { color: theme.colors.primary }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  tagline: {
    fontSize: 16,
    marginTop: 5,
  },
  guestButtonsContainer: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  guestTitle: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    opacity: 0.8,
  },
  guestButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  formContainer: {
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#3498db',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontWeight: '600',
  },
});
