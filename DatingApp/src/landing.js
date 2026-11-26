import React, { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
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
    <Screen contentStyle={local.content} screenStyle={Platform.OS === "web" ? local.heartCursor : undefined}>
      <View style={[styles.card, local.hero, wide && local.wideHero]}>
        <LandingHearts wide={wide} />
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

function LandingHearts({ wide }) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    let animation;
    function clearMotion() {
      animation?.stop();
      drift.setValue(0);
    }
    function updateMotion(reduce) {
      if (!mounted) return;
      clearMotion();
      if (reduce) return;
      animation = Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 1050, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(drift, { toValue: 0, duration: 1250, easing: Easing.inOut(Easing.cubic), useNativeDriver: Platform.OS !== "web" }),
      ]);
      animation.start();
    }
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
      const onChange = ({ matches }) => { if (matches) clearMotion(); };
      if (motion) updateMotion(motion.matches);
      motion?.addEventListener?.("change", onChange);
      return () => { mounted = false; motion?.removeEventListener?.("change", onChange); animation?.stop(); };
    }
    AccessibilityInfo.isReduceMotionEnabled().then(updateMotion).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (reduce) => { if (reduce) clearMotion(); });
    return () => { mounted = false; subscription.remove(); animation?.stop(); };
  }, [drift]);

  const rise = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -9] });
  const sway = drift.interpolate({ inputRange: [0, 1], outputRange: [0, 5] });
  return (
    <View testID="landing-hearts" style={[local.hearts, wide && local.wideHearts]} pointerEvents="none" aria-hidden={true}
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[local.firstHeart, { transform: [{ translateY: rise }, { rotate: "-16deg" }] }]}>
        <Ionicons name="heart" size={wide ? 46 : 26} color="#F5CDDC" />
      </Animated.View>
      <Animated.View style={[local.secondHeart, { transform: [{ translateX: sway }, { rotate: "18deg" }] }]}>
        <Ionicons name="heart-outline" size={wide ? 32 : 22} color="#F1BBCE" />
      </Animated.View>
      {wide && <Animated.View style={[local.thirdHeart, { transform: [{ translateY: rise }, { rotate: "11deg" }] }]}>
        <Ionicons name="heart" size={21} color="#F9DDE7" />
      </Animated.View>}
    </View>
  );
}

function LandingLink({ href, label, secondary = false }) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={label}>
        {({ pressed, hovered }) => (
          <View style={[styles.button, secondary && styles.secondary, hovered && local.linkHover, pressed && styles.dim]}>
            <Text style={[styles.buttonLabel, secondary && styles.secondaryLabel]}>{label}</Text>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

const heartCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M12 21C8 17 2 13 2 7.8 2 2.6 8.7 1.1 12 5.8 15.3 1.1 22 2.6 22 7.8 22 13 16 17 12 21Z' fill='%23EFB4C9' stroke='%238A2D50' stroke-width='1.4'/%3E%3C/svg%3E") 12 12, auto`;

const local = StyleSheet.create({
  heartCursor: { cursor: heartCursor },
  linkHover: { opacity: 0.86 },
  content: { maxWidth: 880, gap: 20 },
  hero: { alignItems: "flex-start", gap: 14 },
  wideHero: { padding: 36 },
  hearts: { position: "absolute", end: 16, top: 21, width: 78, height: 60 },
  wideHearts: { end: 27, top: 39, width: 118, height: 90 },
  firstHeart: { position: "absolute", top: 13, start: 8 },
  secondHeart: { position: "absolute", top: 0, end: 0 },
  thirdHeart: { position: "absolute", top: 61, end: 12 },
  brandMark: { width: 60, height: 60, borderRadius: 20, backgroundColor: "#EFE5FF", alignItems: "center", justifyContent: "center" },
  intro: { maxWidth: 570 },
  steps: { gap: 12 },
  wideSteps: { flexDirection: "row" },
  step: { flex: 1, minWidth: 0 },
  stepTitle: { color: colors.ink, fontSize: 18, fontWeight: "700" },
});
