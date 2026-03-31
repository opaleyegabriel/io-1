import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Container from "@/components/container";
import InfiniteHeader from "@/components/InfiniteHeader";

export default function MessageList({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [mobile, setMobile] = useState("");

  useEffect(() => {
    const loadMobile = async () => {
      const m = await AsyncStorage.getItem("mobile");
      setMobile(m);
      fetchMessages(m);
    };
    loadMobile();
  }, []);

  const fetchMessages = async (mobileNumber) => {
    try {
      const response = await fetch(`https://hoog.ng/infiniteorder/api/Customers/getMessages.php?mobile=${mobileNumber}`);
      const data = await response.json();
     
      if (data.status === "success") {
        console.log(data);
        setMessages(data.messages);
      }
    } catch (error) {
     
      console.log(error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`https://hoog.ng/infiniteorder/api/Customers/markAsRead.php`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `id=${id}&mobile=${mobile}`
      });
      fetchMessages(mobile);
    } catch (error) {
      console.log(error);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.message, item.read_status === 0 ? styles.unread : styles.read]}
      onPress={() => {
        markAsRead(item.id);
        navigation.navigate("HelpScreen", { message: item });
      }}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.content}>{item.content}</Text>
      <Text style={styles.date}>{item.created_at}</Text>
    </TouchableOpacity>
  );

  return (
    <Container>
      <InfiniteHeader/>
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { padding: 10 },
  message: { padding: 15, marginBottom: 10, borderRadius: 8 },
  unread: { backgroundColor: "#fffae6" },
  read: { backgroundColor: "#f0f0f0" },
  title: { fontWeight: "bold", fontSize: 16 },
  content: { fontSize: 14 },
  date: { fontSize: 12, color: "gray", marginTop: 5 }
});
