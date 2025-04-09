import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link } from "expo-router";
import PayButton from "./orange";

const CartScreen = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem("cart");
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          setCart(parsedCart);
          await calculateTotal(parsedCart);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du panier :", error);
      }
    };

    loadCart();
  }, []);

  const updateCartAndTotal = async (updatedCart) => {
    setCart(updatedCart);
    await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
    await calculateTotal(updatedCart);
  };

  const increaseQuantity = async (productId) => {
    const updatedCart = cart.map((item) => {
      if (item._id === productId) {
        return { ...item, quantity: item.quantity + 1 };
      }
      return item;
    });
    await updateCartAndTotal(updatedCart);
  };

  const decreaseQuantity = async (productId) => {
    const updatedCart = cart
      .map((item) => {
        if (item._id === productId) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      })
      .filter((item) => item.quantity > 0); // Supprimer l’item s’il atteint 0
    await updateCartAndTotal(updatedCart);
  };

  const calculateTotal = async (cartItems) => {
    const totalPrice = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const formattedTotal = totalPrice.toFixed(2);
    setTotal(formattedTotal);

    try {
      await AsyncStorage.setItem("cartTotal", formattedTotal);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du total :", error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.cartContainer}>
        {cart.length === 0 ? (
          <Text style={styles.emptyMessage}>Your basket is empty.</Text>
        ) : (
          cart.map((item) => (
            <View key={item._id} style={styles.cartItem}>
              <View style={styles.itemRow}>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.description}>{item.description}</Text>
                  <Text style={styles.itemPrice}>${item.price}</Text>
                </View>

                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    onPress={() => decreaseQuantity(item._id)}
                    style={styles.qtyButton}
                  >
                    <Text style={styles.qtyButtonText}>–</Text>
                  </TouchableOpacity>

                  <Text style={styles.itemQuantity}> {item.quantity} </Text>

                  <TouchableOpacity
                    onPress={() => increaseQuantity(item._id)}
                    style={styles.qtyButton}
                  >
                    <Text style={styles.qtyButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.itemTotal}>
                Total: ${(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))
        )}
      </View>

      {cart.length > 0 && (
        <>
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Total : ${total}</Text>
          </View>

          <Link href="/info" asChild>
            <TouchableOpacity style={styles.linkButtonSecondary}>
              <Text style={styles.linkTextSecondary}>
              Continue to payment
              </Text>
            </TouchableOpacity>
          </Link>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  cartContainer: {
    marginBottom: 20,
  },
  cartItem: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  itemPrice: {
    fontSize: 16,
    color: "#6200EE",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 10,
  },
  qtyButton: {
    backgroundColor: "#6200EE",
    padding: 6,
    borderRadius: 6,
    marginHorizontal: 10,
  },
  qtyButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: "bold",
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginTop: 5,
  },
  totalContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  totalText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  linkButtonSecondary: {
    backgroundColor: "#6200EE",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom:120,
  },
  linkTextSecondary: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  itemDetails: {
    flex: 1,
  },
});

export default CartScreen;
