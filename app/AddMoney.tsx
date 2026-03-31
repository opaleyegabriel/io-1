import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, Text, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Paystack, paystackProps } from 'react-native-paystack-webview';
import tw from 'twrnc';

import InfiniteHeader from '@/components/InfiniteHeader';
import ProfileHeadInfo from '@/components/ProfileHeadInfo';
import RideBalance from '@/components/RideBalance';
import AlsBalance from '@/components/AlsBalance';
import PROWBalance from '@/components/PROWBalance';
import Container from '@/components/container';

const PAYSTACK_KEY = 'pk_live_ef24f6249f17d76bee754b4de5a8ba7fc6c33799';

const WALLET_CONFIGS = {
  ride: {
    name: 'Ride Wallet',
    type: 'RIDE',
    apiEndpoint: 'sumRideBalance.php',
    balanceComponent: RideBalance,
    minDeposit: 200,
    description: 'Add money to your Ride wallet to book transport services.',
    icon: 'car',
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    textColor: 'text-yellow-600',
    buttonColor: 'bg-yellow-600',
  },
  laundry: {
    name: 'Laundry Wallet',
    type: 'ALS',
    apiEndpoint: 'sumAlsBalance.php',
    balanceComponent: AlsBalance,
    minDeposit: 200,
    description: 'Add money to your Laundry wallet for wash and fold services.',
    icon: 'water',
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-600',
    buttonColor: 'bg-blue-600',
  },
  prow: {
    name: 'PROW Wallet',
    type: 'ALS', // Note: Using ALS type as in your original code
    apiEndpoint: 'sumProwBalance.php',
    balanceComponent: PROWBalance,
    minDeposit: 1000, // Different minimum as per your PROW code
    description: 'Add money to your Pre-Order Wallet for laundry extras.',
    icon: 'cube',
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-600',
    buttonColor: 'bg-purple-600',
  }
};

