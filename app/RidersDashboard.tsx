import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, Alert, ActivityIndicator, AppState, Platform } from 'react-native';
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


import { checkForPendingOrders, getRiderOrderStatusToControlBackgroundSearch, resetOrderSearch, resetOrderSearchtoTrue, stopRingtone  } from './task/api';
import * as Notifications from "expo-notifications";
import { openSettings } from "expo-linking";
import * as IntentLauncher from "expo-intent-launcher";
import { useKeepAwake } from 'expo-keep-awake';
import * as Battery from "expo-battery";
import * as Device from "expo-device";



import { registerBackgroundFetch } from './task/backgroundTask';
import { Menu, Divider } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import PolylineFetcher from '@/components/PolyLineFetcher';










    
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});


const RidersDashboard = () => {
  //zoom map
  useKeepAwake();
  const mapRef=useRef<MapView>(null);
  const soundRef = useRef(null); // Use a ref to store the sound object

    




  // State to manage the button text (ON or Start)
  const [isOnline, setIsOnline] = useState(false); // Initially "OFF" or "ON"
  const [pendingOrder, setPendingOrder] = useState(null); // State to store pending order
  const [timer, setTimer] = useState(10); // Timer for countdown (30 seconds)
  
  const [riderId, setRiderId] = useState(null); // State for rider ID
  const [riderName, setRiderName] = useState(null); // State for rider Name
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
const [usertype, setUserType] = useState('');
const [ordertype, setOrderType] = useState('');
const [appState, setAppState] = useState(AppState.currentState);
const [permissionsGranted , setPermissionsGranted] = useState(false);



  
  const [orderData, setOrderData] = useState(null);
  const [orderFound, setOrderFound] = useState(false);
  const [orderRecall, setOrderRecall] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [riderAvailableStatus, setRiderAvailableStatus] = useState(null);
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);
  const [customerOrigin, setCustomerOrigin] = useState(null);



  const logout = async () => {
    AsyncStorage.clear();
    router.replace("/");
  };
  
// 1️⃣ First useEffect: Fetch user data and set necessary state
useEffect(() => {
  const handleGotToken = async () => {
    try {
      const MyMobile = await AsyncStorage.getItem('mobile');
      const MyName = await AsyncStorage.getItem('name');
      const profileimage = await AsyncStorage.getItem("ProfileImage");
      const MyBank = await AsyncStorage.getItem("Bank");
      const myAcct = await AsyncStorage.getItem("AcctNo");
      const usertype = await AsyncStorage.getItem("user_type");

      if (MyMobile) {
        setMobile(MyMobile);
        setRiderId(MyMobile);
      }
      if (MyName) setName(MyName);
      if (profileimage) setProfileImage(profileimage);
      if (MyBank) setBank(MyBank);
      if (myAcct) setAcctNo(myAcct);
      if (usertype) {
        setUserType(usertype);
        const vehicleType = usertype.toLowerCase() === "rider" ? "Bike" : "Car";
        setOrderType(vehicleType);
      }
    } catch (error) {
      console.error("Error fetching data from AsyncStorage:", error);
    }
  };

  handleGotToken();
}, []); // ✅ Runs only once when the component mounts

// 2️⃣ Second useEffect: Fetch rider balance (Only after `mobile` is set)
useEffect(() => {
  if (!mobile) return; // Ensure mobile is available

  getRiderBalance(mobile); // Fetch balance immediately

  const intervalId = setInterval(() => {
    if (mobile) {
      getRiderBalance(mobile);
    }
  }, 2000); // ✅ Fetch balance every 2 seconds

  return () => clearInterval(intervalId); // Cleanup interval on unmount
}, [mobile]); // ✅ Runs when `mobile` is updated

// 3️⃣ Third useEffect: Get rider's location (Only after `mobile` is set)
useEffect(() => {
  if (!mobile) return; // Ensure mobile is available before running

  const getLocationAndUpdatePosition = async () => {
    setLocationTracked(true);

    let { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== "granted") {
      console.log("🚫 Foreground location permission denied");
      return;
    }

    let { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== "granted") {
      Alert.alert("🚫 Background location permission denied");
      console.log("🚫 Background location permission denied");
      return;
    } else {
      console.log("📍 Rider Location Background Update allowed");
    }

    // ✅ Get current latitude and longitude
    let location = await Location.getCurrentPositionAsync({});
    setCurrentLocation(location.coords); // Store in state
    setRider_lat(location.coords.latitude);
    setRider_lng(location.coords.longitude);

    console.log("📍 Rider Location Updated:", location.coords.latitude, location.coords.longitude);

    // 🔄 Reverse Geocode to get location name
    let address = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    if (address.length > 0) {
      let place = address[0];
      let locationName = `${place.name || ""}, ${place.street || ""}, ${place.city || ""}, ${place.region || ""}, ${place.country || ""}`;
      console.log("📌 Rider Location Name:", locationName);
    } else {
      console.log("❌ No address found for this location.");
    }
  };

  getLocationAndUpdatePosition(); // Call function when effect runs
}, [mobile]); // ✅ Runs when `mobile` is updated









  const requestIgnoreBatteryOptimization = async () => {
    if (Platform.OS === "android") {
      try {
        const isOptimized = await Battery.isBatteryOptimizationEnabledAsync();
  
        if (!isOptimized) {
          console.log("Battery optimization already ignored.");
          return;
        }
  
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
          {
            data: "package:com.opaleye10.io1",
          }
        );
      } catch (error) {
        console.warn("Battery optimization request failed", error);
        openSettings(); // Open settings manually
      }
    }
  };
