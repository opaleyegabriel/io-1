import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, Alert, ActivityIndicator, AppState } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Location from 'expo-location'; // Import Expo Location
import tw from 'twrnc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapViewDirections from 'react-native-maps-directions';
import { GOOGLE_MAPS_API_KEY } from '@/config';
import axios from 'axios';
import NetInfo from "@react-native-community/netinfo";
import { router } from 'expo-router';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
 // Import Audio from expo-av
import { registerBackgroundTask, unregisterBackgroundTask } from './task/backgroundTask';



const RidersDashboard = () => {
  //zoom map
  const mapRef=useRef<MapView>(null);
  const soundRef = useRef(null); // Use a ref to store the sound object
  
  
  // State to manage the button text (ON or Start)
  const [isOnline, setIsOnline] = useState(false); // Initially "OFF" or "ON"
  const [pendingOrder, setPendingOrder] = useState(null); // State to store pending order
  const [timer, setTimer] = useState(10); // Timer for countdown (30 seconds)
  
  const [riderId, setRiderId] = useState(null); // State for rider ID
  const [countdownInterval, setCountdownInterval] = useState(null); // Store countdown interval to clear it
  const [found, setFound] = useState(false); // New state to track if the order is found
  const [showNotification, setShowNotification] = useState(false); // State to manage notification visibility
  const [isRejected, setIsRejected] = useState(false); // State to track if the order is rejected
  const [acceptedOrder, SetAcceptedOrder] = useState(false);
  // States for Current Location
  const [currentLocation, setCurrentLocation] = useState(null); // Store current location
  const [errorMsg, setErrorMsg] = useState(null); // Store error message if location access fails
  const [mobile, setMobile] = useState('');
  const [selectCustomer, setSelectCustomer] = useState(false);
  const [customer, setCustomer] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerOriginDesc, setCustomerOriginDesc] = useState('');
  const [customerDestinationDesc, setCustomerDestinationDesc] = useState('');
  const [riderCurrentLocationAsOrigin, setRiderCurrentLocationAsOrigin] = useState(null);
  const [customerOriginAsDestination, setCustomerOriginAsDestination] = useState(null);

  const [orderId, setOrderId] = useState(0);
  //customer lat and lng(Origin)
  const [customerOriginLat, setCustomerOriginLat] = useState();
  const [customerOriginLng, setCustomerOriginLng] = useState();
  const [pupDestination, setPupDestination] = useState(null);
  const [pupOrigin, setPupOrigin] = useState(null);

  //customer lat amd lng(Destination
  const [customerDestinationLat, setCustomerDestinationLat] = useState();
  const [customerDestinationLng, setCustomerDestinationLng] = useState();
  const  [locationTracked,setLocationTracked] = useState(false);
  const [cost, setCost] = useState(0);
  const [tripDistance, setTripDistance] = useState(0);
  const [tripTime, setTripTime] = useState(0);
  const [name, setName] = useState('');
  const [bikeAngle, setBikeAngle] = useState(0);
  const [pickUpNow, setPickUpNow] = useState(false);
  const [riderAround, setRiderAround] = useState(false);


  const [pickUpTrip, setPickUpTrip] = useState(false);
  const [tripStart, setTripStart] = useState(false);
  const [distanceToCustomer, setDistanceToCustomer] = useState('');
  const [minToCustomer, setMinToCustomer] = useState('');

  const [isConnected, setIsConnected] = useState(true); // Track network connection status
  const [intervalId, setIntervalId] = useState(null); // Store interval ID


  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes (in seconds)
  const [isTimerRunning, setIsTimerRunning] = useState(false); // Timer state
  const [isMaxTimeReached, setIsMaxTimeReached] = useState(false); // Whether max time reached (5 mins)
  const [rider_lat, setRider_lat] = useState(0);
  const [rider_lng, setRider_lng] = useState(0);

  const [proposedStartTrip, setProposedStartTrip] = useState(false);
  const [droppingOff, setDroppingOff] = useState(false);
  //start auto finding Pending orders
const [orders, setOrders] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [riderBalance, setRiderBalance] = useState(0);
const [orderPickUpCode, setOrderPickUpCode] = useState(''); // State to toggle between active and inactive
const [isOverlayVisible, setOverlayVisible] = useState(false);
const [profileImage, setProfileImage] = useState('');
const [bank, setBank] = useState('');
const [acctno, setAcctNo] = useState('');
const [sound, setSound] = useState();
const [appState, setAppState] = useState(AppState.currentState);
const [backgroundTime, setBackgroundTime] = useState(0);
  let intervalIdi;




  // Sample profile data (this can be replaced with your actual data source)
  const profileData = {
    name: name,
    mobileNumber: mobile,
    bankName: bank,
   accountNumber: acctno,
    profileImage: 'https://hoog.ng/infiniteorder/' + profileImage // Replace with actual image URL
  };




  const handleCopy = () => {
    Clipboard.setString(customerMobile); // Copy the mobile number to clipboard
    Alert.alert("InfiniteOrder",'Number Copied'); // Optional: You can show a feedback alert
  };

  // Handle opening the profile overlay
  const handleProfile = () => {
    setOverlayVisible(true);
  };

  // Handle closing the profile overlay
  const closeProfileOverlay = () => {
    setOverlayVisible(false);
  };
  
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


useEffect(() => {
  const subscription = AppState.addEventListener("change", (nextAppState) => {
    setAppState(nextAppState);

    if (nextAppState === "background" || nextAppState === "inactive") {
      console.log("App in background or inactive");
      registerBackgroundTask();
      // Start a timer when the app goes to the background
      setBackgroundTime(0);
      const backgroundInterval = setInterval(() => {
        setBackgroundTime((prevTime) => {
          if (prevTime >= 30) {
            clearInterval(backgroundInterval);
            //checkForPendingOrders();
           // console.log("I tried it now!")
            return prevTime;
          }
          return prevTime + 1;
        });
      }, 1000);

    } else if (nextAppState === "active") {
      console.log("App in foreground");
      setBackgroundTime(0); // Reset background timer when the app becomes active
      unregisterBackgroundTask();
    }
  });

  // Fetch rider balance every 5 seconds if mobile is provided
  if (mobile) {
    getRiderBalance(mobile);
  }

  intervalIdi = setInterval(() => {
    if (mobile) {
      getRiderBalance(mobile);
    }
  }, 5000);

  return () => {
    subscription.remove();
    clearInterval(intervalIdi);
  };
}, [mobile]);