export default function AddMoney() {
  const { walletType } = useLocalSearchParams();
  const config = WALLET_CONFIGS[walletType] || WALLET_CONFIGS.ride;
  
  const paystackWebViewRef = useRef(paystackProps.PayStackRef);
  const [amountToPaid, setAmountToPaid] = useState('');
  const [balance, setBalance] = useState(0);
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  
  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.ease,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (mobile) {
      getBalance();
      const interval = setInterval(getBalance, 5000);
      return () => clearInterval(interval);
    }
  }, [mobile]);

  const loadUserData = async () => {
    try {
      const myMobile = await AsyncStorage.getItem("mobile");
      const myName = await AsyncStorage.getItem("name");
      const myEmail = await AsyncStorage.getItem("email");
      
      if (!myMobile) {
        Alert.alert("Error", "Your account not found");
        return;
      }
      
      setMobile(myMobile);
      setUsername(myName || '');
      setEmail(myEmail || '');
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const getBalance = () => {
    fetch(`https://hoog.ng/infiniteorder/api/Customers/${config.apiEndpoint}?mobile=${mobile}`)
      .then(res => res.json())
      .then(result => {
        if (result && result[0] && result[0].balance !== undefined) {
          setBalance(result[0].balance);
        }
      })
      .catch(error => console.log('Error fetching balance:', error));
  };

  const validateAmount = () => {
    if (!amountToPaid) {
      Alert.alert("Error", "Amount cannot be empty");
      return false;
    }
    
    const amount = parseFloat(amountToPaid);
    if (amount < config.minDeposit) {
      Alert.alert("Error", `Minimum deposit is N${config.minDeposit.toLocaleString()}`);
      return false;
    }
    
    return true;
  };

  const addBalance = async () => {
    if (!validateAmount()) return;
    
    // Refresh user data just in case
    await loadUserData();
    
    if (!email) {
      Alert.alert("Error", "Email not found. Please update your profile.");
      return;
    }
    
    paystackWebViewRef.current.startTransaction();
  };

  const handlePaystackResponseCancel = () => {
    Alert.alert("Payment Cancelled", "Transaction was cancelled");
  };

  const handlePaystackResponseSuccess = async () => {
    if (!validateAmount()) return;

    const userData = {
      mobile: mobile,
      description: `Adding ${config.name} funds`,
      type: config.type,
      debit: amountToPaid,
      credit: 0,
    };

    setLoading(true);

    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/createtransactions.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.status === 201) {
        Alert.alert(
          "Success", 
          "Payment successful!",
          [{ text: "OK", onPress: () => router.replace("/(tabs)/") }]
        );
      } else if (response.status === 500) {
        const data = await response.json().catch(() => null);
        Alert.alert("Payment Failed", data?.message || "Payment update failed");
      } else {
        Alert.alert("Error", "An unexpected error occurred");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const BalanceComponent = config.balanceComponent;

  return (
    <ScrollView style={tw`flex-1 bg-gray-100`}>
      <Container>
        {/* Header with animation */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <TouchableOpacity onPress={() => router.replace("/(tabs)/")}>
            <InfiniteHeader />
          </TouchableOpacity>
        </Animated.View>

        {/* Paystack Integration */}
        <Paystack
          paystackKey={PAYSTACK_KEY}
          billingEmail={email}
          billingName={username}
          currency='NGN'
          amount={amountToPaid}
          channels={["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"]}
          onCancel={handlePaystackResponseCancel}
          onSuccess={handlePaystackResponseSuccess}
          ref={paystackWebViewRef}
        />

        {/* Profile and Balance with animation */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          
          
        </Animated.View>

        {/* Main Form */}
        <View style={tw`p-6 mt-6 bg-white rounded-lg shadow-md border border-gray-300`}>
          {/* Wallet Icon and Title */}
          <View style={tw`flex-row items-center mb-6`}>
            <View style={tw`w-12 h-12 rounded-full ${config.bgColor} items-center justify-center mr-3`}>
              <MaterialCommunityIcons 
                name={config.icon} 
                size={24} 
                color={config.color === 'yellow' ? '#CA8A04' : config.color === 'blue' ? '#2563EB' : '#7C3AED'} 
              />
            </View>
            <View>
              <Text style={tw`text-lg font-bold text-gray-800`}>{config.name}</Text>
              <Text style={tw`text-sm text-gray-500`}>Current Balance: ₦{balance.toLocaleString()}</Text>
            </View>
          </View>

          {/* Amount Input */}
          <Text style={tw`text-xl ${config.textColor} mb-2`}>Amount</Text>
          <View style={tw`flex-row items-center border ${config.borderColor} rounded-md mb-4 bg-gray-50`}>
            <Text style={tw`pl-3 text-gray-500 font-bold`}>₦</Text>
            <TextInput
              style={tw`flex-1 p-3`}
              placeholder="Enter amount"
              keyboardType="numeric"
              value={amountToPaid}
              onChangeText={setAmountToPaid}
              maxLength={10}
            />
          </View>

          {/* Quick Amount Suggestions */}
          <View style={tw`flex-row flex-wrap mb-4`}>
            {[1000, 2000, 5000, 10000].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={tw`mr-2 mb-2 px-4 py-2 border border-gray-300 rounded-full bg-gray-50`}
                onPress={() => setAmountToPaid(amount.toString())}
              >
                <Text style={tw`text-gray-600`}>₦{amount.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Load Fund Button */}
          <TouchableOpacity
            style={tw`${config.buttonColor} p-4 rounded-lg items-center mb-4 ${loading ? 'opacity-50' : ''}`}
            onPress={addBalance}
            disabled={loading}
          >
            <Text style={tw`text-white text-lg font-bold`}>
              {loading ? 'PROCESSING...' : 'LOAD FUNDS'}
            </Text>
          </TouchableOpacity>

          {/* Payment Methods Display */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-500 mb-3 text-center`}>Accepted Payment Methods</Text>
            <View style={tw`flex-row justify-around p-2`}>
              <MaterialCommunityIcons name="credit-card" size={30} color="#4B5563" />
              <MaterialCommunityIcons name="bank" size={30} color="#4B5563" />
              <MaterialCommunityIcons name="wallet" size={30} color="#4B5563" />
              <MaterialCommunityIcons name="google" size={30} color="#4B5563" />
            </View>
          </View>

          {/* Description */}
          <View style={tw`mt-4 p-4 bg-gray-50 rounded-lg`}>
            <Text style={tw`text-sm text-gray-600`}>
              {config.description}
            </Text>
            <Text style={tw`text-xs text-gray-400 mt-2`}>
              Minimum deposit: ₦{config.minDeposit.toLocaleString()}
            </Text>
          </View>
        </View>
      </Container>
    </ScrollView>
  );
}