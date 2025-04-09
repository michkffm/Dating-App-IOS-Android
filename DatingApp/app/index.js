import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons"; // ou 'react-native-vector-icons/Ionicons'

import Home from "./screens/HomeScreen";
import Product from "./screens/ProductScreen";
import Settings from "./screens/SettingsScreen";
import { CartProvider } from "./CartContext";
import CartScreen from "./card";

const Drawer = createDrawerNavigator();

export default function Index() {
  return (
     <CartProvider>
       <Drawer.Navigator
        initialRouteName="HeartPulse"
        screenOptions={{
          headerStyle: {
            backgroundColor: "#6200EE",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 22,
          },
          drawerStyle: {
            backgroundColor: "#F8F9FA",
            width: 260,
          },
          drawerActiveTintColor: "#6200EE",
          drawerInactiveTintColor: "#333",
          drawerLabelStyle: {
            fontSize: 18,
            marginLeft: -10,
          },
        }}
      >
        <Drawer.Screen
          name="HeartPulse"
          component={Home}
          options={{
            drawerIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
            title: "HeartPulse",
          }}
        />
        <Drawer.Screen
          name="Product"
          component={Product}
          options={{
            drawerIcon: ({ color, size }) => (
              <Ionicons name="pricetags-outline" size={size} color={color} />
            ),
            title: "Products",
          }}
        />
        <Drawer.Screen
          name="Settings"
          component={Settings}
          options={{
            drawerIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
            title: "Settings",
          }}
        />
      </Drawer.Navigator>
     </CartProvider>
  );
}
