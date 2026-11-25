import React from "react";
import { Text, View } from "react-native";
import { Screen, styles, useDemo } from "../src/experience";
import { matches } from "../src/demo.cjs";

export default function Matches() {
  const { state } = useDemo();
  const list = matches(state);
  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>Demo-Matches</Text>
      <Text style={styles.body}>Matches sind hier simuliert. Ein Chat mit echten Personen ist nicht verfügbar.</Text>
      {list.length === 0 ? <Text style={styles.body}>Noch keine Matches.</Text> : list.map(({ id, name, age }) => (
        <View key={id} style={styles.card}><Text style={styles.heading}>{name}, {age}</Text></View>
      ))}
    </Screen>
  );
}
