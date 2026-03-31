import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Container from "@/components/container";

import tw from "twrnc";
import Icon from 'react-native-vector-icons/FontAwesome';  // Import vector icons from FontAwesome
import { router } from 'expo-router';

// Optional background colors based on status
const OrderStatusColors = {
  Created: "#E6F0FF",
  Picked: "#FFF9E6",
  Delivered: "#E6FFE6",
};

const OrderListScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const mobile = await AsyncStorage.getItem("mobile");

      if (!mobile) {
        console.warn("No mobile number found.");
        setLoading(false);
        return;
      }

      const res = await axios.get(
        `https://hoog.ng/infiniteorder/api/Logistics/getLogisticsOrders.php?mobile=${encodeURIComponent(mobile)}`
      );

      if (res.data.status === 200 && Array.isArray(res.data.data)) {
        const normalizedOrders = res.data.data.map((order) => ({
          id: order.id,
          cost: parseFloat(order.cost || "0"),
          createdAt: order.created_at || "",
          origin: order.origin || "",
          destination: order.destination || "",
          deliverTo: order.deliverTo || "",
          distance: parseFloat(order.distance || "0"),
          orderStatus: order.orderStatus || "Created",
          riderName: order.riderName || null,
          riderId: order.riderId || null,
          pickupStatus: order.pickupstatus === "1" ? "Picked" : "Not Picked",
          pickupTime:
            order.pickUpTime !== "0000-00-00 00:00:00"
              ? order.pickUpTime
              : null,
          droppedTime:
            order.droppedTime !== "0000-00-00 00:00:00"
              ? order.droppedTime
              : null,
        }));

        const sortedOrders = normalizedOrders.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setOrders(sortedOrders);
      } else {
        console.warn("Unexpected response format:", res.data.data);
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching logistics orders:", error);
      Alert.alert("Error", "Failed to fetch logistics orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const renderItem = ({ item }) => {
    const backgroundColor = OrderStatusColors[item.orderStatus] || "#F5F5F5";

    const formattedDate =
      item.createdAt && item.createdAt !== "0000-00-00 00:00:00"
        ? new Date(item.createdAt).toLocaleString()
        : "Not Set";
    return (
      <View style={[styles.card, { backgroundColor }]}>
        <Text style={styles.orderId}>Order ID: {item.id}</Text>
        <Text style={styles.status}>Status: {item.orderStatus}</Text>

        <Text style={styles.label}>From:</Text>
        <Text style={styles.value}>{item.origin}</Text>

        <Text style={styles.label}>To:</Text>
        <Text style={styles.value}>{item.destination}</Text>

        <Text style={styles.label}>Receiver:</Text>
        <Text style={styles.value}>{item.deliverTo}</Text>

        <Text style={styles.label}>Cost:</Text>
        <Text style={styles.value}>
          ₦{item.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Text>

        <Text style={styles.label}>Distance:</Text>
        <Text style={styles.value}>
          {(item.distance / 1000).toFixed(2)} km
        </Text>

        <Text style={styles.label}>Created At:</Text>
        <Text style={styles.value}>{formattedDate}</Text>

        <Text style={styles.label}>Rider:</Text>
        <Text style={styles.value}>
          {item.riderName ?? "No rider assigned"}
        </Text>
      </View>
    );
  };

  return (
   
      <View style={styles.container}>
        <View style={tw`flex-row items-center justify-between mt-16 mb-4`}>
          <TouchableOpacity
            style={tw`bg-yellow-400 px-4 py-2 rounded-lg flex-row items-center`}
            onPress={() => router.replace('/logistic')}>
            <Icon name="arrow-left" size={20} color="white" />
            <Text style={tw`text-white ml-2 font-semibold`}>Back to Home</Text>
          </TouchableOpacity>
          <Text style={[styles.header, tw`ml-4`]}>My Logistics Orders</Text>
</View>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#FBBF24" />
          </View>
        ) : orders.length === 0 ? (
          <Text style={styles.noOrdersText}>No logistics orders found.</Text>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            onRefresh={fetchOrders}
            refreshing={loading}
            contentContainerStyle={{ paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
  
  );
};

export default OrderListScreen;

const styles = StyleSheet.create({
  container: {
    
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    paddingTop:20,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  orderId: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 4,
    color: "#333",
  },
  status: {
    fontSize: 14,
    marginBottom: 8,
    color: "#555",
    fontStyle: "italic",
  },
  label: {
    fontWeight: "bold",
    color: "#555",
    marginTop: 6,
  },
  value: {
    marginBottom: 4,
    color: "#333",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noOrdersText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 40,
  },
});
