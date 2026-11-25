import React, { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Screen, styles, useDemo } from "../src/experience";
import { empty } from "../src/demo.cjs";

export default function Profile() {
  const [confirm, setConfirm] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const { state, save } = useDemo();
  const router = useRouter();
  return (
    <Screen>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.heading}>{state.nickname || "Kein Demo-Spitzname"}</Text>
        <Text style={styles.body}>Die Demo speichert Ihren Spitznamen und Ihre Auswahl nur auf diesem Gerät. Sie lädt keine Profile oder Fotos hoch und sendet keine Likes an Dritte.</Text>
      </View>
      <Button label="Spitznamen ändern" onPress={() => router.push("/welcome")} />
      {deleted ? <Text accessibilityLiveRegion="polite" style={styles.body}>Lokale Demo-Daten gelöscht.</Text> : null}
      {confirm ? (
        <View style={styles.card}>
          <Text style={styles.body}>Spitzname, Likes und übersprungene Profile von diesem Gerät löschen?</Text>
          <Button label="Jetzt löschen" onPress={async () => {
            if (await save(empty, true)) { setConfirm(false); setDeleted(true); }
          }} />
          <Button label="Abbrechen" secondary onPress={() => setConfirm(false)} />
        </View>
      ) : <Button label="Demo-Daten löschen" secondary onPress={() => { setDeleted(false); setConfirm(true); }} />}
    </Screen>
  );
}