// Function to request location and update rider's position
const getLocationAndUpdatePosition = async () => {

  let { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== "granted") {
    console.log("🚫 Foreground location permission denied");
    return;
  }

  let { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== "granted") {
    Alert.alert("🚫 Background location permission denied");
    console.log("🚫 Background location permission denied");
    return;
  } else {
    console.log("📍 Rider Location Background Updated allowed");
  }

  // Get current latitude and longitude
  let location = await Location.getCurrentPositionAsync({});
  rider_lat = location.coords.latitude;
  rider_lng = location.coords.longitude;
  console.log("📍 Rider Location Updated:", rider_lat, rider_lng);

  // 🔄 Get the location name (address) using reverse geocoding
  let address = await Location.reverseGeocodeAsync({ latitude: rider_lat, longitude: rider_lng });

  if (address.length > 0) {
    let place = address[0]; // Get the first result
    let locationName = `${place.name || ""}, ${place.street || ""}, ${place.city || ""}, ${place.region || ""}, ${place.country || ""}`;
    console.log("📌 Rider Location Name:", locationName);
  } else {
    console.log("❌ No address found for this location.");
  }

};
//this will enable external call
/*
  useEffect(() => {
    const handleGotToken = async () => {
      try {
        const MyMobile = await AsyncStorage.getItem('mobile');
        const MyName = await AsyncStorage.getItem('name');
        const profileimage = await AsyncStorage.getItem("ProfileImage");
        const MyBank = await AsyncStorage.getItem("Bank");
        const myAcct = await AsyncStorage.getItem("AcctNo");
        const usertype = await AsyncStorage.getItem("user_type");
  
        // Only set values if they exist
        if (MyMobile) {
          setMobile(MyMobile);
          setRiderId(MyMobile);
        }
        if (MyName) setName(MyName);
        if (profileimage) setProfileImage(profileimage);
        if (MyBank) setBank(MyBank);
        if (myAcct) setAcctNo(myAcct);
        if (usertype) {
          setUserType(usertype);
  
          // Set vehicle type based on user type
          const vehicleType = usertype.toLowerCase() === "rider" ? "Bike" : "Car";
          setOrderType(vehicleType);
        }
      } catch (error) {
        console.error("Error fetching data from AsyncStorage:", error);
      }
    };
  
    handleGotToken();
  }, []); // Runs only once when the component mounts
  */
