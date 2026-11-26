import React, { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { empty, parseState } from "./demo.cjs";

export const colors = { purple: "#6200EE", ink: "#261641", text: "#584D68", paper: "#FAF7FF", border: "#E8DEF5", pink: "#BB244B" };
const KEY = "heartpulse.demo.v1";
const Context = createContext(null);

export function DemoProvider({ children }) {
  const [state, setState] = useState(empty);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let current = true;
    AsyncStorage.getItem(KEY).then((raw) => {
      if (current) setState(parseState(raw));
    }).catch(() => {
      if (current) setNotice("Der lokale Speicher ist nicht lesbar.");
    }).finally(() => {
      if (current) setReady(true);
    });
    return () => { current = false; };
  }, []);
  const busy = React.useRef(false);
  async function save(update, reset = false) {
    if (!ready || busy.current) return false;
    busy.current = true;
    try {
      const next = update(state);
      if (reset) await AsyncStorage.removeItem(KEY);
      else await AsyncStorage.setItem(KEY, JSON.stringify({ ...next, version: 1 }));
      setState(next);
      setNotice("");
      return true;
    } catch {
      setNotice("Änderung konnte nicht lokal gespeichert werden. Bitte erneut versuchen.");
      return false;
    } finally {
      busy.current = false;
    }
  }
  return (
    <Context.Provider value={{ state, ready, notice, save }}>
      {children}
    </Context.Provider>
  );
}
export const useDemo = () => useContext(Context);

export function Screen({ children, contentStyle, screenStyle }) {
  const { ready, notice } = useDemo();
  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={[styles.screen, screenStyle]}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.outer}>
        <View style={[styles.content, contentStyle]}>
          {notice ? <Text accessibilityRole="alert" style={styles.alert}>{notice}</Text> : null}
          {ready ? children : <ActivityIndicator color={colors.purple} accessibilityLabel="Lade Demo" />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Button({ label, onPress, secondary = false, disabled = false }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.button, secondary && styles.secondary, (pressed || disabled) && styles.dim]}>
      <Text style={[styles.buttonLabel, secondary && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  outer: { flexGrow: 1, padding: 20, paddingBottom: 32 },
  content: { width: "100%", maxWidth: 560, alignSelf: "center", gap: 16 },
  kicker: { color: colors.pink, fontWeight: "700", letterSpacing: 1.5, fontSize: 13 },
  title: { fontSize: 34, lineHeight: 40, color: colors.ink, fontWeight: "800" },
  body: { fontSize: 16, lineHeight: 24, color: colors.text },
  card: { backgroundColor: "#fff", borderColor: colors.border, borderWidth: 1, borderRadius: 24, padding: 22, gap: 12 },
  heading: { fontSize: 22, fontWeight: "700", color: colors.ink },
  button: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.purple },
  buttonLabel: { color: "#fff", textAlign: "center", fontSize: 16, fontWeight: "700" },
  secondary: { backgroundColor: "#EFE5FF" },
  secondaryLabel: { color: "#44119E" },
  dim: { opacity: 0.72 },
  alert: { color: "#91203B", fontSize: 15 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: "#F2EAFF", color: colors.ink, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7, fontSize: 14 },
  input: { padding: 12, minHeight: 48, color: colors.ink, borderColor: "#9B89B5", borderWidth: 1, borderRadius: 12, fontSize: 16 },
});
