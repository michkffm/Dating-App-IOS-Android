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
          <Text style={styles.label}>What is your first name?</Text>
          <TextInput
            style={styles.input}
            placeholder="First name"
            value={firstName}
            onChangeText={setFirstName}
          />
        </View>

        {/* Saisie de la date de naissance */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your birthday?</Text>
          <TextInput
            style={styles.input}
            placeholder="Birthday (ex. 01/01/2000)"
            value={birthDate}
            onChangeText={setBirthDate}
            keyboardType="numeric"
          />
          <Text style={styles.note}>
            Your profile shows your age, not your date of birth.
          </Text>
        </View>

        {/* Sélection du genre */}
        <View style={styles.genderGroup}>
          <Text style={styles.label}>What is your gender?</Text>
          <Text style={styles.note}>
            Choose your gender, you can change it later.
          </Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === "Man" && styles.selectedGender,
              ]}
              onPress={() => setGender("Man")}
            >
              <Text style={styles.genderText}>Man</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === "Woman" && styles.selectedGender,
              ]}
              onPress={() => setGender("Woman")}
            >
              <Text style={styles.genderText}>Woman</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sélection de qui rencontrer */}
        <View style={styles.meetingGroup}>
          <Text style={styles.label}>Who would you like to get to know?</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                lookingFor === "Man" && styles.selectedGender,
              ]}
              onPress={() => setLookingFor("Man")}
            >
              <Text style={styles.genderText}>Man</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                lookingFor === "Woman" && styles.selectedGender,
              ]}
              onPress={() => setLookingFor("Woman")}
            >
              <Text style={styles.genderText}>Woman</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sélection du statut de relation */}
        <View style={styles.genderGroup}>
          <Text style={styles.label}>What are you looking for here?</Text>
          <Text style={styles.note}>
            That can change from time to time, no problem. Everyone will find
            something suitable.
          </Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                relationshipStatus === "serious relationship" &&
                  styles.selectedGender,
              ]}
              onPress={() =>
                setRelationshipStatus("serious relationship")
              }
            >
              <Ionicons name="heart" size={24} color="black" />
              <Text style={styles.genderText}>serious relationship</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                relationshipStatus === "Nothing serious" &&
                  styles.selectedGender,
              ]}
              onPress={() => setRelationshipStatus("Nothing serious")}
            >
              <Ionicons name="people" size={24} color="black" />
              <Text style={styles.genderText}>Nothing serious</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                relationshipStatus === "Find new friends" &&
                  styles.selectedGender,
              ]}
              onPress={() => setRelationshipStatus("Find new friends")}
            >
              <Ionicons name="heart-circle-outline" size={24} color="black" />
              <Text style={styles.genderText}>Find new friends</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                relationshipStatus === "I don't know yet" &&
                  styles.selectedGender,
              ]}
              onPress={() => setRelationshipStatus("I don't know yet")}
            >
              <Ionicons name="help-circle-outline" size={24} color="black" />
              <Text style={styles.genderText}>I don't know yet</Text>
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
    flexWrap: "wrap", // Allow wrapping to next line
    justifyContent: "space-between", // Evenly space out the buttons
  },
  genderButton: {
    width: "30%", // Ensures 3 buttons per row
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
    backgroundColor: "#6200EE",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 70,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default Welcome;