//request for Permissions
useEffect(() =>{
      const requestPermissions = async () => {
        if(Device.isDevice){
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if(existingStatus !== "granted"){
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          setPermissionsGranted(finalStatus === "granted");
        } else {
          console.log("You must use a physical devices for Push Notification")
        }
      };
      requestPermissions();
    }, []);

//request for battery permission
  useEffect(() => {
    
    requestIgnoreBatteryOptimization();
  }, []);

const riderONOFFStatusInside = async () => {
    try {
    const MyMobile = await AsyncStorage.getItem('mobile');
    if (!MyMobile) {
      console.error("❌ No mobile number found in AsyncStorage.");
      return;
    }

    const url = `https://hoog.ng/infiniteorder/api/Riders/checkOn.php?mobile=${MyMobile}`;
    const response = await axios.get(url);

    if (response.status === 200) {
      const newStatus = parseInt(response.data[0].availableStatus, 10); // Ensure it's a number
      console.log("Ride ON/OFF Status Data:", newStatus);

      // Convert status to string for AsyncStorage
      const statusString = newStatus === 1 ? 'ON' : 'OFF';

      // Get the saved status from AsyncStorage
      const savedStatus = await AsyncStorage.getItem('riderStatus');

      console.log(`📡 From Database: ${statusString}, Stored Status: ${savedStatus}, User Type: ${usertype}, Order Type : ${ordertype}`);

      // Update only if status changed
      if (savedStatus !== statusString) {
        await AsyncStorage.setItem('riderStatus', statusString);
        console.log(`✅ Rider status updated to: ${statusString}`);

        // Ensure currentLocation exists before calling riderOn/riderOff
       /*
        if (!currentLocation) {
          console.error("❌ Current location is undefined.");
          getLocationAndUpdatePosition();
          return;
        }
        */

       
        if (statusString === 'ON') {
          console.log("🚀 Rider is ONLINE");
          await riderOn(MyMobile, rider_lat, rider_lng);
        } else {
          console.log("🔴 Rider is OFFLINE");
          await riderOff(MyMobile, rider_lat, rider_lng);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error fetching ride status:", error);
  }
};

// Periodically check rider status every 30 seconds
useEffect(() => {
  const intervalId = setInterval(() => {
    riderONOFFStatusInside();
  }, 5000); // Runs every 30 seconds

  return () => clearInterval(intervalId); // Cleanup when component unmounts
}, []);


useEffect(() => {
  const restoreRiderStatus = async () => {
    const savedStatus = await AsyncStorage.getItem('riderStatus');
    if (savedStatus === 'ON') {
      console.log("🚀 Restoring rider status: ONLINE");
      await riderOn(mobile, currentLocation?.latitude, currentLocation?.longitude);
    } else {
      console.log("🔴 Rider remains OFFLINE");
    }
  };

  restoreRiderStatus();
}, []);







  // Sample profile data (this can be replaced with your actual data source)
  const profileData = {
    name: name,
    mobileNumber: mobile,
    bankName: bank,
   accountNumber: acctno,
    profileImage: 'https://hoog.ng/infiniteorder/' + profileImage // Replace with actual image URL
  };


  const handleCopy = () => {
    Clipboard.setString(orderData.mobile); // Copy the mobile number to clipboard
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
  




  useEffect(() => {
   if(locationTracked){

   }else{
    getLocationAndUpdatePosition();
   }
   if(mobile !=""){
   
   }
   //handleGotToken();

    getRiderBalance(mobile);
    
  });


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

const riderOn = async (mobile, origin_lat, origin_lng) => {
  const mymobile = await AsyncStorage.getItem('mobile');
  if (!mymobile) {
    console.log("No mobile found");
    return;
  }

  setMobile(mymobile);  // Ensure mobile is set
  
  setIsOnline(true);  // 🔥 Set isOnline before making API call

  fetch(`https://hoog.ng/infiniteorder/api/Riders/riderOn.php?mobile=${mymobile}&origin_lat=${origin_lat}&origin_lng=${origin_lng}`)
    .then(res => res.json())
    .then((result) => {
      setFound(false);
      setRiderId(mymobile);
      getLocationAndUpdatePosition();
    })
    .catch((error) => console.log(error));
};


const riderOff = async (mobile, origin_lat, origin_lng) => {
  const mymobile = await AsyncStorage.getItem('mobile');
  if (!mymobile) {
    console.log("No mobile found");
    return;
  }
  
  fetch(`https://hoog.ng/infiniteorder/api/Riders/riderOff.php?mobile=${mymobile}&origin_lat=${origin_lat}&origin_lng=${origin_lng}`)
    .then(res => res.json())
    .then(() => {
      setIsOnline(false);
      setFound(false);
      resetOrderSearch();
    })
    .catch((error) => console.log(error));
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

 
  const handleOnAndOffRider = async () => {
    stopRingtone();
    if (!isOnline) {
      
      await AsyncStorage.setItem('riderStatus', 'ON'); // Save first
      riderOn(mobile, currentLocation?.latitude, currentLocation?.longitude);
     
    } else {
      
      await AsyncStorage.setItem('riderStatus', 'OFF'); // Save first
      riderOff(mobile, currentLocation?.latitude, currentLocation?.longitude);
     
    }
  };

  const createRideToCustomerOrigin = () => {
    if (!customerOriginLat || !customerOriginLng || !currentLocation) {
      console.warn("Missing coordinates or current location");
      return;
    }
  
    const origin = {
      location: {
        lat: parseFloat(customerOriginLat),
        lng: parseFloat(customerOriginLng)
      },
      description: customerOriginDesc || "Customer Location"
    };
  
    const currentposition = {
      location: {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude
      },
      description: "Current Location"
    };
    setCustomerOrigin(origin); // Save for future comparisons
    setPupDestination(origin);
    setPupOrigin(currentposition);
  };
  
//Waiting alert customer to ensure movement toward the customer origin
  useEffect(() => {
    let interval = null;
  
    if (customerOrigin && !pickUpTrip) {
      interval = setInterval(async () => {
        // Step 1: Get Rider Current Position
        let location = await Location.getCurrentPositionAsync({});
        const riderLat = location.coords.latitude;
        const riderLng = location.coords.longitude;
  
        //console.log("Customer Origin Lat: " + customerOrigin?.location?.lat);
        //console.log("Customer Origin Lat: " + customerOrigin?.location?.lng);
        // Step 2: Calculate Distance
        const distance = haversine(
          
          customerOrigin?.location?.lat,
          customerOrigin?.location?.lng,
          riderLat,
          riderLng
        );
         
        if(distance <= 0.2604){
        
            setPickUpTrip(true);
            if(droppingOff){
              setPickUpTrip(false);  
            }
          
        }else{
         setPickUpTrip(false); 
        }
  
        console.log("🚴 Rider is", distance.toFixed(2), "miles from customer");
      }, 5000);
    }
  
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [customerOrigin]); // Only run if customer origin is set
  




  useEffect(() => {
    
    const requestPermissions = async () => {
      // Request Notification Permissions
      const { status: notifStatus } = await Notifications.requestPermissionsAsync();
      if (notifStatus !== "granted") {
        console.warn("⚠️ Notification permission denied!");
      }
    
      // Request Foreground Location Permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== "granted") {
        console.warn("⚠️ Foreground location permission denied!");
      }
    
      // Request Background Location Permissions
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== "granted") {
        console.warn("⚠️ Background location permission denied!");
      }
    };

    requestPermissions();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      setAppState(nextAppState);

      if (nextAppState === "background" || nextAppState === "inactive") {
        registerBackgroundFetch(); // Start background search
      } else if (nextAppState === "active") {
        //unregisterBackgroundTask(); // Stop background search
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);


useEffect(() => {
  let apiPollingInterval;

  if (appState === "active" && isOnline) {  // Ensure it only runs when online
    apiPollingInterval = setInterval(() => {
      if (orderFound) {
        console.log("🔄 Order already found, skipping search.");
      } else {
        getRiderOrderStatusToControlBackgroundSearch((orderData) => {
          setOrderData(orderData);
          //set customerPickUp Point(Origin)
          const CommutterOriginLocation = {
            location: {
              lat: parseFloat(orderData.origin_lat),
              lng: parseFloat(orderData.origin_lng)
            },
            description: orderData.origin || "Customer Location"
          }; 
          setCustomerOrigin(CommutterOriginLocation);



          if(orderData){
            setFound(true);

            
          }
          autopickExistingOrder();
          
          if (orderData && orderData.orderStatus === "Pending") {
            setFound(true);
            setPendingOrder(orderData.orderStatus);
            resetOrderSearchtoTrue();
          }
          if (orderData && orderData.orderStatus === "Accepted") {
            SetAcceptedOrder(true);
            setPendingOrder(null);
            setPickUpNow(false);
            setFound(true);
            setDroppingOff(false);
            setPickUpTrip(false);
            resetOrderSearchtoTrue();
          }
         
          if (orderData && orderData.orderStatus === "PickingUp") {
            SetAcceptedOrder(true);
            setPendingOrder(null);
            setPickUpNow(false);
            setFound(true);
            setDroppingOff(false);
            setPickUpTrip(false);
            resetOrderSearchtoTrue();
          }
          if (orderData && orderData.orderStatus === "Waiting") {
            setFound(true);
            SetAcceptedOrder(true);
            setPendingOrder(null);
            setPickUpNow(true);
            setProposedStartTrip(true); 
            setIsMaxTimeReached(true);
            resetOrderSearchtoTrue();
          }
          if (orderData && orderData.orderStatus === "Pro-StartTrip") {
            setFound(true);
            SetAcceptedOrder(true);
            setPendingOrder(null);
            setPickUpNow(true);
            setProposedStartTrip(true); 
            setIsMaxTimeReached(true);
            resetOrderSearchtoTrue();
          }
          if (orderData && orderData.orderStatus === "Dropping") {
            setFound(true);
            SetAcceptedOrder(true);
            setDroppingOff(true);
            setPickUpNow(true);
            setProposedStartTrip(false);
            setIsMaxTimeReached(false);
            resetOrderSearchtoTrue();
            console.log("Dropping off customer");
          }

          Notifications.scheduleNotificationAsync({
            content:{
              title: "Order Resumed",
              body: `From: ${orderData.origin}. to: ${orderData.destination}`,
              sound: "default",
            },
            trigger: new Date(Date.now() + 30 * 1000),
          });
        });

        checkForPendingOrders((orderData) => {
          setOrderData(orderData);
          if (orderData) {
            setFound(true);
            setPendingOrder(orderData.orderStatus);
          }
          Notifications.scheduleNotificationAsync({
            content:{
              title: "Order found",
              body: `From: ${orderData.origin}. to: ${orderData.destination}`,
              sound: "default",
            },
            trigger: new Date(Date.now() + 30 * 1000),
          });
        });
      }
    }, 2000);
  } else {
    console.log("🔄 Rider is NOT online, stopping order checks.");
  }

  return () => {
    if (apiPollingInterval) clearInterval(apiPollingInterval);
  };
}, [appState, isOnline]);  // 🔥 Now useEffect will rerun when isOnline updates

  const DisplayOrder = (orderData) =>{
    if (orderData && orderData.orderStatus=="Pending"){
      console.log("Order Status :");
     console.log(orderData);
     //isOnline && orderData && pendingOrder && found && !acceptOrder 
        setFound(true);
        setPendingOrder(orderData.orderStatus);
        SetAcceptedOrder(false);
        resetOrderSearchtoTrue();

    }
    if (orderData &&  orderData.orderStatus=="Accepted"){
      SetAcceptedOrder(true);
          setPendingOrder(null);
          setPickUpNow(false);
          setFound(true);
          setDroppingOff(false);
          //setPickUpNow(true);
          setPickUpTrip(false);
          resetOrderSearchtoTrue();
    }
    if (orderData &&  orderData.orderStatus=="PickingUp"){
      SetAcceptedOrder(true);
          setPendingOrder(null);
          setPickUpNow(false);
          setFound(true);
          setDroppingOff(false);
          //setPickUpNow(true);
          setPickUpTrip(false);
          resetOrderSearchtoTrue();
    }
    if (orderData && orderData.orderStatus === "Waiting") {
      setFound(true);
      SetAcceptedOrder(true);
      setPendingOrder(null);
      setPickUpNow(true);
      setProposedStartTrip(true); 
      setIsMaxTimeReached(true);
      resetOrderSearchtoTrue();
    }
   
    if (orderData && orderData.orderStatus == "Pro-StartTrip"){
      setFound(true);
      SetAcceptedOrder(true);
      setPendingOrder(null);
      setPickUpNow(true);
      setProposedStartTrip(true); 
      setIsMaxTimeReached(true);
      resetOrderSearchtoTrue();
     
    }
    if (orderData && orderData.orderStatus == "Dropping"){


      //isOnline && orderData && acceptedOrder && found


      setFound(true);
      SetAcceptedOrder(true);
      setDroppingOff(true);
      setPickUpNow(true);
      setProposedStartTrip(false);
      //setRiderAround(true);
      setIsMaxTimeReached(false);
       
      resetOrderSearchtoTrue();
    }

  }
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
    stopRingtone();
      rejectOrder(orderId);
    
  };

  // Continue button handler
  const handleContinue = () => {
    setShowNotification(false); // Just close the notification, no other changes
  };
  
  
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
    
    //get your distance to Origin of Commutter
    //if it is greater than 300 meters, Tell the rider to move closer to the Customer
    /////////And this has being achieve using useeffect to automatically//////
    /////////ensure the distance is closer before allow alert for customer waiting period//////
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
        riderId:riderId,
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
          //setPickUpTrip(true);
          Alert.alert("InfiniteOrder","Customer will be waiting for you now");

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
    const riderID = await AsyncStorage.getItem('mobile');
    const riderNAME = await AsyncStorage.getItem('name');

    //assign most variables
            //setRiderId(riderID);
            setRiderId(riderID);
            setRiderName(riderNAME);
            setOrderId(orderData.id);
            setCustomer(orderData.name);
            setCustomerMobile(orderData.mobile);
            setTripDistance(orderData.distance);
            setTripTime(orderData.mins);
            setCost(orderData.cost);
            
            setCustomerOriginDesc(orderData.origin);
            setCustomerDestinationDesc(orderData.destination);
      
            setCustomerOriginLat(orderData.origin_lat);
            setCustomerOriginLng(orderData.origin_lng);
      
            setCustomerDestinationLat(orderData.destination_lat);
            setCustomerDestinationLng(orderData.destination_lng);
            createRideToCustomerOrigin();

   
    if (!riderId){
      Alert.alert("Infinite Order:", "You may not be able to accept this order due to Rider settings error");
      return;
    } 
    //getOrderStatus();

 //check the order and get status
 
  const url = `https://hoog.ng/infiniteorder/api/Customers/getOrderStatus.php?mobile=${customerMobile}`;
  const response = await axios.get(url);
 
  if (response.status === 200 && response.data && response.data[0].pickupstatus !== undefined) {
    if(response.data[0].pickupstatus ==1 && response.data[0].orderStatus=="Pending"){
      //formulate coordinates
      
     // return;
    }else{
      setFound(false);
      resetOrderSearch();
      Alert.alert("Order Removed","Try to pick it up ontime to avoid removing order");

      return;
    }
  }

  
  const userData = {
    id:orderId,
    customerId:customerMobile,
    riderId:riderId,
    riderName:riderName,
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
      resetOrderSearch();
      alert("Order cancelled due to customer offline");
    } else if (response.status === 200){
      setPendingOrder(null);
      setFound(false);
      resetOrderSearch();
      Alert.alert("Customer Not Online","This customer not right online, search for another order");
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      setPendingOrder(null);
      setFound(false);
      resetOrderSearch();
      //Alert.alert("Customer Not Online","This customer not right online, search for another order");
  } else {
      console.log("Error fetching Data");
      setError("Error fetching data"); // Handle other errors
  }
    
  } finally {
    
  }


  }
  const autopickExistingOrder = async () =>{
    const riderID = await AsyncStorage.getItem('mobile');
    const riderNAME = await AsyncStorage.getItem('name');

    //assign most variables
            //setRiderId(riderID);
            setRiderId(riderID);
            setRiderName(riderNAME);
            setOrderId(orderData.id);
            setCustomer(orderData.name);
            setCustomerMobile(orderData.mobile);
            setTripDistance(orderData.distance);
            setTripTime(orderData.mins);
            setCost(orderData.cost);
            
            setCustomerOriginDesc(orderData.origin);
            setCustomerDestinationDesc(orderData.destination);
      
            setCustomerOriginLat(orderData.origin_lat);
            setCustomerOriginLng(orderData.origin_lng);
      
            setCustomerDestinationLat(orderData.destination_lat);
            setCustomerDestinationLng(orderData.destination_lng);
            createRideToCustomerOrigin();
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
          //setPickUpTrip(true)
         
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
          setCustomerOrigin(customerOrigin);   
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
          setCustomerOrigin(customerOrigin);  
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
          setCustomerOrigin(customerOrigin);

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
          setCustomerOrigin(customerOrigin);
          setDroppingOff(true);
          setProposedStartTrip(false);
          setRiderAround(false);
          setIsMaxTimeReached(false);
        }
 
       
      } else {
      
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
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
          resetOrderSearch(), 
          setPendingOrder(null);
          setOrderData(null);
          setFound(false); // Reset found status
          
        console.log("No Pending Order");
        setError("No Pending Order"); // Handle 404 error properly
    } else {
        console.log("Error fetching Data");
        setError("Error fetching data"); // Handle other errors
    }
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
          resetOrderSearch(), 
          setPendingOrder(null);
          setOrderData(null);
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
  /*
  useEffect(() => {
    const getLocationAndUpdatePosition = async () => {
      setLocationTracked(true);
      //start here
      let { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== "granted") {
    console.log("🚫 Foreground location permission denied");
    return;
  }

  let { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== "granted") {
    Alert.alert("🚫 Background location permission denied");
    console.log("🚫 Background location permission denied");
    return;
  } else {
    console.log("📍 Rider Location Background Updated allowed");
  }

  // Get current latitude and longitude
  let location = await Location.getCurrentPositionAsync({});
  setCurrentLocation(location.coords); // Store the current location in state
  rider_lat = location.coords.latitude;
  rider_lng = location.coords.longitude;
  console.log("📍 Rider Location Updated:", rider_lat, rider_lng);
      
      setRider_lat(location.coords.latitude);
      setRider_lng(location.coords.longitude);

  // 🔄 Get the location name (address) using reverse geocoding
  let address = await Location.reverseGeocodeAsync({ latitude: rider_lat, longitude: rider_lng });

  if (address.length > 0) {
    let place = address[0]; // Get the first result
    let locationName = `${place.name || ""}, ${place.street || ""}, ${place.city || ""}, ${place.region || ""}, ${place.country || ""}`;
    console.log("📌 Rider Location Name:", locationName);
  } else {
    console.log("❌ No address found for this location.");
  }
      //end here




















  
     
    };
  
    getLocationAndUpdatePosition(); // Call function when effect runs
  
  }, []); // Empty dependency array ensures this runs only once when component mounts
  */
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
          resetOrderSearch();

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
  //strealine datas
  setOrderId(orderData.id);
  if(orderId == 0) {
    Alert.alert("Infinite Order" + " Order ID  not exist");
    return;
  }
  if(riderId == "") {
    Alert.alert("Infinite Order" + "Rider ID not exist");
    return;
  }
  
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
      setIsMaxTimeReached(false);
      setProposedStartTrip(false);
      alert("Dropping Customer Off");
    } else {
      //Alert.alert("unforeseen problem occur");
      
    }
  } catch (error) {
    Alert.alert("An error occurred. Please check your network and try again.");
    
  } finally {
    
  }
}

