import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, StyleSheet } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import tw from 'twrnc';
import { useDispatch, useSelector } from 'react-redux';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';

import { GOOGLE_MAPS_API_KEY } from '@/config';


const haversine = (lat1, lon1, lat2, lon2) => {
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceInKm = R * c;
  return distanceInKm * 0.621371;
};

const PreOrderScreen = () => {
  const dispatch = useDispatch();
  const [fromLocation, setFromLocation] = useState(null);
  const [toLocation, setToLocation] = useState(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [approvedCost, setApprovedCost] = useState('');
  const [orders, setOrders] = useState([]);
  const rideBalance = 5000;

  const calculateCost = () => {
    if (!fromLocation || !toLocation) return 0;
    const distance = haversine(
      fromLocation.lat,
      fromLocation.lng,
      toLocation.lat,
      toLocation.lng
    );
    return distance * 150;
  };

  const handleCreateOrder = () => {
    if (!fromLocation || !toLocation || !approvedCost) {
      Alert.alert('Please complete all fields.');
      return;
    }
    const newOrder = {
      id: Date.now(),
      fromLocation,
      toLocation,
      date,
      approvedCost,
      status: 'Ready',
    };
    setOrders([...orders, newOrder]);
  };

  const updateOrderStatus = (id, status) => {
    setOrders(prev => prev.map(order => order.id === id ? { ...order, status } : order));
  };

  const deleteOrder = (id) => {
    setOrders(prev => prev.filter(order => order.id !== id));
  };

   // Function to format the number as currency in Naira
   const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      currencyDisplay: 'symbol',
    }).format(amount);
  };

  return (
    <View style={tw`p-4 bg-white h-full`}>
      {/* Wallet Balance */}
      <View style={tw`bg-yellow-600 p-4 rounded-xl mb-4`}>
        <Text style={tw`text-white font-bold text-lg`}>Wallet Balance</Text>
        <Text style={tw`text-white text-xl`}>{formatCurrency(rideBalance)}</Text>
      </View>

      {/* Google Places Inputs */}
      <GooglePlacesAutocomplete
        placeholder='From Where?'
        fetchDetails
        styles={inputBoxStyles}
        onPress={(data, details) => {
          setFromLocation({
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng,
            description: data.description,
          });
        }}
        query={{
          key: GOOGLE_MAPS_API_KEY,
          language: 'en',
          location: '8.4922,4.5428',
          radius: 250000,
          componentRestrictions: { country: 'NG' },
          strictbounds: true,
        }}
        minLength={2}
        debounce={400}
      />

      <GooglePlacesAutocomplete
        placeholder='To Where?'
        fetchDetails
        styles={inputBoxStyles}
        onPress={(data, details) => {
          setToLocation({
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng,
            description: data.description,
          });
        }}
        query={{
          key: GOOGLE_MAPS_API_KEY,
          language: 'en',
          location: '8.4922,4.5428',
          radius: 250000,
          componentRestrictions: { country: 'NG' },
          strictbounds: true,
        }}
        minLength={2}
        debounce={400}
      />

      {/* Date & Time */}
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={tw`bg-gray-200 p-2 rounded-lg mb-2`}>
        <Text>{date.toLocaleString()}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            const currentDate = selectedDate || date;
            setShowDatePicker(false);
            setDate(currentDate);
          }}
        />
      )}

      {/* Cost Display */}
      <Text style={tw`mb-1 text-sm`}>Actual Cost: {formatCurrency(calculateCost())}</Text>
      <TextInput
        placeholder="Approved Cost"
        keyboardType="numeric"
        value={approvedCost}
        onChangeText={setApprovedCost}
        style={tw`bg-gray-200 p-2 rounded-lg mb-4`}
      />

      {/* Create Order */}
      <TouchableOpacity onPress={handleCreateOrder} style={tw`bg-yellow-600 p-3 rounded-xl mb-4`}>
        <Text style={tw`text-white text-center font-bold`}>Create Pre-Order</Text>
      </TouchableOpacity>

      {/* List Orders */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={tw`bg-gray-100 p-3 mb-2 rounded-lg`}>
            <Text style={tw`font-bold`}>From: {item.fromLocation.description}</Text>
            <Text style={tw`font-bold`}>To: {item.toLocation.description}</Text>
            <Text>Date: {new Date(item.date).toLocaleString()}</Text>
            <Text>Status: {item.status}</Text>
            <Text>Approved Cost: {formatCurrency(item.approvedCost)}</Text>
            <View style={tw`flex-row justify-between mt-2`}>
              <TouchableOpacity onPress={() => updateOrderStatus(item.id, 'Paused')} style={tw`bg-yellow-400 px-3 py-1 rounded`}>
                <Text>Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => updateOrderStatus(item.id, 'Ready')} style={tw`bg-green-500 px-3 py-1 rounded`}>
                <Text>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteOrder(item.id)} style={tw`bg-red-500 px-3 py-1 rounded`}>
                <Text style={tw`text-white`}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};






const inputBoxStyles = StyleSheet.create({
    container:{
      backgroundColor:"white",
      marginTop:10,
      flex:0,
    },
    textInput:{
      fontSize:18,
      backgroundColor:"#fff",
      borderWidth:1,
      borderColor:"#00000050",
      borderRadius:50,
    },
  
    textInputContainer:{
      paddingBottom:0,
    },
  })





export default PreOrderScreen;
