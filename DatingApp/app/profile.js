import React, { useState } from "react";
import {
  SafeAreaView,
  TouchableOpacity,
  Text,
  Image,
  View,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Link } from "expo-router";

export default function UploadPhoto() {
  const [images, setImages] = useState(Array(4).fill(null)); // Tableau de 4 images initialisées à null
  const [loading, setLoading] = useState(false);

  // Fonction pour choisir une image
  const pickImage = async (index) => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Correction ici
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const uri = result.assets[0].uri;
        const fileName = uri.split("/").pop();
        const newImages = [...images];
        newImages[index] = { uri, name: fileName };
        setImages(newImages);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
      console.error(error);
    }
  };

  // Fonction pour supprimer une image
  const removeImage = (index) => {
    const newImages = [...images];
    newImages[index] = null; // Remet l'index à null
    setImages(newImages);
  };

  // Fonction pour uploader les images
  const uploadImage = async () => {
    if (!images.some((image) => image?.uri)) {
      Alert.alert(
        "Erreur",
        "Veuillez sélectionner au moins une image avant de télécharger."
      );
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      images.forEach((image, index) => {
        if (image?.uri) {
          formData.append("file", {
            uri: image.uri,
            name: image.name || `photo_${index}.jpg`,
            type: "image/jpeg",
          });
        }
      });

      formData.append("upload_preset", "my_preset");
      formData.append("cloud_name", "dtmedui7o");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dtmedui7o/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (result.secure_url) {
        Alert.alert("Succès", "Images téléchargées avec succès");
        setImages(Array(4).fill(null)); // Réinitialise après téléchargement
      }
    } catch (error) {
      Alert.alert("Erreur", "Échec du téléchargement");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: "center" }}>
        {/* Container des images */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {[...Array(4)].map((_, index) => (
            <View
              key={index}
              style={{
                width: "48%",
                marginBottom: 20,
                position: "relative",
                height: 250,
                borderRadius: 8,
                overflow: "hidden",
                backgroundColor: "#ecf0f1", // Fond gris clair si aucune image
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {images[index]?.uri ? (
                <>
                  <Image
                    source={{ uri: images[index].uri }}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 8,
                      resizeMode: "cover",
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => removeImage(index)}
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      backgroundColor: "red",
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      justifyContent: "center",
                      alignItems: "center",
                      zIndex: 2,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 18,
                        fontWeight: "bold",
                      }}
                    >
                      ×
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={() => pickImage(index)}
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <Text style={{ fontSize: 40, color: "#7f8c8d" }}>+</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Bouton de téléchargement */}
        {images.some((image) => image?.uri) && (
          <TouchableOpacity
            onPress={uploadImage}
            style={{
              padding: 15,
              backgroundColor: "#2ecc71",
              borderRadius: 20,
              width: "80%",
              alignItems: "center",
              marginTop: 20,
            }}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Link href="/home">
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
              >
                Télécharger les images
              </Text>
              </Link>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
