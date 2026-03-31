import { View, Text, StyleSheet, TouchableOpacity, Image,Alert } from 'react-native'
import React, { useEffect, useState } from 'react'

import tw from "twrnc";
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_API_KEY } from '@/config';
import { useDispatch, useSelector } from 'react-redux';
import { selectDestination, selectOrigin, selectTravelTimeInformation, setDestination, setTravelTimeInformation } from '@/store/ioSlices';
import { TabBarIcon } from './navigation/TabBarIcon';
import RiderCards from './RiderCards';
import { router, useNavigation } from 'expo-router';
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckBox } from 'react-native-elements'; // Ensure you install react-native-elements if not installed
import axios from 'axios';


const NavigateCard = ({ nTime, nDistance }) => {
    const [showaRider, setShowRider] = useState(false);
    const dispatch = useDispatch();
    const [isChecked, setIsChecked] = useState(false);
    const [isRoundTrip, setIsRoundTrip] = useState(false);


    const CHARGE_RATE = 150;
    const navigation=useNavigation();
    const [isConnected, setIsConnected] = useState(true); // Track network connection status
    const Origin = useSelector(selectOrigin);
    const Destination = useSelector(selectDestination);
    
    const [orderStatus, setOrderStatus] = useState('');
  
   

    const [customerName, setCustomerName] = useState('');
    const [mobile, setMobile] = useState('');
    const [distance, setDistance] = useState(0);
    const [mins, setMins] = useState('');
    const [cost, setCost] = useState(0);

       // State to hold the costData and fuelCostData
  const [costData, setCostData] = useState([]);
  const [fuelCostData, setFuelCostData] = useState([]);
  const [fuelCost, setFuelCost] = useState(0);


  const [balance, setBalance] = useState(0);
  const [usableBalance, setUsableBalance] = useState(0);
  const [orderType,setOrderType] = useState('Bike');
 
  const [appMode, setAppMode] = useState('');
  const [capCost, setCapCost] = useState(0);
  const [minCost, setMinCost] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [rstatus, setrStatus] = useState('');
  const [orderTimes, setOrderTimes] = useState(0);

  const travelTimeInformation = useSelector(selectTravelTimeInformation) || {
    distance: {text: "No distance", value: 0},
    duration: {text: "No duration", value: 0},
  };
  
  
  
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

/*
  useEffect(() => {
    // Fetch balance immediately on mount
    if (mobile) {
      getBalanceRide(mobile);
    }
  
    // Set up an interval to fetch balance every 10 seconds
    const intervalId = setInterval(() => {
      if (mobile) {
        getBalanceRide(mobile);
      }
    }, 10000); // 10 seconds
  
    // Set up an interval to update order type every second (optimized)
    const intervalId2 = setInterval(() => {
      setOrderType(prevOrderType => {
        const newOrderType = isChecked ? "Car" : "Bike";
        
        if (prevOrderType !== newOrderType) {
          console.log("Updated Order Type:", newOrderType);
        }
        
        return newOrderType;
      });
    }, 1000); // 1 second
  
    // Cleanup intervals when component unmounts or when dependencies change
    return () => {
      clearInterval(intervalId);
      clearInterval(intervalId2);
    };
  
  },[]); // Re-run if mobile or isChecked changes
  
*/

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      setIsConnected(true); // Network is connected
    } else {
      setIsConnected(false); // Network is disconnected
    }
  });

  // Cleanup on unmount
  return () => unsubscribe();
}, []);




