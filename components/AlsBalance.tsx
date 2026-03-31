import React, { useEffect, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // For icons
import tw from 'twrnc'; // TailwindCSS for styling

const AlsBalance = ({ balance }) => {
  const [fadeAnim] = useState(new Animated.Value(0)); // Fade-in animation

  // Function to format the number as currency in Naira
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      currencyDisplay: 'symbol',
    }).format(amount);
  };

  useEffect(() => {
    // Fade-in animation for the balance
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View
      style={[
        tw`p-3 m-2 bg-yellow-600 rounded-lg shadow-md border border-gray-300`, // Container styles
        { opacity: fadeAnim }, // Apply fade-in effect
      ]}
    >
      <View style={tw`flex-row items-center mb-1`}>
        <MaterialCommunityIcons name="tshirt-crew" size={20} color="white" />
        <Text style={tw`ml-2 text-xl font-semibold text-white`}>Laundry(ALS)</Text>
      </View>

      <View style={tw`flex-row gap-6`}>
      <Text style={tw`text-white text-sm mb-0`}>
        Available Balance
      </Text>

      <Text style={tw`text-white text-2xl font-bold`}>
        {formatCurrency(balance)}
      </Text>
      </View>

      
    </Animated.View>
  );
};

export default AlsBalance;
