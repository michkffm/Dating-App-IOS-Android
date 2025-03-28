import { View, Text, Button } from 'react-native';
import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

const Layout = () => {
  const router = useRouter();  // Import du router

  return (
    <Tabs>
      <Tabs.Screen 
        name="feed" 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="list" size={size} color={color} />
          ),
          tabBarLabel: "Feed",
          headerTitle: "Feed",
          headerRight: () => (
            <Button title="New" onPress={() => router.push("/feed/new")} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
          tabBarLabel: "Profile",
          headerTitle: "Profile",
        }} 
      />
    </Tabs>
  );
};

export default Layout;
