import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React from "react";
import { Link } from "expo-router";

const Payment = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose a payment method</Text>
      </View>

      <Link href="/orange" asChild>
        <TouchableOpacity style={styles.buttonSecondary}>
          <Text style={styles.buttonTextSecondary}>Orange Money and MTN Mobile Money</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/paypal" asChild>
        <TouchableOpacity style={styles.buttonSecondary}>
          <Text style={styles.buttonTextSecondary}>Paypal or Credit Card</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f7f7f7", // Couleur de fond douce
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  buttonSecondary: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 50,
    marginVertical: 10,
    width: "80%",
    borderWidth: 1,
    borderColor: "#ddd", // Bordure subtile pour un look élégant
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonTextSecondary: {
    color: "#333",
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default Payment;
