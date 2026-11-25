import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { colors, Screen, styles } from "./experience";

const steps = [
  ["person-outline", "Profil erstellen", "Zeigen Sie mit einem Foto und ein paar Worten, wer Sie sind."],
  ["heart-outline", "Ein Match finden", "Entdecken Sie Profile. Ein Match entsteht, wenn Sie sich gegenseitig liken."],
  ["chatbubble-outline", "Ins Gespräch kommen", "Schreiben Sie sich nach dem Match direkt in HeartPulse."],
];

export function Landing() {
  const { width } = useWindowDimensions();
  const wide = width >= 780;
  return (
    <Screen contentStyle={local.content}>
      <View style={[styles.card, local.hero, wide && local.wideHero]}>
        <View style={local.brandMark}>
          <Ionicons name="heart" size={32} color={colors.pink} accessible={false} aria-hidden={true} />
        </View>
        <Text style={styles.kicker}>HEARTPULSE</Text>
        <Text accessibilityRole="header" style={styles.title}>Vom Match zum Date</Text>
        <Text style={[styles.body, local.intro]}>Entdecken Sie Menschen, die Sie kennenlernen möchten. Wenn das Interesse auf beiden Seiten da ist, können Sie direkt miteinander schreiben.</Text>
        <View style={styles.row}>
          <LandingLink href={{ pathname: "/live", params: { mode: "register" } }} label="Konto erstellen" />
          <LandingLink href="/live" label="Anmelden" secondary />
        </View>
        <Text style={styles.body}>Für Erwachsene ab 18 Jahren.</Text>
      </View>
      <Text accessibilityRole="header" style={styles.heading}>So funktioniert HeartPulse</Text>
      <View style={[local.steps, wide && local.wideSteps]}>
        {steps.map(([icon, title, detail]) => (
          <View key={title} style={[styles.card, wide && local.step]}>
            <Ionicons name={icon} size={24} color={colors.purple} accessible={false} aria-hidden={true} />
            <Text accessibilityRole="header" style={local.stepTitle}>{title}</Text>
            <Text style={styles.body}>{detail}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

function LandingLink({ href, label, secondary = false }) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={label}>
        {({ pressed }) => (
          <View style={[styles.button, secondary && styles.secondary, pressed && styles.dim]}>
            <Text style={[styles.buttonLabel, secondary && styles.secondaryLabel]}>{label}</Text>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

const local = StyleSheet.create({
  content: { maxWidth: 880, gap: 20 },
  hero: { alignItems: "flex-start", gap: 14 },
  wideHero: { padding: 36 },
  brandMark: { width: 60, height: 60, borderRadius: 20, backgroundColor: "#EFE5FF", alignItems: "center", justifyContent: "center" },
  intro: { maxWidth: 570 },
  steps: { gap: 12 },
  wideSteps: { flexDirection: "row" },
  step: { flex: 1, minWidth: 0 },
  stepTitle: { color: colors.ink, fontSize: 18, fontWeight: "700" },
});
