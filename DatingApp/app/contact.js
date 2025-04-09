import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { getCountryCodes } from "./getCountryCodes"; // Importer la fonction
import { Link } from "expo-router";

const PhoneNumberScreen = () => {
  const [countryCode, setCountryCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countries, setCountries] = useState([]);

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

  const handleContinue = () => {
    console.log(`Numéro saisi: ${countryCode} ${phoneNumber}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Can we get your phone number?</Text>

      <View style={styles.inputContainer}>
        {/* Séparation entre le texte et le picker */}
        <View style={styles.countryLabelContainer}>
          <Text style={styles.label}>Country</Text>
        </View>

        <View style={styles.countryCodeContainer}>
          <Picker
            selectedValue={countryCode}
            style={styles.countryCodePicker}
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
      </View>

      {/* Champ de saisie du numéro de téléphone sur une autre ligne */}
      <View style={styles.phoneNumberContainer}>
        <Text style={styles.label}>Phone number</Text>
        <TextInput
          style={styles.phoneNumberInput}
          placeholder="123456789"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
      </View>

      <Text style={styles.infoText}>
        We often send a code by SMS to confirm that you really are you.
        Fees may apply for messages and data. What happens if your phone number changes?
      </Text>

      <Link href="/welcome" asChild>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F8F9FA", // Fond doux
    justifyContent: "center",
    alignItems: "center",
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
  countryLabelContainer: {
    marginBottom:5, // Ajoute un espacement entre le texte "Country" et le picker
  },
  countryCodeContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden", // Pour arrondir les coins du picker
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  phoneNumberContainer: {
    marginBottom: 5,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  countryCodePicker: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  phoneNumberInput: {
    width: 370,
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  infoText: {
    color: "#666",
    fontSize: 14,
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#6200EE",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    maxWidth: 300, // Limiter la largeur du bouton
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default PhoneNumberScreen;