const cancelAccptedOrder = async () => {
  setOrderId(orderData.id);
  if(orderId == 0) {
    Alert.alert("Infinite Order" + " Order ID  not exist");
    return;
  }
  if(riderId == "") {
    Alert.alert("Infinite Order" + "Rider ID not exist");
    return;
  }
  
  const userData = {
    id:orderId,
    riderId:riderId
  };

  try {
    const response = await fetch('https://hoog.ng/infiniteorder/api/Riders/deleteOrder.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    let data = null;
    
    if (response.status === 500) {
      
    } else if (response.status === 204) {
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
          resetOrderSearch(), 
          setPendingOrder(null);
          setOrderData(null);
          setFound(false); // Reset found status
         // riderOff(mobile,currentLocation?.latitude,currentLocation?.longitude); 
          
    } else {
      //Alert.alert("unforeseen problem occur");
      
    }
  } catch (error) {
    Alert.alert("An error occurred. Please check your network and try again.");
    
  } finally {
    
  }
}

const tripcompleted = async () =>{
  //strealine datas
  if(mobile == "") {
    Alert.alert("Infinite Order" + "Mobile number not exist");
    return;
  }
  if(riderId == "") {
    Alert.alert("Infinite Order" + "Rider ID not exist");
    return;
  }
  
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
    latitude: currentLocation ? currentLocation.latitude : 8.48673,
    longitude: currentLocation ? currentLocation.longitude : 4.7444,
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
      title="My Current Location"
      description={currentLocation.description}
      identifier="origin"
      pinColor="green"
    />
  )}

  {/* Marker for customer destination */}
  {customerOriginLat && customerOriginLng && (
    <Marker
      coordinate={{
        latitude: parseFloat(customerOriginLat),
        longitude: parseFloat(customerOriginLng),
      }}
      title="Customer Location"
      description="Location of the customer to Pick"
      identifier="destination"
      pinColor="green"
    />
  )}

  {/* OSRM Route Polyline */}
  {currentLocation && customerOriginLat && customerOriginLng && (
    <PolylineFetcher
      originLat={rider_lat}
      originLng={rider_lng}
      destLat={parseFloat(customerOriginLat)}
      destLng={parseFloat(customerOriginLng)}
    />
  )}
