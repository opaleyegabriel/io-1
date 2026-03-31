import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import Container from '@/components/container';
import tw from 'twrnc';
import ComboBoxWithTable from '@/components/ComboBoxWithTable';
import TopBar from '@/components/TopBar'; // Assuming TopBar is already created and imported.
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AlsScreen = () => {
  const [activeScreen, setActiveScreen] = useState('comboBox');  // Initially show ComboBoxWithTable
  const [balance, setBalance] = useState(0);
  const [mobile, setMobile] = useState('');
  const [alsUsableAmt, setAlsUsableAmt] = useState(0);
  const [rideUsableAmt, setRideUsableAmt] = useState(0);
  const [profileImage, setProfileImage]= useState('');


  useEffect(() => {
    const handleGotToken = async () => {
      const myMobile = await AsyncStorage.getItem('mobile');
      let profileimage = await AsyncStorage.getItem('profileimage');
    //console.log("username : ", cusName);
    
    setMobile(myMobile);
    setProfileImage(profileimage);
      if (myMobile) {
        setMobile(myMobile);
      } else {
        alert('Your account name not found');
      }
    };

    handleGotToken();
  }, []);


  

  const getBalanceAls = (mobile) => {
    fetch(`https://hoog.ng/infiniteorder/api/Customers/sumAlsBalance.php?mobile=${mobile}`)
      .then((res) => res.json())
      .then((result) => {
        if(result[0].balance > 0){
            setBalance(result[0].balance);
            setAlsUsableAmt(result[0].balance-result[0].bonus);
        }
      })
      .catch((error) => console.log(error));
  };
  useEffect(() => {
    // Fetch balance immediately on mount
    getBalanceAls(mobile);

    // Set up an interval to fetch balance every 10 seconds
    const intervalId = setInterval(() => {
      getBalanceAls(mobile); // Fetch balance every 10 seconds
    }, 10000); // 10,000 milliseconds = 10 seconds

    // Cleanup the interval when component unmounts or mobile changes
    return () => clearInterval(intervalId);
  }, [mobile]); // Re-run if mobile changes


  // This function will be triggered when buttons inside the TopBar are clicked
  const handleScreenChange = (screen) => {
    setActiveScreen(screen);  // Update activeScreen to switch between ComboBoxWithTable and AlsOrders
  };

  // Handle the "Go Home" action - for now, just reset to the default screen
  const goHome = () => {
    router.replace("/(tabs)/");
  };

  return (
    <Container className='p-0'>
      {/* TopBar takes up 1/10 of the screen */}
      <View style={tw`h-1/10 bg-yellow-600`}>
        <TopBar balance={balance} handleScreenChange={handleScreenChange} onGoHome={goHome} />
      </View>

      {/* Main content takes up 9/10 of the screen */}
      <View style={tw`h-9/10 bg-yellow-500`}>
        {/* Render content based on activeScreen state */}
        {activeScreen === 'comboBox' && <ComboBoxWithTable />}
        
      </View>
    </Container>
  );
};

export default AlsScreen;


// Company office location (simulated for now)
/*
const COMPANY_OFFICE = {
  lat: 8.4815407000, // Lagos coordinates
  lng: 4.5621774000,
  address: "1, Opp Railway Line, Unity Road, Ilorin, Kwara State.",
  name: "Ilorin Main Office"
};
*/