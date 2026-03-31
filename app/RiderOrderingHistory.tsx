import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import tw from 'twrnc';
import { FontAwesome } from '@expo/vector-icons'; // For icons
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Rider Order History Component
const RiderOrderHistory = ({ orders }) => {
  const renderRideOrder = ({ item }) => (
    <View style={tw`bg-white p-1 mb-1 rounded-lg`}>
      <View style={tw`flex-row items-start justify-between`}>
        <View style={tw`w-5 h-5 border-2 border-orange-600 rounded-full justify-center items-center`}>
          <FontAwesome name="arrow-down" size={12} color="#D97706" />
        </View>
        <View style={tw` flex-1 pl-2`}>
          <Text style={[tw`text-lg font-semibold`,{fontFamily:"NunitoB", fontSize:11}]}>{item.originDescription}</Text>
          <Text style={[tw`text-sm text-gray-500`,{fontFamily:"RobotoR", fontSize:10}]}>Pickup point</Text>
        </View>
        <View style={tw`flex-1 items-end`}>
          <Text style={[tw`text-sm font-semibold`,{fontFamily:"NunitoB", fontSize:10}]}>Payment</Text>
          <Text 
            style={[ 
              tw`text-xl font-semibold`, 
              { 
                fontFamily: "NunitoB", 
                fontSize: 11, 
                fontWeight:"bold",
                backgroundColor: '#D97706', 
                color: 'white', 
                borderRadius: 999, 
                paddingVertical: 0, 
                paddingHorizontal: 4 
              }
            ]}
          >
            {new Intl.NumberFormat('en-NG', {
              style: 'currency',
              currency: 'NGN',
              minimumFractionDigits: 2,
            }).format(item.paymentAmount)}
          </Text>
        </View>
      </View>
      <View style={tw`border-l-2 border-dotted border-black h-9 absolute top-6 left-1/25 -ml-0.5`} />
      <View style={tw`flex-row items-start justify-between`}>
        <View style={tw`w-5 h-5 border-2 border-gray-300 rounded-full justify-center items-center`}>
          <FontAwesome name="map-marker" size={12} color="black" />
        </View>
        <View style={tw`flex-1 pl-2`}>
          <Text style={[tw`text-lg font-semibold`,{fontFamily:"NunitoB", fontSize:12}]}>{item.destinationDescription}</Text>
          <Text style={[tw`text-sm text-gray-500`,{fontFamily:"RobotoR", fontSize:10}]}>Destination</Text>
        </View>
        <View style={tw` flex-1 items-end`}>
          <Text style={[tw`text-sm font-semibold`,{fontFamily:"NunitoB", fontSize:10}]}>Distance</Text>
          <Text 
            style={[ 
              tw`text-xl font-semibold`, 
              { 
                fontFamily: "NunitoB", 
                fontSize: 11, 
                backgroundColor: '#D97706', 
                color: 'white', 
                borderRadius: 999, 
                paddingVertical: 0, 
                paddingHorizontal: 4 
              }
            ]}
          >
            {Math.ceil(item.distance)} mil
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <FlatList
      data={orders}
      renderItem={renderRideOrder}
      keyExtractor={(item) => item.orderId.toString()}
    />
  );
};

// Main Component to Display Rider Order History
const RiderOrderingHistory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [riderOrders, setRiderOrders] = useState([]);
  const [mobile, setMobile] = useState(null); // Mobile number state

  useEffect(() => {
    const fetchMobileAndOrders = async () => {
      try {
        const myMobile = await AsyncStorage.getItem('mobile');
        if (!myMobile) {
          alert("Your account name not found");
          return;
        }
        setMobile(myMobile);
        fetchRiderOrders(myMobile);
      } catch (error) {
        console.error('Error fetching mobile or orders:', error);
        alert('An error occurred while fetching user data');
      }
    };

    fetchMobileAndOrders();
  }, []);

  // Fetch Rider Orders
  const fetchRiderOrders = async (mobile) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://hoog.ng/infiniteorder/api/Riders/riderOrderHistory.php?riderId=${mobile}`);
      const data = await response.json();

      // Directly set the orders from the response
      setRiderOrders(data); // The response is already an array of orders

      console.log("Rider Orders Data:", data); // To check the response format in the console
    } catch (error) {
      console.error('Error fetching rider orders:', error);
      alert("Failed to fetch rider orders");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={tw`bg-gray-100 p-1`}>
      {/* Header */}
      <View style={tw`mb-4 mt-4`}>
        <TouchableOpacity onPress={() => router.replace("/RidersDashboard")}>
          <Text style={tw`text-2xl mt-0 py-1 font-semibold mb-2 mr-2 pl-2`}>
            <FontAwesome name="arrow-left" size={20} color="black" />
            Back
          </Text>
        </TouchableOpacity>

        {/* Rider Order History */}
        <View style={tw`flex-row justify-between mb-1`}>
          <TouchableOpacity
            style={[
              tw`p-3 rounded-lg flex-1 mr-2`, 
              tw`bg-black`
            ]}
          >
            <Text 
              style={[
                tw`text-center text-lg font-semibold`, 
                { 
                  fontFamily: "LatoB", 
                  fontSize: 14, 
                  fontWeight: "condensedBold", 
                  color: '#D97706' // yellow-600 color when selected
                }
              ]}
            >
              Rider Order History
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rider Order History Rendering */}
      <RiderOrderHistory orders={riderOrders} />

      {/* Loading Indicator */}
      {isLoading && (
        <ActivityIndicator size="large" color="#D97706" style={tw`mt-4`} />
      )}
    </View>
  );
};

export default RiderOrderingHistory;
