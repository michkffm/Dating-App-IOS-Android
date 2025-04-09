import React, { useEffect, useState } from "react";
import { Alert, Linking, StyleSheet, View, TouchableOpacity, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PayButton = () => {
  const [total, setTotal] = useState("0.00");

  useEffect(() => {
    const loadTotal = async () => {
      try {
        const storedTotal = await AsyncStorage.getItem("cartTotal");
        if (storedTotal) {
          setTotal(storedTotal);
        }
      } catch (err) {
        console.error("Erreur lors du chargement du total :", err);
      }
    };

    loadTotal();
  }, []);

  const handlePayment = async () => {
    try {
      const res = await fetch("http://192.168.178.102:5000/api/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: total,
          description: "Achat d’un produit",
          customer_name: "John",
          customer_surname: "Doe",
          customer_email: "john.doe@example.com",
          customer_phone_number: "+237650000000",
        }),
      });

      const data = await res.json();
      console.log(data);

      if (data.payment_url) {
        Linking.openURL(data.payment_url);
      } else {
        Alert.alert("Erreur", "Erreur lors de la génération du lien de paiement.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Une erreur est survenue.");
    }
  };

  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity onPress={handlePayment} style={styles.payButton}>
        <Text style={styles.payButtonText}>Pay ${total}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  payButton: {
    backgroundColor: "#6200EE",
    padding: 15,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
  },
  payButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default PayButton;
