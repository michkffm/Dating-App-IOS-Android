import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";


const ProductScreen = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPrice, setFilterPrice] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://192.168.178.102:5000/products");
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des produits :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSearch = () => {
    const filtered = products.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const handleFilter = () => {
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    let filtered = [...products];

    if (filterPrice) {
      filtered = filtered.filter(
        (item) => item.price <= parseFloat(filterPrice)
      );
    }

    setFilteredProducts(filtered);
    setShowFilterModal(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.price}>${item.price}</Text>
      <Text style={styles.category}>{item.category}</Text>
      <Link
        href={{ pathname: "/buy", params: { id: item._id } }}
        asChild
      >
        <TouchableOpacity style={styles.linkButtonSecondary}>
          <Text style={styles.linkTextSecondary}>Buy</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search products..."
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.button} onPress={handleSearch}>
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton} onPress={handleFilter}>
          <Ionicons name="filter" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Products</Text>
            <TextInput
              placeholder="Max Price"
              value={filterPrice}
              onChangeText={setFilterPrice}
              keyboardType="numeric"
              style={styles.modalInput}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={{ color: "#fff" }}>Apply</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Products List */}
      <FlatList
        data={filteredProducts.length > 0 ? filteredProducts : products}
        renderItem={renderItem}
        keyExtractor={(item) => item._id} // Ajouter l'index pour garantir l'unicité
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 16,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: "#777",
    marginBottom: 6,
  },
  price: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6200EE",
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    color: "#999",
    marginBottom: 8,
  },
  linkButtonSecondary: {
    backgroundColor: "#6200EE",
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: "flex-end",
    paddingHorizontal: 30,
  },
  linkTextSecondary: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#6200EE",
    padding: 10,
    borderRadius: 8,
  },
  filterButton: {
    backgroundColor: "#03DAC5",
    padding: 10,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  applyButton: {
    backgroundColor: "#6200EE",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#999",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },
});

export default ProductScreen;
