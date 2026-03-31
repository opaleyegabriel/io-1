import * as Location from "expo-location";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { getDataFromSQLite } from "./storage";




let soundRef = null;
let orderFound = false; // Global flag to stop searching once an order is found
let rider_lat = null;
let rider_lng = null;
let orderid=0;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

//let soundRef = null;

export const playRingtone = async () => {
  try {
    console.log("🔔 Playing ringtone...");
    
    // Set Audio Mode for Background Playback
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: "https://hoog.ng/infiniteorder/public/images/ring.mp3" },
      { shouldPlay: true, isLooping: true }
    );

    soundRef = sound;
    await sound.playAsync();

    // Start Foreground Service (For Android)
    if (Platform.OS === "android") {
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🚨 Incoming Order!",
          body: "You have a new order. Open the app to accept it.",
          sound: true, // Ensure notification plays sound
        },
        trigger: null,
      });
    }
  } catch (error) {
    console.error("⚠️ Error playing ringtone:", error);
  }
};

// Stop Ringtone
export const stopRingtone = async () => {
  if (soundRef) {
//    console.log("🔕 Stopping ringtone...");
    await soundRef.stopAsync();
    await soundRef.unloadAsync();
    soundRef = null;
  }
};


  // Reset Order Search
  export const resetOrderSearch = () => {
//    console.log("🔄 Resetting order search...");
    orderFound = false;
  };
  // Reset Order Search
  export const resetOrderSearchtoTrue = () => {
  //  console.log("🔄 Resetting order search to true...");
    orderFound = true;
  };

// Function to request location and update rider's position
export const getLocationAndUpdatePosition = async () => {

  let { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== "granted") {
//    console.log("🚫 Foreground location permission denied");
    return;
  }

  let { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== "granted") {
    Alert.alert("🚫 Background location permission denied");
//    console.log("🚫 Background location permission denied");
    return;
  } else {
  //  console.log("📍 Rider Location Background Updated allowed");
  }

  // Get current latitude and longitude
  let location = await Location.getCurrentPositionAsync({});
  rider_lat = location.coords.latitude;
  rider_lng = location.coords.longitude;
//  console.log("📍 Rider Location Updated:", rider_lat, rider_lng);

  // 🔄 Get the location name (address) using reverse geocoding
  let address = await Location.reverseGeocodeAsync({ latitude: rider_lat, longitude: rider_lng });

  if (address.length > 0) {
    let place = address[0]; // Get the first result
    let locationName = `${place.name || ""}, ${place.street || ""}, ${place.city || ""}, ${place.region || ""}, ${place.country || ""}`;
//    console.log("📌 Rider Location Name:", locationName);
  } else {
  //  console.log("❌ No address found for this location.");
  }

};

// Function to calculate distance between two locations (Haversine formula)
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
  const distanceInKm = R * c;

  return distanceInKm * 0.621371; // Convert to miles
}

// Function to find the closest pending order to the rider// Synchronous: Use this if rider_lat and rider_lng are already globally available
const findClosestUser =  (orders) => {
  
  getLocationAndUpdatePosition();
  // Utility delay function
 

  const MAX_DISTANCE = 21; // Maximum distance in miles
  let closestUser = null;
  let minDistance = 0.01; 

  orders.forEach(order => {
    const { origin_lat, origin_lng } = order;
    /*
    console.log("Customer Origin Latitude :" + origin_lat);
    console.log("Customer Origin Latitude :" + origin_lng);
    console.log("Rider Origin Latitude :" + rider_lat);
    console.log("Rider Origin Latitude :" + rider_lng);
    console.log("============nnnnnnnnnnnnnnnnnnnnnnnn=====================================")
    */
    const distance = haversine(origin_lat, origin_lng, rider_lat, rider_lng);
    console.log("📏 Distance to order:", distance, "miles");
   // console.log("order details: ", order);
    if (distance <= MAX_DISTANCE) {
      closestUser= order;
      //console.log("orders selected : ", order);
      //minDistance = distance;
    }
  });

  return closestUser;
};

// Fetch pending orders and assign the closest one
let pollingStarted = false;

export const checkForPendingOrders = async (setOrderData) => {
  if (!pollingStarted) {
    pollingStarted = true;

    setInterval(async () => {
      getLocationAndUpdatePosition();
      if (rider_lat == null) {
       
        return;
      }

      let ordertype;
      const savedStatus = await AsyncStorage.getItem("riderStatus");
      const riderId = await AsyncStorage.getItem("mobile");
      const riderName = await AsyncStorage.getItem("name");
      const usertype = await AsyncStorage.getItem("user_type");

      ordertype = usertype === "rider" ? "Bike" : usertype === "driver" ? "Car" : ordertype;

      if (savedStatus !== "ON") {
        
        return;
      }

      if (orderFound) return;

      try {
        console.log("🔎 Checking for pending orders...");
        const response = await fetch(
          `https://hoog.ng/infiniteorder/api/Riders/ordersLookUp.php?orderType=${ordertype}`
        );
        const res = await response.json();

        if (response.status === 200 && res.orders && Array.isArray(res.orders)) {
          const closestOrder = findClosestUser(res.orders);

          if (closestOrder) {
           
            setOrderData(closestOrder);
            

            selectACustomerForCurrentRider(closestOrder["id"], riderId, riderName);
            orderFound = true;
            playRingtone();
          } else {
            //console.log("🚫 No eligible order found. Will retry...");
          }
        }
      } catch (error) {
        console.error("⚠️ Error fetching orders:", error);
      }
    }, 60000);// every 20 seconds
  }
};




