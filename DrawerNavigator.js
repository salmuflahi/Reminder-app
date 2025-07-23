// DrawerNavigator.js
import React, { useContext } from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Alert } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { ThemeContext } from './ThemeContext';

import TabNavigator from './TabNavigator'; 

import SettingsScreen from './screens/SettingsScreen';
import SupportScreen from './screens/SupportScreen';
import AboutScreen from './screens/AboutScreen';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator({ user, setUser, profilePic, setProfilePic }) {
  const { darkMode } = useContext(ThemeContext);

  function CustomDrawerContent(props) {
    return (
      <DrawerContentScrollView {...props} style={{ backgroundColor: darkMode ? '#222' : '#fff' }}>
        <DrawerItemList {...props} />
        <DrawerItem
          label="Logout"
          icon={({ color, size }) => <FontAwesome name="sign-out" size={size} color={color} />}
          labelStyle={{ fontWeight: '600', color: darkMode ? '#fff' : '#000' }}
          onPress={() => {
            Alert.alert(
              "Logout",
              "Are you sure you want to log out?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Logout",
                  style: "destructive",
                  onPress: () => {
                    setUser(null);
                    setProfilePic(null);
                  }
                }
              ],
              { cancelable: true }
            );
          }}
        />
      </DrawerContentScrollView>
    );
  }

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: darkMode ? '#222' : '#fff' },
        drawerActiveTintColor: '#3b82f6',
        drawerInactiveTintColor: darkMode ? '#aaa' : '#444',
        drawerLabelStyle: { fontWeight: '600' },
      }}
      drawerContent={props => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="Home" options={{ drawerLabel: 'Reminders & Calendar' }}>
        {props => (
          <TabNavigator
            {...props}
            user={user}
            profilePic={profilePic}
            setProfilePic={setProfilePic}
          />
        )}
      </Drawer.Screen>

      <Drawer.Screen name="Achievements">
  {(props) => <AchievementsStack {...props} user={user} />}
</Drawer.Screen>

      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ drawerLabel: 'Settings' }}
      />

      <Drawer.Screen
        name="Support"
        component={SupportScreen}
        options={{ drawerLabel: 'Support' }}
      />

      <Drawer.Screen
        name="About"
        component={AboutScreen}
        options={{ drawerLabel: 'About' }}
      />

    </Drawer.Navigator>
  );
}
