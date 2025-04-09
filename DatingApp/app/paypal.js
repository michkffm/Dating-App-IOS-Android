import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";

const PayPalScreen = () => {
  const [orderId, setOrderId] = useState(null);

  const startPayment = async () => {
    try {
      const res = await fetch("http://192.168.178.102:5000/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: "10.00" }),
      });
      const data = await res.json();
      setOrderId(data.id);
    } catch (error) {
      console.log("Erreur de paiement :", error.message);
    }
  };

  if (orderId) {
    return (
      <WebView
        source={{ uri: `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}` }}
        onNavigationStateChange={(navState) => {
          if (navState.url.includes("success")) {
            alert("Paiement réussi !");
          }
        }}
      />
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <TouchableOpacity
        style={{
          backgroundColor: "#ffc439",
          padding: 15,
          borderRadius: 10,
          alignItems: "center",
        }}
        onPress={startPayment}
      >
        <Text style={{ color: "#000", fontWeight: "bold", fontSize: 16 }}>
          pay with paypal or with credit card
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default PayPalScreen;
