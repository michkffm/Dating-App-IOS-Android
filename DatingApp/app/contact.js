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
  const [countries, setCountries] = useState(() => []);

  useEffect(() => {
    // Récupérer les codes de pays lors du chargement du composant
    const fetchCountryCodes = async () => {
      try {
        const data = await getCountryCodes();
        setCountries(data); // Mettre à jour l'état avec les données de l'API
        setCountryCode(data[0]?.countryCode); // Définir le premier code de pays par défaut
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des codes de pays",
          error
        );
      }
    };

    fetchCountryCodes();
  }, []);

  const handleContinue = () => {
    console.log(`Numéro saisi: ${countryCode} ${phoneNumber}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Können wir deine Telefonnummer bekommen?</Text>

      <View style={styles.inputContainer}>
        <View style={styles.countryCodeContainer}>
          <Text style={styles.label}>Land</Text>
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

        <View style={styles.phoneNumberContainer}>
          <Text style={styles.label}>Telefonnummer</Text>
          <TextInput
            style={styles.phoneNumberInput}
            placeholder="123456789"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>
      </View>

      <Text style={styles.infoText}>
        Wir senden oft einen Code per SMS, um zu bestätigen, dass du wirklich du
        bist. Für Nachrichten und Daten fallen ggf. Gebühren an. Was passiert,
        wenn sich deine Telefonnummer ändert?
      </Text>
      <Link href="/welcome" asChild>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Weiter</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    marginBottom: 30,
  },
  countryCodeContainer: {
    flex: 1,
    marginRight: 10,
  },
  phoneNumberContainer: {
    flex: 2,
  },
  label: {
    marginBottom: 8,
    color: "#666",
  },
  countryCodePicker: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  phoneNumberInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 15,
  },
  infoText: {
    color: "#666",
    marginBottom: 30,
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default PhoneNumberScreen;
