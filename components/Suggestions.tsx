import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import tw from 'twrnc';
import { Link, useNavigation } from 'expo-router';
import { suggestionsData } from '@/constants';
import { NativeStackNavigationProp } from 'react-native-screens/lib/typescript/native-stack/types';
import axios from 'axios';

type RootStackParamList ={
    map:undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList,"map">;

const Suggestions = ({mymobile}) => {
  const [applock, setApplock] = useState(false); // Track if the app is locked
  const [appLockMessage, setAppLockMessage] = useState('');
  const [lockStatus, setLockStatus] = useState('');
    const navigation = useNavigation<NavigationProp>()
    const [avaOrder, setAvaOrder] = useState(0);
    

    useEffect(() => {
      getOrderStatus();
      getAppLock();
      
    });
  
  
    useEffect(() => {
      
      getAppLock();
  
      const intervalId = setInterval(() => {
        getAppLock();
      }, 10000); // Run every 10 seconds
  
      // Cleanup the interval when the component is unmounted
      return () => clearInterval(intervalId);
    }, []); 
  
    useEffect(() => {
      if(lockStatus=="YES"){
        setApplock(true);
      }else{
        setApplock(false);
      }
    },[lockStatus])

    
    
  const getAppLock = () => {
    fetch(`https://hoog.ng/infiniteorder/api/Settings/readAppLock.php`)
      .then((res) => res.json())
      .then((result) => {
        setAppLockMessage(result[0].lockmessage);
        setLockStatus(result[0].applock);
      })
      .catch((error) => console.log(error));
  };
  
  //check the order and get status
  const getOrderStatus = async () => {
    try {
      const url = `https://hoog.ng/infiniteorder/api/Customers/getOrderStatus.php?mobile=${mymobile}`;
      const response = await axios.get(url);
      console.log('API Response:', response.data);  // Log the API response
      console.log(mymobile);
      console.log(response.status);
      console.log(response.data[0].pickupstatus);
      if (response.status === 200 && response.data && response.data[0].pickupstatus !== undefined) {
        
        if(response.data[0].pickupstatus ==1 || response.data[0].pickupstatus ==0 && response.data[0].orderStatus !="Completed"){
          //formulate coordinates
          console.log(response.data[0].orderStatus);
          setAvaOrder(1);
          const customerOrigin = {
            location: {
              lat: parseFloat(response.data[0].origin_lat),
              lng: parseFloat(response.data[0].origin_lng)
            },
            description: response.data[0].riderId
          };
          const riderCurrentPosition = {
            location: {
              lat: parseFloat(response.data[0].riderPosition_lat),
              lng: parseFloat(response.data[0].riderPosition_lng)
            },
            description: "Moving Rider"
          };
           
        }
        

        
        
      } else {
        
      }
    } catch (error) {
    
     // setError('Error fetching data');
    } finally {
      
    }
  };

    
    
    







  return (
    <View style={tw`mt-3`}>
      <View style={tw`flex-row items-center justify-between`}>
        <Text style={tw`text-sm  font-semibold`}>Order's History</Text>
        <Link href={"/VerifyImages"}>
            <Text style={tw`text-base font-semibold`}>See All</Text>
        </Link>
      </View>
      <FlatList
  data={suggestionsData}
  horizontal
  showsHorizontalScrollIndicator={false}
  keyExtractor={(item) => item?._id}
  renderItem={({ item }) => (
    <TouchableOpacity
      onPress={() => {
        if (applock) {
          // Show an alert or change the appearance of the button to indicate it's locked
          alert('The app is locked. Please try again later.');
          return; // Don't perform any action if app is locked
        }
        
        // If the app is not locked, proceed with navigation
        navigation.navigate(item?.screen, {
          showRider: true,
          orderPicked: true,
        });
      }}
      style={[
        tw`p-5 border border-yellow-600 mt-3 mr-3 rounded-lg relative`,
        applock && { opacity: 0.5 }, // Optional: Dim the button if app is locked
      ]}
      disabled={applock} // Disable the button if app is locked
    >
      {/* Circular badge for pending orders */}
      <View style={[tw`absolute top-0 right-0 bg-red-600 justify-center items-center rounded-full`, { width: 30, height: 30 }]}>
        <Text style={tw`text-white text-xl font-bold`}>
          {item.title == "Bike" && avaOrder}
        </Text>
      </View>
      
      <Image 
        source={{ uri: item?.image }}
        style={tw`w-18 h-18 mb-3 rounded-lg pr-3`}
        resizeMode="contain"
      />
      
      <Text style={tw`font-semibold`}>
        {item?.title}
      </Text>
    </TouchableOpacity>
  )}
/>

    </View>
  )
}

export default Suggestions