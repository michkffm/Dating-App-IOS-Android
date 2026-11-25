import React from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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

export function Field({ label, ...props }) {
  return (
    <View style={local.field}>
      <Text style={styles.body}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor={colors.text} {...props}
        style={[styles.input, props.multiline && local.multiline]} />
    </View>
  );
}

export function Person({ person, token, children, showImage = true }) {
  const source = photoSource(person.photo, token);
  return (
    <View style={styles.card}>
      {showImage && (source
        ? <Image source={source} accessibilityLabel={"Profilfoto von " + person.nickname} style={local.photo} resizeMode="cover" />
        : <View style={local.avatar}><Ionicons name="person-circle-outline" color={colors.purple} size={72} accessible={false} /></View>)}
      <Text accessibilityRole="header" style={styles.heading}>{person.nickname}, {person.age}</Text>
      {person.bio ? <Text style={styles.body}>{person.bio}</Text> : null}
      {children}
    </View>
  );
}

const local = StyleSheet.create({
  field: { gap: 4 },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  avatar: { width: "100%", minHeight: 132, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "#EFE5FF" },
  photo: { width: "100%", aspectRatio: 4 / 3, borderRadius: 18, backgroundColor: "#EFE5FF" },
});
