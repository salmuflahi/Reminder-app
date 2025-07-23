import React, { useContext } from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity, ScrollView } from 'react-native';
import { ThemeContext } from '../ThemeContext'; // adjust path if needed

export default function AboutScreen() {
  const { darkMode } = useContext(ThemeContext);

  const styles = getStyles(darkMode);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Reminder App</Text>
      <Text style={styles.version}>Version 1.0.0</Text>

      <Text style={styles.sectionTitle}>About</Text>
      <Text style={styles.text}>
        This app helps you create and manage reminders easily, so you never forget your tasks!
      </Text>

      <Text style={styles.sectionTitle}>Developer</Text>
      <Text style={styles.text}>Sammy Almuflahi</Text>

      <Text style={styles.sectionTitle}>Contact</Text>
      <TouchableOpacity onPress={() => Linking.openURL('mailto:sammyalmuflahi1@gmail.com')}>
        <Text style={[styles.text, styles.link]}>sammyalmuflahi1@gmail.com</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => Linking.openURL('https://github.com/salmuflahi')}>
        <Text style={[styles.text, styles.link]}>GitHub Profile</Text>
      </TouchableOpacity>

      <Text style={[styles.text, { marginTop: 40, fontStyle: 'italic', textAlign: 'center' }]}>
        Thanks for using the app! 🚀
      </Text>
    </ScrollView>
  );
}

const getStyles = (darkMode) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: 20,
      backgroundColor: darkMode ? '#121212' : '#fff',
      justifyContent: 'flex-start',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: darkMode ? '#fff' : '#000',
      marginBottom: 4,
    },
    version: {
      fontSize: 14,
      color: darkMode ? '#bbb' : '#444',
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: darkMode ? '#fff' : '#000',
      marginTop: 20,
      marginBottom: 8,
    },
    text: {
      fontSize: 16,
      color: darkMode ? '#ddd' : '#222',
      lineHeight: 22,
    },
    link: {
      color: '#1e90ff',
      textDecorationLine: 'underline',
      marginBottom: 8,
    },
  });
