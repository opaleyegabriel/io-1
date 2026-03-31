import { router, Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { useKeepAwake } from 'expo-keep-awake';






export default function TabLayout() {
  

  useKeepAwake(); // Prevents the app from sleeping
  const colorScheme = useColorScheme();

  useEffect(() => {
      handleGotToken();
  }, []);
  




  const handleGotToken = async () => {
    const dataToken = await AsyncStorage.getItem("AccessToken")
    const usertpe = await AsyncStorage.getItem("user_type")
    if(!dataToken){
      router.replace("/SignUpScreen");
    }else{
      if(usertpe == "customer"){
        router.replace("/(tabs)");
      }
      if(usertpe == "rider"){

        router.replace("/RidersDashboard");
      }
      if(usertpe == "alsrider"){
        router.replace("/AlsRiderDashboard");
      }
      
      
    }
  }




  


  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="AllTransactionHistory"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'receipt-outline' : 'receipt-outline'} color={color} />
          ),
        }}
      /> 
     <Tabs.Screen
        name="orderHistory"
        options={{
          title: 'Order History',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'document-outline' : 'document-outline'} color={color} />
          ),
        }}
      /> 
     

      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'person' : 'person-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