</MapView>


      {/* Floating Rider Balance, Profile Image, and Rating at the top of the Map */}
      <View style={tw`absolute top-10 left-4 right-4 flex-row justify-between items-center`}>
        {/* Rider Profile */}
        <View style={tw`flex-row items-center p-2 bg-yellow-600`}>
      {/* Profile Image */}
      <TouchableOpacity onPress={() => setIsVisible(!isVisible)} style={tw`flex-row items-center`}>
        <Image
          source={{ uri: "https://example.com/profile.jpg" }}
          style={tw`w-3 h-3 rounded-full border-2 border-yellow-600`}
        />
        <Ionicons name="chevron-down" size={20} style={tw`ml-2`} />
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity
        style={tw`ml-1 flex-row items-center bg-red-500 px-2 py-1 rounded-full`}
        onPress={logout}
      >
        <Ionicons name="log-out-outline" size={14} color="white" />
        <Text style={tw`text-white ml-1 text-sm`}>Logout</Text>
      </TouchableOpacity>

      {/* Dropdown Menu */}
      <Modal visible={isVisible} transparent animationType="fade">
        <TouchableOpacity
          style={tw`flex-1 bg-black/50`}
          onPress={() => setIsVisible(false)}
        />
        <View style={tw`absolute top-20 left-4 bg-white p-4 rounded-lg shadow-lg w-40`}>
          <TouchableOpacity style={tw`py-2`} onPress={() => alert("Profile Clicked")}>
            <Text style={tw`text-black`}>👤 Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={tw`py-2`} onPress={() => alert("Report Clicked")}>
            <Text style={tw`text-black`}>📊 Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={tw`py-2`} onPress={() => alert("Messages Clicked")}>
            <Text style={tw`text-black`}>💬 Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={tw`py-2`} onPress={logout}>
            <Text style={tw`text-red-500`}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>

        {/* Rider Balance */}
        <Text style={tw`bg-yellow-600 text-xl text-white font-bold mt-2 px-4 py-2 rounded-full border-2 border-[#fbbf24] shadow-md`}>
          {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(riderBalance)}
        </Text>

        {/* Decline Button */}
        {found && (
          <TouchableOpacity style={tw`bg-yellow-600 px-2 py-1 rounded-full`} onPress={handleDecline}>
          <Text style={tw`text-white font-semibold`}>Decline</Text>
        </TouchableOpacity>
        )}
        
      </View>

     

