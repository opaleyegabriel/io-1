import AlsBalance from '@/components/AlsBalance';
import InfiniteHeader from '@/components/InfiniteHeader';
import ProfileHeadInfo from '@/components/ProfileHeadInfo';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, Text, TouchableOpacity, TextInput, TurboModuleRegistry, Alert } from 'react-native';
import tw from 'twrnc';
import  { Paystack , paystackProps}  from 'react-native-paystack-webview';


const ProfessionalTransitionView = () => {
  const paystackWebViewRef = useRef(paystackProps.PayStackRef); 
  const [amountToPaid, setAmountToPaid] = useState('');
  const [alsBalance, setAlsBalance] = useState(0);
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] =useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
 
  const GoHome = () =>{
    router.replace("/(tabs)/");
  }
  // Animating the opacity (for fade effect) and position (for slide effect)
  const [fadeAnim] = useState(new Animated.Value(0)); // Fade-in animation
  const [slideAnim] = useState(new Animated.Value(50)); // Slide-up animation
  

  useEffect(() => {
    // Trigger the fade and slide animation after the component mounts
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800, // Duration for fade
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800, // Duration for slide
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, slideAnim]);

  const handleGotToken = async () => {
    const myMobile = await AsyncStorage.getItem("mobile")
    
    
    if(!myMobile){
      alert("Your account name not found");
      return
    }else{
      setMobile(myMobile);
    }
  }


  useEffect(() => {
    // Initial fetch when component mounts or mobile changes
    getBalance(mobile);
  
    // Set an interval to fetch data every 5 seconds
    const intervalId = setInterval(() => {
      getBalance(mobile); // Fetch data again after 5 seconds
    }, 5000); // 5000ms = 5 seconds
  
    // Cleanup function to clear the interval when the component unmounts or mobile changes
    return () => clearInterval(intervalId);
  }, [mobile]);  // Dependency array ensures this effect runs when `mobile` changes
  
  



  useEffect(() => {
    handleGotToken();
   // getBalance(mobile);
    // Trigger the fade and slide animation after the component mounts
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800, // Duration for fade
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800, // Duration for slide
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, slideAnim]);

 

//add balance for Ride Account
const getBalance = (mobile) => {
  fetch(`https://hoog.ng/infiniteorder/api/Customers/sumAlsBalance.php?mobile=${mobile}`)
  .then(res => {
    //console.log(res.status);
    //console.log(res.header);
    return res.json();
  })
  .then(
    (result) => {
      //let data= result;
     // console.log(result[0].balance);
      //console.log(data.balance);
      //console.log(result);
      //console.log(result.balance);
      //console.log(res.json());
      setAlsBalance(result[0].balance);
  },
    (error) => {
      console.log(error);
    }
  )
};

  const addBalance = async () =>{
    if(!amountToPaid){
      alert("amount can not be empty");
      return;
    }
    if(parseFloat(amountToPaid) < 200){
      alert("Minimum deposit is N200"); 
      return;
    }
    
    //set all necessary param
    let name = await AsyncStorage.getItem("name");
    let email = await AsyncStorage.getItem("email")
   setUsername(name);
   setEmail(email);

    paystackWebViewRef.current.startTransaction();
  }