/*
export const checkForPendingOrders = async (setOrderData) => {
  getLocationAndUpdatePosition();
  if(rider_lat == null){
   // console.log("Rider Position Not UPDATED YETTTTTTTTTTTTTTTTTTTTTTT");
    return;
  }
     
  let ordertype;
  const savedStatus = await AsyncStorage.getItem("riderStatus");
  const riderId = await AsyncStorage.getItem('mobile');
  const riderName = await AsyncStorage.getItem('name');
  const usertype = await AsyncStorage.getItem("user_type");

  ordertype = usertype === "rider" ? "Bike" : usertype === "driver" ? "Car" : ordertype;
//  console.log(`📡 Order Type is ${ordertype}`);
  if (savedStatus !== "ON") {
//    console.log("❌ Rider is OFF. Not searching for orders.");   
    return;
  }

//  console.log("✅ Rider is ONLINE. Searching for orders...");
  
  
  if (orderFound) return; 

  try {
    console.log("🔎 Checking for pending orders...");
    const response = await fetch(`https://hoog.ng/infiniteorder/api/Riders/ordersLookUp.php?orderType=${ordertype}`);
    const res = await response.json();
    
    if (response.status === 200 && res.orders && Array.isArray(res.orders)) {
//      console.log("All Orders Fetched:", JSON.stringify(res.orders, null, 2));
      const closestOrder =  findClosestUser(res.orders);

      if (closestOrder) {
        console.log("✅ Closest order found:", closestOrder);
        setOrderData(closestOrder);
       console.log(riderId);
        console.log(riderName);
        console.log("Order ID : "+ closestOrder['id']);
        selectACustomerForCurrentRider(closestOrder['id'],riderId,riderName)
        orderFound = true; // Stop further searches
        playRingtone(); 
      }else{
        console.log("Searching again!");
      }
    }
  } catch (error) {
    console.error("⚠️ Error fetching orders:", error);
  }
};
*/

// Fetch pending orders and assign the closest one
export const checkForPendingOrdersBackground = async (setOrderData) => {
    try {
       // ✅ Retrieve stored values from SQLite
       let ordertype;
    const savedStatus = await getDataFromSQLite("riderStatus");
    const riderId = await getDataFromSQLite("mobile");
    const riderName = await getDataFromSQLite("name");
    const usertype = await getDataFromSQLite("user_type");

    ordertype = usertype === "rider" ? "Bike" : usertype === "driver" ? "Car" : ordertype;
    
      if (savedStatus !== "ON") {
//        console.log("❌ Rider is OFF. Not searching for orders.");
      
        return;
      }
  
      console.log("✅ Rider is ONLINE. Searching for orders..");
      
    //  console.log(orderFound);
      if (orderFound) {
  //      console.log("✅ But an order is Picked Already..");
        return;
      } 
  
  //    console.log("🔎 Checking for pending orders...");
      const response = await fetch(`https://hoog.ng/infiniteorder/api/Riders/ordersLookUp.php?orderType=${ordertype}`);
      const res = await response.json();
  
      if (response.status === 200 && res.orders && Array.isArray(res.orders)) {
        const closestOrder = findClosestUser(res.orders);
  
        if (closestOrder) {
         // console.log("✅ Closest order found:", closestOrder);
          setOrderData(closestOrder);
  //        console.log(riderId);
    //      console.log(riderName);
  
          selectACustomerForCurrentRider(closestOrder["id"], riderId, riderName);
         // orderFound = true; // Stop further searches
          playRingtone(); 
        }
      }
    } catch (error) {
      console.error("⚠️ Error fetching orders:", error);
    }  
};

// Function to update the order pickup status
export const selectACustomerForCurrentRider = async (orderid,riderId,riderName) => {

  const userData = { 
    id: orderid, 
    riderId: riderId, 
    riderName: riderName, 
    };
  try {
    const response = await fetch(
      "https://hoog.ng/infiniteorder/api/TransportOrders/orderPickUpStatusUpdate.php",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      }
    );

    const contentLength = response.headers.get("content-length");
    const isJson = response.headers.get("content-type")?.includes("application/json");
    let data = response.ok && contentLength && parseInt(contentLength) > 0 && isJson
      ? await response.json()
      : null;

    if (response.status === 200) {
//      console.log("✅ Order Pickup confirmed:", data?.message);
      //setSelectCustomer(true);
    } else {
  //    console.error("❌ Pickup update failed:", data?.message);
    }
  } catch (error) {
    console.error("⚠️ Network error during order pickup update:", error);
  }
};

export const getRiderOrderStatusToControlBackgroundSearch = async (setOrderData) => {
  
  // Retrieve the rider's mobile number from AsyncStorage
  const mobile = await AsyncStorage.getItem('mobile');

  if (!mobile) {
//    console.warn("🚨 No mobile number found. Cannot fetch orders.");
    return;
  }
  
  if(orderFound) {
  //  alert("Order Found");
    return;
  }

  try {

    const response = await fetch(`https://hoog.ng/infiniteorder/api/Riders/getAssignOrders.php?riderId=${mobile}`);
    const res = await response.json();

    if (response.status === 200 && res.ucorders && Array.isArray(res.ucorders)) {
        //formulate coordinates
        // ✅ Extract the first object (if the array is not empty)
      const orderObject = res.ucorders.length > 0 ? res.ucorders[0] : null;
        
       
       
        setOrderData(orderObject); 
        
        
    } else {
    }
  } catch (error) {
  } finally {
    
  }
};