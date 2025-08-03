import React, { useState, useEffect, useContext } from 'react';
import { TouchableOpacity, View, Text, Alert } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, DrawerActions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';

import AuthScreen from './screens/AuthScreen';
import RemindersScreen from './screens/RemindersScreen';
import DashboardScreen from './screens/DashboardScreen';
import CalendarScreen from './screens/CalendarScreen';
import AchievementsScreen from './screens/AchievementsScreen';
import SettingsScreen from './screens/SettingsScreen';
import SupportScreen from './screens/SupportScreen';
import AboutScreen from './screens/AboutScreen';

import { ThemeProvider, ThemeContext } from './ThemeContext';
import { registerForPushNotificationsAsync } from './utils/notifications';
import BASE_URL from './config';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function TabNavigator({ user }) {
  const { darkMode } = useContext(ThemeContext);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerStyle: { paddingTop: 20, height: 80 },
        tabBarStyle: { backgroundColor: darkMode ? '#111' : '#fff' },
        tabBarActiveTintColor: darkMode ? '#fff' : '#007bff',
      }}
    >
      <Tab.Screen
        name="Reminders"
        options={({ navigation }) => ({
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={{ marginLeft: 15 }}
            >
              <FontAwesome name="bars" size={24} color={darkMode ? '#fff' : '#000'} />
            </TouchableOpacity>
          ),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="check-square" color={color} size={size} />
          ),
          headerTitle: 'Reminders',
        })}
      >
        {(props) => (
          <RemindersScreen {...props} user={user} />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ color, size }) => <FontAwesome name="calendar" color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="Dashboard"
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="th-large" color={color} size={size} />
          ),
        }}
      >
        {(props) => <DashboardScreen {...props} username={user} />}
      </Tab.Screen>

    </Tab.Navigator>
  );
}

function createStackScreen(Component, title, propsToPass = {}) {
  return function StackScreen({ navigation }) {
    const { darkMode } = useContext(ThemeContext);
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerTitle: title,
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: darkMode ? '#121212' : '#fff',
            paddingTop: 20,
            height: 80,
            shadowColor: 'transparent',
          },
          headerTintColor: darkMode ? '#fff' : '#000',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={{ marginLeft: 15 }}
            >
              <FontAwesome name="bars" size={24} color={darkMode ? '#fff' : '#000'} />
            </TouchableOpacity>
          ),
        }}
      >
        <Stack.Screen name={title}>
          {(props) => <Component {...props} {...propsToPass} />}
        </Stack.Screen>
      </Stack.Navigator>
    );
  };
}

const AchievementsStack = (props) => createStackScreen(AchievementsScreen, 'Achievements', { user: props.user })(props);
const SupportStack = createStackScreen(SupportScreen, 'Support');
const AboutStack = createStackScreen(AboutScreen, 'About');

function SettingsStack(props) {
  const { user } = props;
  const StackScreen = createStackScreen(SettingsScreen, 'Settings', { user });
  return <StackScreen {...props} />;
}

function CustomDrawerContent(props) {
  const { user, setUser } = props;

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          setUser(null);
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await axios.delete(`${BASE_URL}/delete_user/${user}`);
      if (response.data.status === "success") {
        Alert.alert("Account Deleted", "Your account has been deleted.");
        setUser(null);
      } else {
        Alert.alert("Error", "Something went wrong.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to delete your account.");
    }
  };

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Logout"
        labelStyle={{ fontWeight: '600', color: '#f44' }}
        icon={({ color, size }) => (
          <FontAwesome name="sign-out" color={color} size={size} />
        )}
        onPress={handleLogout}
      />
      <DrawerItem
        label="Delete Account"
        labelStyle={{ fontWeight: '600', color: '#f00' }}
        icon={({ color, size }) => (
          <FontAwesome name="trash" color={color} size={size} />
        )}
        onPress={() =>
          Alert.alert(
            "Delete Account",
            "Are you sure? This can't be undone.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: handleDeleteAccount },
            ],
            { cancelable: true }
          )
        }
      />
    </DrawerContentScrollView>
  );
}

function DrawerNavigator({ user, setUser }) {
  const { darkMode } = useContext(ThemeContext);

  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <CustomDrawerContent {...props} user={user} setUser={setUser} />
      )}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: darkMode ? '#222' : '#fff' },
        drawerActiveTintColor: '#3b82f6',
        drawerInactiveTintColor: darkMode ? '#aaa' : '#444',
      }}
    >
      <Drawer.Screen name="Home" options={{ drawerLabel: 'Reminders & Calendar' }}>
        {(props) => <TabNavigator {...props} user={user} />}
      </Drawer.Screen>
      <Drawer.Screen name="Achievements" options={{ drawerLabel: 'Achievements' }}>
        {(props) => <AchievementsStack {...props} user={user} />}
      </Drawer.Screen>
      <Drawer.Screen name="Settings">
        {(props) => <SettingsStack {...props} user={user} />}
      </Drawer.Screen>
      <Drawer.Screen name="Support" component={SupportStack} />
      <Drawer.Screen name="About" component={AboutStack} />
    </Drawer.Navigator>
  );
}

function AppNavigator() {
  const [user, setUser] = useState(null);
  const { darkMode, setDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    async function registerNotifications() {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        console.log('Registered for push notifications with token:', token);
      }
    }

    registerNotifications();

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetch(`${BASE_URL}/user_profile?username=${user}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            setDarkMode(data.profile.dark_mode);
          }
        })
        .catch(() => setDarkMode(true));
    } else {
      setDarkMode(true);
    }
  }, [user]);

  return (
    <NavigationContainer theme={darkMode ? DarkTheme : DefaultTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth">
            {(props) => <AuthScreen {...props} onLogin={(username) => setUser(username)} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="DrawerMain">
            {(props) => <DrawerNavigator {...props} user={user} setUser={setUser} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