const getOrderStatus = async (mobile) => {
  //console.log("trying");
  try {
    const url = `https://hoog.ng/infiniteorder/api/Customers/getOrderStatus.php?mobile=${mobile}`;
    const response = await axios.get(url);
    
  
    if (response.status === 200 && response.data && response.data[0].pickupstatus !== undefined) {
      
      setShowRider(true);
      
      //console.log('i m here');
      //console.log(message);
    } 
    
    
  } catch (error) {
    
      setError("Error fetching data"); // Handle other errors
  
  } finally {
    setLoading(false);  // Stop loading once the request is done
  }
};






  useEffect(() => {
    // Fetch balance immediately on mount
     handleGotToken();
    getBalanceRide(mobile);
    getOrderStatus(mobile);
    getAppMode();
    // Set up an interval to fetch balance every 10 seconds
    const intervalId = setInterval(() => {
      
     getBalanceRide(mobile); // Fetch balance every 10 seconds
      getOrderStatus(mobile); 
      getAppMode();
    }, 10000); // 10,000 milliseconds = 10 seconds
    
    // Cleanup the interval when component unmounts or mobile change
    return () => {
      clearInterval(intervalId);
      
    };

  }, [mobile]); // Re-run if mobile changes



  const getAppMode = async () => {
  try {
    const response = await fetch('https://hoog.ng/infiniteorder/api/Settings/readAppMode.php');
    const result = await response.json();

    setAppMode(result[0].mode);
    setMinCost(result[0].minCost);
    setCapCost(result[0].capCost);
    setOrderTimes(result[0].orderTimes);

    // Save to AsyncStorage after setting the state
    await AsyncStorage.setItem("AppMode", result[0].mode); 
  } catch (error) {
    console.log("Error fetching app mode:", error);
  }
};



  useEffect(() => {
    const intervalId = setInterval(() => {
      const odt = isChecked ? "Car" : "Bike";
      setOrderType(odt);
      console.log("Commuters Order Type ********* :"+ odt);
    }, 1000); // Runs every second
  
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [isChecked]); // Re-run if `isChecked` changes
    

    
    useEffect(() => {
      handleGotToken();
    });
    

    useEffect(() => {
      // Only fetch if costData is empty
      if (costData.length === 0) {
        fetchData();
      }
    }, [costData]); // Dependency array ensures it only runs when costData changes
  


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



const getBalanceRide = (mobile) => {
  fetch(`https://hoog.ng/infiniteorder/api/Customers/sumRideBalance.php?mobile=${mobile}`)
    .then((res) => res.json())
    .then((result) => {
      if(result[0].balance > 0){
          setBalance(result[0].balance);
          setUsableBalance(result[0].balance-result[0].bonus);
      }
    })
    .catch((error) => console.log(error));
};


    const handleGotToken = async () => {
      getAppMode();
      const cusName = await AsyncStorage.getItem("name")
      const MyMobile = await AsyncStorage.getItem('mobile');
      const appmode = await AsyncStorage.getItem('AppMode');
    
     
      setCustomerName(cusName);
      setAppMode(appmode);
      setMobile(MyMobile);

    }


//fetchOrderCount for the current user
    useEffect(() => {
    const fetchOrderCount = async () => {
      try {
        const response = await fetch(`https://hoog.ng/infiniteorder/api/Settings/countRideOrders.php?mobile=${mobile}`);
        const json = await response.json();

        if (json.status === 'success') {
          setOrderCount(json.today_order_count);
          setrStatus('success');
        } else {
          setOrderCount(0);
          setrStatus('error');
        }
      } catch (error) {
        console.error('Fetch error:', error);
        setrStatus('error');
      } finally {
        
      }
    };

    if (mobile) {
      fetchOrderCount();
    }
  }, [mobile]);
  
    const fetchData = async () => {
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
    // Function to create a ride order
    const createRideOrder = async () => {
      if(nDistance < 1){
        Alert.alert("Eror","Kindly start the selection again.");
        return;
      } 
      getAppMode();
      //deleteOrder();
      //delete already included in the create
      setOrderStatus("Pending");
      const calcCost = calculateCost();
        //before the one below, get numbers of completed orders for the current date for a specific user
  //get orderTimes set in the appMode table
  //then compare: if orderTimes > noOfCompletedOder and appMode != "Normal" then......
  //only applied to promo
  let promoCost=0;
//  console.log("Order Times " + orderTimes);
 // console.log("Cap Cost " + capCost);
 // console.log("Minimum Cost " + minCost);
 // console.log("Calculated Cost : " + calcCost);
  /*
  if((orderTimes > orderCount) && (appMode != "Normal")){
     promoCost = calcCost <= capCost ? minCost: minCost +(calcCost - capCost);
  }  
*/

  if ((orderTimes > orderCount) && (appMode !== "Normal")) {
    if (calcCost <= capCost) {
      promoCost = minCost;
    } 
    if (calcCost > capCost) {
      promoCost = (parseFloat(minCost) + (parseFloat(calcCost) - parseFloat(capCost)));
    }
  }

  //console.log("Final Promo Cost " + promoCost);
  //console.log("Order Count " + orderCount);


      if(usableBalance < calcCost){
        Alert.alert("Balance Err.","Pure Bonus cannot be use for trip, kindly load fund");
        router.replace("/AddRiderBalance");
        return;
      }
      //console.log("Get me the type here :" + orderType);
      //return;
     // console.log(nTime);
      const data = {
        mobile:mobile,
        name:customerName,
        distance:nDistance,
        mins:nTime,
        cost:calcCost,
        promoCost:promoCost,
        orderType:orderType,
        origin_lat: Origin?.location?.lat,
        origin_lng: Origin?.location?.lng,
        destination_lat: Destination?.location?.lat,
        destination_lng: Destination?.location?.lng,
        origin: Origin?.description,
        destination: Destination?.description
        
      };
  
      try {
        const response = await fetch('https://hoog.ng/infiniteorder/api/TransportOrders/create.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
  
        // Handle response
        if (response.status === 201) {
          //const responseData = await response.json();
          
         // console.log('Order created successfully:', responseData);
          Alert.alert('Success', 'Your ride order has been successfully created.');
          
           
        } else {
          
          Alert.alert('Error', 'Failed to create ride order. Please try again.');
        }
      } catch (error) {
        
        Alert.alert('Error', 'An error occurred. Please check your connection.');
      }
    };

  // Function  deleting the uncompleted order
  const deleteOrder = () => {
        
          fetch('https://hoog.ng/infiniteorder/api/TransportOrders/delete.php', {
            method: 'DELETE', // HTTP method
            headers: {
              'Content-Type': 'application/json', // Set content type for the request
            },
            body: JSON.stringify({ mobile }), // Send `mobile` as the body in JSON format
          })
            .then((response) => response.json())
            .then((data) => {
            
              if (data.success) {
              
                console.log('Order deleted successfully!');
              } else {
               
              }
            })
            .catch((error) => {
             
            });
  };
  
// Calculate the total cost using the provided formula
const calculateCost = () => { 
const distancee = travelTimeInformation?.distance || 0; // Distance from travelTimeInformation
const selectedCost = getCostForDistance(distancee); // Example cost from selected range
//console.log("Selected Cost : "+ selectedCost);
const time = travelTimeInformation?.duration || 0; // Time from travelTimeInformation
  const distanceCost = distancee * selectedCost;  // cost based on distance
  const timeCost = (time / 60) * (10000 / 60);   // time-based cost
  const fuelcost = (1 / 10) * fuelCost;              // fuel cost

  let totalCost = distanceCost + timeCost + fuelCost;




  // If isChecked is true, apply the new calculation
  if (isChecked) {
    totalCost = totalCost * 3 + 300;
  
    // Ensure the minimum cost is 1,300 when Car is selected
    if (totalCost < 1300) {
      totalCost = 1300;
    }
    }else{
      // Ensure the minimum base cost is 238 fo BIke
      if (totalCost < 238) {
        totalCost = 238;
      }

  }
  
  return totalCost;

};

const totalCost = calculateCost();

// Format the total cost as currency
const formattedCost = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'NGN',
}).format(totalCost);



  return (
  <View style={tw`flex-1 bg-white`}>
    {showaRider ? (
      <View>
        <RiderCards setShowRider={setShowRider} />
      </View>
    ) : (
      <>
        <View style={tw`flex-row items-center justify-between mb-2 px-2`}>
  {/* Greeting */}
  <View style={tw`flex-row items-center`}>
    <Text style={[tw`text-xl font-semibold`, { fontFamily: 'SacR', fontSize: 12 }]}>
      Hi,
    </Text>
    <Text style={[tw`text-xl font-semibold ml-1`, { fontFamily: 'OpenSansR', fontSize: 12 }]}>
      {customerName}
    </Text>
  </View>

  {/* Car Image 
  <Image source={require('../assets/images/car.jpeg')} style={tw`w-7 h-7 rounded-full`} />
*/}
  {/* Book Car with Checkbox */}
  <TouchableOpacity
    onPress={() => setIsChecked(!isChecked)}
    style={tw`flex-row items-center bg-yellow-600 px-3 py-1 rounded-lg ml-0`}
  >
    <Image source={require('../assets/images/car.jpeg')} style={tw`w-7 h-7 rounded-full`} />

   <CheckBox
  checked={isChecked}
  onPress={() => setIsChecked(!isChecked)}
  checkedIcon="check-square"
  uncheckedIcon="square-o"
  iconType="font-awesome"
  checkedColor="#fff"
  uncheckedColor="#fff"
  containerStyle={{
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  }}
/>
    <Text style={[tw`ml-0 text-white`, { fontFamily: 'OpenSansR', fontSize: 13 }]}>
      Book Car
    </Text>
  </TouchableOpacity>
        </View>

        <View>
          <GooglePlacesAutocomplete
            styles={inputBoxStyles}
            placeholder='Where to?'
            fetchDetails={true}
            query={{
              key: GOOGLE_MAPS_API_KEY,
              language: 'en',
              location: '8.4922, 4.5428',
              radius: 50000,
              componentRestrictions: { country: 'NG' },
              types: ['geocode'],
              strictbounds: true,
            }}
            minLength={2}
            enablePoweredByContainer={false}
            nearbyPlacesAPI='GooglePlacesSearch'
            debounce={400}
            onPress={(data, details = null) => {
              dispatch(
                setDestination({
                  location: details?.geometry?.location,
                  description: data?.description,
                })
              );
            }}
          />

          <View style={tw``}>
            <View style={tw`items-center`}>
              <Text style={[tw`text-xl font-bold`, { fontFamily: "NunitoM", fontSize: 18 }]}>
                {(travelTimeInformation?.distance && !isNaN(travelTimeInformation?.distance) ? travelTimeInformation?.distance : 0)} mil - Distance for your trip
              </Text>
            </View>
            <View style={tw`items-center`}>
              <Text style={[tw`text-xl font-bold`, { fontFamily: "NunitoM", fontSize: 18 }]}>
                {(travelTimeInformation?.duration && !isNaN(travelTimeInformation?.duration) ? travelTimeInformation?.duration : 0)} mins - Travel time
              </Text>
            </View>
            <View style={tw`items-center`}>
              <Text style={[tw`text-xl font-bold`, { fontFamily: "NunitoM", fontSize: 18 }]}>
                {(!isNaN(formattedCost) ? 0.00 : formattedCost)} - Total Trip Cost
              </Text>
            </View>
          </View>

          {/* Round Trip Checkbox */}
          <TouchableOpacity
            style={tw`flex-row items-center justify-center`}
            onPress={() => setIsRoundTrip(!isRoundTrip)}
            disabled={true}
          >
            <CheckBox
              disabled={false}
              checked={isRoundTrip}
              onPress={() => setIsRoundTrip(!isRoundTrip)}
              containerStyle={tw`m-0 p-0 bg-transparent`}
            />
            <Text style={[tw`text-yellow-600 ml-2`, { fontFamily: "OpenSansR", fontSize: 11 }]}>
              Round Trip (To and Fro - With Rules?)
            </Text>
          </TouchableOpacity>

          <View style={tw`flex-row bg-white justify-evenly py-3 border-t border-t border-t-gray-300`}>
            {isChecked ? (
              <TouchableOpacity
                onPress={() => [createRideOrder(), setShowRider(true)]}
                style={tw`flex-row items-center justify-between bg-black w-40 px-4 py-3 rounded-full border border-black`}
              >
                <TabBarIcon name="car" color="white" size={25} />
                <Text style={[tw`text-white text-center text-xl`, { fontFamily: "RobotoM", fontSize: 13 }]}>
                  Get me a Driver
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => [createRideOrder(), setShowRider(true)]}
                style={tw`flex-row items-center justify-between bg-black w-40 px-4 py-3 rounded-full border border-black`}
              >
                <TabBarIcon name="bicycle" color="white" size={25} />
                <Text style={[tw`text-white text-center text-xl`, { fontFamily: "RobotoM", fontSize: 13 }]}>
                  Get me a Rider
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => [router.replace("/(tabs)/"), setShowRider(false)]}
              style={tw`flex-row items-center justify-between w-32 px-4 py-3 rounded-full border border-gray-500`}
            >
              <TabBarIcon name="arrow-back" color="black" size={20} />
              <Text style={[tw`text-center`, { fontFamily: "RobotoM", fontSize: 17 }]}>
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </View>

              



      </>


              




    )}

      
     {/* Notification Section */}
     <View style={tw`mt-3 px-4`}>
            {isChecked && !showaRider ? (
              <View style={tw`flex-row items-center bg-yellow-500 p-4 rounded-lg`}>
                <Image
                  source={require('../assets/images/caryellow.jpeg')}
                  style={tw`w-12 h-12 mr-3 ml-5 rounded-md`}
                  resizeMode="contain"
                />
                <Text style={[tw`text-black`, { fontFamily: 'OpenSansR', fontSize: 16 }]}>
                  Order Car for your trip
                </Text>
              </View>
            ) : !showaRider && (
              <View style={tw`flex-row items-center bg-yellow-500 p-2 rounded-lg`}>
                <Image
                  source={require('../assets/images/bike.png')}
                  style={tw`w-16 h-16 mr-3 ml-5 rounded-md`}
                  resizeMode="contain"
                />
                <Text style={[tw`text-black`, { fontFamily: 'OpenSansR', fontSize: 16 }]}>
                  Order Bike for your trip
                </Text>
              </View>
            )}
          </View>






  </View>
  
);

}








const inputBoxStyles = StyleSheet.create({
    container:{
      backgroundColor:"white",
      marginTop:10,
      flex:0,
    },
    textInput:{
      fontSize:18,
      backgroundColor:"#fff",
      borderWidth:1,
      borderColor:"#00000050",
      borderRadius:50,
    },
  
    textInputContainer:{
      paddingBottom:0,
    },
  })
export default NavigateCard 