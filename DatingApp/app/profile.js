import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";

export default function Profile() {
  return (
    <View style={styles.page}>
      <Text style={styles.title}>HeartPulse</Text>
      <Text>Der Foto-Upload ist deaktiviert. Bitte keine persönlichen Fotos hochladen.</Text>
      <Link href="/home" style={styles.link}>Beispielprofil ansehen</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 24, gap: 14, backgroundColor: "#FAF7FF" },
  title: { color: "#6200EE", fontSize: 28, fontWeight: "700" },
  link: { color: "#6200EE", paddingVertical: 12 },
});
