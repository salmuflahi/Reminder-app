import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
  Modal,
  Pressable,
  Platform,
  RefreshControl,
} from 'react-native';
import { ThemeContext } from '../ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BASE_URL from './config';

const categories = ['All', 'Work', 'Personal', 'Urgent', 'Other'];
const recurringOptions = ['None', 'Daily', 'Weekly', 'Monthly'];
const categoryColors = {
  Work: '#007AFF',
  Personal: '#4CAF50',
  Urgent: '#FF3B30',
  Other: '#8E8E93',
};

function formatTime(date) {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

function formatDateString(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function parseDateTime(datetimeStr) {
  const d = new Date(datetimeStr);
  return isNaN(d) ? new Date() : d;
}

export default function RemindersScreen({ user, profilePic, navigation }) {
  const { darkMode } = useContext(ThemeContext);

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(null); // 'date' or 'time'
  const [editing, setEditing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [category, setCategory] = useState('Personal');
  const [recurring, setRecurring] = useState('None');
  const [reminders, setReminders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortAsc, setSortAsc] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [headerSearchVisible, setHeaderSearchVisible] = useState(false);
  const [headerSearchTerm, setHeaderSearchTerm] = useState('');

  useEffect(() => {
    setSearchTerm(headerSearchTerm);
  }, [headerSearchTerm]);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = () => {
    setRefreshing(true);
    fetch(`${BASE_URL}/activities?user=${user}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          const fixedReminders = data.reminders.map((r) => ({
            ...r,
            category: r.category || 'Personal',
            recurring: r.recurring || 'None',
          }));
          setReminders(fixedReminders);
        } else {
          Alert.alert('Error fetching reminders');
        }
      })
      .catch(() => Alert.alert('Error fetching reminders'))
      .finally(() => setRefreshing(false));
  };

  const resetForm = () => {
    setTitle('');
    setDate(new Date());
    setEditing(false);
    setEditingItem(null);
    setCategory('Personal');
    setRecurring('None');
    setModalVisible(false);
    setShowPicker(null);
  };

  const handleSave = () => {
    if (!title.trim()) {
      return Alert.alert('Please enter a title');
    }

    const bodyData = {
      user,
      title,
      time: date.toISOString(),
      category,
      recurring,
    };

    const url = editing && editingItem
      ? `${BASE_URL}/update_schedule/${editingItem.id}`
      : `${BASE_URL}/add_schedule`;

    const method = editing ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          fetchReminders();
          resetForm();
        } else {
          Alert.alert('Failed to save reminder');
        }
      })
      .catch(() => Alert.alert('Failed to save reminder'));
  };

  const toggleDone = (id, done) => {
    const reminderToUpdate = reminders.find((r) => r.id === id);
    if (!reminderToUpdate) return;

    const updatedData = {
      user,
      title: reminderToUpdate.title,
      time: reminderToUpdate.time,
      category: reminderToUpdate.category,
      recurring: reminderToUpdate.recurring,
      done: !done,
    };

    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, done: !done } : r))
    );

    fetch(`${BASE_URL}/update_schedule/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || data.status !== 'success') {
          // Revert on failure
          setReminders((prev) =>
            prev.map((r) => (r.id === id ? { ...r, done: done } : r))
          );
          Alert.alert('Failed to update reminder');
        }
      })
      .catch(() => {
        setReminders((prev) =>
          prev.map((r) => (r.id === id ? { ...r, done: done } : r))
        );
        Alert.alert('Failed to update reminder');
      });
  };

  const openEdit = (item) => {
    setTitle(item.title);
    setCategory(item.category || 'Personal');
    setRecurring(item.recurring || 'None');
    setDate(parseDateTime(item.time));
    setEditing(true);
    setEditingItem(item);
    setModalVisible(true);
  };

  const deleteReminder = (id) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            fetch(`${BASE_URL}/delete_schedule/${id}`, {
              method: 'DELETE',
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.status === 'success') {
                  setReminders((prev) => prev.filter((r) => r.id !== id));
                } else {
                  Alert.alert('Failed to delete reminder');
                }
              })
              .catch(() => Alert.alert('Failed to delete reminder'));
          },
        },
      ]
    );
  };

  const filteredReminders = useMemo(() => {
    let list = reminders;
    if (selectedCategory !== 'All')
      list = list.filter((r) => r.category === selectedCategory);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((r) => r.title.toLowerCase().includes(term));
    }
    return list
      .slice()
      .sort((a, b) => {
        const timeA = new Date(a.time);
        const timeB = new Date(b.time);
        return sortAsc ? timeA - timeB : timeB - timeA;
      });
  }, [reminders, selectedCategory, searchTerm, sortAsc]);

  const renderReminder = ({ item }) => {
    const catColor = categoryColors[item.category] || categoryColors.Other;
    const reminderDate = new Date(item.time);

    return (
      <View
        style={[
          styles.reminder,
          darkMode ? styles.reminderDark : styles.reminderLight,
          { borderLeftColor: catColor },
        ]}
      >
        <TouchableOpacity
          onPress={() => toggleDone(item.id, item.done)}
          style={styles.doneToggleBtn}
        >
          {item.done ? (
            <Ionicons name="checkmark-circle" size={28} color={catColor} />
          ) : (
            <Ionicons name="ellipse-outline" size={28} color={catColor} />
          )}
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.reminderText,
              darkMode && styles.textDark,
              item.done && styles.doneText,
            ]}
          >
            {item.title}
          </Text>
          <Text
            style={[
              styles.reminderSubText,
              darkMode && styles.textDark,
              item.done && styles.doneText,
            ]}
          >
            {formatDateString(reminderDate)} • {formatTime(reminderDate)}{' '}
            {item.category !== 'Other' ? `• ${item.category}` : ''}
          </Text>
          {item.recurring !== 'None' && (
            <Text style={[styles.recurringText, darkMode && styles.textDark]}>
              🔁 {item.recurring}
            </Text>
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
            <FontAwesome5
              name="edit"
              size={20}
              color={darkMode ? '#fff' : '#000'}
              solid
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deleteReminder(item.id)}
            style={styles.actionBtn}
          >
            <FontAwesome5
              name="trash"
              size={20}
              color={darkMode ? '#fff' : '#000'}
              solid
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      {/* Topbar */}
      <View style={[styles.topbarMain, darkMode && styles.topbarMainDark]}>
        {!headerSearchVisible ? (
          <View
            style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' }}
          >
            <TouchableOpacity
              onPress={() => setHeaderSearchVisible(true)}
              style={styles.searchIconBtn}
            >
              <FontAwesome5
                name="search"
                size={20}
                color={darkMode ? '#fff' : '#007AFF'}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <TextInput
              style={[
                styles.searchInput,
                darkMode && styles.inputDark,
                { flex: 1, marginRight: 10 },
              ]}
              placeholder="Search reminders..."
              placeholderTextColor={darkMode ? '#aaa' : '#666'}
              value={headerSearchTerm}
              onChangeText={setHeaderSearchTerm}
              autoFocus
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            <TouchableOpacity
              onPress={() => {
                setHeaderSearchTerm('');
                setHeaderSearchVisible(false);
              }}
            >
              <FontAwesome5
                name="times"
                size={20}
                color={darkMode ? '#fff' : '#000'}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Category filter */}
      <View style={[styles.topbarCategories, darkMode && styles.topbarCategoriesDark]}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.categoryBtn,
              selectedCategory === cat && {
                backgroundColor: categoryColors[cat] || '#007AFF',
                borderColor: categoryColors[cat] || '#007AFF',
              },
              darkMode && styles.categoryBtnDark,
            ]}
          >
            <Text
              style={[
                styles.categoryBtnText,
                selectedCategory === cat && { color: '#fff' },
                selectedCategory !== cat && darkMode && styles.textDark,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sort button */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          onPress={() => setSortAsc((v) => !v)}
          style={[styles.sortBtn, darkMode && styles.sortBtnDark]}
        >
          <FontAwesome5
            name={sortAsc ? 'sort-amount-up' : 'sort-amount-down'}
            size={18}
            color={darkMode ? '#fff' : '#000'}
          />
          <Text style={[styles.sortBtnText, darkMode && styles.textDark]}>
            Sort by Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reminders list */}
      <FlatList
        style={{ flex: 1, paddingHorizontal: 10 }}
        data={filteredReminders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderReminder}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchReminders} />
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, darkMode && styles.textDark]}>
            No reminders found
          </Text>
        }
      />

      {/* Add/Edit Button */}
      <TouchableOpacity
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
        style={[styles.addBtn, darkMode && styles.addBtnDark]}
      >
        <FontAwesome5 name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Modal for add/edit reminder */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, darkMode && styles.textDark]}>
              {editing ? 'Edit Reminder' : 'Add Reminder'}
            </Text>

            <TextInput
              style={[styles.input, darkMode && styles.inputDark]}
              placeholder="Reminder Title"
              placeholderTextColor={darkMode ? '#aaa' : '#666'}
              value={title}
              onChangeText={setTitle}
            />

            {/* Date Picker Button */}
            <TouchableOpacity
              onPress={() => setShowPicker('date')}
              style={[styles.timePickerBtn, darkMode && styles.timePickerBtnDark]}
            >
              <Text style={[styles.timePickerText, darkMode && styles.textDark]}>
                {formatDateString(date)}
              </Text>
            </TouchableOpacity>

            {/* Time Picker Button */}
            <TouchableOpacity
              onPress={() => setShowPicker('time')}
              style={[styles.timePickerBtn, darkMode && styles.timePickerBtnDark]}
            >
              <Text style={[styles.timePickerText, darkMode && styles.textDark]}>
                {formatTime(date)}
              </Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={date}
                mode={showPicker} // 'date' or 'time'
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  if (Platform.OS !== 'ios') setShowPicker(null);
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}

            {/* Category picker */}
            <View style={styles.categoryPickerContainer}>
              {categories
                .filter((c) => c !== 'All')
                .map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.categoryOption,
                      category === cat && { backgroundColor: categoryColors[cat] },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        category === cat && { color: '#fff' },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>

            {/* Recurring picker */}
            <View style={styles.recurringPickerContainer}>
              {recurringOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setRecurring(opt)}
                  style={[
                    styles.recurringOption,
                    recurring === opt && { backgroundColor: '#007AFF' },
                  ]}
                >
                  <Text
                    style={[
                      styles.recurringOptionText,
                      recurring === opt && { color: '#fff' },
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtnsRow}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.saveBtn]} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  containerDark: { backgroundColor: '#121212' },

  topbarMain: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  topbarMainDark: {
    borderColor: '#333',
  },

  searchIconBtn: {
    marginRight: 15,
  },

  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    borderColor: '#ccc',
    color: '#000',
    backgroundColor: '#fff',
  },
  inputDark: {
    borderColor: '#444',
    color: '#fff',
    backgroundColor: '#222',
  },

  topbarCategories: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  topbarCategoriesDark: {
    borderColor: '#333',
  },

  categoryBtn: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  categoryBtnDark: {
    borderColor: '#4A90E2',
  },

  categoryBtnText: {
    color: '#007AFF',
    fontWeight: '500',
  },

  sortContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#000',
  },
  sortBtnDark: {
    borderColor: '#fff',
  },
  sortBtnText: {
    marginLeft: 8,
    fontWeight: '500',
    color: '#000',
  },

  reminder: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
    borderLeftWidth: 6,
    backgroundColor: '#f7f7f7',
    alignItems: 'center',
  },
  reminderDark: {
    backgroundColor: '#1e1e1e',
  },
  reminderLight: {
    backgroundColor: '#f7f7f7',
  },

  doneToggleBtn: {
    marginRight: 12,
  },

  reminderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  reminderSubText: {
    fontSize: 14,
    color: '#444',
  },
  recurringText: {
    fontSize: 13,
    color: '#555',
  },
  doneText: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  textDark: {
    color: '#eee',
  },

  actionsRow: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  actionBtn: {
    marginLeft: 12,
  },

  addBtn: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  addBtnDark: {
    backgroundColor: '#4A90E2',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalContentDark: {
    backgroundColor: '#222',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
    color: '#000',
  },

  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    color: '#000',
  },

  timePickerBtn: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#efefef',
    borderRadius: 10,
    marginBottom: 15,
  },
  timePickerBtnDark: {
    backgroundColor: '#333',
  },
  timePickerText: {
    fontSize: 16,
    color: '#000',
  },

  categoryPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  categoryOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#ddd',
  },
  categoryOptionText: {
    fontWeight: '500',
    color: '#000',
  },

  recurringPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  recurringOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#ddd',
  },
  recurringOptionText: {
    fontWeight: '500',
    color: '#000',
  },

  modalBtnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  cancelBtn: {
    backgroundColor: '#ccc',
  },
  cancelBtnText: {
    fontWeight: '700',
    color: '#333',
  },
  saveBtn: {
    backgroundColor: '#007AFF',
  },
  saveBtnText: {
    fontWeight: '700',
    color: '#fff',
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#888',
  },
});
