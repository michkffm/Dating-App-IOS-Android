import { View, Text, Button, TouchableOpacity } from "react-native";
import React from "react";
import { Link, useRouter } from "expo-router";
import "react-native-gesture-handler";

const HomeScreen = () => {
  const router = useRouter();
  return (
    <View
      style={{
        flex: 1,
        flexDirection: "column",
        justifyContent: "space-around",
        alignContent: "center",
        margin: 10,
      }}
    >
      <View>
        <Text style={{ fontSize: 20, marginLeft: 110 }}>
          welcone to our app
        </Text>
      </View>
      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: 15,
        }}
      >
        {/* About Page Link */}
        <Link href="/register" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>Create account</Text>
          </TouchableOpacity>
        </Link>

        {/* Contact Page Link */}
        <Link href="/login" asChild>
          <TouchableOpacity style={styles.linkButtonSecondary}>
            <Text style={styles.linkTextSecondary}>Login</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
};
const styles = {
  linkButton: {
    backgroundColor: "#6200EE", // Couleur principale
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25, // Coins arrondis
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Ombre pour Android
  },
  linkText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    width: 140,
  },
  linkButtonSecondary: {
    backgroundColor: "#6200EE",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#6200EE",
  },
  linkTextSecondary: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    width: 140,
    paddingHorizontal: 40,
  },
};

export default HomeScreen;
