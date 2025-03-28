import React from "react";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";
import { Text, SafeAreaView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

const Drawer = createDrawerNavigator();

// Screens
function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Home Screen</Text>
    </SafeAreaView>
  );
}

function FeedScreen() {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Feed Screen</Text>
    </SafeAreaView>
  );
}

// Custom Drawer Content
const CustomDrawerContent = (props) => {
  const navigation = useNavigation();

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItem
        icon={({ color, size }) => <Feather name="home" size={size} color={color} />}
        label="Home"
        onPress={() => navigation.navigate("contact")}
      />
      <DrawerItem
        icon={({ color, size }) => <Feather name="user" size={size} color={color} />}
        label="profile"
        onPress={() => navigation.navigate("contact")}
      />
      <DrawerItem
        icon={({ color, size }) => <Feather name="box" size={size} color={color} />}
        label="product"
        onPress={() => navigation.navigate("/(drawer)/(tabs)/feed")}
      />
        <DrawerItem
        icon={({ color, size }) => <Feather name="box" size={size} color={color} />}
        label="favorite"
        onPress={() => navigation.navigate("favorite")}
      />
        <DrawerItem
        icon={({ color, size }) => <Feather name="box" size={size} color={color} />}
        label="settigns"
        onPress={() => navigation.navigate("(tabs)/index")}
      />
      <DrawerItem
        icon={({ color, size }) => <Feather name="log-out" size={size} color={color} />}
        label="logout"
        onPress={() => navigation.navigate("/(drawer)/(tabs)/new")}
      />
    </DrawerContentScrollView>
  );
};

// Main Navigator
export default function App() {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Feed" component={FeedScreen} />
    </Drawer.Navigator>
  );
}