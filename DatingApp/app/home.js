import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import React from "react";
import Icon from "react-native-vector-icons/MaterialIcons";

const handleOuiClick = () => {
  console.log("OUI clic");
};

const handleNonClick = () => {
  console.log("NON clic");
};

const handleMessageClick = () => {
  console.log("MESSAGE clic");
};

const Home = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerText}>HeartPulse</Text>
        </View>

        <View style={styles.profileContainer}>
          <View style={{ padding: 20, alignItems: "center" }}>
            <Icon name="favorite" size={64} color="#FF5864" />
            <Text>Beispielprofil · Fotos sind derzeit deaktiviert.</Text>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>Demo-Profil</Text>
            </View>

            <Text style={styles.nameText}>Gina 24</Text>
            <Text style={styles.interestsTitle}>Interessen</Text>

            <View style={styles.interestsContainer}>
              <Text style={styles.interestTag}>Spa</Text>
              <Text style={styles.interestTag}>Brunch</Text>
              <Text style={styles.interestTag}>Fitness</Text>
            </View>
          </View>
          <View style={styles.iconContainer}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleNonClick}
            >
              <Icon name="cancel" size={50} color="#FF5864" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleOuiClick}
            >
              <Icon name="check-circle" size={50} color="#4CAF50" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleMessageClick}
            >
              <Icon name="message" size={50} color="#2196F3" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    position: "relative",
  },
  header: {
    padding: 16,
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileContainer: {
    marginTop: 20,
    alignItems: "center",
    position: "relative",
  },
  profileImage: {
    width: 300,
    height: 400,
    borderRadius: 15,
    marginBottom: 20,
  },
  profileInfo: {
    width: "80%",
    position: "absolute",
    top: 300,
  },
  statusContainer: {
    backgroundColor: "green",
    padding: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  statusText: {
    color: "white",
    fontWeight: "bold",
    color: "white",
  },
  nameText: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "white",
  },
  interestsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "white",
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  interestTag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    fontWeight: "500",
  },
  imageGallery: {
    flexDirection: "row",
    marginTop: 20,
  },
  placeholderImage: {
    width: 400,
    height: 500,
    borderRadius: 10,
    marginRight: 10, // Ajoute un espacement entre les images
  },
  loader: {
    marginTop: 20,
    alignSelf: "center",
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "80%",
    bottom:20
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  iconText: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Home;
