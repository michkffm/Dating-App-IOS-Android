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
          backgroundColor: "#6200EE",
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
        options={{ headerTitle: "About you" }}
      />
      <Stack.Screen name="profile" options={{ headerTitle: "Profile Bild" }} />
      <Stack.Screen
        name="(drawer)/(tabs)/feed"
        options={{ headerTitle: "Feed" }}
      />
      <Stack.Screen name="phone" options={{ headerTitle: "Phone Number" }} />
      <Stack.Screen name="email" options={{ headerTitle: "Email" }} />
      <Stack.Screen name="buy" options={{ headerTitle: "Buy" }} />
      <Stack.Screen name="card" options={{ headerTitle: "Card" }} />
      <Stack.Screen name="info" options={{ headerTitle: "Information" }} />
      <Stack.Screen name="payment" options={{ headerTitle: "Payment" }} />
      <Stack.Screen name="paypal" options={{ headerTitle: "Paypal" }} />
      <Stack.Screen name="orange" options={{ headerTitle: "Pay with Cinetpay" }} />
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
