import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Buy = () => {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchProduct = async () => {
    try {
      const response = await fetch(
        `http://192.168.178.102:5000/products/${id}`
      );
      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error("Erreur lors du chargement du produit :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    const loadQuantity = async () => {
      try {
        if (product) {
          const storedQuantity = await AsyncStorage.getItem(
            `cart-${product._id}`
          );
          if (storedQuantity) {
            const parsedQty = parseInt(storedQuantity);
            if (!isNaN(parsedQty)) setQuantity(parsedQty);
            else setQuantity(1); // fallback
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement du panier :", error);
      }
    };

    loadQuantity();
  }, [product]);

  const saveQuantity = async (newQty) => {
    try {
      if (product) {
        if (newQty < 1) {
          await AsyncStorage.removeItem(`cart-${product._id}`);
        } else {
          await AsyncStorage.setItem(`cart-${product._id}`, newQty.toString());
        }
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde :", error);
    }
  };

  const increaseQuantity = () => {
    const newQty = quantity + 1;
    setQuantity(newQty);
    saveQuantity(newQty);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      const newQty = quantity - 1;
      setQuantity(newQty);
      saveQuantity(newQty);
    } else {
      setQuantity(0);
      saveQuantity(0);
    }
  };
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Produit introuvable</Text>
      </View>
    );
  }

  const handleOrder = async () => {
    try {
      const storedCart = await AsyncStorage.getItem("cart");
      const cart = storedCart ? JSON.parse(storedCart) : [];

      const existingProductIndex = cart.findIndex(
        (item) => item._id === product._id
      );

      if (existingProductIndex > -1) {
        // Si le produit existe déjà dans le panier, on met à jour sa quantité
        cart[existingProductIndex].quantity += quantity;
      } else {
        // Sinon, on ajoute le produit au panier
        cart.push({ ...product, quantity });
      }

      await AsyncStorage.setItem("cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Erreur lors de l'ajout au panier :", error);
    }
  };

  return (
    <View style={styles.container}>
      <Link href="/card" asChild>
        <TouchableOpacity style={styles.cartIconContainer}>
          <View>
            <Ionicons name="cart" size={28} color="#6200EE" />
            {quantity > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartCount}>{quantity}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Link>

      <View style={styles.card}>
        {product?.image && (
          <Image source={{ uri: product.image }} style={styles.image} />
        )}
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.price}>${product.price}</Text>
        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.quantityContainer}>
          <TouchableOpacity onPress={decreaseQuantity} style={styles.btn}>
            <Text style={styles.btnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantity}>{quantity}</Text>
          <TouchableOpacity onPress={increaseQuantity} style={styles.btn}>
            <Text style={styles.btnText}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.totalPrice}>
          Total: $
          {product.price && quantity
            ? (product.price * quantity).toFixed(2)
            : "0.00"}
        </Text>

        <Link href="/card" asChild>
          <TouchableOpacity style={styles.orderButton} onPress={handleOrder}>
            <Text style={styles.orderButtonText}>voir votre panier</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
};

export default Buy;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdfdfd",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cartIconContainer: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#ff3d00",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 1,
  },
  cartCount: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 10,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#222",
  },
  price: {
    fontSize: 20,
    fontWeight: "600",
    color: "#6200EE",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#555",
    lineHeight: 22,
    marginBottom: 20,
  },
  quantityContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  btn: {
    backgroundColor: "#6200EE",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 12,
  },
  btnText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  quantity: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  totalPrice: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
  },
  orderButton: {
    marginTop: 30,
    backgroundColor: "#03DAC6",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },
  orderButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
