import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import BASE_URL from "../config"; 


export default function AuthScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const authUser = () => {
  if (!username.trim() || !password.trim()) {
    Alert.alert('Please enter username and password');
    return;
  }
  const endpoint = isLogin ? 'login' : 'signup';

  fetch(`${BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
    .then(res => {
      console.log('Fetch response status:', res.status);
      return res.json();
    })
    .then(data => {
      console.log('Fetch response data:', data);
      if (data.status === 'success') {
        if (isLogin) {
          Alert.alert('Login successful!');
          onLogin(username);
        } else {
          Alert.alert('Signup successful! Please login.');
          setIsLogin(true);
        }
      } else {
        Alert.alert(data.message || 'Authentication failed');
      }
    })
    .catch((error) => {
      console.log('Fetch error:', error);
      Alert.alert('Auth request failed', error.message);
    });
};


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>{isLogin ? 'Login' : 'Sign Up'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#999"
      />

      <TouchableOpacity style={styles.button} onPress={authUser} activeOpacity={0.8}>
        <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setIsLogin(!isLogin);
          setUsername('');
          setPassword('');
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.toggleText}>
          {isLogin ? "Don't have an account? Sign Up" : 'Have an account? Login'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#4a90e2',
    marginBottom: 36,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#eee',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    fontSize: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: '#4a90e2',
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 18,
    alignItems: 'center',
    shadowColor: '#4a90e2',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  toggleText: {
    color: '#a1a1a1',
    fontSize: 16,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
