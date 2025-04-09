import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Link } from "expo-router";

const About = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register now</Text>
      <Text style={styles.subtitle}>
      choose a way to register :
      </Text>

      <View style={styles.buttonsContainer}>
        <Link href="/contact" asChild>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryText}>Phone</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/email" asChild>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Email</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F6",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  buttonsContainer: {
    width: "100%",
    alignItems: "center",
    gap: 20,
  },
  primaryButton: {
    backgroundColor: "#6200EE",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: "80%",
    alignItems: "center",
    elevation: 4,
  },
  primaryText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "#6200EE",
    width: "80%",
    alignItems: "center",
  },
  secondaryText: {
    color: "#6200EE",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default About;
