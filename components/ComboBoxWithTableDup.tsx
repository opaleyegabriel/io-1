import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // For delete icon
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { selectOrigin } from '@/store/ioSlices';
import { router } from 'expo-router';
import tw from 'twrnc'; // Import the tailwind function

const ComboBoxWithTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false); // For controlling the "Pay" and "Go Back" visibility

  const [address, setAddress] = useState('');        
  const [originLat, setOriginLat] = useState('');    
  const [originLng, setOriginLng] = useState('');    
  const [alsUsableAmt, setAlsUsableAmt] = useState(0);
  const [mobile, setMobile] = useState('');
  const [grandTotal, setGrandTotal] = useState(0);

  const [items, setItems] = useState([]); // State for storing the items fetched from the API
  const [loading, setLoading] = useState(true); // Loading state
  const Origin = useSelector(selectOrigin);

  useEffect(() => {
    handleGotToken();
  });

  const handleGotToken = async () => {
    const MyMobile = await AsyncStorage.getItem('mobile');
    setMobile(MyMobile);
  };

  useEffect(() => {
    getBalanceAls(mobile);

    const intervalId = setInterval(() => {
      getBalanceAls(mobile); // Fetch balance every 10 seconds
    }, 10000); // 10,000 milliseconds = 10 seconds

    return () => clearInterval(intervalId);
  }, [mobile]);

  const getBalanceAls = (mobile) => {
    fetch(`https://hoog.ng/infiniteorder/api/Customers/sumAlsBalance.php?mobile=${mobile}`)
      .then((res) => res.json())
      .then((result) => {
        if (result[0].balance > 0) {
          setAlsUsableAmt(result[0].balance - result[0].bonus);
        }
      })
      .catch((error) => console.log(error));
  };

  // Fetch the items from the API
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('https://hoog.ng/infiniteorder/api/Settings/readClothList.php');
        const data = await response.json();
        if (data) {
          setItems(data); // Set the fetched items in state
        }
      } catch (error) {
        console.error('Error fetching items:', error);
        Alert.alert('Error', 'Unable to load items.');
      } finally {
        setLoading(false); // Set loading to false once the data is fetched
      }
    };

    fetchItems();
  }, []); // Fetch items only once when the component mounts

  const filteredItems = searchTerm === 'All'
    ? items 
    : items.filter((item) =>
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const handleSelectItem = (item) => {
    const isItemSelected = selectedItems.some((selectedItem) => selectedItem.id === item.id);

    if (isItemSelected) {
      Alert.alert('Item Already Selected', 'This item has already been added to the list.');
      return;
    }

    setSelectedItems((prevItems) => [
      ...prevItems,
      { ...item, quantity: 1 }
    ]);
  };

  const handleQuantityChange = (id, type) => {
    setSelectedItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          if (type === 'decrement') {
            if (item.quantity === 1) {
              return null;
            } else {
              return { ...item, quantity: item.quantity - 1 };
            }
          } else if (type === 'increment') {
            return { ...item, quantity: item.quantity + 1 };
          }
        }
        return item;
      }).filter((item) => item !== null)
    );
  };

  const handleItemRemoval = (id) => {
    setSelectedItems((prevItems) =>
      prevItems.filter((item) => item.id !== id) 
    );
  };

  const calculateItemTotal = (price, quantity) => {
    return price * quantity;
  };

  const calculateGrandTotal = () => {
    return selectedItems.reduce((total, item) => total + calculateItemTotal(item.price, item.quantity), 0);
  };

  useEffect(() => {
    if (calculateGrandTotal() > alsUsableAmt) {
      const lastItemId = selectedItems[selectedItems.length-1]?.id;
      if (lastItemId) {
        handleItemRemoval(lastItemId); 
        alert("Usable or available balance is " + "N" + alsUsableAmt + " kindly load 50% money to make order beyond usable or available balance");
      }
    }
  }, [grandTotal, selectedItems]);

  const saveOrder = async () => {
    if(!Origin?.location.lat || !Origin?.location.lng){
      Alert.alert("You must select your House or use Current Location");
      return;
    }
    let t= calculateGrandTotal();
    if(t < 2000 ){
      Alert.alert("Minimum Order Limit","Minimum Order of N2,000 Required");
      return;
    }
    const orderDetails = {
      mobile: mobile,
      amount: calculateGrandTotal(),
      address: Origin?.description,
      origin_lat: Origin?.location.lat,
      origin_lng: Origin?.location.lng,
      items: selectedItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        total: calculateItemTotal(item.price, item.quantity),
      }))
    };

    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/alsOrdering.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderDetails),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Something went wrong!');
      }

      const result = await response.json();
      if (result.status === 201) {
        // Alert with the success message and navigate after OK is pressed
        Alert.alert(
          'Success', 
          'Order has been placed successfully. Expect Pickup within 12 and 24 hours, and always monitor your order at Order History',
          [
            {
              text: 'OK',
              onPress: () => {
                // Execute the navigation after the user presses OK
                router.replace("/(tabs)");
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Something went wrong!');
      }
    } catch (error) {
      console.error('Error saving order:', error);
      Alert.alert('Error', 'There was an issue saving your order: ' + error.message);
    }
  };

  const handlePay = () => {
    saveOrder();
  };

  const handleGoBack = () => {
    router.replace("/(tabs)/");
  };

  return (
    <View style={tw`flex-1 p-4 bg-gray-100`}>
      <TextInput
        style={tw`p-3 mb-4 border-2 border-gray-300 rounded-lg text-lg`}
        placeholder="Search Items..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      <View style={tw`flex-1`}>
        {/* Item List (25% height) */}
        <View style={tw`h-1/4`}>
          {loading ? (
            <ActivityIndicator size="large" color="#D97706" style={tw`mt-10`} />
          ) : (
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const isSelected = selectedItems.some((selectedItem) => selectedItem.id === item.id);

                return (
                  <TouchableOpacity
                    style={tw`flex-row justify-between p-1 mb-1 bg-white rounded-lg ${isSelected ? 'bg-yellow-600' : ''}`}
                    onPress={() => handleSelectItem(item)}
                  >
                    <Text style={[tw`text-lg`,{fontFamily:"RobotoR",fontSize:14}]}>{item.description}</Text>
                    <Text style={[tw`text-lg`,{fontFamily:"RobotoR",fontSize:14}]}>₦{item.price}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>

        {/* Order Section (75% height) */}
        <View style={tw`h-3/4`}>
          <ScrollView style={tw`mt-6 border-1 border-yellow-600`}>
            <View style={tw`flex-row bg-yellow-600 p-4 justify-between`}>
              <Text style={[tw`font-bold text-white text-base`,{fontFamily:"NunitoB", fontSize:13}]}>Description</Text>
              <Text style={[tw`font-bold text-white text-base`,{fontFamily:"NunitoB", fontSize:13}]}>Quantity</Text>
              <Text style={[tw`font-bold text-white text-base`,{fontFamily:"NunitoB", fontSize:13}]}>Price</Text>
              <Text style={[tw`font-bold text-white text-base`,{fontFamily:"NunitoB", fontSize:13}]}>Total</Text>
            </View>

            {selectedItems.map((item) => (
              <View key={item.id} style={tw`flex-row justify-between p-4 border-b border-gray-300`}>
                <View style={tw`flex-row items-center`}>
                  <TouchableOpacity
                    onPress={() => handleItemRemoval(item.id)}
                    style={tw`mr-2`}
                  >
                    <MaterialCommunityIcons name="trash-can" size={24} color="red" />
                  </TouchableOpacity>
                  <Text style={tw`text-base`}>{item.description}</Text>
                </View>
                <View style={tw`flex-row items-center`}>
                  <TouchableOpacity
                    onPress={() => handleQuantityChange(item.id, 'decrement')}
                    disabled={item.quantity <= 1}
                    style={tw`p-2 bg-yellow-600 rounded-lg mx-2`}
                  >
                    <Text style={tw`text-lg`}>-</Text>
                  </TouchableOpacity>
                  <Text style={tw`text-base`}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => handleQuantityChange(item.id, 'increment')}
                    style={tw`p-2 bg-yellow-600 rounded-lg mx-2`}
                  >
                    <Text style={tw`text-lg`}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={tw`text-base`}>₦{item.price}</Text>
                <Text style={tw`text-base`}>₦{calculateItemTotal(item.price, item.quantity)}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={tw`pt-5 items-end`}>
            <Text style={tw`text-lg font-bold`}>Grand Total: ₦{calculateGrandTotal()}</Text>
          </View>

          {!isOrderCompleted && (
            <View style={tw`flex-row justify-end pt-2`}>
              <TouchableOpacity
                onPress={handlePay}
                style={tw`bg-yellow-600 p-3 rounded-lg w-1/2 items-center mr-2`}
              >
                <Text style={tw`text-white text-lg font-bold`}>Pay</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleGoBack}
                style={tw`bg-yellow-600 p-3 rounded-lg w-1/2 items-center`}
              >
                <Text style={tw`text-white text-lg font-bold`}>Go Back</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default ComboBoxWithTable;
