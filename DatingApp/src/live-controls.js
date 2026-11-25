import React, { useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, styles } from "./experience";
import { photoSource } from "./live-api";

export function LiveScreen({ children, busy, error, notice }) {
  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.outer}>
        <View style={styles.content}>
          {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.alert}>{error}</Text> : null}
          {notice ? <Text accessibilityLiveRegion="polite" style={styles.body}>{notice}</Text> : null}
          {busy ? <ActivityIndicator accessibilityLabel="Wird geladen" color={colors.purple} /> : null}
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function AuthHeading({ title }) {
  return (
    <View style={local.authHeader}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    </View>
  );
}

export function AccountLinks({ children }) {
  return <View style={local.accountLinks}>{children}</View>;
}

export function TextAction({ label, onPress, disabled }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [local.textAction, (pressed || disabled) && styles.dim]}>
      <Text style={local.actionLabel}>{label}</Text>
    </Pressable>
  );
}

export function LiveNavigation({ tabs, pane, busy, onSelect }) {
  return (
    <View style={local.navigation}>
      {tabs.map(([key, label, icon]) => {
        const selected = pane === key || (key === "matches" && pane === "chat");
        return (
          <Pressable key={key} accessibilityRole="button" accessibilityLabel={label} aria-current={selected || undefined} accessibilityState={{ disabled: busy }}
            disabled={busy} onPress={() => onSelect(key)}
            style={({ pressed }) => [local.navItem, selected && local.navSelected, (pressed || busy) && styles.dim]}>
            <Ionicons name={icon} size={19} color={selected ? "#fff" : colors.purple} accessible={false} aria-hidden={true} />
            <Text style={[local.actionLabel, selected && local.navSelectedLabel]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function EmptyState({ icon, title, detail, children }) {
  return (
    <View style={[styles.card, local.empty]}>
      <View style={local.brandMark}>
        <Ionicons name={icon} size={24} color={colors.purple} accessible={false} aria-hidden={true} />
      </View>
      <Text accessibilityRole="header" style={[styles.heading, local.center]}>{title}</Text>
      <Text style={[styles.body, local.center]}>{detail}</Text>
      {children}
    </View>
  );
}

export function Message({ sender, message, own, timestamp }) {
  return (
    <View style={[local.message, own && local.ownMessage]}>
      <Text style={styles.kicker}>{sender}</Text>
      <Text style={styles.body}>{message}</Text>
      {timestamp ? <Text style={local.timestamp}>{timestamp}</Text> : null}
    </View>
  );
}

export function Field({ label, onFocus, onBlur, multiline, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={local.field}>
      <Text style={styles.body}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor={colors.text} {...props} multiline={multiline}
        onFocus={(event) => { setFocused(true); onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); onBlur?.(event); }}
        style={[styles.input, local.input, multiline && local.multiline, focused && local.focusedInput]} />
    </View>
  );
}

export function Person({ person, token, children, showImage = true }) {
  const source = photoSource(person.photo, token);
  return (
    <View style={styles.card}>
      {showImage && (source
        ? <Image source={source} accessibilityLabel={"Profilfoto von " + person.nickname} style={local.photo} resizeMode="cover" />
        : <View style={local.avatar}><Ionicons name="person-circle-outline" color={colors.purple} size={72} accessible={false} aria-hidden={true} /></View>)}
      <Text accessibilityRole="header" style={styles.heading}>{person.nickname}, {person.age}</Text>
      {person.bio ? <Text style={styles.body}>{person.bio}</Text> : null}
      {children}
    </View>
  );
}

const local = StyleSheet.create({
  authHeader: { alignItems: "flex-start", gap: 8, paddingTop: 8, paddingBottom: 4 },
  brandMark: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#EFE5FF", alignItems: "center", justifyContent: "center" },
  accountLinks: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 4 },
  textAction: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  actionLabel: { color: "#44119E", fontSize: 14, fontWeight: "700", textAlign: "center" },
  navigation: { flexDirection: "row", backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 5, gap: 4 },
  navItem: { flex: 1, minWidth: 0, minHeight: 52, alignItems: "center", justifyContent: "center", paddingVertical: 6, paddingHorizontal: 2, gap: 3, borderRadius: 12 },
  navSelected: { backgroundColor: colors.purple },
  navSelectedLabel: { color: "#fff" },
  empty: { alignItems: "center", paddingVertical: 28 },
  center: { textAlign: "center" },
  message: { alignSelf: "flex-start", maxWidth: "86%", gap: 4, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 },
  ownMessage: { alignSelf: "flex-end", backgroundColor: "#EFE5FF" },
  timestamp: { color: colors.text, fontSize: 13 },
  field: { gap: 4 },
  input: { borderWidth: 2 },
  focusedInput: { borderColor: colors.purple },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  avatar: { width: "100%", minHeight: 132, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "#EFE5FF" },
  photo: { width: "100%", aspectRatio: 4 / 3, borderRadius: 18, backgroundColor: "#EFE5FF" },
});
