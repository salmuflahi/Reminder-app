import React, { useContext, useLayoutEffect, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { ThemeContext } from '../ThemeContext';
import BASE_URL from './config';

export default function SettingsScreen({ navigation, user }) {
  const { darkMode, setDarkMode } = useContext(ThemeContext);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('********'); // masked by default
  const [passwordChanged, setPasswordChanged] = useState(false);

  // Fetch profile on mount or when user changes
  useEffect(() => {
    if (!user) return;
    fetch(`${BASE_URL}/user_profile?username=${user}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setUsername(data.profile.username || '');
          setNotificationsEnabled(data.profile.notifications_enabled || false);
          setPassword('********');
          setPasswordChanged(false);
        } else {
          Alert.alert('Failed to load user data');
        }
      })
      .catch(() => Alert.alert('Error fetching profile'));
  }, [user]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ marginLeft: 15 }}>
          <FontAwesome name="bars" size={24} color={darkMode ? '#fff' : '#000'} />
        </TouchableOpacity>
      ),
      headerTitle: 'Settings',
      headerTitleAlign: 'center',
    });
  }, [navigation, darkMode]);

  const handleSaveChanges = () => {
    if (!username.trim()) {
      Alert.alert('Username cannot be empty');
      return;
    }
    if (passwordChanged && password.length < 6) {
      Alert.alert('Password must be at least 6 characters');
      return;
    }

    fetch(`${BASE_URL}/update_profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user,
        new_username: username,
        password: passwordChanged ? password : null,
        dark_mode: darkMode,
        notifications_enabled: notificationsEnabled,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          Alert.alert('Profile updated');
        } else {
          Alert.alert(data.message || 'Failed to update profile');
        }
      })
      .catch(() => Alert.alert('Failed to update profile'));
  };

  return (
    <ScrollView style={[styles.container, darkMode && styles.darkBackground]}>
      <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>Preferences</Text>

      <View style={styles.settingRow}>
        <Text style={[styles.label, darkMode && styles.darkText]}>Dark Mode</Text>
        <Switch value={darkMode} onValueChange={() => setDarkMode(!darkMode)} />
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.label, darkMode && styles.darkText]}>Notifications</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={() => setNotificationsEnabled(!notificationsEnabled)}
        />
      </View>

      <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>Account</Text>

      <View style={styles.editRow}>
        <Text style={[styles.label, darkMode && styles.darkText]}>Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={[styles.input, darkMode && styles.inputDark]}
        />
      </View>

      <View style={styles.editRow}>
        <Text style={[styles.label, darkMode && styles.darkText]}>Password</Text>
        <TextInput
          value={password}
          onChangeText={text => {
            setPassword(text);
            setPasswordChanged(true);
          }}
          secureTextEntry={true}
          style={[styles.input, darkMode && styles.inputDark]}
          placeholder="********"
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSaveChanges}>
        <Text style={styles.saveText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  darkBackground: { backgroundColor: '#121212' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 25, marginBottom: 10, color: '#000' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  editRow: {
    marginTop: 10,
    marginBottom: 10,
  },
  label: { fontSize: 16, color: '#000' },
  darkText: { color: '#fff' },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    color: '#000',
  },
  inputDark: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
  },
  saveBtn: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveText: { color: '#fff', fontWeight: 'bold' },
});
