import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Button,
  Platform,
  Alert,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ThemeContext } from "../ThemeContext";
import BASE_URL from "../config";

LocaleConfig.locales["en"] = {
  monthNames: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  monthNamesShort: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  dayNames: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};
LocaleConfig.defaultLocale = "en";

export default function CalendarScreen() {
  const { darkMode } = useContext(ThemeContext);

  // State to hold selected date string 'YYYY-MM-DD'
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // All reminders fetched from backend for the month (or whole)
  const [reminders, setReminders] = useState([]);

  // Filter states
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterDone, setFilterDone] = useState("All"); // 'All', 'Done', 'Not Done'
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' or 'edit'
  const [modalData, setModalData] = useState({
    id: null,
    title: "",
    time: "12:00 PM",
    category: "All",
    recurring: "None",
    done: false,
  });

  // DateTimePicker state for time input
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Today button helper
  const todayStr = new Date().toISOString().split("T")[0];

  // Fetch reminders from backend (example endpoint)
  useEffect(() => {
    fetch(`${BASE_URL}/activities`)// Adjust backend URL here
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setReminders(data.reminders);
        }
      })
      .catch(() => setReminders([]));
  }, []);

  // Filter reminders by selected date, filter, search
  const filteredReminders = useMemo(() => {
    return reminders
      .filter((r) => r.user === "someUser") // Replace with actual user if needed
      .filter((r) => r.time && r.title)
      .filter((r) => {
        // Match selected date
        return r.time.includes(selectedDate);
      })
      .filter((r) => {
        if (filterCategory === "All") return true;
        return r.category === filterCategory;
      })
      .filter((r) => {
        if (filterDone === "All") return true;
        return filterDone === "Done" ? r.done : !r.done;
      })
      .filter((r) => {
        if (!searchTerm) return true;
        return r.title.toLowerCase().includes(searchTerm.toLowerCase());
      });
  }, [reminders, selectedDate, filterCategory, filterDone, searchTerm]);

  // Mark dates with dots by categories and counts
  const markedDates = useMemo(() => {
    const marks = {};
    // Group reminders by date
    const remindersByDate = {};
    reminders.forEach((r) => {
      const dateKey = r.time.split("T")[0] || r.time; // handle time format
      if (!remindersByDate[dateKey]) remindersByDate[dateKey] = [];
      remindersByDate[dateKey].push(r);
    });
    // Create marks with dots and counts
    Object.entries(remindersByDate).forEach(([date, rems]) => {
      const dots = [];
      const categories = new Set();
      rems.forEach((r) => categories.add(r.category || "All"));
      // You can assign color per category:
      const categoryColors = {
        All: "gray",
        Work: "blue",
        Personal: "green",
        Shopping: "purple",
        Other: "orange",
      };
      categories.forEach((cat) => {
        dots.push({ key: cat, color: categoryColors[cat] || "gray" });
      });
      marks[date] = {
        dots,
        marked: true,
      };
    });
    // Highlight selected date
    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: darkMode ? "#3399ff" : "#007bff",
      };
    }
    return marks;
  }, [reminders, selectedDate, darkMode]);

  // Handle add/edit modal submit
  const handleSubmitReminder = () => {
    if (!modalData.title.trim()) {
      Alert.alert("Validation", "Title cannot be empty");
      return;
    }

    // Prepare payload for backend
    const payload = {
      user: "someUser",
      title: modalData.title.trim(),
      time: `${selectedDate}T${convertTo24Hour(modalData.time)}`,
      category: modalData.category,
      recurring: modalData.recurring,
      done: modalData.done ? 1 : 0,
    };

    const url =
      modalMode === "add"
        ? `${BASE_URL}/add_schedule`
        : `${BASE_URL}/update_schedule/${modalData.id}`;

    const method = modalMode === "add" ? "POST" : "PUT";

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          // Refresh reminders after change
          fetch(`${BASE_URL}/activities`)
            .then((res) => res.json())
            .then((data) => {
              if (data.status === "success") {
                setReminders(data.reminders);
              }
            });
          setModalVisible(false);
          resetModalData();
        } else {
          Alert.alert("Error", "Failed to save reminder");
        }
      })
      .catch(() => Alert.alert("Error", "Failed to save reminder"));
  };

  // Reset modal data
  const resetModalData = () => {
    setModalData({
      id: null,
      title: "",
      time: "12:00 PM",
      category: "All",
      recurring: "None",
      done: false,
    });
  };

  // Open modal for adding new reminder
  const openAddModal = () => {
    resetModalData();
    setModalMode("add");
    setModalVisible(true);
  };

  // Open modal for editing reminder
  const openEditModal = (reminder) => {
    setModalData({
      id: reminder.id,
      title: reminder.title,
      time: reminder.time.split("T")[1] || "12:00 PM",
      category: reminder.category || "All",
      recurring: reminder.recurring || "None",
      done: !!reminder.done,
    });
    setModalMode("edit");
    setModalVisible(true);
  };

  // Convert 12hr time string (e.g. "8:30 PM") to 24hr "HH:mm:ss"
  function convertTo24Hour(timeStr) {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":");
    if (hours === "12") {
      hours = "00";
    }
    if (modifier === "PM") {
      hours = parseInt(hours, 10) + 12;
    }
    return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
  }

  // Handle time picker change
  const onTimeChange = (event, selected) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selected) {
      let hours = selected.getHours();
      let minutes = selected.getMinutes();
      let ampm = "AM";
      if (hours >= 12) {
        ampm = "PM";
        if (hours > 12) hours -= 12;
      } else if (hours === 0) {
        hours = 12;
      }
      const timeStr = `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
      setModalData({ ...modalData, time: timeStr });
    }
  };

  // Delete reminder
  const handleDelete = (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          fetch(`${BASE_URL}/delete_schedule/${id}`, {
            method: "DELETE",
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.status === "success") {
                setReminders((old) => old.filter((r) => r.id !== id));
                if (modalVisible) setModalVisible(false);
              } else {
                Alert.alert("Error", "Failed to delete");
              }
            })
            .catch(() => Alert.alert("Error", "Failed to delete"));
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        markingType={"multi-dot"}
          theme={{
    backgroundColor: darkMode ? "#121212" : "#fff",
    calendarBackground: darkMode ? "#121212" : "#fff",
    textSectionTitleColor: darkMode ? "#eee" : "#333",    // Month names, weekdays labels
    textDisabledColor: darkMode ? "#555" : "#d9e1e8",     // Disabled days color
    selectedDayBackgroundColor: darkMode ? "#3399ff" : "#007bff",
    selectedDayTextColor: "#fff",
    todayTextColor: darkMode ? "#66aaff" : "#007bff",
    dayTextColor: darkMode ? "#eee" : "#333",             // Normal day numbers
    arrowColor: darkMode ? "#66aaff" : "#007bff",
    monthTextColor: darkMode ? "#66aaff" : "#007bff",
    dotColor: darkMode ? "#3399ff" : "#007bff",            // The dots under dates
    selectedDotColor: "#ffffff",
    disabledArrowColor: darkMode ? "#444" : "#d9e1e8",
        }}
      />

      {/* Filters & Today Button */}
      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={[styles.todayButton, darkMode && styles.todayButtonDark]}
          onPress={() => setSelectedDate(todayStr)}
        >
          <Text style={[styles.todayText, darkMode && styles.todayTextDark]}>
            Today
          </Text>
        </TouchableOpacity>

        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, darkMode && styles.textLight]}>
            Category:
          </Text>
          <TouchableOpacity
            onPress={() =>
              setFilterCategory(
                filterCategory === "All" ? "Work" : filterCategory === "Work" ? "Personal" : "All"
              )
            }
            style={[styles.filterButton, darkMode && styles.filterButtonDark]}
          >
            <Text style={[styles.filterText, darkMode && styles.textLight]}>
              {filterCategory}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, darkMode && styles.textLight]}>
            Status:
          </Text>
          <TouchableOpacity
            onPress={() =>
              setFilterDone(
                filterDone === "All" ? "Done" : filterDone === "Done" ? "Not Done" : "All"
              )
            }
            style={[styles.filterButton, darkMode && styles.filterButtonDark]}
          >
            <Text style={[styles.filterText, darkMode && styles.textLight]}>
              {filterDone}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <TextInput
        placeholder="Search reminders..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        style={[styles.searchInput, darkMode && styles.searchInputDark]}
        placeholderTextColor={darkMode ? "#aaa" : "#666"}
      />

      {/* Reminder List */}
      <FlatList
        data={filteredReminders}
        keyExtractor={(item) => item.id.toString()}
        style={{ flex: 1 }}
        ListEmptyComponent={() => (
          <Text style={[styles.emptyText, darkMode && styles.textLight]}>
            No reminders for this date.
          </Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => openEditModal(item)}
            style={[styles.reminderItem, darkMode && styles.reminderItemDark]}
          >
            <View style={styles.reminderInfo}>
              <Text
                style={[
                  styles.reminderTitle,
                  darkMode && styles.textLight,
                  item.done && styles.reminderDone,
                ]}
              >
                {item.title}
              </Text>
              <Text style={[styles.reminderMeta, darkMode && styles.textLight]}>
                {item.time.split("T")[1].slice(0, 5)} | {item.category} |{" "}
                {item.recurring}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              style={styles.deleteButton}
            >
              <Text style={{ color: "red" }}>Delete</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* Add Reminder Button */}
      <TouchableOpacity
        style={[styles.addButton, darkMode && styles.addButtonDark]}
        onPress={openAddModal}
      >
        <Text style={[styles.addButtonText, darkMode && styles.textLight]}>
          + Add Reminder
        </Text>
      </TouchableOpacity>

      {/* Modal for Add/Edit */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={[styles.modalOverlay]}>
          <View style={[styles.modalContainer, darkMode && styles.darkModal]}>
            <Text style={[styles.modalTitle, darkMode && styles.textLight]}>
              {modalMode === "add" ? "Add Reminder" : "Edit Reminder"}
            </Text>

            <TextInput
              placeholder="Title"
              value={modalData.title}
              onChangeText={(text) => setModalData({ ...modalData, title: text })}
              style={[styles.modalInput, darkMode && styles.inputDark]}
              placeholderTextColor={darkMode ? "#aaa" : "#666"}
            />

            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              style={[styles.timePickerButton, darkMode && styles.filterButtonDark]}
            >
              <Text style={[styles.filterText, darkMode && styles.textLight]}>
                Time: {modalData.time}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={onTimeChange}
              />
            )}

            <Text style={[styles.filterLabel, darkMode && styles.textLight]}>
              Category:
            </Text>
            <View style={styles.categoryRow}>
              {["All", "Work", "Personal", "Shopping", "Other"].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setModalData({ ...modalData, category: cat })}
                  style={[
                    styles.categoryButton,
                    modalData.category === cat && styles.categorySelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      modalData.category === cat && styles.categoryTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.filterLabel, darkMode && styles.textLight]}>
              Recurring:
            </Text>
            <View style={styles.categoryRow}>
              {["None", "Daily", "Weekly", "Monthly"].map((rec) => (
                <TouchableOpacity
                  key={rec}
                  onPress={() => setModalData({ ...modalData, recurring: rec })}
                  style={[
                    styles.categoryButton,
                    modalData.recurring === rec && styles.categorySelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      modalData.recurring === rec && styles.categoryTextSelected,
                    ]}
                  >
                    {rec}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>


            <View style={styles.modalButtonsRow}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title="Save" onPress={handleSubmitReminder} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// === Styles ===
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  filtersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  filterGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterLabel: {
    fontWeight: "bold",
    marginRight: 6,
  },
  filterButton: {
    backgroundColor: "#eee",
    padding: 6,
    borderRadius: 8,
  },
  filterButtonDark: {
    backgroundColor: "#333",
  },
  filterText: {},
  textLight: {
    color: "#eee",
  },
  todayButton: {
    backgroundColor: "#007bff",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  todayButtonDark: {
    backgroundColor: "#3399ff",
  },
  todayText: {
    color: "#fff",
    fontWeight: "bold",
  },
  todayTextDark: {
    color: "#fff",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    marginBottom: 10,
    fontSize: 16,
  },
  searchInputDark: {
    borderColor: "#555",
    color: "#eee",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
    color: "#666",
  },
  reminderItem: {
    backgroundColor: "#f0f0f0",
    marginVertical: 4,
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reminderItemDark: {
    backgroundColor: "#222",
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  reminderDone: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  reminderMeta: {
    fontSize: 12,
    color: "#666",
  },
  deleteButton: {
    paddingHorizontal: 8,
  },
  addButton: {
    backgroundColor: "#007bff",
    padding: 14,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  addButtonDark: {
    backgroundColor: "#3399ff",
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#000000AA",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
  },
  darkModal: {
    backgroundColor: "#222",
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    marginBottom: 14,
    fontSize: 16,
  },
  inputDark: {
    borderColor: "#555",
    color: "#eee",
  },
  timePickerButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#eee",
    marginBottom: 14,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  categoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#ddd",
  },
  categorySelected: {
    backgroundColor: "#007bff",
  },
  categoryText: {
    color: "#333",
    fontWeight: "600",
  },
  categoryTextSelected: {
    color: "#fff",
  },
  doneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  doneCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 6,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  doneCheckMark: {
    fontSize: 18,
    color: "#007bff",
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
});
