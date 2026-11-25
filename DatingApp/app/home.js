import React, { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, colors, Screen, styles, useDemo } from "../src/experience";
import { decide, matches, profiles } from "../src/demo.cjs";

export default function Home() {
  const { state, save } = useDemo();
  const [message, setMessage] = useState("");
  const router = useRouter();
  const next = profiles.find(({ id }) => !state.decisions[id]);
  async function choose(action) {
    const profile = next;
    const accepted = await save((previous) => decide(previous, profile.id, action));
    if (accepted) setMessage(action === "like" && profile.likesBack ? "Demo-Match mit " + profile.name + "!" : action === "like" ? "Like gespeichert." : "Profil übersprungen.");
  }
  return (
    <Screen>
      <Text style={styles.kicker}>HEARTPULSE · BEISPIELPROFILE</Text>
      <Text accessibilityRole="header" style={styles.title}>Entdecken</Text>
      {message ? <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text> : null}
      {next ? (
        <View style={styles.card}>
          <View style={{ backgroundColor: next.color, borderRadius: 20, minHeight: 150, justifyContent: "center", alignItems: "center" }}>
            <Ionicons name={next.icon} size={66} color={colors.purple} accessible={false} />
          </View>
          <Text accessibilityRole="header" style={styles.heading}>{next.name}, {next.age}</Text>
          <View style={styles.row}>{next.interests.map((interest) => <Text key={interest} style={styles.chip}>{interest}</Text>)}</View>
          <Button label="Gefällt mir" onPress={() => choose("like")} />
          <Button label="Überspringen" secondary onPress={() => choose("pass")} />
        </View>
      ) : (
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.heading}>Alle Beispiele angesehen</Text>
          <Text style={styles.body}>Unter „Profil & Datenschutz“ können Sie die Demo zurücksetzen.</Text>
        </View>
      )}
      <Button label={"Demo-Matches (" + matches(state).length + ")"} secondary onPress={() => router.push("/matches")} />
      <Button label="Profil & Datenschutz" secondary onPress={() => router.push("/profile")} />
    </Screen>
  );
}
