import React, { useEffect, useState } from 'react';
import { View, Text, Animated, Easing, TouchableOpacity, Alert } from 'react-native';
import  tw  from 'twrnc';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // For icons
import { router } from 'expo-router';


const WalletBalance = ({rideBalance, alsBalance, PROW}) => {
 
  const [fadeAnim] = useState(new Animated.Value(0)); // For fade-in animation
  






  // Function to format the number as currency in Naira
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      currencyDisplay: 'symbol',
    }).format(amount);
  };

  useEffect(() => {
    // Fade-in animation for wallet balance
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);


  const addRideMoney = () => {
   
    router.replace("/AddRiderBalance");
  }
  const addAlsMoney = () => {
   
    router.replace("/AddAlsBalance");
  }
  const TAlsHistory = () => {
    
    router.replace("/AllTransactionHistory");
  }
  const GoPreOrder = () =>{
    router.replace("/PreOrder");
  }
  const TRideHistory = () =>{
    
    router.replace("/RideTransactionHistory"); 
  }
  

  return (
    <View>
      <Animated.View
        style={[
          tw`p-3 py-1 rounded-xl bg-yellow-600`, // outer container
          { opacity: fadeAnim }
        ]}
      >
        {/* Header with optional Title and History Button */}
        <View style={tw`flex-row justify-between items-center`}>
        <TouchableOpacity onPress={() => TAlsHistory()} style={tw`mt-1 ml-2`}>
              <Text style={[tw`text-white text-xs underline`, { fontSize: 12, fontFamily: "NunitoB" }]}>View All Histories</Text>
            </TouchableOpacity>
          <Text style={tw`font-semibold text-white text-lg ml-4`}></Text>
          <TouchableOpacity
            //onPress={() => GoPreOrder()}
            onPress={() => Alert.alert("Pre Order","Pre order not yet available, or update your app to use it ")}
            style={tw`flex-row items-center mr-4`}
          >
            <Text style={[tw`text-white font-bold`, { fontSize: 12, fontFamily: "NunitoB" }]}>
              POW {formatCurrency(PROW)}
            </Text>
          </TouchableOpacity>
        </View>
  
        {/* Wallet Balances: Ride and Laundry */}
        <View style={tw`flex-row justify-between mt-2 px-2`}>
          {/* Ride Section - Left */}
          <View style={tw`flex-1 mr-2`}>
            <View style={tw`flex-row items-center`}>
              <MaterialCommunityIcons name="bike" size={15} color="white" />
              <Text style={tw`ml-1 text-white text-sm font-bold`}>Ride</Text>
              <TouchableOpacity
                onPress={() => addRideMoney()}
                style={tw`ml-2 bg-white rounded-lg px-2 py-1 shadow-md`}
              >
                <Text
                  style={[
                    tw`text-yellow-700 font-bold`,
                    { fontSize: 11, fontFamily: 'NunitoR' }
                  ]}
                >
                  + Add Money
                </Text>
              </TouchableOpacity>
            </View>
  
  
            <Text
              style={[
                tw`text-white font-bold mt-1`,
                { fontSize: 17, fontFamily: 'LatoB' }
              ]}
            >
              {formatCurrency(rideBalance)}
            </Text>
          </View>
  
          {/* Laundry Section - Right */}
          <View style={tw`flex-1 ml-2 items-end`}>
            <View style={tw`flex-row items-center justify-end`}>
              <MaterialCommunityIcons name="tshirt-crew" size={15} color="white" />
              <Text style={tw`ml-1 text-white text-sm font-bold`}>Laundry</Text>
              <TouchableOpacity
                onPress={() => addAlsMoney()}
                style={tw`ml-2 bg-white rounded-lg px-2 py-1 shadow-md`}
              >
                <Text
                  style={[
                    tw`text-yellow-700 font-bold`,
                    { fontSize: 11, fontFamily: 'NunitoR' }
                  ]}
                >
                  + Add Money
                </Text>
              </TouchableOpacity>
            </View>
  
            
  
            <Text
              style={[
                tw`text-white font-bold mt-1`,
                { fontSize: 17, fontFamily: 'LatoB' }
              ]}
            >
              {formatCurrency(alsBalance)}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
  
};

export default WalletBalance;
