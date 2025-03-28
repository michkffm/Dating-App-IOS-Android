import { Button } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { useNavigation } from "@react-navigation/native";

const Layout = () => {
  const navigation = useNavigation();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "purple",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          headerRight: () => (
            <Button
              onPress={() => navigation.navigate("contact")}
              title="Contact"
            />
          ),
        }}
      />
      <Stack.Screen
        name="blog/index"
        options={{ headerTitle: "All Blog Posts" }}
      />
      <Stack.Screen name="contact" options={{ headerTitle: "Contact" }} />
      <Stack.Screen
        name="welcome"
        options={{ headerTitle: "Welcome to HeartPulse" }}
      />
      <Stack.Screen name="profile" options={{ headerTitle: "Profile Bild" }} />
      <Stack.Screen
        name="(drawer)/(tabs)/feed"
        options={{ headerTitle: "Feed" }}
      />
      <Stack.Screen name="phone" options={{ headerTitle: "Phone Number" }} />
      <Stack.Screen name="settings" options={{ headerTitle: "Settings" }} />
      <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
      <Stack.Screen
        name="blog/[id]"
        options={({ route }) => ({
          headerTitle: `Article ${route.params?.id || ""}`,
        })}
      />
    </Stack>
  );
};

export default Layout;
