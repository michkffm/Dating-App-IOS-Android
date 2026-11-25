import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DemoProvider, colors } from "../src/experience";
import { LIVE_ENABLED } from "../src/live-api";

export default function Layout() {
  return (
    <DemoProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: colors.purple }, headerTintColor: "#fff", headerBackTitle: "Zurück", headerShadowVisible: false }}>
        <Stack.Screen name="index" options={{ title: "HeartPulse" }} />
        <Stack.Protected guard={!LIVE_ENABLED} redirectTo="/live">
          <Stack.Screen name="welcome" options={{ title: "Demo-Profil" }} />
          <Stack.Screen name="home" options={{ title: "Entdecken" }} />
          <Stack.Screen name="profile" options={{ title: "Profil & Datenschutz" }} />
          <Stack.Screen name="matches" options={{ title: "Demo-Matches" }} />
        </Stack.Protected>
        <Stack.Screen name="live" options={{ title: "HeartPulse · Konto" }} />
      </Stack>
    </DemoProvider>
  );
}