const getRiderBalance = (mobile) => {
  fetch(`https://hoog.ng/infiniteorder/api/Riders/riderBalance.php?mobile=${mobile}`)
    .then((res) => res.json())
    .then((result) => {
      if(result[0].balance > 0){
          setRiderBalance(result[0].balance);
         
      }
    })
    .catch((error) => console.log(error));
};

//calculate the distance function toRadians(degrees) {
  function toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
  
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


const findClosestUser = (orders) => {
  getLocationAndUpdatePosition();
  const MAX_DISTANCE = 2.7; // Maximum distance in miles
  //console.log(rider_lat);
  const currentLocation = { lat: rider_lat, lng: rider_lng };  // Rider's current location (can be dynamic)
  let closestUser = null;
  let minDistance = 0.1; // Initialize with a large value

  // Loop through all orders to find the closest user
  orders.forEach(order => {
    const { mobile, origin_lat, origin_lng } = order;

    const distance = haversine(origin_lat, origin_lng, currentLocation.lat, currentLocation.lng);
   console.log("This is the distance we got : " + distance);
    // If distance is within 0.18 miles and closer than previous users
    if (distance <= MAX_DISTANCE) {
      //if (distance <= MAX_DISTANCE && distance < minDistance) {
      closestUser = order; // Set the current order as the closest user
      minDistance = distance; // Update minimum distance
    }
  });

  return closestUser; // Return the closest user (or null if no one is within range)
};

//sound play

const playRingtone = async () => {
  const { sound } = await Audio.Sound.createAsync(
    { uri: 'https://hoog.ng/infiniteorder/public/images/ring.mp3' } // External URL for the ringtone
  );
  soundRef.current = sound; // Store the sound object in the ref
  await sound.playAsync();  // Play the sound
};


// Function to stop the ringtone
const stopRingtone = async () => {
  try {
    if (soundRef.current) {
      await soundRef.current.stopAsync(); // Stop the sound
      await soundRef.current.unloadAsync(); // Unload the sound from memory
      soundRef.current = null; // Clear the ref
    }
  } catch (error) {
    console.error('Error stopping sound:', error);
  }
};

 // Function to call API and check for pending orders made by various customers
 const checkForPendingOrders = async () => {
  if (!riderId) return;

  try {
    // Build the API URL with the riderId and orderStatus=Pending as query parameters
    const url = 'https://hoog.ng/infiniteorder/api/Riders/ordersLookUp.php';

    const response = await fetch(url);
   // const data = await response.json();
    const res = await response.json();

   
  
      // Check if the response status is 200 (OK)
    if (response.status === 200) {
     // console.log("This is order :" + res.orders[0].id);  // Log the response to see its structure

      // Process the response data and find the closest user
      if (res && res.orders && Array.isArray(res.orders)) {
        //console.log("Former Code for Order+++++++++++++" + response.res.orders);
        const closestUser = findClosestUser(res.orders);
        //console.log('Closest User:', closestUser);
        //console.log("Closer" + closestUser['id']);

        selectACustomerForCurrentRider(closestUser['id']);
        setFound(true); // Set found status to true
        setOrderId(closestUser['id']);
        setCustomer(closestUser['name']);
        setCustomerMobile(closestUser['mobile']);
        setTripDistance(closestUser['distance']);
        setTripTime(closestUser['mins']);
        setCost(closestUser['cost']);
        
        setCustomerOriginDesc(closestUser['origin']);
        setCustomerDestinationDesc(closestUser['destination']);
  
        setCustomerOriginLat(closestUser['origin_lat']);
        setCustomerOriginLng(closestUser['origin_lng']);
  
        setCustomerDestinationLat(closestUser['destination_lat']);
        setCustomerDestinationLng(closestUser['destination_lng']);
  
  
        setPendingOrder(closestUser['orderStatus']); // Assuming the API returns order status
        playRingtone();
        createOriginDestinationForBikeCustomer();
      //  if (countdownInterval) {
      //    clearInterval(countdownInterval); // Stop the countdown when found is true
      //    setCountdownInterval(null); // Reset the interval state
      //  }
  
     










      }
   
      









      
    } 
   
    else {
      //getRiderOrderStatus();
      
    }
   

    
  } catch (error) {
    //console.log("Error fetching pending orders");
   // Alert.alert("Error fetching pending orders: ");
  }
};


const logout = async() => {
  AsyncStorage.clear();
  router.replace("/");
}
  useEffect(() => {
   if(locationTracked){

   }else{
    getLocationAndUpdatePosition();
   }
   if(mobile !=""){
   
   }else{
    handleGotToken();
    // Call this function during app initialization
   
   }
    getRiderBalance(mobile);
    
  });

  const handleGotToken = async () => {
  
    const MyMobile = await AsyncStorage.getItem('mobile');
    const MyName = await AsyncStorage.getItem('name');
    const profileimage = await AsyncStorage.getItem("ProfileImage");
    const MyBank = await AsyncStorage.getItem("Bank");
    const myAcct = await AsyncStorage.getItem("AcctNo");


    setMobile(MyMobile);
    setName(MyName);
    setProfileImage(profileimage);
    setBank(MyBank);
    setAcctNo(myAcct);
    
  }


  //this use effect is to zoom
  useEffect(() => {
    if (!customerOriginLat || !customerOriginLng || !mapRef.current) return;
    mapRef.current.fitToSuppliedMarkers(["origin", "destination"], {
      edgePadding: { top: 180, right: 180, bottom: 180, left: 180 },
      animated: true,
    });
  }, [setPupOrigin, pupDestination]);
  // API URL
  const apiUrl = "https://hoog.ng/infiniteorder/api/TransportOrders/readpendings.php";
