// screens/BlankScreen.js
import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../ThemeContext';

export default function BlankScreen() {
  const { darkMode } = useContext(ThemeContext);

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <Text style={[styles.text, darkMode && styles.textDark]}>
        🚧 Coming Soon...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  text: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  textDark: {
    color: '#eee',
  },
});