<View style={tw`absolute bottom-5 left-4 right-4 bg-white p-4 rounded-t-xl shadow-2xl z-20`}>
 
      <Text>🚀 Commuter Order Information</Text>
      {orderData && found ? (
        <View>
                      {/* Customer Profile */}
               
                <Text>📦 Order Found: 
                  <TouchableOpacity
                onPress={() => DisplayOrder(orderData)}
                style={tw`bg-yellow-600 rounded-full px-3 py-1 shadow-md`}>
                 <Text style={tw`text-white font-semibold`}>Display</Text>
                  </TouchableOpacity>
                </Text>
             
        </View>
      ) : (
        <Text>🔍 No orders available</Text>
      )}
</View>

{/* Floating trip details when Online and pending order is found */}
{isOnline && orderData && pendingOrder && found &&(
  <View style={tw`absolute bottom-5 left-4 right-4 bg-white p-4 rounded-t-xl shadow-2xl z-20`}>
    {/* Customer Profile */}
   
    <Text>📦 Order Found:</Text>
    <View style={tw`flex-row items-center mb-2`}>
      <Image
        source={{ uri: 'https://example.com/mr-james.jpg' }}
        style={tw`w-12 h-12 rounded-full border-2 border-black shadow-md`}
      />
      <View style={tw`ml-3 flex-1`}>
        <Text style={[tw`text-lg font-semibold text-gray-800`,{fontFamily:"NunitoB"}]}>👤 {orderData.name}</Text>
        <Text style={tw`text-sm font-medium text-gray-600`}>Contact on : {orderData.mobile}</Text>
        <Text style={[tw`text-2xl font-bold text-yellow-600 mt-1`,{fontFamily:"KalamB", fontWeight:"Bold"}]}>💰 NGN {orderData.cost}</Text>
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
        <Text style={[tw`text-sm text-gray-700`,{fontFamily:"NunitoB",fontSize:12}]}> 📍
         {orderData.origin}
        </Text>
        <Text style={[tw`text-sm font-bold text-gray-700 mt-1`,{fontFamily:"OpenSansB",fontWeight:"Bold"}]}>PICKUP POINT</Text>
      </View>
    </View>

    {/* Dropoff Details */}
    <View style={tw`flex-row items-center mb-3`}>
      <View style={tw`w-12 h-12 bg-white border-2 border-yellow-500 rounded-full items-center justify-center`}>
        <Text style={[tw`text-xs font-semibold text-yellow-600`,{fontFamily:"RobotoB", fontSize:12}]}>{orderData.distance} min</Text>
      </View>
      <View style={tw`ml-3 flex-1`}>
        <Text style={[tw`text-sm text-gray-700`,{fontFamily:"NunitoB", fontSize:12}]}>
        ⏳{orderData.mins} mins 📏({orderData.distance} miles) - Trip to :</Text>            
        <Text>🎯 {orderData.destination}
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
{isOnline && orderData && acceptedOrder && found &&(
  <View style={tw`absolute bottom-25 left-4 right-4 bg-white p-4 rounded-t-xl shadow-2xl z-20`}>
    {/* Customer Profile */}
    <View style={tw`flex-row items-center mb-2`}>
      <Image
        source={{ uri: 'https://example.com/mr-james.jpg' }}
        style={tw`w-12 h-12 rounded-full border-2 border-black shadow-md`}
      />
      <View style={tw`flex-1`}>

      <Text style={tw`text-lg font-semibold text-gray-800`}>Picking Up {orderData.name}</Text>
      <View style={tw`flex-row items-center`}>
        <Text style={tw`text-sm font-medium text-gray-600`}>Contact on : </Text>
        <TouchableOpacity onPress={handleCopy} style={tw`flex-row items-center`}>
          <Text style={tw`text-sm font-medium text-gray-600 mr-2`}>{orderData.mobile}</Text>
          <MaterialCommunityIcons name="clipboard-text" size={20} color="gray" />
        </TouchableOpacity>
      </View>
      <Text style={tw`text-xl font-bold text-yellow-600 mt-1`}>NGN {orderData.cost}</Text>
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
          <Text style={tw`text-center text-sm font-bold text-gray-700 mt-1`}>Ride Closer to the Customer for Pickup Alert </Text>
        </>
      )}
       {/* start  Order pickup Button */}
       {!pickUpNow &&(
           <View style={tw`mt-12 flex-row items-center justify-center`}>
           {/* START PICK UP BUTTON */}
           <TouchableOpacity
             style={tw`py-3 px-6 bg-yellow-600 rounded-full`}
             onPress={() => pickCustomerUp()}
           >
             <Text style={tw`text-white text-2xl font-semibold text-center`}>START PICK UP</Text>
           </TouchableOpacity>
       
           {/* CANCEL ORDER BUTTON */}
           <TouchableOpacity
             style={tw`ml-4 bg-red-600 p-3 rounded-full`}
             onPress={() => cancelAccptedOrder()} // Define cancelOrder function
           >
            <Icon name="times" size={15} color="white" />
             
           </TouchableOpacity>
         </View>

       

       
       )}
      {/* start  Order pickup Button */}
      {pickUpTrip &&(
        
            <View style={tw`mt-12 flex-row items-center justify-center`}>
              {/* ALERT CUSTOMER BUTTON */}
              <TouchableOpacity
                style={tw`py-3 px-6 bg-yellow-600 rounded-full`}
                onPress={() => alertWaiting()}
                disabled={isTimerRunning || isMaxTimeReached}
              >
                <Text style={tw`text-white text-2xl font-semibold text-center`}>ALERT CUSTOMER</Text>
              </TouchableOpacity>

              {/* CANCEL ORDER BUTTON */}
              <TouchableOpacity
                    style={tw`ml-4 bg-red-600 p-3 rounded-full`}
                    onPress={() => cancelAccptedOrder()} // Define cancelOrder function
                  >
                    <Icon name="times" size={15} color="white" />
             
                  </TouchableOpacity>
            </View>


       )}




       {/* if distance to where customer closes to like 100 metres, then, alert customer you around  */}
       {riderAround && !isMaxTimeReached &&(
          <View
          style={tw`mt-10 py-1 px-3 bg-yellow-600`}
        >
          <Text style={tw`text-white  text-xl font-semibold text-center`}> Waiting Time:  { formatTime(timeRemaining)}</Text>
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
          <View style={tw`flex-row items-center justify-center`}>
          <TouchableOpacity
          style={tw`mt-12 py-3 px-6 bg-yellow-600 rounded-full`}
          onPress={() => startTripDroppingoff()} 
        >
          <Text style={[tw`text-white  text-2xl font-semibold text-center`,{fontFamily:"NunitoR"}]}> Accept Trip Start</Text>
        </TouchableOpacity>
        <TouchableOpacity
                    style={tw`ml-4 bg-red-600 p-3 rounded-full`}
                    onPress={() => cancelAccptedOrder()} // Define cancelOrder function
                  >
                    <Icon name="times" size={15} color="white" />
             
                  </TouchableOpacity>
        </View>
       )

       }
      
       {droppingOff &&(
        <View style={tw`flex-row items-center justify-center`}>
          <TouchableOpacity
          style={tw`mt-12 py-3 px-6 bg-yellow-600 rounded-full`}
          onPress={() => tripcompleted()} 
        >
          <Text style={tw`text-white  text-2xl font-semibold text-center`}> Trip Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity
                    style={tw`ml-4 bg-red-600 p-3 rounded-full`}
                    onPress={() => cancelAccptedOrder()} // Define cancelOrder function
                  >
                    <Icon name="times" size={15} color="white" />
             
                  </TouchableOpacity>
        </View>
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