const handlePaystackResponseCancel = () =>{
  alert("Payment cancelled"); 
  return; 
}
  const handlePaystackResponseSuccess = async () =>{

    //validate input
    if(!amountToPaid){
      alert("amount can not be empty");
      return;
    }

    if(parseFloat(amountToPaid) < 200){
      alert("Minimum deposit is N200"); 
      return;
    }





    const userData = {
      mobile:mobile,
      description:"Adding Laundry expected/extra cost",
      type:"ALS",
      debit:amountToPaid,
      credit:0,
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
  
      let data = null;
      // Attempt to parse JSON only if the response body is non-empty and is of JSON type
      const contentLength = response.headers.get("content-length");
      if (response.ok && contentLength && parseInt(contentLength) > 0 && response.headers.get("content-type")?.includes("application/json")) {
        data = await response.json();
      }
      console.log(response.status);
      
      if (response.status === 500) {
        Alert.alert("Payment fail", data?.message || "Payment update failed");
      } else if (response.status === 201) {
        
        Alert.alert("Payment successful!");
        //await AsyncStorage.setItem('userData', JSON.stringify(userData));
        //pass phone to dashboardLand   
        router.replace("/(tabs)/");   
      } else {
        Alert.alert("Wrong Method found.405");
        
      }
    } catch (error) {
      console.error(error);
      Alert.alert("An error occurred. Please check your network and try again.");
      
    } finally {
      setLoading(false);
    }
  
  }









  return (
    
    <View style={tw`flex-1 mt-20 bg-gray-100`}>
      
      {/* InfiniteHeader with transition */}
      <Animated.View
        style={{
          opacity: fadeAnim, // Applying fade effect
          transform: [{ translateY: slideAnim }], // Applying slide effect
        }}
      >
        <TouchableOpacity
        onPress={() => GoHome()}>
        <InfiniteHeader />
        </TouchableOpacity>
      </Animated.View>

      {/* ProfileHeadInfo with transition */}
      <Animated.View
        style={{
          opacity: fadeAnim, // Applying fade effect
          transform: [{ translateY: slideAnim }], // Applying slide effect
        }}
      >

      <Paystack
        paystackKey =  'pk_live_ef24f6249f17d76bee754b4de5a8ba7fc6c33799'//'pk_live_bfa6e6abfbfd97d03d2690a53a395d495792ea00'
        billingEmail={ email }
        billingName={ username }
        currency='NGN'
        amount = { amountToPaid }
        channels={["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"]}
        onCancel={(e) => {
          // handle response here
          handlePaystackResponseCancel()
        }}
        onSuccess={(res) => {
          // handle response here
          handlePaystackResponseSuccess()
        }}
        ref={paystackWebViewRef}
      />






        <ProfileHeadInfo />
        <AlsBalance balance={alsBalance} />
      </Animated.View>
      <View style={tw`p-6 mt-10 bg-white rounded-lg shadow-md border border-gray-300 `}>
        {/* Amount Input (TextInput) */}
      <Text style={tw`text-xl text-yellow-600 mb-2`}>Amount</Text>
      <TextInput
        style={tw`p-3 bg-gray-100 border border-yellow-300 rounded-md mb-4`}
        placeholder="Enter amount"
        keyboardType="numeric"
        value={amountToPaid}
        onChangeText={setAmountToPaid}
      />

      {/* Load Fund Button */}
      <TouchableOpacity
        style={tw`bg-yellow-600 p-3 rounded-lg items-center mb-4`}
        onPress={() => addBalance()}
      >
        <Text style={tw`text-white text-xl font-bold`}>Load Fund</Text>
      </TouchableOpacity>

      {/* Payment Gateway Icons Row */}
      <View style={tw`flex-row justify-around p-4`}>
       
        <MaterialCommunityIcons name="google" size={30} color="black" />
        
        <MaterialCommunityIcons name="credit-card" size={30} color="black" />
        <MaterialCommunityIcons name="wallet" size={30} color="black" />
      </View>
      {/* Bank Icon and Title */}
      <View style={tw`flex-row items-center mb-4`}>

        <MaterialCommunityIcons name="bank" size={30} color="black" />
        <Text style={tw`ml-2 text-lg font-bold`}>Load Your InfiniteOrder Account</Text>
      </View>

      {/* Description */}
      <Text style={tw`text-sm text-gray-700 mb-4`}>
        Add money to your account here via Paystack, transfer, and other methods to enable you to use our laundry services.
      </Text>

      
    </View>

    </View>
  );
};

export default ProfessionalTransitionView;
