import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import React, { useState, useEffect } from 'react';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setDestination, selectOrigin, selectDestination, selectTravelTimeInformation, setOrigin, setTravelTimeInformation } from '@/store/ioSlices';
import { GOOGLE_MAPS_API_KEY } from '@/config';
import tw from "twrnc";
import Icon from 'react-native-vector-icons/FontAwesome';  // Import vector icons from FontAwesome
import { router } from 'expo-router';
import LogisticScreen from '@/app/logistic';
import OSMPlacesAutocomplete from './OSMPlacesAutocomplete';

const LogisticOrder = () => {
  const dispatch = useDispatch();
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [deliveryName, setDeliveryName] = useState('');
  const [deliveryMobile, setDeliveryMobile] = useState('');
  const [pickupLocation, setPickupLocation] = useState(null);
  
  const [distance, setDistance] = useState(0);
  const [cost, setCost] = useState(0);
  const [orderCount, setOrderCount] = useState(5);  // Assuming 5 orders for now, you can replace this with actual data
  
  const Origin = useSelector(selectOrigin);
  const Destination = useSelector(selectDestination); 
  


  const travelTimeInformation = useSelector(selectTravelTimeInformation) || {
    distance: {text: "No distance", value: 0},
    duration: {text: "No duration", value: 0},
  };
  
  function toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
  
  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth’s radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // distance in km
  }


  useEffect(() => {
    // Reset the destination to null when the screen is first visited or navigated to
    dispatch(setDestination(null));
    dispatch(setTravelTimeInformation(null));
    

    // You can also do any other necessary setup here
    return () => {
      // Optionally, you can reset it again on cleanup (when navigating away from this screen)
      dispatch(setDestination(null));
      dispatch(setTravelTimeInformation(null));
    };
  }, [dispatch]); // Empty dependency array ensures this only runs once when the component mounts

  useEffect(() => {
    const fetchUserData = async () => {
      const name = await AsyncStorage.getItem("name");
      const mobileNum = await AsyncStorage.getItem('mobile');
      setCustomerName(name);
      setMobile(mobileNum);
      
    };

    fetchUserData();
  }, []);


  const handleOrder = async () => {
    console.log("Cus_Name : " + customerName);
    console.log("Mobile : " + mobile);
    console.log("Del Name : " + deliveryName);
    console.log("Del Mobile : " + deliveryMobile);
  
    // Check for empty fields
    if (!customerName || !mobile || !deliveryName || !deliveryMobile) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
  
    // Mobile number validation
    const isValidMobile = (num) => /^\d{11}$/.test(num);
    if (!isValidMobile(mobile) || !isValidMobile(deliveryMobile)) {
      Alert.alert("Invalid Mobile Number", "All mobile numbers must be exactly 11 digits.");
      return;
    }
  
    // Name validation (must contain at least first and last name)
    const isValidName = (name) => name.trim().split(/\s+/).length >= 2;
    if (!isValidName(customerName) || !isValidName(deliveryName)) {
      Alert.alert("Invalid Name", "Please enter at least a first name and a last name.");
      return;
    }
  
    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Logistics/createOrder.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          mobile: mobile,
          name: customerName,
          distance: distance.toString(),
          mins: "0", // You said you'll handle this later
          cost: cost.toString(),
          origin_lat: Origin?.location?.lat?.toString() || '',
          origin_lng: Origin?.location?.lng?.toString() || '',
          destination_lat: Destination?.location.lat?.toString() || '',
          destination_lng: Destination?.location.lng?.toString() || '',
          origin: Origin?.description || '',
          destination: Destination?.description || '',
          deliverTo: deliveryName,
          mobileDT: deliveryMobile,
          pickfrom: customerName,
          mobilePF: mobile
        }).toString()
      });
  
      if (response.status === 201) {
        Alert.alert("Order Created", `Your delivery will cost: ₦${cost}`);
      } else {
        const responseText = await response.text();
        Alert.alert("Error", `Failed to create order. Server responded with status ${response.status}: ${responseText}`);
      }
    } catch (error) {
      console.error("API Error:", error);
      Alert.alert("Network Error", "Something went wrong. Please try again.");
    }
  };
  
  

  
  const handleViewOrders = () => {
    router.replace("/LogisticOrderList");
    
    // Add your logic to navigate to the orders screen or view details
  };

  return (
    <View style={tw`flex-1 bg-white p-6`}>
      {/* Your Orders Section with Icon and Clickable Action */}
      <TouchableOpacity onPress={handleViewOrders} style={tw`flex-row items-center justify-start mb-1 mt-8`}>
        <Icon name="list-alt" size={20} color="grey" />
        <Text style={tw`text-2xl font-bold ml-2 text-yellow-600`}>
            Your Orders ({orderCount})
        </Text>
    </TouchableOpacity>

      {/* Deliver To Section */}
     <OSMPlacesAutocomplete
  Origin={Origin}
  setDistance={setDistance}
  setCost={setCost}
/>


      {/* Pickup Contact Section */}
      <Text style={tw`text-lg text-gray-700 mb-2`}>Pickup Contact</Text>
      <View style={tw`flex-row items-center mb-3`}>
        <Icon name="user" size={20} color="gray" />
        <TextInput
          style={tw`border p-3 rounded-lg flex-1 ml-2`}
          placeholder="Pickup Name"
          defaultValue={customerName}
          onChangeText={setCustomerName}
        />
      </View>
      <View style={tw`flex-row items-center mb-5`}>
        <Icon name="phone" size={20} color="gray" />
        <TextInput
          style={tw`border p-3 rounded-lg flex-1 ml-2`}
          placeholder="Pickup Mobile"
          defaultValue={mobile}
          keyboardType="phone-pad"
          onChangeText={setMobile}
        />
      </View>
      <TouchableOpacity
        style={tw`bg-yellow-600 p-3 rounded-lg flex-row items-center justify-center mb-5`}
        onPress={() => Alert.alert('Edit Pickup Info', 'Edit your pickup contact info here.')}>
        <Icon name="edit" size={20} color="white" />
        <Text style={tw`text-white ml-2`}>Edit Pickup Info</Text>
      </TouchableOpacity>

      {/* Delivery Contact Section */}
      <Text style={tw`text-lg text-gray-700 mb-2 mt-4`}>Delivery Contact</Text>
      <View style={tw`flex-row items-center mb-3`}>
        <Icon name="user" size={20} color="gray" />
        <TextInput
          style={tw`border p-3 rounded-lg flex-1 ml-2`}
          placeholder="Recipient Name"
          value={deliveryName}
          onChangeText={setDeliveryName}
        />
      </View>
      <View style={tw`flex-row items-center mb-5`}>
        <Icon name="phone" size={20} color="gray" />
        <TextInput
          style={tw`border p-3 rounded-lg flex-1 ml-2`}
          placeholder="Recipient Mobile"
          value={deliveryMobile}
          keyboardType="phone-pad"
          onChangeText={setDeliveryMobile}
        />
      </View>

      {/* Distance and Cost Calculation */}
      <View style={tw`my-5`}>
        <Text style={tw`text-lg text-gray-600`}>Distance: {distance} km</Text>
        <Text style={tw`text-lg text-gray-600`}>Total Cost: ₦{cost}</Text>
      </View>

      {/* Instructions */}
      <View style={tw`bg-gray-200 p-4 mb-6 rounded-lg`}>
        <Text style={tw`text-lg font-semibold text-gray-700`}>Instructions:</Text>
        <Text style={tw`text-gray-600`}>1. Goods must be portable.</Text>
        <Text style={tw`text-gray-600`}>2. Goods must be sealed and labeled.</Text>
      </View>

      {/* Buttons */}
      <View style={tw`flex-row justify-between`}>
        <TouchableOpacity
          style={tw`bg-yellow-600 p-4 rounded-lg flex-1 mr-2 flex-row items-center justify-center`}
          onPress={handleOrder}>
          <Icon name="check-circle" size={20} color="white" />
          <Text style={tw`text-white ml-2 text-center font-semibold`}>Initiate Order</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={tw`bg-gray-400 p-4 rounded-lg flex-1 ml-2 flex-row items-center justify-center`}
          onPress={() => router.replace('/(tabs)')}>
          <Icon name="arrow-left" size={20} color="white" />
          <Text style={tw`text-white ml-2 text-center font-semibold`}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const inputBoxStyles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    marginTop: 10,
    flex: 0,
  },
  textInput: {
    fontSize: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#00000050",
    borderRadius: 50,
    paddingHorizontal: 15,
  },
  textInputContainer: {
    paddingBottom: 0,
  },
});

export default LogisticOrder;
