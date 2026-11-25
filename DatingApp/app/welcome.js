import React, { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Screen, styles, useDemo } from "../src/experience";
import { nickname } from "../src/demo.cjs";

export default function Welcome() {
  const { state, ready, save } = useDemo();
  if (!ready) return <Screen />;
  return <Editor initialValue={state.nickname} save={save} />;
}

function Editor({ initialValue, save }) {
  const [draft, setDraft] = useState(initialValue);
  const router = useRouter();
  return (
    <Screen>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.heading}>Ihr Demo-Profil</Text>
        <Text style={styles.body}>Wählen Sie einen erfundenen Spitznamen. Verwenden Sie keine persönlichen Angaben.</Text>
        <TextInput accessibilityLabel="Demo-Spitzname" placeholder="z. B. Sonnenwind" placeholderTextColor="#625571"
          autoComplete="off" autoCorrect={false} maxLength={24} style={styles.input} value={draft} onChangeText={setDraft} />
      </View>
      <Button label="Spitznamen speichern" disabled={!nickname(draft)} onPress={async () => {
        if (await save((previous) => ({ ...previous, nickname: nickname(draft) }))) router.replace("/home");
      }} />
    </Screen>
  );
}
