import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";

const Email = () => {
  const [email, setEmail] = useState("");
  const router = useRouter();

  // Fonction pour valider l'email
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex simple pour valider un email
    return regex.test(email);
  };

  const handleSubmit = () => {
    if (validateEmail(email)) {
      // Si l'email est valide, rediriger vers l'écran "Home"
      router.push("/welcome"); // Remplace "/home" par le chemin exact de ton écran "Home"
    } else {
      // Afficher un message d'erreur si l'email est invalide
      Alert.alert("Erreur", "Veuillez entrer un email valide.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter your Email</Text>

      {/* Champ de saisie pour l'email */}
      <TextInput
        style={styles.input}
        placeholder="Your Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      {/* Bouton de soumission */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    width: "100%",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#6200EE",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Email;
