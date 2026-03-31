import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, StyleSheet, Modal } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import tw from 'twrnc';
import { useDispatch, useSelector } from 'react-redux';
import DateTimePicker from '@react-native-community/datetimepicker';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';  // Import vector icons from FontAwesome
import axios from 'axios';

import { GOOGLE_MAPS_API_KEY } from '@/config';
import { router } from 'expo-router';
import Container from '@/components/container';
import { useFocusEffect } from '@react-navigation/native';

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
  const [PROW, setPROW] = useState(0);
  const [toLocation, setToLocation] = useState(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [approvedCost, setApprovedCost] = useState('');
  const [orders, setOrders] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [editDate, setEditDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [mobile, setMobile] = useState('');
  const [costData, setCostData] = useState([]);
  const [fuelCostData, setFuelCostData] = useState([]);
  const [fuelCost, setFuelCost] = useState(0);
  const handleGoBack = () => {
    router.replace("/(tabs)");
  }

// Calculate the total cost using the provided formula
const calculateCost = () => { 

  if (!fromLocation || !toLocation) return 0;
    const distancee = haversine(
      fromLocation.lat,
      fromLocation.lng,
      toLocation.lat,
      toLocation.lng
    );

  
  const selectedCost = getCostForDistance(distancee); // Example cost from selected range
  //console.log("Selected Cost : "+ selectedCost);
  const time = distancee/20 // Time from travelTimeInformation
    const distanceCost = distancee * selectedCost;  // cost based on distance
    const timeCost = (time / 60) * (10000 / 60);   // time-based cost
    const fuelcost = (1 / 10) * fuelCost;              // fuel cost
  
    let totalCost = distanceCost + timeCost + fuelCost;
  
    
    // If isChecked is true, apply the new calculation
   
    if (totalCost < 238) {
      totalCost = 238;
    }
    return totalCost;  
  };
  





  const handleCreateOrder = async () => {
    if (!fromLocation || !toLocation || !approvedCost || !date) {
      Alert.alert('Missing Info', 'Please complete all fields.');
      return;
    }
  
    try {
      const mobile = await AsyncStorage.getItem('mobile');
      const name = await AsyncStorage.getItem('name');
  
      if (!mobile || !name) {
        Alert.alert('User Info Missing', 'Please log in again.');
        return;
      }
  
      const distance = haversine(
        fromLocation.lat,
        fromLocation.lng,
        toLocation.lat,
        toLocation.lng
      );
  
      const mins = (distance * 1.60934) / 20 * 60;
  
      const body = {
        mobile,
        name,
        distance: distance.toFixed(2),
        mins: Math.round(mins),
        cost: approvedCost,
        origin_lat: fromLocation.lat,
        origin_lng: fromLocation.lng,
        destination_lat: toLocation.lat,
        destination_lng: toLocation.lng,
        origin: fromLocation.description,
        destination: toLocation.description,
        preOrderStatus: 'Ready',
        pre_order_date: date.toISOString().split('T')[0],
        pre_order_time: date.toTimeString().split(' ')[0]
      };
  
      console.log('📦 Request Body:', body); // ✅ <-- Added for debugging
  
      const response = await fetch(
        'https://hoog.ng/infiniteorder/api/Settings/createPreOrder.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );
  
      const result = await response.json();
  
      if (response.status === 201) {
        Alert.alert('✅ Pre-order created successfully');
        fetchUserOrders();
      } else if (response.status === 500) {
        Alert.alert('❌ Error', result.message || 'Insufficient funds or internal error');
      } else if (response.status === 404) {
        Alert.alert('❌ Not Found', result.message || 'No wallet transaction found');
      } else {
        Alert.alert('❌ Unexpected Error', result.message || 'Please try again later.');
      }
    } catch (error) {
      Alert.alert('❌ Network Error', error.message || 'Could not connect to server.');
    }
  };

  useEffect(() => {
    const handleGotToken = async () => {
      const myMobile = await AsyncStorage.getItem('mobile');
      if (myMobile) {
        setMobile(myMobile);
      } else {
        alert('Your account name not found');
      }
   
    };

    handleGotToken();
  }, [mobile]); // Adding dependencies to properly manage state changes


  useFocusEffect(
    React.useCallback(() => {
      fetchUserOrders();
    }, [])
  );



  useEffect(() => {
     
    if (mobile) {
      
      getPROW(mobile);
     
    }

    const intervalId = setInterval(() => {
      if (mobile) {
        getPROW(mobile);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [mobile]);

  const getPROW = (mobile) => {
   
    fetch(`https://hoog.ng/infiniteorder/api/Customers/sumProwBalance.php?mobile=${mobile}`)
      .then((res) => res.json())
      .then((result) => {
       
        setPROW(result[0].balance);
      })
      .catch((error) => console.log(error));
  };

  const pauseOrder = async (id) => {
    try {
      await axios.post('https://hoog.ng/infiniteorder/api/Settings/pausePreOrder.php', { orderId: id });
      fetchUserOrders();
    } catch (error) {
      Alert.alert('❌ Failed to pause order');
    }
  };
  const resumePausedPreOrder = async (id) => {
    try {
      await axios.post('https://hoog.ng/infiniteorder/api/Settings/resumePausedPreOrder.php', { orderId: id });
      fetchUserOrders();
    } catch (error) {
      Alert.alert('❌ Failed to pause order');
    }
  };
  
  const editOrderDateTime = async () => {
    try {
      const newDate = editDate.toISOString().split('T')[0];
      const newTime = editDate.toTimeString().split(' ')[0];
      await axios.post('https://hoog.ng/infiniteorder/api/Settings/editPreOrderDateTime.php', {
        orderId: selectedOrderId,
        newDate,
        newTime,
      });
      fetchUserOrders();
      setEditModalVisible(false);
    } catch (error) {
      Alert.alert('❌ Failed to edit order');
    }
  };

  const deleteOrder = async (id) => {
    try {
      await axios.post('https://hoog.ng/infiniteorder/api/Settings/deletePreOrder.php', { orderId: id });
      fetchUserOrders();
    } catch (error) {
      Alert.alert('❌ Failed to delete order');
    }
  };
  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      const mobile = await AsyncStorage.getItem('mobile');
  
      const res = await axios.get(`https://hoog.ng/infiniteorder/api/Settings/getUserPreOrders.php?mobile=${encodeURIComponent(mobile)}`);
  
      if (res.data.status === 200 && Array.isArray(res.data.data)) {
        setOrders(res.data.data);
      } else {
        console.log('No orders found or invalid format:', res.data);
      }
    } catch (err) {
      console.error('Fetch user orders failed:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewAllPreOrders = async () => {
    try {
      const mobile = await AsyncStorage.getItem('mobile');
      const res = await axios.get(`https://hoog.ng/infiniteorder/api/Settings/getUserAllPreOrders.php?mobile=${encodeURIComponent(mobile)}`);
      if (res.data.status === 200) {
        setOrders(res.data.data); // update order list UI
      }
    } catch (error) {
      console.error('Failed to fetch all preorders', error);
    }
  };
  
  const handleViewUsedPreOrders = async () => {
    try {
      const mobile = await AsyncStorage.getItem('mobile');
      const res = await axios.get(`https://hoog.ng/infiniteorder/api/Settings/getUserUsedPreOrders.php?mobile=${encodeURIComponent(mobile)}`);
      
      
      if (res.data.status === 200) {
        setOrders(res.data.data); // update order list UI
      }
      
    } catch (error) {
      if (res.data.status === 404) {
        setOrders(''); // update order list UI
      }
      console.error('Failed to fetch used preorders', error);
    }
  };
  
  useEffect(() => {
    // Only fetch if costData is empty
    if (costData.length === 0) {
      fetchCostData();
    }
  }, [costData]); // Dependency array ensures it only runs when costData changes

  useEffect(() => {
    fetchUserOrders();
  }, []);

  const fetchCostData = async () => {
    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Settings/readCost.php');
      const result = await response.json();
  
      if (result?.costData) {
        
        setCostData(result.costData);
      }
      if (result?.fuelCostData) {
        
        setFuelCostData(result.fuelCostData);
        setFuelCost(fuelCostData[0].current_price);
      }
    } catch (error) {
      //Alert.alert("Error :",'Error fetching data');
    }
  };

    // Function to find the cost based on a given distance
    const getCostForDistance = (distance) => {
      // Convert distance to number to compare
      const distanceValue = parseFloat(distance);
    
      // Filter the costData array to find the item where distance is within the range
      const costItem = costData.find(
        (item) => distanceValue >= parseFloat(item.minDistance) && distanceValue <= parseFloat(item.maxDistance)
      );
    
      // Return the cost if a match is found, otherwise return a default message
      return costItem ? parseFloat(costItem.cost) : 'No cost available for this distance';
    };

    const handleAddMoney = async () => {
      router.replace('/AddPROWBalance');
    }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      currencyDisplay: 'symbol',
    }).format(amount);
  };

  return (
 
    <View style={tw`p-0 bg-white h-full`}>
    <Container>
    <View style={tw`bg-yellow-600 p-4 rounded-xl mb-4`}>
  <View style={tw`flex-row justify-between`}>
    {/* Wallet Section */}
    <View style={tw`flex-1 mr-2`}>
      <Text style={tw`text-white font-bold text-sm`}>Wallet Balance</Text>
      <Text style={tw`text-white text-xl mb-1`}>{formatCurrency(PROW)}</Text>

      {/* Add Money Button */}
      <TouchableOpacity
        onPress={handleAddMoney} // define this function
        style={tw`flex-row items-center bg-white px-8 py-1 rounded-lg`}>
        <Icon name="plus-circle" size={18} color="#eab308" />
        <Text style={tw`text-yellow-600 font-semibold ml-2 text-sm`}>Add Money</Text>
      </TouchableOpacity>
    </View>

    {/* Buttons Section */}
    <View style={tw`flex-1`}>
      {/* View All PreOrders */}
      <TouchableOpacity
        onPress={handleViewAllPreOrders}
        style={tw`flex-row items-center bg-white p-2 rounded-lg mb-2`}>
        <Icon name="list-ul" size={16} color="#eab308" />
        <Text style={tw`text-yellow-600 font-semibold ml-2 text-sm`}>All PreOrders</Text>
      </TouchableOpacity>

      {/* View Used PreOrders */}
      <TouchableOpacity
        onPress={handleViewUsedPreOrders}
        style={tw`flex-row items-center bg-white p-2 rounded-lg`}>
        <Icon name="check-circle" size={16} color="#eab308" />
        <Text style={tw`text-yellow-600 font-semibold ml-2 text-sm`}>Used PreOrders</Text>
      </TouchableOpacity>
    </View>
  </View>
    </View>



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

      <Text style={tw`mb-1 text-sm`}>Actual Cost: {formatCurrency(calculateCost())}</Text>
      <TextInput
        placeholder="Approved Cost"
        keyboardType="numeric"
        value={approvedCost}
        onChangeText={setApprovedCost}
        style={tw`bg-gray-200 p-2 rounded-lg mb-4`}
      />

<View style={tw`flex-row mb-4`}>
  {/* Create Pre-Order Button - more pronounced */}
  <TouchableOpacity
    onPress={handleCreateOrder}
    style={tw`bg-yellow-600 p-3 rounded-xl flex-2 mr-2`}>
    <Text style={tw`text-white text-center font-bold`}>Create Pre-Order</Text>
  </TouchableOpacity>

  {/* Back Home Button - smaller */}
  <TouchableOpacity
    onPress={handleGoBack}
    style={tw`bg-yellow-600 p-2 rounded-xl flex-1 flex-row items-center justify-center`}>
    <Icon name="arrow-left" size={16} color="white" />
    <Text style={tw`text-white font-bold ml-1`}>Back</Text>
  </TouchableOpacity>
</View>



      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={fetchUserOrders}
        renderItem={({ item }) => (
          <View style={tw`bg-gray-200 p-3 mb-4 rounded-lg`}>
            <Text style={tw`font-bold`}>From: {item.origin}</Text>
            <Text style={tw`font-bold`}>To: {item.destination}</Text>
            <Text>Date: {item.pre_order_date} {item.pre_order_time}</Text>
            <Text>Status: {item.preOrderStatus}</Text>
            <Text>Approved Cost: {formatCurrency(item.cost)}</Text>
            <View style={tw`flex-row justify-between mt-2 flex-wrap gap-2`}>
              <TouchableOpacity onPress={() => pauseOrder(item.id)} style={tw`bg-yellow-400 px-3 py-1 rounded`}>
                <Text>Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => resumePausedPreOrder(item.id)} style={tw`bg-green-500 px-3 py-1 rounded`}>
                <Text>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteOrder(item.id)} style={tw`bg-red-500 px-3 py-1 rounded`}>
                <Text style={tw`text-white`}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setSelectedOrderId(item.id);
                setEditDate(new Date(`${item.pre_order_date}T${item.pre_order_time}`));
                setEditModalVisible(true);
              }} style={tw`bg-blue-500 px-3 py-1 rounded`}>
                <Text style={tw`text-white`}>Edit Date/Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={editModalVisible} transparent>
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <View style={tw`bg-white p-4 rounded-xl w-80`}>
            <Text className="font-bold text-lg mb-2">Edit Date & Time</Text>
            <DateTimePicker
              value={editDate}
              mode="datetime"
              display="default"
              onChange={(event, selectedDate) => setEditDate(selectedDate || editDate)}
            />
            <TouchableOpacity onPress={editOrderDateTime} style={tw`mt-4 bg-blue-500 p-2 rounded`}>
              <Text className="text-white text-center">Update</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditModalVisible(false)} style={tw`mt-2 bg-gray-300 p-2 rounded`}>
              <Text className="text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </Container>
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
  },
  textInputContainer: {
    paddingBottom: 0,
  },
});

export default PreOrderScreen;
