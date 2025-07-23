// screens/AchievementsScreen.js
import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { ThemeContext } from '../ThemeContext';
import BASE_URL from "../config";


if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AchievementsScreen = ({ route }) => {
  const { darkMode } = useContext(ThemeContext);
  const user = route?.params?.user || null;
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await fetch(`${BASE_URL}/user_achievements?username=${user}`);
        const data = await res.json();
        if (data.status === 'success') {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setAchievements(data.achievements);
        } else {
          console.warn('Failed to load achievements');
        }
      } catch (err) {
        console.error('Error fetching achievements:', err);
      }
    };

    fetchAchievements();
  }, []);

  return (
    <ScrollView style={[styles.container, darkMode && styles.darkBackground]}>
      <Text style={[styles.title, darkMode && styles.darkText]}>Achievements</Text>

      {achievements.map((ach, index) => (
        <View
          key={index}
          style={[
            styles.card,
            darkMode && styles.darkCard,
            { opacity: ach.unlocked ? 1 : 0.5 },
          ]}
        >
          <Image
            source={
              ach.unlocked
                ? require('../assets/badge.png')
                : require('../assets/badge-grey.png')
            }
            style={styles.badge}
          />
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.cardTitle,
                darkMode && styles.darkText,
                !ach.unlocked && styles.lockedText,
              ]}
            >
              {ach.title}
            </Text>
            <Text
              style={[
                styles.cardDescription,
                darkMode && styles.darkText,
                !ach.unlocked && styles.lockedText,
              ]}
            >
              {ach.description}
            </Text>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${ach.percent}%`, backgroundColor: ach.unlocked ? '#4CAF50' : '#888' },
                ]}
              />
            </View>
            <Text style={[styles.progressText, darkMode && styles.darkText]}>
              {ach.current}/{ach.requirement} ({ach.percent}%)
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  darkBackground: {
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  lockedText: {
    color: '#777',
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  badge: {
    width: 50,
    height: 50,
    marginRight: 15,
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#555',
  },
});

export default AchievementsScreen;
