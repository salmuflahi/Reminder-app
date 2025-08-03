import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { BarChart, PieChart } from "react-native-chart-kit";
import { ThemeContext } from "../ThemeContext";
import BASE_URL from "../config";

const screenWidth = Dimensions.get("window").width;

const quotes = [
  "Don't watch the clock; do what it does. Keep going.",
  "Success is not final, failure is not fatal.",
  "The way to get started is to quit talking and begin doing.",
  "Are you successful? I didn't think, keep going.",
  "Who's gonna carry the boat?",
  "Stop waiting for permission to be great.",
  "Most people quit right when they’re about to win.",
];

const tips = [
  "Break tasks into small steps.",
  "Use the two-minute rule.",
  "Take regular breaks to stay fresh.",
  "Do your top priorities first.",
];


function getWeekStartDate(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

export default function DashboardScreen({ username }) {
  const { darkMode } = useContext(ThemeContext);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAlerted, setHasAlerted] = useState(false);

  const weekStart = getWeekStartDate(new Date());
  const todayStr = formatDate(new Date());

  useEffect(() => {
    if (!username) {
      if (!hasAlerted) {
        Alert.alert("Error", "Username is required to load data.");
        setHasAlerted(true);
      }
      setLoading(false);
      return;
    }

    async function fetchReminders() {
      try {
        setLoading(true);
        const response = await fetch(
          `${BASE_URL}/activities?user=${encodeURIComponent(username)}`
        );
        const json = await response.json();
        if (json.status === "success") {
          setReminders(json.reminders);
        } else {
          Alert.alert("Error", "Failed to load reminders");
          setReminders([]);
        }
      } catch (error) {
        Alert.alert("Error", "Network error while fetching reminders");
        setReminders([]);
      } finally {
        setLoading(false);
      }
    }

    fetchReminders();
  }, [username, hasAlerted]);

  if (loading) {
    return (
      <View
        style={[styles.container, darkMode && styles.darkContainer, styles.center]}
      >
        <ActivityIndicator size="large" color={darkMode ? "#fff" : "#000"} />
        <Text
          style={[styles.text, darkMode && styles.textLight, { marginTop: 12 }]}
        >
          Loading data...
        </Text>
      </View>
    );
  }

  // Filter reminders done this week
  const remindersThisWeek = reminders.filter((r) => {
    if (!r.done) return false;
    const rDate = r.time.split("T")[0];
    return rDate >= formatDate(weekStart) && rDate <= todayStr;
  });

  // Total reminders this week
  const totalThisWeek = reminders.filter((r) => {
    const rDate = r.time.split("T")[0];
    return rDate >= formatDate(weekStart) && rDate <= todayStr;
  }).length;

  const donePercent =
    totalThisWeek === 0
      ? 0
      : Math.round((remindersThisWeek.length / totalThisWeek) * 100);

  // Category counts
  const categoryCounts = {};
  remindersThisWeek.forEach((r) => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  });

  const topCategory =
    Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  // Calculate streak
  let streak = 0;
  for (let i = 0; ; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    const doneOnDate = reminders.some(
      (r) => r.done && r.time.startsWith(dateStr)
    );
    if (doneOnDate) streak++;
    else break;
  }

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  const chartConfig = {
    backgroundGradientFrom: darkMode ? "#121212" : "#f1f5f9",
    backgroundGradientTo: darkMode ? "#1f2937" : "#e2e8f0",
    color: (opacity = 1) =>
      darkMode ? `rgba(255,255,255,${opacity})` : `rgba(30, 41, 59, ${opacity})`,
    labelColor: (opacity = 1) =>
      darkMode ? `rgba(255,255,255,${opacity})` : `rgba(30, 41, 59, ${opacity})`,
    barPercentage: 0.6,
    decimalPlaces: 0,
  };

  const barData = {
    labels: ["Done", "Total"],
    datasets: [{ data: [remindersThisWeek.length, totalThisWeek] }],
  };

  const pieData = Object.entries(categoryCounts).map(([cat, val], index) => ({
    name: cat,
    population: val,
    color: `hsl(${index * 60}, 70%, 50%)`,
    legendFontColor: darkMode ? "#e0e0e0" : "#333",
    legendFontSize: 14,
  }));

  return (
    <ScrollView
      style={[styles.container, darkMode && styles.darkContainer]}
      contentContainerStyle={{ padding: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* TOP ROW */}
      <View style={styles.row}>
        <Animatable.View
          animation="fadeInLeft"
          style={[styles.smallBox, darkMode && styles.darkBox]}
        >
          <Text style={[styles.boxTitle, darkMode && styles.boxTitleDark]}>
            Quote
          </Text>
          <Text style={[styles.text, darkMode && styles.textLight]}>
            "{randomQuote}"
          </Text>
        </Animatable.View>

        <Animatable.View
          animation="fadeInRight"
          delay={100}
          style={[styles.smallBox, darkMode && styles.darkBox]}
        >
          <Text style={[styles.boxTitle, darkMode && styles.boxTitleDark]}>
            Tip of the Day
          </Text>
          <Text style={[styles.text, darkMode && styles.textLight]}>{randomTip}</Text>
        </Animatable.View>
      </View>

      {/* CHARTS */}
      <View style={styles.center}>
        <Text style={[styles.chartTitle, darkMode && styles.textLight]}>
          Weekly Completion
        </Text>
        <BarChart
          data={barData}
          width={screenWidth - 50}
          height={220}
          chartConfig={chartConfig}
          fromZero
          showValuesOnTopOfBars
          style={styles.chart}
        />
      </View>

      {pieData.length > 0 && (
        <View style={styles.center}>
          <Text style={[styles.chartTitle, darkMode && styles.textLight]}>
            Category Breakdown
          </Text>
          <PieChart
            data={pieData}
            width={screenWidth - 50}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </View>
      )}

      {/* STATS GRID */}
      <View style={styles.row}>
        <View style={[styles.statCard, darkMode && styles.statCardDark]}>
          <Text style={[styles.statLabel, darkMode && styles.textLight]}>
            Current Streak
          </Text>
          <Text style={[styles.statValue, darkMode && styles.textLight]}>
            {streak} day{streak !== 1 ? "s" : ""}
          </Text>
        </View>

        <View style={[styles.statCard, darkMode && styles.statCardDark]}>
          <Text style={[styles.statLabel, darkMode && styles.textLight]}>
            Top Category
          </Text>
          <Text style={[styles.statValue, darkMode && styles.textLight]}>
            {topCategory}
          </Text>
        </View>
      </View>

      <View style={[styles.fullWidthBox, darkMode && styles.fullWidthBoxDark]}>
        <Text style={[styles.boxTitle, darkMode && styles.boxTitleDark]}>
          Total This Week
        </Text>
        <Text style={[styles.text, darkMode && styles.textLight]}>
          {remindersThisWeek.length} done / {totalThisWeek} total ({donePercent}%)
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  smallBox: {
    backgroundColor: "#dbeafe",
    borderRadius: 16,
    flex: 1,
    padding: 16,
    marginRight: 8,
  },
  darkBox: {
    backgroundColor: "#374151",
  },
  chart: {
    marginVertical: 12,
    borderRadius: 16,
  },
  chartTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1e40af",
  },
  boxTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#1e40af",
  },
  boxTitleDark: {
    color: "#d1d5db",
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: "#1e293b",
  },
  textLight: {
    color: "#e0e0e0",
  },
  center: {
    alignItems: "center",
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fde68a",
    padding: 20,
    borderRadius: 16,
    marginRight: 8,
    shadowColor: "#ca8a04",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  statCardDark: {
    backgroundColor: "#4b5563",
    shadowColor: "#1f2937",
  },
  statLabel: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e40af",
  },
  fullWidthBox: {
    backgroundColor: "#dcfce7",
    padding: 20,
    borderRadius: 16,
    marginTop: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  fullWidthBoxDark: {
    backgroundColor: "#374151",
  },
});
