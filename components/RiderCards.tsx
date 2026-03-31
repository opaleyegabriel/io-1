import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity,Image, Animated, Easing, Dimensions, Alert, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location'; // Import Expo Location
import axios from 'axios';
import { GOOGLE_MAPS_API_KEY } from '@/config';
import NetInfo from "@react-native-community/netinfo";
import { router } from 'expo-router';


import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const RiderCards = ({ setShowRider }) => {

  const [isConnected, setIsConnected] = useState(true); // Track network connection status
  const [intervalId, setIntervalId] = useState(null); // Store interval ID

  // Animation for moving bike icon
  const [bikeAnimation] = useState(new Animated.Value(0));
  const [fadeAnimation] = useState(new Animated.Value(0)); // Fade-in animation for the card
  const [scaleAnimation] = useState(new Animated.Value(0)); // Scale-up animation for the button
  const [mobile, setMobile] = useState('');


  const [pickupStatus, setPickupStatus] = useState(null);  // State to hold the pickup status
  const [loading, setLoading] = useState(true);  // State to track loading
  const [error, setError] = useState(null);  // State to track errors
  const [message, setMessage] = useState('');
  const [riderName, setRiderName] = useState('');
  const [riderMobile, setRiderMobile] = useState('');
  const [orderPicked, setOrderPicked] = useState(false);
  const [riderAround, setRiderAround] = useState(false);
  const [cost, setCost] = useState(0);
  const [orderMessage,setOrderMessage] = useState('');
  const [riderCurrentLocationAsOrigin, setRiderCurrentLocationAsOrigin] = useState(null);
  const [customerOriginAsDestination, setCustomerOriginAsDestination] = useState(null);
 
  const [customerDestinationDB, setCustomerDestinationDB] = useState(null);
  const [riderTimetoReach, setRiderTimetoReach] = useState('');
  const [reOrderStatus, setReOrderStatus] = useState(true);
  const [startTripRequest,setStartTripRequest] = useState(false);
  const [tripStart, setTripStart] = useState(false);
  const [myCounter, setMyCounter]= useState(0);
  const [orderId, setOrderId] = useState(0);





  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes (in seconds)
  const [isTimerRunning, setIsTimerRunning] = useState(false); // Timer state
  const [isMaxTimeReached, setIsMaxTimeReached] = useState(false); // Whether max time reached (5 mins)
  const [paynow, setPaynow] = useState(false);
  const [riderFoundOrder,setriderFoundOrder] = useState(false);
  const [plateNumber,setplateNumber] = useState('');
  const [vehicleName,setvehicleName] = useState(''); 
  const [vehicleColor,setvehicleColor] = useState('')
  const [riderImage,setRiderImage] = useState('');
  const [dOwner, setDOwner] = useState('');
  const [cancelAvailable,setCancelAvailable] = useState(true);
  const [appMode, setAppMode] = useState('');
  const [promocost, setPromoCost] = useState(0);



  
         

  const screenWidth = Dimensions.get('window').width;



  const handleCopy = () => {
    Clipboard.setString(riderMobile); // Copy the mobile number to clipboard
    alert('Copied to clipboard!'); // Optional: You can show a feedback alert
  };


  //calculate the distance function toRadians(degrees) {
    function toRadians(degrees) {
      return degrees * (Math.PI / 180);
    }
//distance calculation

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceInKm = R * c; // Distance in kilometers
  
  // Convert distance from kilometers to miles
  const distanceInMiles = distanceInKm * 0.621371;
  
  return distanceInMiles; // Returns distance in miles
}



  useEffect(() => {
    if(!riderCurrentLocationAsOrigin || !customerOriginAsDestination) return;
    if(!orderPicked) return;
    //console.log("Im here oooo");
   let  riderLat = riderCurrentLocationAsOrigin?.location?.lat;
   let  riderLng = riderCurrentLocationAsOrigin?.location?.lng;
   let customerLat = customerOriginAsDestination?.location?.lat;
    let customerLng = customerOriginAsDestination?.location?.lng;

    const getTravelTime = async () =>{
      try {
       // const response = await fetch(url);
        const speedInMPH = 15;
        const distance = haversine(riderLat,riderLng,customerLat,customerLng);
        

        // Calculate time in minutes
        const timeInMinutes = ((distance / speedInMPH) * 60).toFixed(0);

        //console.log(timeInMinutes.toFixed(2));
        
        setRiderTimetoReach("reaching you soon!");
        if(isMaxTimeReached){
          setRiderTimetoReach('');
        }
        //if(parseInt(distance) > 15){
         // setRiderTimetoReach("reaching you in " + data + " mins");
       // }
       
      } catch (error) {
        console.log("Error fetching travel time data", error);
      }
    };
    getTravelTime();
  },[riderCurrentLocationAsOrigin,customerOriginAsDestination]);

  useEffect(() => {
    handleGotToken();
  });
  
  const handleGotToken = async () => {
   
    const MyMobile = await AsyncStorage.getItem('mobile');
    const appmode = await AsyncStorage.getItem('AppMode');
    
     
     if (promocost ==0){
     setAppMode("Normal");
     }else{
      setAppMode(appmode);
     }
      
    //console.log("username : ", cusName);
    
    setMobile(MyMobile);
    
  }
  
  const deleteUnacceptedOrder = async () => {

        Alert.alert(
          "InfiniteOrder",
          "Do you want to Delete Ride Order?",
          [
            {
              text: "No",
              onPress: () => console.log("Function execution cancelled"),
              style: "cancel"
            },
            {
              text: "Yes",
              onPress: () => deleteRideOrdering()
            }
          ]
        );
  }
  const deleteRideOrdering = async () => {
    //const url = `https://hoog.ng/infiniteorder/api/TransportOrders/deleteCustomerUnpickedOrder.php?mobile=${mobile}`;
  
    const userData = {
      mobile:mobile
    };
  
    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/TransportOrders/deleteCustomerUnpickedOrder.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
  
      let data = null;
      
      if (response.status === 500) {
        
      } else if (response.status === 204) {
            
        setShowRider(false); // Hide the rider if the deletion is successful
        Alert.alert('Success', 'Your ride order has been successfully cancelled.');
        return; 
      } else {
        //Alert.alert("unforeseen problem occur");
        
      }
    } catch (error) {
      Alert.alert("An error occurred. Please check your network and try again.");
      
    } finally {
      
    }
  };

  // Format the total cost as currency
