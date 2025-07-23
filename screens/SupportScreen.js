import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { ThemeContext } from '../ThemeContext';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

export default function SupportScreen() {
  const { darkMode } = useContext(ThemeContext);
  const supportEmail = 'remindme.assistants@gmail.com';

  const handleEmailPress = async () => {
    const subject = 'Support Request - RemindMe App';
    const body = 'Hey RemindMe team,\n\nI need help with...';
    const mailtoUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    const supported = await Linking.canOpenURL(mailtoUrl);
    if (supported) {
      Linking.openURL(mailtoUrl);
    } else {
      Alert.alert('Error', 'No email app found.');
    }
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Text style={[styles.title, darkMode && styles.darkText]}>Need Help?</Text>

      <Text style={[styles.label, darkMode && styles.darkText]}>
        You can reach us at:
      </Text>

      <Text style={[styles.email, darkMode && styles.darkText]}>
        {supportEmail}
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleEmailPress}>
       <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <FontAwesome name="envelope" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.buttonText}>Send Feedback</Text>
      </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  label: {
    fontSize: 16,
    marginTop: 12,
    color: '#555',
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 32,
    color: '#3b82f6',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  darkText: {
    color: '#eee',
  },
});
