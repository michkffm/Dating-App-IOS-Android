import { View, Text, Button } from "react-native";
import React from "react";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";

const BlogPage = () => {
  const router = useRouter();
  const { id , author} = useLocalSearchParams();
  return (
    <>
      <Stack.Screen options={{ headerBackTitle: `Aticle${id}` }} />
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Blog Post Details {id}</Text>
        <Text>Written by {author}</Text>
        <Button onPress={() => router.back()} title="go back" />
      </View>
    </>
  );
};

export default BlogPage;