const formattedCost = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'NGN',
}).format(cost);

  // Format the Promo cost as currency
const promoCost = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'NGN',
}).format(promocost);


  // Start the bike animation (moving left and right)
  const startBikeAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bikeAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(bikeAnimation, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Start the fade and scale animations on mount
  React.useEffect(() => {
    startBikeAnimation();
    // Fade-in the card when the component is mounted
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 500,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    // Scale-up the "Cancel Order" button after a delay
    Animated.timing(scaleAnimation, {
      toValue: 1,
      duration: 500,
      delay: 300, // Small delay for better visual appeal
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, []);

const startTrip = async () =>{
  const userData = {
    mobile:mobile,
  };

  try {
    const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/propStartTrip.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    let data = null;
    console.log("Presence Result Status : " + response.status);
    // Attempt to parse JSON only if the response body is non-empty and is of JSON type
 //   const contentLength = response.headers.get("content-length");
 //   if (response.ok && contentLength && parseInt(contentLength) > 0 && response.headers.get("content-type")?.includes("application/json")) {
 //     data = await response.json();
 //   }
    // console.log(response.status);
    
    if (response.status === 500) {
      //Alert.alert("Pick Update fail", data?.message || "Pickup update failed");
      console.log(response.status)
    } else if (response.status === 201) {
      
      alert("Start Trip Proposed, waiting for rider approval");

    } else {
      //Alert.alert("unforeseen problem occur");
      
    }
  } catch (error) {
   // Alert.alert("An error occurred. Please check your network and try again.");
    console.error(error);
  } finally {
    
  }
}
  const getOrderStatus = async (mobile) => {
    try {
      const url = `https://hoog.ng/infiniteorder/api/Customers/getOrderStatus.php?mobile=${mobile}`;
      const response = await axios.get(url);
      
    
      if (response.status === 200 && response.data && response.data[0].pickupstatus !== undefined) {
        
     

        if(response.data[0].pickupstatus ==1 && response.data[0].orderStatus=="Pending"){
          const owner = response.data[0].ordertype === "Bike" ? "Rider" : "Driver";
          setDOwner(owner);
          setMessage("This " + owner +" viewing your order");
          setOrderId(response.data[0].id);
          setRiderMobile(response.data[0].riderId);
          setplateNumber(response.data[0].plateNo);
          setvehicleName(response.data[0].rideName);
          setvehicleColor(response.data[0].rideColor);
          setRiderName(response.data[0].riderName);
          setRiderImage(response.data[0].riderImage);
          setCost(response.data[0].cost);
          setPromoCost(response.data[0].promoCost);
          setriderFoundOrder(true);
        }
        
        if(response.data[0].pickupstatus == 0 && response.data[0].orderStatus=="Pending"){
          const owner = response.data[0].ordertype === "Car" ? "Driver" : "Rider";
          setDOwner(owner);
          setMessage("Searching for a " + owner);
          setOrderId(response.data[0].id);
          setriderFoundOrder(false);
        }
        if(response.data[0].pickupstatus ==1 && response.data[0].orderStatus=="Accepted"){
          const owner = response.data[0].ordertype === "Bike" ? "Rider" : "Driver";
          setDOwner(owner);
          setMessage("This " + owner + " Accepted Your Order");
          setOrderId(response.data[0].id);
          setRiderMobile(response.data[0].riderId);
          setRiderName(response.data[0].riderName);
          setCost(response.data[0].cost);
          setOrderPicked(true);
          setOrderMessage("Picking You Up!")



          //formulate coordinates
          const customerOrigin = {
            location: {
              lat: parseFloat(response.data[0].origin_lat),
              lng: parseFloat(response.data[0].origin_lng)
            },
            description: response.data[0].riderId
          };
          const riderCurrentPosition = {
            location: {
              lat: parseFloat(response.data[0].rOrigin_lat),
              lng: parseFloat(response.data[0].rOrigin_lng)
            },
            description: "Moving Rider"
          };
          setRiderCurrentLocationAsOrigin(riderCurrentPosition);
          setCustomerOriginAsDestination(customerOrigin);
          
        }

        if(response.data[0].pickupstatus ==1 && response.data[0].orderStatus=="PickingUp"){
          const owner = response.data[0].ordertype === "Bike" ? "Rider" : "Driver";
          setDOwner(owner);

          setMessage("This " + owner + " has started Coming to pick you");
          setOrderId(response.data[0].id);
          setRiderMobile(response.data[0].riderId);
          setRiderName(response.data[0].riderName);
          setCost(response.data[0].cost);
          setOrderPicked(true);
          setReOrderStatus(false);
          setOrderMessage("Picking You Up!")



          //formulate coordinates
          const customerOrigin = {
            location: {
              lat: parseFloat(response.data[0].origin_lat),
              lng: parseFloat(response.data[0].origin_lng)
            },
            description: response.data[0].riderId
          };
          const riderCurrentPosition = {
            location: {
              lat: parseFloat(response.data[0].rOrigin_lat),
              lng: parseFloat(response.data[0].rOrigin_lng)
            },
            description: "Moving Rider"
          };
          setRiderCurrentLocationAsOrigin(riderCurrentPosition);
          setCustomerOriginAsDestination(customerOrigin);
         
        }
        if(response.data[0].pickupstatus ==1 && response.data[0].orderStatus=="Waiting" || response.data[0].orderStatus=="Pro-StartTrip"){
          setCancelAvailable(false);
          const owner = response.data[0].ordertype === "Bike" ? "Rider" : "Driver";
          setDOwner(owner);
          setMessage(owner + " is around, 3 minutes waiting time start");
          setOrderId(response.data[0].id);
          setRiderMobile(response.data[0].riderId);
          setRiderName(response.data[0].riderName);
          setCost(response.data[0].cost);
          setOrderPicked(true);
          setReOrderStatus(false);
          setRiderAround(true);
          setIsTimerRunning(true);
          setIsMaxTimeReached(false); // Reset max time reached state
          setTimeRemaining(180); // Reset timer to 3 minutes (180 seconds)
          



          //formulate coordinates
          const customerOrigin = {
            location: {
              lat: parseFloat(response.data[0].origin_lat),
              lng: parseFloat(response.data[0].origin_lng)
            },
            description: response.data[0].riderId
          };
          const riderCurrentPosition = {
            location: {
              lat: parseFloat(response.data[0].rOrigin_lat),
              lng: parseFloat(response.data[0].rOrigin_lng)
            },
            description: "Moving Rider"
          };
          setRiderCurrentLocationAsOrigin(riderCurrentPosition);
          setCustomerOriginAsDestination(customerOrigin);

          
          /*
          //start 3 min Order Stopping time
          if(myCounter ===1){

          }else{
            setMyCounter(1);
            setIsTimerRunning(true);
            setIsMaxTimeReached(false); // Reset max time reached state
             setTimeRemaining(180); // Rese 
          
          }
          */
          
          


        }
        if(response.data[0].pickupstatus ==1 && response.data[0].orderStatus=="StartTrip"){
          setCancelAvailable(false);
          setMessage("Inform Rider to accept trip start");
          setOrderId(response.data[0].id);
          setRiderMobile(response.data[0].riderId);
          setRiderName(response.data[0].riderName);
          setCost(response.data[0].cost);
          setOrderPicked(true);
          setReOrderStatus(false);
          setRiderAround(true);
          setRiderTimetoReach('');
          setStartTripRequest(true);



          //formulate coordinates
          const customerOrigin = {
            location: {
              lat: parseFloat(response.data[0].origin_lat),
              lng: parseFloat(response.data[0].origin_lng)
            },
            description: response.data[0].riderId
          };
          const riderCurrentPosition = {
            location: {
              lat: parseFloat(response.data[0].rOrigin_lat),
              lng: parseFloat(response.data[0].rOrigin_lng)
            },
            description: "Moving Rider"
          };
          setRiderCurrentLocationAsOrigin(riderCurrentPosition);
          setCustomerOriginAsDestination(customerOrigin);
          
          


        }
        
        if(response.data[0].pickupstatus ==1 && response.data[0].orderStatus=="Dropping"){
          setCancelAvailable(false);
          setMessage("Trip Starts!");
          setOrderId(response.data[0].id);
          setRiderMobile(response.data[0].riderId);
          setRiderName(response.data[0].riderName);
          setCost(response.data[0].cost);
          setPromoCost(response.data[0].promoCost);
          setOrderPicked(true);
          setReOrderStatus(false);
          setRiderAround(false);
          
          setStartTripRequest(false);
          
          setPaynow(true);

          //formulate coordinates
          const customerDestination = {
            location: {
              lat: parseFloat(response.data[0].destination_lat),
              lng: parseFloat(response.data[0].destination_lng)
            },
            description: response.data[0].riderId
          };
          const riderCurrentPosition = {
            location: {
              lat: parseFloat(response.data[0].rOrigin_lat),
              lng: parseFloat(response.data[0].rOrigin_lng)
            },
            description: "Moving Rider"
          };
          setRiderCurrentLocationAsOrigin(riderCurrentPosition);
          setCustomerDestinationDB(customerDestination);
          setRiderTimetoReach('Reaching/Reached Destination');

        }
        if(response.data[0].pickupstatus ==1 && response.data[0].orderStatus=="Completed"){
          setOrderPicked(false);
          setReOrderStatus(false);
          setRiderAround(false);
          
          setStartTripRequest(false);
          
          setPaynow(false);

          setShowRider(false);

          router.replace("/(tabs)/");

        }
        
        
        //console.log('i m here');
        //console.log(message);
      } 
      
      
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log("No Pending Order");
        setOrderPicked(false);
          setReOrderStatus(false);
          setRiderAround(false);
          
          setStartTripRequest(false);
          
          setPaynow(false);

          setShowRider(false);

        setError("No Pending Order"); // Handle 404 error properly
    } else {
        console.log("Error fetching Data");
        setError("Error fetching data"); // Handle other errors
    }
    } finally {
      setLoading(false);  // Stop loading once the request is done
    }
  };

const deleteRiderFromOrder = () =>{
  alert("Delete Rider from the Order, change order status to Pending  and change orderPicked to false");
}
useEffect(() => {
  // If connected to the internet, start the intervals for the API calls
  if (isConnected) {
    // Initial API calls
    
    getOrderStatus(mobile);  // Initial call when the component mounts
    createCustomerPresence(mobile);  // Initial call for customer presence

    // Interval for getOrderStatus every 20 seconds
    const orderStatusInterval = setInterval(() => {
      if (isConnected) {
        getOrderStatus(mobile);  // Call the API only if connected
      }
    }, 6000); // 20000ms = 20 seconds

    // Interval for createCustomerPresence every 5 seconds
    const customerPresenceInterval = setInterval(() => {
      if (isConnected) {
       // handleGotToken();
        createCustomerPresence(mobile);  // Call the API only if connected
      }
    }, 5000); // 5000ms = 5 seconds

    // Cleanup the intervals on component unmount or when connectivity changes
    return () => {
      clearInterval(orderStatusInterval);
      clearInterval(customerPresenceInterval);
    };
  } else {
    console.log('No internet connection, API calls paused.');
  }
}, [mobile, isConnected]); // Re-run when `mobile` or `isConnected` changes
  // Monitor network connectivity status
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

    //Create Customer presence
  const createCustomerPresence = async (mobile) =>{
    if(paynow) return;
   
      const userData = {
        mobile:mobile,
      };

      try {
        const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/createCustomerPresence.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        let data = null;
        console.log("Presence Result Status : " + response.status);
        // Attempt to parse JSON only if the response body is non-empty and is of JSON type
     //   const contentLength = response.headers.get("content-length");
     //   if (response.ok && contentLength && parseInt(contentLength) > 0 && response.headers.get("content-type")?.includes("application/json")) {
     //     data = await response.json();
     //   }
        // console.log(response.status);
        
        if (response.status === 500) {
          //Alert.alert("Pick Update fail", data?.message || "Pickup update failed");
          console.log(response.status)
        } else if (response.status === 200) {
          
          //alert("Position Updated");

        } else {
          //Alert.alert("unforeseen problem occur");
          
        }
      } catch (error) {
       // Alert.alert("An error occurred. Please check your network and try again.");
        console.error(error);
      } finally {
        
      }
  }


  //determine when payment button will surface
useEffect(() => {
  const interval = setInterval(async () => {
    try {
      // Hardcoded or previously assigned origin coordinates
      const customerLat = customerOriginAsDestination?.location?.lat;
      const customerLng = customerOriginAsDestination?.location?.lng;

      if (!customerLat || !customerLng) {
        console.log("⛔ Origin coordinates missing");
        return;
      }

      // 1. Get current customer location
      const currentPosition = await Location.getCurrentPositionAsync({});
      const currentLat = currentPosition.coords.latitude;
      const currentLng = currentPosition.coords.longitude;

      // 2. Calculate distance in meters
      const distanceInMeters = haversine(
        customerLat, customerLng,
         currentLat, currentLng
      );

      console.log("📍 Customer is", distanceInMeters.toFixed(2), "meters from origin");


      
      // 3. If more than 300 meters
      if (distanceInMeters > 300) {
       // setPaynow(true)
        console.log("🚨 Customer moved more than 300 meters from origin!");
        // You can trigger alert, update state, or call an API here
      }else{
      //  setPaynow(false)
      }

    } catch (error) {
      console.warn("❌ Error getting location:", error);
    }
  }, 5000); // Run every 5 seconds

  return () => clearInterval(interval); // Clean up on unmount
}, []); // Empty dependency array — runs once and sets interval

  // Timer for the countdown (3 minutes) and getOrderStatus interval (10 seconds)
  useEffect(() => {
    let countdownIntervalId;
    let statusCheckIntervalId;

    // Start the countdown timer if it's running
    if (isTimerRunning) {
      countdownIntervalId = setInterval(() => {
        setTimeRemaining((prevTime) => {
          // If time remaining is 0, stop the countdown
          if (prevTime === 0) {
            clearInterval(countdownIntervalId); // Clear the countdown interval
            setIsTimerRunning(false); // Stop the timer
            setIsMaxTimeReached(true); // Mark time as reached
            return prevTime; // Stop countdown
          }
          return prevTime - 1; // Decrease time by 1 second
        });
      }, 1000); // Update every second
    } else {
      clearInterval(countdownIntervalId); // Clear the countdown interval when timer stops
    }

    // Set up a separate interval to call getOrderStatus every 10 seconds
    statusCheckIntervalId = setInterval(() => {
     
    }, 3000); // Every 10 seconds

    // Cleanup intervals when the component unmounts or when the timer stops
    return () => {
      clearInterval(countdownIntervalId); // Cleanup countdown interval
      clearInterval(statusCheckIntervalId); // Cleanup getOrderStatus interval
    };
  }, [isTimerRunning]); // Only depend on isTimerRunning to start the countdown



// Start the countdown
const startTimer = () => {
  setIsTimerRunning(true);
  setIsMaxTimeReached(false); // Reset max time reached state
  setTimeRemaining(180); // Reset timer to 3 minutes (180 seconds)
};

// Stop the countdown
const stopTimer = () => {
  setIsTimerRunning(false);
  setIsMaxTimeReached(false); // Reset max time reached state
};

// Format the remaining time (e.g., 2:45 for 2 minutes 45 seconds)
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};


const payforthetrip = () => {

Alert.alert(
  "InfiniteOrder",
  "Do you want to Make Payment for the trip now?",
  [
    {
      text: "No",
      onPress: () => console.log("Function execution cancelled"),
      style: "cancel"
    },
    {
      text: "Yes",
      onPress: () => payforthetripFunction()
    }
  ]
);
}




const payforthetripFunction =  async () =>{
  //upon payment cases could arise, but at the customer side they will always refuse to pay
  //so when customer pay, there no cases, i believe
if(!mobile){
  Alert.alert("Error Occur","Kindly alert Rider to Implement payment from his Mobile");
  return;
}
if(!orderId){
  Alert.alert("Order Error","Order Error, kindly alert Rider to Effect");
  return;
}
if(!riderMobile){
  Alert.alert("Rider Error","Rider ID error occur, kindly alert Rider to Effect Payment");
  return;
}

//we shall one only 1 cost: it is either normal or promo price
let amount= 0;
if(appMode == "Normal"){
  amount = cost;
}else{
  amount = promocost;
}




  const userData = {
    mobile:mobile,
    id:orderId,
    riderId:riderMobile,
    cost:amount
  };

  try {
    const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/pay.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    let data = null;
    console.log("Payment made : " + response.status);
    // Attempt to parse JSON only if the response body is non-empty and is of JSON type   
    if (response.status === 500) {
      //Alert.alert("Pick Update fail", data?.message || "Pickup update failed");
      console.log(response.status)
    } else if (response.status === 200) {

      //now call payUpdate.php api if the appMode !=Normal
      if(appMode != "Normal"){
       const updateData = {
       
        id:orderId,
        cost:cost
      }; 
        const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/payUpdate.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

      }




      
      Alert.alert(
        "Success",
        "Trip Completed and Payment successful",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate to the new route once the user clicks "OK"
              router.replace("/(tabs)/");
            },
          },
          {
            text: "Cancel",
            onPress: () => {
              // You can handle the cancel action if needed
              router.replace("/(tabs)/");
            },
            style: "cancel",
          },
        ],
        { cancelable: false } // Optional: prevent dismissing the alert by tapping outside
      );


    } else {
      //Alert.alert("unforeseen problem occur");
      
    }
  } catch (error) {
    Alert.alert("An error occurred. Please check your network and try again.");
   
  } finally {
    
  }

}
  return (
    <View style={tw`flex-1 justify-center items-center`}>
      {/* When order is not picked, show the second block */}
      {!orderPicked && (
        
         <>

          {/* Animated bike icon */}
          <Animated.View
            style={[
              tw`w-full h-10 justify-center items-center`,
              {
                transform: [
                  {
                    translateX: bikeAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-0.5 * screenWidth + 50, 0.5 * screenWidth - 50], // Left and Right
                    }),
                  },
                ],
              },
            ]}
          >
            <Icon name="bicycle" size={20} color="black" />
          </Animated.View>

          <View style={tw`w-full h-30 bg-white p-2  mt-20 rounded-t-xl shadow-2xl z-20`}>
          {/* Customer Profile */}
          { !riderFoundOrder && (
            <View style={tw`flex-row items-center mb-2`}>
            <View style={tw`ml-3 flex-1`}>
              <Text style={tw`text-xl text-center font-bold text-yellow-600 mt-0`}>{message}</Text>
            {/* Cancel Order Button */}
            <TouchableOpacity
                style={tw`mt-2 py-4 px-1 bg-yellow-600 rounded-full`}
                onPress={() => deleteUnacceptedOrder()}
              >
                <Text style={[tw`text-white font-semibold text-center`,{fontFamily:"LatoB", fontSize:22}]}>Cancel Order</Text>
              </TouchableOpacity>
            </View>
            
          </View>
          )}

          { riderFoundOrder && (

<View style={tw`w-full bg-white p-4 mt-2 rounded-t-2xl shadow-2xl z-20`}>
<Text style={tw`text-xl text-center font-bold text-yellow-600 mt-0`}>Driver Viewing Your Order</Text>
{/* Rider Profile */}
<View style={tw`flex-row items-center mb-3`}>
  {/* Rider Image */}
  <Image
    source={{ uri: 'https://hoog.ng/infiniteorder/' + riderImage }} // Replace with actual image URL
    style={tw`w-13 h-13 rounded-full border-2 border-yellow-600`}
  />

  <View style={tw`ml-4 flex-1`}>
    <Text style={tw`text-lg font-bold text-gray-800`}>{riderName}</Text>
    <Text style={tw`text-sm text-gray-500`}>{vehicleName} - {vehicleColor}</Text>
  </View>
</View>

{/* Vehicle Information */}
<View style={tw`bg-gray-100 p-3 rounded-lg`}>
  <Text style={tw`text-sm text-gray-700`}>
    <Text style={tw`font-bold`}>Plate No:</Text> {plateNumber}
  </Text>
  <Text style={tw`text-sm text-gray-700`}>
    <Text style={tw`font-bold`}>Mobile:</Text> {riderMobile}
  </Text>{appMode === "Normal" ? (
  <Text style={tw`text-xl font-bold text-yellow-600 mt-1`}>
    Amount to Pay: {formattedCost}
  </Text>
) : (
  <>
    <Text style={tw`text-xl font-bold text-yellow-600 mt-1`}>
      Regular Price: {formattedCost}
    </Text>
    <Text style={tw`text-xl font-bold text-yellow-600 mt-1`}>
      Price After Discount: {promoCost}
    </Text>
  </>
)}

</View>
 {/* Cancel Order Button */}
 <TouchableOpacity
            style={tw`mt-3 py-4 px-2 bg-yellow-600 rounded-full`}
            onPress={() => deleteUnacceptedOrder()}
          >
            <Text style={[tw`text-white font-semibold text-center`,{fontFamily:"LatoB", fontSize:20}]}>Cancel Order</Text>
          </TouchableOpacity>
        
</View>
          )}
          

          











          {/* Separator Line */}
          <View style={tw`border-b border-gray-300`} />

        
          {/* Accept and Decline Buttons */}
          {/* Add your accept and decline buttons here if needed */}
        </View>
             
         

          </>

            
         
      )}
      
      {/* When order is picked, show the first block */}
      {orderPicked && (
        <View style={tw`w-full h-60 bg-white p-4  mt-55 rounded-t-xl shadow-2xl z-20`}>
          {/* Customer Profile */}
                      <View style={tw`w-full bg-white p-4 mt-2 rounded-t-2xl shadow-2xl z-20`}>
            <Text style={tw`text-xl text-center font-bold text-yellow-600 mt-0`}>{message}</Text>
            {/* Rider Profile */}
            <View style={tw`flex-row items-center mb-3`}>
              {/* Rider Image */}
              <Image
                source={{ uri: 'https://hoog.ng/infiniteorder/' + riderImage }} // Replace with actual image URL
                style={tw`w-13 h-13 rounded-full border-2 border-yellow-600`}
              />

              <View style={tw`ml-4 flex-1`}>
                <Text style={tw`text-lg font-bold text-gray-800`}>{riderName}</Text>
                <Text style={tw`text-sm text-gray-500`}>{vehicleName} - {vehicleColor}</Text>
              </View>
            </View>

            {/* Vehicle Information */}
            <View style={tw`bg-gray-100 p-3 rounded-lg`}>
              <Text style={tw`text-sm text-gray-700`}>
                <Text style={tw`font-bold`}>Plate No:</Text> {plateNumber}
              </Text>
              <Text style={tw`text-sm text-gray-700`}>
                
                 <TouchableOpacity onPress={handleCopy} style={tw`flex-row items-center`}>
                  <Text style={tw`text-sm font-medium text-gray-600 mr-2`}> Mobile: {riderMobile}</Text>
                  <MaterialCommunityIcons name="clipboard-text" size={20} color="gray" />
                </TouchableOpacity>
              </Text>
              {appMode === "Normal" ? (
                <Text style={tw`text-xl font-bold text-yellow-600 mt-1`}>
                  Amount to Pay: {formattedCost}
                </Text>
              ) : (
                <>
                 <Text style={[tw`font-bold text-yellow-600 mt-1`, { fontSize: 15 }]}>
  Regular Price: {formattedCost}
</Text>
<Text style={[tw`font-bold text-yellow-600 mt-1`, { fontSize: 15 }]}>
  Price After Discount: {promoCost}
</Text>
                </>
              )}
            </View>
            {/* Cancel Order Button */}
            { cancelAvailable &&(
              <TouchableOpacity
              style={tw`mt-3 py-4 px-2 bg-yellow-600 rounded-full`}
              onPress={() => deleteUnacceptedOrder()}
            >
              <Text style={[tw`text-white font-semibold text-center`,{fontFamily:"LatoB", fontSize:20}]}>Cancel Order</Text>
            </TouchableOpacity>
            )}
                    
                    
            </View>

          {/* Separator Line */}
          <View style={tw`border-b border-gray-300 my-2`} />

          {/* Dropoff Details */}
        
            {/* RIDER IS AROUND WAITING */}
            {orderPicked && riderAround && (
              
               <TouchableOpacity
               style={tw`mt-0 py-3 px-1 bg-yellow-600 rounded-full`}
               onPress={() => startTrip()}
             >
               <Text style={tw`text-white text-xl font-semibold text-center`}>Start Trip Now! </Text>
             </TouchableOpacity>
           
            ) 

            }

            {/* this should show when it is like 400 metres to customer destination         */}
            {paynow && (
              
              <TouchableOpacity
              style={tw`mt-0 py-3 px-1 bg-yellow-600 rounded-full`}
              onPress={() => payforthetrip()}
            >
              <Text style={tw`text-white text-xl font-semibold text-center`}>Pay for the Trip</Text>
            </TouchableOpacity>
          
           ) 

           }


          {/* Accept and Decline Buttons */}
          {/* Add your accept and decline buttons here if needed */}
        </View>
      )}
    </View>
  );
};


export default RiderCards;
