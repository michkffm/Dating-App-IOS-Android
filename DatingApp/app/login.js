import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { getCountryCodes } from "./getCountryCodes"; // Importer la fonction
import { useRouter } from "expo-router";

const Login = () => {
  const [countryCode, setCountryCode] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countries, setCountries] = useState([]);
  const router = useRouter();

  // Fonction pour valider l'email
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex simple pour valider un email
    return regex.test(email);
  };

  // Fonction pour valider le numéro de téléphone
  const validatePhoneNumber = (phoneNumber) => {
    return phoneNumber.length >= 10; // Vérification simple pour un numéro de téléphone (ex : 10 chiffres)
  };

  const handleSubmit = () => {
    if (validateEmail(email) || validatePhoneNumber(phoneNumber)) {
      // Si l'email ou le téléphone est valide, rediriger vers l'écran "Home"
      router.push("/home"); // Remplace "/home" par le chemin exact de ton écran "Home"
    } else {
      Alert.alert("Erreur", "Veuillez entrer un email ou un numéro de téléphone valide.");
    }
  };
  

  useEffect(() => {
    // Récupérer les codes de pays lors du chargement du composant
    const fetchCountryCodes = async () => {
      try {
        const data = await getCountryCodes();
        const sortedCountries = data.sort((a, b) => a.country.localeCompare(b.country)); // Tri des pays par ordre alphabétique
        setCountries(sortedCountries); // Mettre à jour l'état avec les pays triés
        setCountryCode(sortedCountries[0]?.countryCode); // Définir le premier code de pays par défaut
      } catch (error) {
        console.error("Erreur lors de la récupération des codes de pays", error);
      }
    };

    fetchCountryCodes();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {/* Sélection du code de pays */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Country</Text>
        <Picker
          selectedValue={countryCode}
          style={styles.picker}
          onValueChange={(itemValue) => setCountryCode(itemValue)}
        >
          {Array.isArray(countries) && countries.length > 0 ? (
            countries.map((country, index) => (
              <Picker.Item
                key={index}
                label={`${country.country} ${country.countryCode}`}
                value={country.countryCode}
              />
            ))
          ) : (
            <Picker.Item label="Chargement..." value="" />
          )}
        </Picker>
      </View>

      {/* Saisie du numéro de téléphone */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Your Phone Number"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
      </View>

      {/* Saisie de l'email */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Your Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
      </View>

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
    backgroundColor: "#F8F9FA", // Fond doux
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
    marginBottom: 8,
  },
  picker: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#6200EE",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    maxWidth: 300, // Limiter la largeur du bouton
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default Login;
