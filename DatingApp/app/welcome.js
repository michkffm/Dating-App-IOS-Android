import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const Welcome = () => {
  const [firstName, setFirstName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState(null);
  const [lookingFor, setLookingFor] = useState(null);
  const [relationshipStatus, setRelationshipStatus] = useState(null);  

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Saisie du prénom */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Wie heisst du mit Vorname?</Text>
          <TextInput
            style={styles.input}
            placeholder="Vorname"
            value={firstName}
            onChangeText={setFirstName}
          />
        </View>

        {/* Saisie de la date de naissance */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dein Geburtstag?</Text>
          <TextInput
            style={styles.input}
            placeholder="Geburtstag (z.B. 01/01/2000)"
            value={birthDate}
            onChangeText={setBirthDate}
            keyboardType="numeric"
          />
          <Text style={styles.note}>
            Dein Profil zeigt dein Alter, nicht dein Geburtsdatum.
          </Text>
        </View>

        {/* Sélection du genre */}
        <View style={styles.genderGroup}>
          <Text style={styles.label}>Was ist dein Geschlecht?</Text>
          <Text style={styles.note}>
            Wähle dein Geschlecht aus, du kannst es später ändern.
          </Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === "Mann" && styles.selectedGender,
              ]}
              onPress={() => setGender("Mann")}
            >
              <Text style={styles.genderText}>Mann</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === "Frau" && styles.selectedGender,
              ]}
              onPress={() => setGender("Frau")}
            >
              <Text style={styles.genderText}>Frau</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sélection de qui rencontrer */}
        <View style={styles.meetingGroup}>
          <Text style={styles.label}>Wen möchtest du kennenlernen?</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                lookingFor === "Mann" && styles.selectedGender,
              ]}
              onPress={() => setLookingFor("Mann")}
            >
              <Text style={styles.genderText}>Mann</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                lookingFor === "Frau" && styles.selectedGender,
              ]}
              onPress={() => setLookingFor("Frau")}
            >
              <Text style={styles.genderText}>Frau</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sélection du statut de relation */}
<View style={styles.genderGroup}>
  <Text style={styles.label}>Wonach suchst du hier?</Text>
  <Text style={styles.note}>
    Das kann sich auch mal ändern, kein Thema. Hier finden alle etwas Passendes.
  </Text>
  <View style={styles.genderContainer}>
    <TouchableOpacity
      style={[
        styles.genderButton,
        relationshipStatus === "Fest & ernsthafte Beziehung" && styles.selectedGender,
      ]}
      onPress={() => setRelationshipStatus("Fest & ernsthafte Beziehung")}
    >
      <Ionicons name="heart" size={24} color="black" />
      <Text style={styles.genderText}>Fest & ernsthafte Beziehung</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.genderButton,
        relationshipStatus === "Feste Beziehung mal sehen" && styles.selectedGender,
      ]}
      onPress={() => setRelationshipStatus("Feste Beziehung mal sehen")}
    >
      <Ionicons name="heart-outline" size={24} color="black" />
      <Text style={styles.genderText}>Feste Beziehung mal sehen</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.genderButton,
        relationshipStatus === "Nix Ernstes, offen für Festes" && styles.selectedGender,
      ]}
      onPress={() => setRelationshipStatus("Nix Ernstes, offen für Festes")}
    >
      <Ionicons name="heart-half" size={24} color="black" />
      <Text style={styles.genderText}>Nix Ernstes, offen für Festes</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.genderButton,
        relationshipStatus === "Nix Ernste" && styles.selectedGender,
      ]}
      onPress={() => setRelationshipStatus("Nix Ernste")}
    >
      <Ionicons name="people" size={24} color="black" />
      <Text style={styles.genderText}>Nix Ernste</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.genderButton,
        relationshipStatus === "Neue Freunde Finden" && styles.selectedGender,
      ]}
      onPress={() => setRelationshipStatus("Neue Freunde Finden")}
    >
      <Ionicons name="heart-circle-outline" size={24} color="black" />
      <Text style={styles.genderText}>Neue Freunde Finden</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.genderButton,
        relationshipStatus === "weiss ich noch nicht" && styles.selectedGender,
      ]}
      onPress={() => setRelationshipStatus("weiss ich noch nicht")}
    >
      <Ionicons name="help-circle-outline" size={24} color="black" />
      <Text style={styles.genderText}>weiss ich noch nicht</Text>
    </TouchableOpacity>
  </View>
</View>

        {/* Bouton "Weiter" */}
        <Link href="/profile" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Weiter</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  note: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  genderGroup: {
    marginTop: 20,
  },
  meetingGroup: {
    marginTop: 20,
  },
  genderContainer: {
    flexDirection: "row",
    flexWrap: "wrap",  // Allow wrapping to next line
    justifyContent: "space-between", // Evenly space out the buttons
  },
  genderButton: {
    width: "30%",  // Ensures 3 buttons per row
    padding: 15,
    marginVertical: 5, // Add some space between buttons vertically
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    alignItems: "center",
  },
  selectedGender: {
    backgroundColor: "#007AFF",
  },
  genderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  button: {
    marginTop: 20,
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

export default Welcome;