//On Rider(Make him online)
const riderOn = (mobile,origin_lat,origin_lng) => {
  fetch(`https://hoog.ng/infiniteorder/api/Riders/riderOn.php?mobile=${mobile}&origin_lat=${origin_lat}&origin_lng=${origin_lng}`)
  .then(res => {
    return res.json();
  })
  .then(
    (result) => {
      let data= result;
      setIsOnline(true);
      setFound(false);
    // Set riderId dynamically when the rider goes online
      setRiderId(mobile);
      getLocationAndUpdatePosition();
  },
    (error) => {
      console.log(error);
    }
  )
};

//Off Rider(Make him offline)
const riderOff = (mobile,origin_lat,origin_lng) => {
  fetch(`https://hoog.ng/infiniteorder/api/Riders/riderOff.php?mobile=${mobile}&origin_lat=${origin_lat}&origin_lng=${origin_lng}`)
  .then(res => {
    return res.json();
  })
  .then(
    (result) => {
      let data= result;
      setIsOnline(false);
      setFound(false);
  },
    (error) => {
      console.log(error);
    }
  )
};
const selectACustomerForCurrentRider = async (orderid) =>{
  const userData = {
    id:orderid,
  };

  try {
    const response = await fetch('https://hoog.ng/infiniteorder/api/TransportOrders/orderPickUpStatusUpdate.php', {
      method: 'PUT',
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
     // console.log(response.status);
    
    if (response.status === 500) {
      Alert.alert("Pick Update fail", data?.message || "Pickup update failed");
    } else if (response.status === 200) {
      //console.log("Order Pickup code : " + data?.message);
      setSelectCustomer(true);

    } else {
      Alert.alert("unforeseen problem occur");
      
    }
  } catch (error) {
    Alert.alert("An error occurred. Please check your network and try again.");

  } finally {
    
  }




}

  
  // Handle the button press (toggle ON/Start)
  const handleOnAndOffRider = () => {
    if(!isOnline){
      riderOn(mobile,currentLocation?.latitude,currentLocation?.longitude);
     // KeepAwake.activateKeepAwakeAsync();
      //alert("Activated");
     

    }else{
      riderOff(mobile,currentLocation?.latitude,currentLocation?.longitude); 
    //  KeepAwake.deactivateKeepAwake();
//      alert("Deactivated");
    }
  };


  const createOriginDestinationForBikeCustomer = () =>{

    const origin = {
      location: {
        lat: parseFloat(customerOriginLat),
        lng: parseFloat(customerOriginLng)
      },
      description: customerOriginDesc
    };
    const currentposition = {
      location: {
        lat:  currentLocation?.latitude,
        lng: currentLocation?.longitude
      },
      description: "Current Location"
    };
    
    setPupDestination(origin);
    setPupOrigin(currentposition);
  };

  
 
  useEffect(() => {
    let apiPollingInterval;
    let countdownInterval;
    
    if (isOnline && riderId && !found && !isRejected && !acceptedOrder) {
      
      // 1. API polling logic: Check the API every 10 seconds
      apiPollingInterval = setInterval(() => {
        if (isOnline) {
          setLoading(true);
          checkForPendingOrders();
          console.log("Polling API for pending orders...");
          console.log("Online : "+ isOnline);
          console.log("RiderID : "+ riderId);
          console.log("Found : "+ found);
          console.log("Rejected : "+ isRejected);
          console.log("Accepted : "+ acceptedOrder);
          console.log("Order ID : "+ orderId);
          setTimer(10); // Reset the timer to 10 seconds
        }
      }, 10000);
  
      // 2. Countdown timer: Update the timer every second
      countdownInterval = setInterval(() => {
        setTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0));
      }, 1000);
  
      setCountdownInterval(countdownInterval); // Store the countdown interval
    }
  
    // Cleanup intervals on unmount or when `acceptedOrder` changes
    return () => {
      if (apiPollingInterval) clearInterval(apiPollingInterval);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [isOnline, riderId, ,found, isRejected, acceptedOrder]);
  

  const rejectOrder = async (orderId) =>{

      const userData = {
        id:orderId,
        customerId:customerMobile,
        riderId:riderId,
      };

      try {
        const response = await fetch('https://hoog.ng/infiniteorder/api/Riders/rejectOrder.php', {
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
        // console.log(response.status);
        
        if (response.status === 500) {
          Alert.alert("Order Rejection Error", data?.message || "Rejection fail");
        } else if (response.status === 201) {
          //riderOff(mobile,currentLocation.latitude,currentLocation.longitude);  
          setFound(false); // Set found to true (so countdown continues)
          setIsRejected(false); // Set the rejected state to true
          setShowNotification(false); // Close the notification
          setPendingOrder(null);
          SetAcceptedOrder(false);
          
        } else {
          Alert.alert("unforeseen problem occur");
          
        }
      } catch (error) {
        Alert.alert("An error occurred. Please check your network and try again.");
        console.error(error);
      } finally {
        
      }

  }

  // Decline button click handler
  const handleDecline = () => {
    stopRingtone();
    setShowNotification(true); // Show the custom notification modal
  };

  // Reject button handler
  const handleReject = () => {

      rejectOrder(orderId);
    
  };

  // Continue button handler
  const handleContinue = () => {
    setShowNotification(false); // Just close the notification, no other changes
  };
  
  const tellCustomerYouareWaiting = async () =>{
    const userData = {
      id:orderId,
      riderId:riderId,
    };

    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Riders/waiting.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      let data = null;
      console.log(response.status);
      // Attempt to parse JSON only if the response body is non-empty and is of JSON type
      const contentLength = response.headers.get("content-length");
      if (response.ok && contentLength && parseInt(contentLength) > 0 && response.headers.get("content-type")?.includes("application/json")) {
        data = await response.json();
      }
      // console.log(response.status);
      
      if (response.status === 500) {
        Alert.alert("Pick Update fail", data?.message || "Pickup update failed");
      } else if (response.status === 201) {
        setRiderAround(true);
        setPickUpTrip(false);
        
        alert("Waiting for customer to join the trip");

      } else {
        Alert.alert("unforeseen problem occur");
        
      }
    } catch (error) {
      Alert.alert("An error occurred. Please check your network and try again.");

    } finally {
      
    }
  }

  const riderDistancetoCustimerOrigin = async () => {
    try {

      let riderCurrentLat = riderCurrentLocationAsOrigin?.location?.lat;
      let riderCurrentLng = riderCurrentLocationAsOrigin?.location?.lng;
      let  customeroringLat =  customerOriginAsDestination?.location?.lat;
      let  customeroriginLng = customerOriginAsDestination?.location?.lng;



      console.log("RLat : " + riderCurrentLocationAsOrigin?.location?.lat );
      console.log("Rlng : " + riderCurrentLocationAsOrigin?.location?.lat);
      console.log("=========================================================")
      console.log("CLat : " + customerOriginAsDestination?.location?.lat);
      console.log("Clng : " + customerOriginAsDestination?.location?.lng);


     const data = (haversine(riderCurrentLat,riderCurrentLng,customeroringLat,customeroriginLng)/1.609);
     const dataraw = haversine(riderCurrentLat,riderCurrentLng,customeroringLat,customeroriginLng);
     
     const speed =15;
     const datatime = ((dataraw/speed) *60);
        const distance = data // Distance in meters
        const duration = datatime; // Duration in minutes
        // Log distance and time for debugging
      //  console.log(`Distance: ${distance} mil`);
     //   console.log(`Duration: ${duration} mins`);
        // Convert duration to minutes        
        setDistanceToCustomer(`Distance: ${distance} mil`);
        setMinToCustomer(`Duration: ${duration} minutes`);
        // Example logic: if the distance is less than or equal to 100 meters
        if ((dataraw * 0.621371) <= 0.0621) {
          setTripStart(true);
          
        } else {
          setTripStart(true);   //this is to improvise
        
        }
  
     
  
    } catch (error) {
      console.error("Error fetching travel time data:", error);
    }
  };
  
  const alertWaiting = async () =>{

    if(!currentLocation) return;
    getOrderStatus();
    riderDistancetoCustimerOrigin();
    if(!tripStart) return;
    tellCustomerYouareWaiting();
    setIsTimerRunning(true);
    setIsMaxTimeReached(false); // Reset max time reached state
    setTimeRemaining(180); // Reset timer to 3 minutes (180 seconds)
    
  }
  const pickCustomerUp = async () =>{
    updateRiderPosition(orderId);
      const userData = {
        id:orderId,
        riderId:mobile,
      };

      try {
        const response = await fetch('https://hoog.ng/infiniteorder/api/Riders/pickingUp.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        let data = null;
        console.log(response.status);
        // Attempt to parse JSON only if the response body is non-empty and is of JSON type
        const contentLength = response.headers.get("content-length");
        if (response.ok && contentLength && parseInt(contentLength) > 0 && response.headers.get("content-type")?.includes("application/json")) {
          data = await response.json();
        }
        if (response.status === 500) {
          Alert.alert("Pick Update fail", data?.message || "Pickup update failed");
        } else if (response.status === 201) {
          setPickUpNow(true);
          setPickUpTrip(true);
          alert("Customer will be waiting for you now");

        } else {
          Alert.alert("unforeseen problem occur");
          
        }
      } catch (error) {
        Alert.alert("An error occurred. Please check your network and try again.");
      } finally {
        
      }
    }
  const updateRiderPosition = async (orderid) =>{
    if(!orderId) return;
    const userData = {
      id:orderid,
      riderPosition_lat:currentLocation?.latitude,
      riderPosition_lng:currentLocation?.longitude,
    };

    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Riders/positionUpdate.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      let data = null;
      const contentLength = response.headers.get("content-length");
      if (response.ok && contentLength && parseInt(contentLength) > 0 && response.headers.get("content-type")?.includes("application/json")) {
        data = await response.json();
      }
      if (response.status === 500) {
        Alert.alert("Pick Update fail", data?.message || "Pickup update failed");
      } else if (response.status === 201) {
      } else {
        Alert.alert("unforeseen problem occur");
      }
    } catch (error) {
      Alert.alert("An error occurred. Please check your network and try again.");
    } finally {
      
    }

  }






  const acceptOrder = async () =>{
    stopRingtone();
    
    if (!riderId) return;
    //getOrderStatus();

 //check the order and get status
 
  const url = `https://hoog.ng/infiniteorder/api/Customers/getOrderStatus.php?mobile=${customerMobile}`;
  const response = await axios.get(url);
 
  if (response.status === 200 && response.data && response.data[0].pickupstatus !== undefined) {
    if(response.data[0].pickupstatus ==1 && response.data[0].orderStatus=="Pending" && response.data[0].riderId==""){
      //formulate coordinates
      
     // return;
    }else{
      setFound(false);
      Alert.alert("Order Removed","Try to pick it up ontime to avoid removing order");

      return;
    }
  }

    
  const userData = {
    id:orderId,
    customerId:customerMobile,
    riderId:mobile,
    riderName:name,
    rOrigin_lat:currentLocation?.latitude,
    rOrigin_lng:currentLocation?.longitude,
    riderPosition_lat:currentLocation?.latitude,
    riderPOsition_lng:currentLocation?.longitude,
  };

  try {
    const response = await fetch('https://hoog.ng/infiniteorder/api/Riders/acceptOrder.php', {
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
    if (response.status === 500) {
      Alert.alert("Pick Update fail", data?.message || "Pickup update failed");
    } else if (response.status === 201) {
      
      SetAcceptedOrder(true);
      setPendingOrder(null);
      

    } else if (response.status === 204){
      setPendingOrder(null);
      setFound(false);
      alert("Order cancelled due to customer offline");
    } else if (response.status === 200){
      setPendingOrder(null);
      setFound(false);
      Alert.alert("Customer Not Online","This customer not right online, search for another order");
    }
  } catch (error) {
    Alert.alert("An error occurred. Please check your network and try again.");
    
  } finally {
    
  }


  }

  //check the order and get status
  const getRiderOrderStatus = async () => {
    try {
      const url = `https://hoog.ng/infiniteorder/api/Riders/getOrderStatus.php?riderId=${riderId}`;
      const response = await axios.get(url);
      if (response.status == 200) {
        if(response.data.pickupstatus ==1 && response.data.orderStatus !="Completed"){
          //formulate coordinates
          setCost(response.data.cost);
          setCustomerMobile(response.data.mobile);
          setCustomer(response.data.name);
          const customerOrigin = {
            location: {
              lat: parseFloat(response.data.origin_lat),
              lng: parseFloat(response.data.origin_lng)
            },
            description: response.data.origin
          };
          const riderCurrentPosition = {
            location: {
              lat: parseFloat(response.data.riderPosition_lat),
              lng: parseFloat(response.data.riderPosition_lng)
            },
            description: "Moving Rider"
          };
          setRiderCurrentLocationAsOrigin(riderCurrentPosition);
          setCustomerOriginAsDestination(customerOrigin);    
          SetAcceptedOrder(true);
          setPendingOrder(null);
          setPickUpNow(true);
          setFound(true);
          setPickUpTrip(true)
         
        }
      } else {
      }
    } catch (error) {
    } finally {
      
    }
  };

  //check the order and get status
  const getOrderStatus = async () => {
    try {
      const url = `https://hoog.ng/infiniteorder/api/Customers/getOrderStatus.php?mobile=${customerMobile}`;
      const response = await axios.get(url);
     
      if (response.status === 200 && response.data && response.data[0].pickupstatus !== undefined) {
        if(response.data[0].pickupstatus ==1 && response.data[0].orderStatus=="Pending"){
          //formulate coordinates
          //setFound(false);
         // return;
        }
        
        
        if(response.data[0].pickupstatus ==1 && response.data[0].orderStatus=="PickingUp"){
          //formulate coordinates
          setOrderId(response.data[0].id);
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
          setRiderCurrentLocationAsOrigin(riderCurrentPosition);
          setCustomerOriginAsDestination(customerOrigin);      
        }
        if(response.data[0].pickupstatus ==1 && response.data[0].orderStatus =="PickingUp" &&  response.data[0].riderId == riderId){
          //formulate coordinates
          setOrderId(response.data[0].id);
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
          setRiderCurrentLocationAsOrigin(riderCurrentPosition);
          setCustomerOriginAsDestination(customerOrigin);    
          SetAcceptedOrder(true);
          setPendingOrder(null);
          setPickUpNow(true);
          setFound(true);
        }
        if(response.data[0].pickupstatus ==1 && response.data[0].orderStatus =="Pro-StartTrip" &&  response.data[0].riderId == riderId){
          //formulate coordinates
          setOrderId(response.data[0].id);
          console.log("Timer included works" + response.data[0].id);
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
          setRiderCurrentLocationAsOrigin(riderCurrentPosition);
          setCustomerOriginAsDestination(customerOrigin);    
          setProposedStartTrip(true);
        }
        if(response.data[0].pickupstatus ==1 && response.data[0].orderStatus =="Dropping" &&  response.data[0].riderId == riderId){
          //formulate coordinates
          setOrderId(response.data[0].id);
          console.log("Dropping off this order" + response.data[0].id);
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
          setRiderCurrentLocationAsOrigin(riderCurrentPosition);
          setCustomerOriginAsDestination(customerOrigin);    
          setDroppingOff(true);
          setProposedStartTrip(false);
          setRiderAround(false);
          setIsMaxTimeReached(false);
        }
 
       
      } else {
      
      }
    } catch (error) {
       //formulate coordinates
     
    } finally {
      
    }
  };

  const getOrderStatusCompleted = async () => {
   // console.log("Yes, the function is calling? :" + riderId);
    try {
      const url = `https://hoog.ng/infiniteorder/api/Riders/getCompletedOrderStatus.php?riderId=${riderId}&id=${orderId}`;
      const response = await axios.get(url);
      if (response.status === 200) {
          setOrderId(0);   
          setDroppingOff(false);
          setProposedStartTrip(false);
          setRiderAround(false);
          setIsMaxTimeReached(false);
          SetAcceptedOrder(false);
          setPickUpNow(false);
          setPickUpTrip(false);
          setIsTimerRunning(false);
          setIsMaxTimeReached(false); 
          setPendingOrder(null);
          setFound(false); // Reset found status
         
         // riderOff(mobile,currentLocation?.latitude,currentLocation?.longitude); 
          
         
      } else {
      }
    } catch (error) {
    } finally {
      
    }
  };


//calculate distance to where the customer his and then once it is about 100 metres, 
  useEffect(() => {
    riderDistancetoCustimerOrigin();
   
  },[currentLocation,customerOriginAsDestination]);


   // Function to request location and update rider position
   const getLocationAndUpdatePosition = async () => {
    setLocationTracked(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      return;
    }

    // Get current location
    let location = await Location.getCurrentPositionAsync({});
    setCurrentLocation(location.coords); // Store the current location in state
    setRider_lat(location.coords.latitude);
    setRider_lng(location.coords.longitude);
  };


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
      
      if (isOnline) {
        getOrderStatus(); // Call the function to check order status
        getOrderStatusCompleted(); // Call getOrderStatusCompleted every 3 seconds, but only if online
      }

     
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

const stopOrder = async () => {
  
  const userData = {
    mobile:mobile,
    riderId:riderId
  };

  try {
    const response = await fetch('https://hoog.ng/infiniteorder/api/Riders/stopOrder.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    let data = null;
    
    if (response.status === 500) {
      //Alert.alert("Pick Update fail", data?.message || "Pickup update failed");
      //console.log(response.status)
    } else if (response.status === 201) {
      
      Alert.alert("InfiniteOrder","Order Stopped and You are compensated");
      setOrderId(0);   
          setDroppingOff(false);
          setProposedStartTrip(false);
          setRiderAround(false);
          setIsMaxTimeReached(false);
          SetAcceptedOrder(false);
          setPickUpNow(false);
          setPickUpTrip(false);
          setIsTimerRunning(false);
          setIsMaxTimeReached(false); 
          setPendingOrder(null);
          setFound(false); // Reset found status

    } else {
      //Alert.alert("unforeseen problem occur");
      
    }
  } catch (error) {
   // Alert.alert("An error occurred. Please check your network and try again.");

  } finally {
    
  }
}
const startTripDroppingoff = async () => {
  //but this suppose to happen when customer is like 200 metre away departing customer origin
  const userData = {
    id:orderId,
    riderId:riderId
  };

  try {
    const response = await fetch('https://hoog.ng/infiniteorder/api/Riders/dropping.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    let data = null;
    
    if (response.status === 500) {
      
    } else if (response.status === 201) {
      setDroppingOff(true);
      alert("Dropping Customer Off");

    } else {
      //Alert.alert("unforeseen problem occur");
      
    }
  } catch (error) {
    Alert.alert("An error occurred. Please check your network and try again.");
    
  } finally {
    
  }
}

const tripcompleted = async () =>{
  const userData = {
    mobile:mobile,
    riderId:riderId,
    id:orderId,
    cost:cost
  };

  try {
    const response = await fetch('https://hoog.ng/infiniteorder/api/Riders/tripCompleted.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (response.status === 500) {
     
    } else if (response.status === 200) {
      
      alert("Trip Completed");

    } else {
      Alert.alert("unforeseen problem occur");
      getOrderStatusCompleted();
      
    }
  } catch (error) {
   Alert.alert("An error occurred. Please check your network and try again.");
   
  } finally {
    
  }

}
  return (
    <View style={tw`flex-1`}>
      {/* Map View */}
      <MapView
        style={tw`flex-1`}
        initialRegion={{
          latitude: 8.48673,
          longitude: 4.7444,
          latitudeDelta: 0.090,
          longitudeDelta: 0.090,
        }}
        region={{
          latitude: currentLocation ? currentLocation.latitude : 8.48673, // Use current location latitude if available
          longitude: currentLocation ? currentLocation.longitude : 4.7444, // Use current location longitude if available
          latitudeDelta: 0.090,
          longitudeDelta: 0.090,
        }}
      >
        
        {/* Marker for current location */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            
            title= "My Current Location"
            description={currentLocation.description}
            identifier='origin'
            pinColor="green" // Optional: blue pin to represent the user's current location
          >
            
          </Marker>
        )}

{customerOriginLat && customerOriginLng && (
      
     
             
              <Marker
            coordinate={{
              latitude: parseFloat(customerOriginLat), 
              longitude: parseFloat(customerOriginLng),
            }}
        
            title="Customer Location"
            description="Location of the customer to Pick"
            identifier='destination'
            pinColor="green" // Optional: blue pin to represent the user's current location
          />
            
          )}
        {customerOriginLat && customerOriginLng && (
      
             
              <MapViewDirections 
              origin={{ latitude: currentLocation?.latitude, longitude: currentLocation?.longitude }} 
              destination={{ latitude: parseFloat(customerOriginLat), longitude: parseFloat(customerOriginLng) }}
              apikey={GOOGLE_MAPS_API_KEY}
              strokeWidth={3}
              strokeColor="black"
            />
            
          )}



         




        
      </MapView>

      {/* Floating Rider Balance, Profile Image, and Rating at the top of the Map */}
      <View style={tw`absolute top-10 left-4 right-4 flex-row justify-between items-center`}>
        {/* Rider Profile */}
        <View style={tw`flex-row items-center`}>
          <Image
            source={{ uri: 'https://example.com/profile.jpg' }}
            style={tw`w-12 h-12 rounded-full border-2 border-white`}
          />
          <View style={tw`ml-2 w-6 h-6 bg-yellow-500 rounded-full items-center justify-center`}>
            <Text style={tw`text-white text-sm`}>5</Text>
          </View>
        </View>

        {/* Rider Balance */}
        <Text style={tw`bg-yellow-600 text-xl text-white font-bold mt-4 px-6 py-3 rounded-full border-2 border-[#fbbf24] shadow-md`}>
          {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(riderBalance)}
        </Text>

        {/* Decline Button */}
        {found &&(
          <TouchableOpacity style={tw`bg-yellow-600 px-4 py-2 rounded-full`} onPress={handleDecline}>
          <Text style={tw`text-white font-semibold`}>Decline</Text>
        </TouchableOpacity>
        )}
        
      </View>

      {/* Countdown Timer below Online status */}
      {isOnline && !acceptedOrder &&(
        <View style={tw`absolute bottom-110 left-4 right-4`}>
          <Text style={tw`text-red-500 text-xl font-semibold`}>
            Next Check in: {Math.floor(timer / 60)}:{timer % 60 < 10 ? `0${timer % 60}` : timer % 60}
          </Text>
        </View>
      )}
{/* Floating trip details when Online and pending order is found */}
{isOnline && pendingOrder && found && (
  <View style={tw`absolute bottom-5 left-4 right-4 bg-white p-4 rounded-t-xl shadow-2xl z-20`}>
    {/* Customer Profile */}
    <View style={tw`flex-row items-center mb-2`}>
      <Image
        source={{ uri: 'https://example.com/mr-james.jpg' }}
        style={tw`w-12 h-12 rounded-full border-2 border-black shadow-md`}
      />
      <View style={tw`ml-3 flex-1`}>
        <Text style={[tw`text-lg font-semibold text-gray-800`,{fontFamily:"NunitoB"}]}>{customer}</Text>
        <Text style={tw`text-sm font-medium text-gray-600`}>Contact on : {customerMobile}</Text>
        <Text style={[tw`text-2xl font-bold text-yellow-600 mt-1`,{fontFamily:"KalamB", fontWeight:"Bold"}]}>NGN {cost}</Text>
        <Text style={[tw`text-sm font-medium text-gray-600`,{fontFamily:"PopR", fontSize:13}]}>Please Call to contact!</Text>
      </View>
    </View>

    {/* Separator Line */}
    <View style={tw`border-b border-gray-300 my-2`} />

    {/* Pickup Details */}
    <View style={tw`flex-row items-center mb-2`}>
      <View style={tw`w-12 h-12 bg-white border-2 border-yellow-500 rounded-full items-center justify-center`}>
        <Text style={tw`text-xs font-semibold text-yellow-600`}>P-Up</Text>
      </View>
      <View style={tw`ml-3 mt-1 flex-1`}>
      <Text style={[tw`text-sm  text-gray-500`,{fontFamily:"KalamB", fontSize: 16}]}>
          Pick this Passenger from:
        </Text>
        <Text style={[tw`text-sm text-gray-700`,{fontFamily:"NunitoB",fontSize:12}]}>
         {customerOriginDesc}
        </Text>
        <Text style={[tw`text-sm font-bold text-gray-700 mt-1`,{fontFamily:"OpenSansB",fontWeight:"Bold"}]}>PICKUP POINT</Text>
      </View>
    </View>

    {/* Dropoff Details */}
    <View style={tw`flex-row items-center mb-3`}>
      <View style={tw`w-12 h-12 bg-white border-2 border-yellow-500 rounded-full items-center justify-center`}>
        <Text style={[tw`text-xs font-semibold text-yellow-600`,{fontFamily:"RobotoB", fontSize:12}]}>{tripDistance} min</Text>
      </View>
      <View style={tw`ml-3 flex-1`}>
        <Text style={[tw`text-sm text-gray-700`,{fontFamily:"NunitoB", fontSize:12}]}>
          {tripDistance} mins ({tripTime} miles) - Trip to : {customerDestinationDesc}
        </Text>
        <Text style={[tw`text-sm font-bold text-gray-700 mt-1`,{fontFamily:"OpenSansB", fontWeight:"Bold", fontSize:14}]}>DROPPING POINT</Text>
      </View>
    </View>

    {/* Accept and Decline Buttons */}
    <View style={tw`flex-row justify-between items-center mt-2`}>
      {/* ACCEPT Button */}
      <TouchableOpacity 
      onPress={() => acceptOrder()}
      style={tw`bg-yellow-600 rounded-full px-6 py-3 shadow-md`}>
        <Text style={tw`text-white text-xl font-semibold`}>ACCEPT</Text>
      </TouchableOpacity>

      {/* Decline Button with Cancel Icon */}
      <TouchableOpacity
        style={tw`bg-red-500 rounded-full p-3 shadow-md`}
        onPress={() => setShowNotification(true)} // Assuming you want to show a notification
      >
        <Icon name="times" size={25} color="white" />
      </TouchableOpacity>
    </View>
  </View>
)}


{/* Floating trip details when Online and pending order is found */}
{isOnline && acceptedOrder && found && (
  <View style={tw`absolute bottom-25 left-4 right-4 bg-white p-4 rounded-t-xl shadow-2xl z-20`}>
    {/* Customer Profile */}
    <View style={tw`flex-row items-center mb-2`}>
      <Image
        source={{ uri: 'https://example.com/mr-james.jpg' }}
        style={tw`w-12 h-12 rounded-full border-2 border-black shadow-md`}
      />
      <View style={tw`flex-1`}>
      <Text style={tw`text-lg font-semibold text-gray-800`}>Picking Up {customer}</Text>
      <View style={tw`flex-row items-center`}>
        <Text style={tw`text-sm font-medium text-gray-600`}>Contact on : </Text>
        <TouchableOpacity onPress={handleCopy} style={tw`flex-row items-center`}>
          <Text style={tw`text-sm font-medium text-gray-600 mr-2`}>{customerMobile}</Text>
          <MaterialCommunityIcons name="clipboard-text" size={20} color="gray" />
        </TouchableOpacity>
      </View>
      <Text style={tw`text-xl font-bold text-yellow-600 mt-1`}>NGN {cost}</Text>
    </View>

    </View>

    {/* Separator Line */}
    <View style={tw`border-b border-gray-300 my-2`} />

   

    {/* Dropoff Details */}
    <View style={tw`flex-row items-center mb-3`}>
     
      <View style={tw`ml-3 flex-1`}>
       
      {!droppingOff && (
        <>
          <Text style={tw`text-center text-sm font-bold text-gray-700 mt-1`}>PICKING UP CUSTOMER NOW!</Text>
          {/* <Text style={tw`text-center text-sm font-bold text-gray-700 mt-1`}>{distanceToCustomer} | {minToCustomer}</Text> */}
          <Text style={tw`text-center text-sm font-bold text-gray-700 mt-1`}>Click START PICKUP NOW!</Text>
        </>
      )}
       {/* start  Order pickup Button */}
       {!pickUpNow &&(
         <TouchableOpacity
         style={tw`mt-12 py-3 px-6 bg-yellow-600 rounded-full`}
         onPress={() => pickCustomerUp()}
       >
         <Text style={tw`text-white  text-2xl font-semibold text-center`}>START PICK UP</Text>
       </TouchableOpacity>
       )}
      {/* start  Order pickup Button */}
      {pickUpTrip &&(
         <TouchableOpacity
         style={tw`mt-12 py-3 px-6 bg-yellow-600 rounded-full`}
         onPress={() => alertWaiting()}
          disabled={isTimerRunning || isMaxTimeReached}
       >
         <Text style={tw`text-white  text-2xl font-semibold text-center`}>ALERT CUSTOMER</Text>
       </TouchableOpacity>
       )}




       {/* if distance to where customer closes to like 100 metres, then, alert customer you around  */}
       {riderAround && !isMaxTimeReached &&(
          <View
          style={tw`mt-12 py-3 px-6 bg-yellow-600 rounded-full`}
        >
          <Text style={tw`text-white  text-2xl font-semibold text-center`}> Waiting Time:  { formatTime(timeRemaining)}</Text>
        </View>
       )

       }
       {riderAround && isMaxTimeReached &&(
          <TouchableOpacity
          style={tw`mt-12 py-3 px-6 bg-yellow-600 rounded-full`}
          onPress={() => stopOrder()} 
        >
          <Text style={tw`text-white  text-2xl font-semibold text-center`}> STOP ORDER</Text>
        </TouchableOpacity>
       )
       

       }
       {(isMaxTimeReached || proposedStartTrip) &&(
          <TouchableOpacity
          style={tw`mt-12 py-3 px-6 bg-yellow-600 rounded-full`}
          onPress={() => startTripDroppingoff()} 
        >
          <Text style={[tw`text-white  text-2xl font-semibold text-center`,{fontFamily:"NunitoR"}]}> Accept Trip Start</Text>
        </TouchableOpacity>
       )

       }
      
       {droppingOff &&(
          <TouchableOpacity
          style={tw`mt-12 py-3 px-6 bg-yellow-600 rounded-full`}
          onPress={() => tripcompleted()} 
        >
          <Text style={tw`text-white  text-2xl font-semibold text-center`}> Trip Completed</Text>
        </TouchableOpacity>
       )

       }
      </View>
     
      
    </View>

    {/* Accept and Decline Buttons */}
   
  </View>
)}




      
       
      <View style={tw`absolute bottom-32 left-0 right-0 items-center z-10`}>
  {/* Row container for Start, Order History, and Transaction History buttons */}
  <View style={tw`flex-row justify-between w-full px-5`}>
    {/* Order History Icon (Left) */}
    <TouchableOpacity
      style={tw`bg-blue-600 rounded-full w-18 h-18 justify-center items-center shadow-lg`}
      onPress={() => router.replace("/RiderOrderingHistory")} // Add your navigation function here
    >
      <Icon name="history" size={30} color="white" />
      <Text style={[tw`text-white text-xs mt-1`,{fontFamily:"NunitoB", fontSize:12}]}>Orders</Text>
    </TouchableOpacity>

    {/* Floating Start Button (Center) */}
    <TouchableOpacity
      style={tw`bg-yellow-600 rounded-full w-25 h-25 justify-center items-center shadow-lg`}
      onPress={handleOnAndOffRider}
    >
      <Icon name={isOnline ? 'toggle-on' : 'toggle-off'} size={40} color="white" />
      <Text style={tw`text-white text-sm mt-2`}>{isOnline ? 'ON' : 'Start'}</Text>
    </TouchableOpacity>

    {/* Transaction History Icon (Right) */}
    <TouchableOpacity
      style={tw`bg-green-600 rounded-full w-18 h-18 justify-center items-center shadow-lg`}
      onPress={() => router.replace("/RiderTransactionHistory")} // Add your navigation function here
    >
      <Icon name="credit-card" size={30} color="white" />
      <Text style={[tw`text-white text-xs mt-1`,{fontFamily:"NunitoB", fontSize:12}]}>Trans</Text>
    </TouchableOpacity>
  </View>
</View>
 



      {/* Rectangular Bottom Status Bar */}
      <View style={tw`absolute bottom-0 left-0 right-0 bg-white p-4 rounded-t-2xl`}>
        <View style={tw`flex-row justify-between items-center`}>
               
              {/* Touchable to open profile overlay */}
              <TouchableOpacity
                style={tw`p-4 rounded-full ${isOverlayVisible ? 'bg-yellow-600 border-2 border-[#fbbf24]' : ''}`}
                onPress={handleProfile}
              >
                <Icon
                  name="user"
                  size={27}
                  style={[tw`${isOverlayVisible ? 'text-white' : 'text-black'}`]}
                />
              </TouchableOpacity>

              {/* Profile Overlay / Modal */}
              <Modal
                animationType="slide"
                transparent={true}
                visible={isOverlayVisible}
                onRequestClose={closeProfileOverlay}
              >
                <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
                  <View style={tw`bg-white p-6 rounded-lg w-80`}>
                    {/* Profile Image */}
                    <Image
                      source={{ uri: profileData.profileImage }}
                      style={tw`w-24 h-24 rounded-full mx-auto mb-4`}
                    />

                    {/* Profile Details */}
                    <Text style={tw`text-xl font-bold text-center mb-2`}>{profileData.name}</Text>
                    <Text style={tw`text-gray-600 text-center mb-2`}>Mobile: {profileData.mobileNumber}</Text>
                    <Text style={tw`text-gray-600 text-center mb-2`}>Bank: {profileData.bankName}</Text>
                    <Text style={tw`text-gray-600 text-center mb-4`}>Account No: {profileData.accountNumber}</Text>
                    
                    {/* Close Button */}
                    <TouchableOpacity
                      onPress={closeProfileOverlay}
                      style={tw`absolute top-2 right-2`}
                    >
                      <Icon name="close" size={30} color="black" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
           


          <View style={tw`flex-1 items-center`}>
            <Text style={tw`text-xl font-semibold`}>{isOnline ? "Online" : "Offline"}</Text>
            <Text style={tw`text-sm text-gray-500`}>
              {isOnline ? "" : "5 customers within 1 mile"}
            </Text>
          </View>

          <TouchableOpacity style={tw`p-2`}
          onPress={() => logout()}
          >
            <SimpleLineIcons name="logout" size={24} style={tw`text-yellow-600`} />
            </TouchableOpacity>
        </View>
      </View>


      {/* Custom Notification Modal */}
      {showNotification && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={showNotification}
          onRequestClose={() => setShowNotification(false)}
        >
          <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
            <View style={tw`bg-white p-6 rounded-lg`}>
              <Text style={tw`text-lg font-bold`}>Do you want to reject the order?</Text>
              <View style={tw`flex-row justify-between mt-4`}>
                <TouchableOpacity onPress={handleContinue} style={tw`bg-gray-400 px-6 py-2 rounded-full`}>
                  <Text style={tw`text-white`}>Continue</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleReject} style={tw`bg-yellow-600 px-6 py-2 rounded-full`}>
                  <Text style={tw`text-white`}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default RidersDashboard;
