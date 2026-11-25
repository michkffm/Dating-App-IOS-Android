import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { LIVE_ENABLED } from "../src/live-api";
import { Button, Screen, styles, colors } from "../src/experience";

export default function Index() {
  const router = useRouter();
  if (LIVE_ENABLED) return <Redirect href="/live" />;
  return (
    <Screen>
      <View style={styles.card}>
        <Ionicons name="heart" size={52} color={colors.pink} accessible={false} />
        <Text style={styles.kicker}>LOKALE DEMO</Text>
        <Text accessibilityRole="header" style={styles.title}>HeartPulse</Text>
        <Text style={styles.body}>Entdecken Sie Beispielprofile und erleben Sie, wie Likes und Matches funktionieren.</Text>
      </View>
      <Button label="Demo starten" onPress={() => router.push("/home")} />
      <Button label="Demo-Profil anlegen" secondary onPress={() => router.push("/welcome")} />
      <Text style={styles.body}>Die lokale Demo verwendet keine echten Profile, keine Anmeldung und keine Fotos oder Zahlungen.</Text>
    </Screen>
  );
}
