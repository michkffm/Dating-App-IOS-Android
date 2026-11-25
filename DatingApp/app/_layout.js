import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DemoProvider, colors } from "../src/experience";
import { LIVE_ENABLED } from "../src/live-api";

function BrandTitle() {
  return (
    <View accessibilityRole="header" accessibilityLabel="HeartPulse" style={brand.row}>
      <View style={brand.mark}>
        <Ionicons name="heart" size={17} color={colors.pink} accessible={false} aria-hidden={true} />
      </View>
      <Text style={brand.wordmark}>HeartPulse</Text>
    </View>
  );
}

const brand = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 9 },
  mark: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#EFE5FF", alignItems: "center", justifyContent: "center" },
  wordmark: { color: "#fff", fontSize: 20, fontWeight: "800" },
});

export default function Layout() {
  return (
    <DemoProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: colors.purple }, headerTintColor: "#fff", headerBackTitle: "Zurück", headerShadowVisible: false }}>
        <Stack.Screen name="index" options={{ title: "HeartPulse", ...(LIVE_ENABLED && { headerTitle: BrandTitle }) }} />
        <Stack.Protected guard={!LIVE_ENABLED} redirectTo="/live">
          <Stack.Screen name="welcome" options={{ title: "Demo-Profil" }} />
          <Stack.Screen name="home" options={{ title: "Entdecken" }} />
          <Stack.Screen name="profile" options={{ title: "Profil & Datenschutz" }} />
          <Stack.Screen name="matches" options={{ title: "Demo-Matches" }} />
        </Stack.Protected>
        <Stack.Screen name="live" options={{ title: "HeartPulse", headerTitle: BrandTitle }} />
      </Stack>
    </DemoProvider>
  );
}
