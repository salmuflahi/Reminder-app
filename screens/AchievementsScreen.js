// screens/AchievementsScreen.js
import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { ThemeContext } from '../ThemeContext';
import BASE_URL from '../config';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AchievementsScreen = ({ user }) => {
  const { darkMode } = useContext(ThemeContext);

  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchAchievements = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/user_achievements?username=${user}`);
        const data = await res.json();
        if (data.status === 'success') {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setAchievements(data.achievements);
        } else {
          setAchievements([]);
        }
      } catch (err) {
        setAchievements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [user]);

  if (!user) {
    return (
      <View style={[styles.centered, darkMode && styles.darkBackground]}>
        <Text style={[styles.title, darkMode && styles.darkText]}>
          No user found. Please login to see achievements.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.centered, darkMode && styles.darkBackground]}>
        <ActivityIndicator size="large" color={darkMode ? '#6ee7b7' : '#3b82f6'} />
      </View>
    );
  }

  if (achievements.length === 0) {
    return (
      <View style={[styles.centered, darkMode && styles.darkBackground]}>
        <Text style={[styles.infoText, darkMode && styles.darkText]}>
          No achievements yet. Start completing tasks to unlock achievements!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, darkMode && styles.darkBackground]}
      contentContainerStyle={{ paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, darkMode && styles.darkText]}>Achievements</Text>

      {achievements.map((ach) => (
        <View
          key={ach.id}
          style={[
            styles.card,
            darkMode && styles.darkCard,
            { opacity: ach.unlocked ? 1 : 0.55 },
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
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {ach.title}
            </Text>
            <Text
              style={[
                styles.cardDescription,
                darkMode && styles.darkText,
                !ach.unlocked && styles.lockedText,
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {ach.description}
            </Text>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${ach.percent}%`,
                    backgroundColor: ach.unlocked ? '#22c55e' : '#6b7280',
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, darkMode && styles.darkText]}>
              {ach.current} / {ach.requirement} ({ach.percent}%)
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
    backgroundColor: '#f9fafb',
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  darkBackground: {
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 25,
    color: '#111827',
    textAlign: 'center',
    fontFamily: 'System',
  },
  darkText: {
    color: '#f3f4f6',
  },
  infoText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  darkCard: {
    backgroundColor: '#1e293b',
    shadowOpacity: 0.15,
  },
  badge: {
    width: 56,
    height: 56,
    marginRight: 20,
    resizeMode: 'contain',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  lockedText: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    borderRadius: 6,
  },
  progressText: {
    marginTop: 6,
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
});

export default AchievementsScreen;
