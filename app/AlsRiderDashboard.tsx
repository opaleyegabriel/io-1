import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Vibration,
  Animated,
  Easing,
  ActivityIndicator
} from 'react-native';
import tw from 'twrnc';
import { FontAwesome, MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import MapView, { Marker, Polyline, Circle, PROVIDER_GOOGLE } from 'react-native-maps';

import * as Location from 'expo-location';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Mock order data generator
const generateMockOrders = (riderLocation) => {
  if (!riderLocation) return [];

  const orders = [
    {
      id: 'ORD' + Math.floor(Math.random() * 1000),
      customer: {
        name: 'John Smith',
        phone: '+234 801 234 5678',
        rating: 4.8,
        avatar: 'https://i.pravatar.cc/150?img=1'
      },
      pickup: {
        latitude: riderLocation.latitude + (Math.random() - 0.5) * 0.02,
        longitude: riderLocation.longitude + (Math.random() - 0.5) * 0.02,
        address: '123 Merchant Road, Ikeja',
        landmark: 'Opposite Shoprite',
        exactLocation: 'In front of the blue gate'
      },
      delivery: {
        latitude: riderLocation.latitude + (Math.random() - 0.2) * 0.03,
        longitude: riderLocation.longitude + (Math.random() - 0.2) * 0.03,
        address: '45 Consumer Street, Surulere',
        landmark: 'Near First Bank',
        exactLocation: 'Apartment 4B, Bellagio Estate'
      },
      package: {
        type: 'Food',
        weight: '2.5kg',
        size: 'Medium',
        value: 12500,
        photo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38'
      },
      fare: 2500 + Math.random() * 2000,
      paymentMethod: Math.random() > 0.5 ? 'Card' : 'Cash',
      priority: Math.random() > 0.7 ? 'High' : 'Normal',
      orderTime: new Date().toISOString()
    },
    {
      id: 'ORD' + Math.floor(Math.random() * 1000),
      customer: {
        name: 'Sarah Johnson',
        phone: '+234 802 345 6789',
        rating: 4.9,
        avatar: 'https://i.pravatar.cc/150?img=2'
      },
      pickup: {
        latitude: riderLocation.latitude + (Math.random() - 0.4) * 0.015,
        longitude: riderLocation.longitude + (Math.random() - 0.4) * 0.015,
        address: '78 Tech Hub, VI',
        landmark: 'Beside E-Centre',
        exactLocation: '3rd Floor, Tech Hub Building'
      },
      delivery: {
        latitude: riderLocation.latitude + (Math.random() - 0.3) * 0.025,
        longitude: riderLocation.longitude + (Math.random() - 0.3) * 0.025,
        address: '234 Island Way, Lekki',
        landmark: 'Phase 1 Estate Gate',
        exactLocation: 'House 12, Admiralty Road'
      },
      package: {
        type: 'Electronics',
        weight: '1.8kg',
        size: 'Small',
        value: 245000,
        photo: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2'
      },
      fare: 4200 + Math.random() * 3000,
      paymentMethod: 'Card',
      priority: 'High',
      orderTime: new Date().toISOString()
    }
  ];

  return orders;
};

// Calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate estimated time
const calculateTime = (distance) => {
  const minutes = (distance / 30) * 60;
  return Math.round(minutes);
};

const AlsRiderScreen = () => {
  // Core states
  const [isActive, setIsActive] = useState(false);
  const [riderStatus, setRiderStatus] = useState('offline');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('Loading...');
  const [errorMsg, setErrorMsg] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [nearbyOrders, setNearbyOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [acceptedOrder, setAcceptedOrder] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [orderStage, setOrderStage] = useState('searching');
  const [showPickupConfirm, setShowPickupConfirm] = useState(false);
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);
  const [isAtPickup, setIsAtPickup] = useState(false);
  const [isAtDelivery, setIsAtDelivery] = useState(false);
  const [riderBalance, setRiderBalance] = useState(12580.50);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const sound = useRef(null);
  const locationSubscription = useRef(null);

  // Mock data
  const riderName = 'Ahmed Musa';
  const riderRating = 4.92;
  const totalDeliveries = 1248;

  // Menu options with actions
  const menuOptions = [
    { id: '1', title: 'Profile', icon: 'user', action: 'profile' },
    { id: '2', title: 'Earnings', icon: 'wallet', action: 'earnings' },
    { id: '3', title: 'Pickup History', icon: 'history', action: 'pickupHistory' },
    { id: '4', title: 'Delivery History', icon: 'check-circle', action: 'deliveryHistory' },
    { id: '5', title: 'Support', icon: 'headphones', action: 'support' },
    { id: '6', title: 'Settings', icon: 'settings', action: 'settings' },
    { id: '7', title: 'Logout', icon: 'log-out', action: 'logout' },
  ];

  // Enhanced logout function with active order check
  const logout = async () => {
    // Check if there's an active order
    if (acceptedOrder) {
      Alert.alert(
        'Active Order Detected',
        'You have an active order in progress. Logging out now will cancel this order. Continue?',
        [
          {
            text: 'Stay',
            style: 'cancel'
          },
          {
            text: 'Cancel Order & Logout',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsLoggingOut(true);
                
                // Clear all states
                setAcceptedOrder(null);
                setOrderStage('searching');
                setRiderStatus('offline');
                setIsActive(false);
                setNearbyOrders([]);
                setSelectedOrder(null);
                
                // Stop location tracking
                if (locationSubscription.current) {
                  locationSubscription.current.remove();
                }
                
                // Clear AsyncStorage and navigate
                await AsyncStorage.clear();
                router.replace("/");
              } catch (error) {
                console.error('Logout error:', error);
                Alert.alert('Error', 'Failed to logout. Please try again.');
              } finally {
                setIsLoggingOut(false);
              }
            }
          }
        ]
      );
    } else {
      // No active order, proceed with logout
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsLoggingOut(true);
                
                // Clear all states
                setRiderStatus('offline');
                setIsActive(false);
                setNearbyOrders([]);
                setSelectedOrder(null);
                
                // Stop location tracking
                if (locationSubscription.current) {
                  locationSubscription.current.remove();
                }
                
                // Clear AsyncStorage and navigate
                await AsyncStorage.clear();
                router.replace("/");
              } catch (error) {
                console.error('Logout error:', error);
                Alert.alert('Error', 'Failed to logout. Please try again.');
              } finally {
                setIsLoggingOut(false);
              }
            }
          }
        ]
      );
    }
  };

  // Handle menu item selection
  const handleMenuSelect = (item) => {
    console.log(`Selected: ${item.title}`);
    setDropdownVisible(false);
    
    if (item.action === 'logout') {
      logout();
    } else {
      // Handle other menu items
      Alert.alert(item.title, `Navigate to ${item.title} screen`);
    }
  };

  // Pulse animation for new orders
  useEffect(() => {
    if (nearbyOrders.length > 0 && !selectedOrder && !acceptedOrder) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      ).start();
      
      Vibration.vibrate([0, 500, 200, 500]);
      playNotificationSound();
    } else {
      pulseAnim.setValue(1);
    }
  }, [nearbyOrders.length]);

  // Success animation
  useEffect(() => {
    if (showSuccessAnimation) {
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.delay(1500),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start(() => setShowSuccessAnimation(false));
    }
  }, [showSuccessAnimation]);

  // Monitor location for pickup/delivery proximity
  useEffect(() => {
    if (acceptedOrder && location) {
      // Check if at pickup location (within 50 meters)
      const distanceToPickup = calculateDistance(
        location.coords.latitude, location.coords.longitude,
        acceptedOrder.pickup.latitude, acceptedOrder.pickup.longitude
      ) * 1000; // Convert to meters

      const atPickupLocation = distanceToPickup <= 50; // 50 meters radius
      
      if (atPickupLocation && orderStage === 'accepted' && !isAtPickup) {
        setIsAtPickup(true);
        setShowPickupConfirm(true);
        Vibration.vibrate([0, 300, 200, 300]);
        playNotificationSound();
      } else if (!atPickupLocation) {
        setIsAtPickup(false);
        setShowPickupConfirm(false);
      }

      // Check if at delivery location (within 50 meters)
      const distanceToDelivery = calculateDistance(
        location.coords.latitude, location.coords.longitude,
        acceptedOrder.delivery.latitude, acceptedOrder.delivery.longitude
      ) * 1000;

      const atDeliveryLocation = distanceToDelivery <= 50;
      
      if (atDeliveryLocation && orderStage === 'picked' && !isAtDelivery) {
        setIsAtDelivery(true);
        setShowDeliveryConfirm(true);
        Vibration.vibrate([0, 300, 200, 300]);
        playNotificationSound();
      } else if (!atDeliveryLocation) {
        setIsAtDelivery(false);
        setShowDeliveryConfirm(false);
      }
    }
  }, [location, acceptedOrder, orderStage]);

  // Play notification sound
  const playNotificationSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('./assets/notification.mp3')
      );
      sound.current = newSound;
      await sound.current.playAsync();
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  // Get current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 5
        },
        (newLocation) => {
          setLocation(newLocation);
          updateAddress(newLocation.coords);
          
          if (isActive && !acceptedOrder) {
            const orders = generateMockOrders(newLocation.coords);
            setNearbyOrders(orders);
            
            if (orders.length > 0 && !selectedOrder) {
              const closestOrder = orders.reduce((prev, curr) => {
                const prevDist = calculateDistance(
                  newLocation.coords.latitude, newLocation.coords.longitude,
                  prev.pickup.latitude, prev.pickup.longitude
                );
                const currDist = calculateDistance(
                  newLocation.coords.latitude, newLocation.coords.longitude,
                  curr.pickup.latitude, curr.pickup.longitude
                );
                return prevDist < currDist ? prev : curr;
              });
              
              setSelectedOrder(closestOrder);
              setShowOrderModal(true);
            }
          }
        }
      );
    })();

    // Cleanup subscription on unmount
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, [isActive, acceptedOrder]);

  const updateAddress = async (coords) => {
    try {
      let geocode = await Location.reverseGeocodeAsync(coords);
      if (geocode.length > 0) {
        const locationName = `${geocode[0].street || ''}, ${geocode[0].city || ''}`;
        setAddress(locationName || 'Unknown location');
      }
    } catch (error) {
      console.log('Error getting address:', error);
    }
  };

  // Handle rider activation
  const handleToggleActive = () => {
    setIsActive(!isActive);
    setRiderStatus(!isActive ? 'available' : 'offline');
    if (!isActive) {
      Alert.alert('You are now online', 'You will receive nearby orders');
    }
  };

  // Handle order acceptance
  const handleAcceptOrder = () => {
    setAcceptedOrder(selectedOrder);
    setOrderStage('accepted');
    setShowOrderModal(false);
    setRiderStatus('busy');
    setNearbyOrders([]);
    
    const routeCoords = [
      {
        latitude: selectedOrder.pickup.latitude,
        longitude: selectedOrder.pickup.longitude
      },
      {
        latitude: selectedOrder.delivery.latitude,
        longitude: selectedOrder.delivery.longitude
      }
    ];
    setRouteCoordinates(routeCoords);
    setShowRouteModal(true);
    
    Alert.alert(
      'Order Accepted',
      `Proceed to pickup location at ${selectedOrder.pickup.address}`,
      [{ text: 'OK' }]
    );
  };

  // Handle order rejection
  const handleRejectOrder = () => {
    setSelectedOrder(null);
    setShowOrderModal(false);
    Alert.alert('Order Rejected', 'Looking for more orders...');
  };

  // Handle pickup confirmation
  const handleConfirmPickup = () => {
    setOrderStage('picked');
    setShowPickupConfirm(false);
    setShowSuccessAnimation(true);
    
    Alert.alert(
      '✅ Pickup Confirmed',
      'Package collected successfully! Proceed to delivery location.',
      [{ text: 'Continue to Delivery' }]
    );
  };

  // Handle delivery confirmation with payment
  const handleConfirmDelivery = () => {
    // Add fare to rider balance
    const earnings = acceptedOrder.fare;
    setRiderBalance(prevBalance => prevBalance + earnings);
    setOrderStage('delivered');
    setShowDeliveryConfirm(false);
    setShowSuccessAnimation(true);
    
    // Show earnings notification
    Alert.alert(
      '🎉 Delivery Complete!',
      `You have successfully delivered order #${acceptedOrder.id}\n\n` +
      `💰 Earnings: NGN ${earnings.toFixed(2)}\n` +
      `💳 Payment Method: ${acceptedOrder.paymentMethod}\n` +
      `📦 Package Value: NGN ${acceptedOrder.package.value.toLocaleString()}\n\n` +
      `New Balance: NGN ${(riderBalance + earnings).toFixed(2)}`,
      [
        { 
          text: 'Great!', 
          onPress: () => {
            // Reset after delivery
            setAcceptedOrder(null);
            setRouteCoordinates([]);
            setShowRouteModal(false);
            setRiderStatus('available');
            setOrderStage('searching');
          }
        }
      ]
    );
  };

  // Send chat message
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, {
        id: Date.now().toString(),
        text: newMessage,
        sender: 'rider',
        timestamp: new Date().toISOString()
      }]);
      setNewMessage('');
    }
  };

  if (errorMsg) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color="#fbbf24" />
        <Text style={tw`mt-4 text-gray-600`}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1`}>
      {/* Map View */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={tw`absolute inset-0`}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsTraffic={true}
        followsUserLocation={true}
      >
        {/* Show nearby orders on map */}
        {nearbyOrders.map((order) => (
          <Marker
            key={order.id}
            coordinate={order.pickup}
            title={`Order #${order.id}`}
            description={`Fare: NGN ${order.fare.toFixed(2)}`}
            pinColor={order.priority === 'High' ? 'red' : 'orange'}
          />
        ))}

        {/* Show pickup/delivery zones */}
        {acceptedOrder && (
          <>
            {/* Pickup Zone Circle */}
            <Circle
              center={acceptedOrder.pickup}
              radius={50}
              strokeColor="rgba(34, 197, 94, 0.5)"
              fillColor="rgba(34, 197, 94, 0.1)"
              strokeWidth={2}
            />
            
            {/* Delivery Zone Circle */}
            <Circle
              center={acceptedOrder.delivery}
              radius={50}
              strokeColor="rgba(59, 130, 246, 0.5)"
              fillColor="rgba(59, 130, 246, 0.1)"
              strokeWidth={2}
            />

            {/* Route */}
            <Polyline
              coordinates={[
                location.coords,
                acceptedOrder.pickup,
                acceptedOrder.delivery
              ]}
              strokeColor="#3b82f6"
              strokeWidth={4}
              lineDashPattern={orderStage === 'accepted' ? [1] : []}
            />
          </>
        )}
      </MapView>

      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <Animated.View style={[
          tw`absolute inset-0 bg-green-500/30 items-center justify-center z-50`,
          {
            opacity: successAnim
          }
        ]}>
          <Animated.View style={[
            tw`bg-white rounded-full p-8`,
            {
              transform: [{
                scale: successAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1]
                })
              }]
            }
          ]}>
            <Ionicons name="checkmark-circle" size={80} color="#22c55e" />
          </Animated.View>
        </Animated.View>
      )}

      {/* Pickup Confirmation Modal */}
      {showPickupConfirm && (
        <View style={tw`absolute bottom-40 left-4 right-4 bg-white rounded-xl shadow-2xl p-4 z-40 border-2 border-green-500`}>
          <View style={tw`items-center mb-3`}>
            <View style={tw`bg-green-100 rounded-full p-3`}>
              <Ionicons name="location" size={30} color="#22c55e" />
            </View>
            <Text style={tw`text-xl font-bold mt-2 text-green-600`}>At Pickup Location</Text>
            <Text style={tw`text-gray-600 text-center mt-1`}>
              You have arrived at the pickup point
            </Text>
          </View>
          
          <View style={tw`bg-gray-50 p-3 rounded-lg mb-3`}>
            <Text style={tw`font-semibold`}>📍 Exact Location:</Text>
            <Text style={tw`text-gray-600`}>{acceptedOrder?.pickup.exactLocation}</Text>
            <Text style={tw`text-sm text-gray-500 mt-1`}>{acceptedOrder?.pickup.address}</Text>
          </View>

          <TouchableOpacity
            style={tw`bg-green-500 py-4 rounded-xl flex-row items-center justify-center`}
            onPress={handleConfirmPickup}
          >
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <Text style={tw`text-white font-bold text-lg ml-2`}>
              Confirm Package Picked Up
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Delivery Confirmation Modal */}
      {showDeliveryConfirm && (
        <View style={tw`absolute bottom-40 left-4 right-4 bg-white rounded-xl shadow-2xl p-4 z-40 border-2 border-blue-500`}>
          <View style={tw`items-center mb-3`}>
            <View style={tw`bg-blue-100 rounded-full p-3`}>
              <Ionicons name="gift" size={30} color="#3b82f6" />
            </View>
            <Text style={tw`text-xl font-bold mt-2 text-blue-600`}>At Delivery Location</Text>
            <Text style={tw`text-gray-600 text-center mt-1`}>
              You have arrived at the delivery point
            </Text>
          </View>
          
          <View style={tw`bg-gray-50 p-3 rounded-lg mb-3`}>
            <Text style={tw`font-semibold`}>📍 Exact Location:</Text>
            <Text style={tw`text-gray-600`}>{acceptedOrder?.delivery.exactLocation}</Text>
            <Text style={tw`text-sm text-gray-500 mt-1`}>{acceptedOrder?.delivery.address}</Text>
            
            <View style={tw`border-t border-gray-200 mt-3 pt-3`}>
              <View style={tw`flex-row justify-between`}>
                <Text style={tw`text-gray-600`}>Delivery Fare:</Text>
                <Text style={tw`font-bold text-green-600`}>NGN {acceptedOrder?.fare.toFixed(2)}</Text>
              </View>
              <View style={tw`flex-row justify-between mt-1`}>
                <Text style={tw`text-gray-600`}>Payment Method:</Text>
                <Text style={tw`font-semibold`}>{acceptedOrder?.paymentMethod}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={tw`bg-blue-500 py-4 rounded-xl flex-row items-center justify-center`}
            onPress={handleConfirmDelivery}
          >
            <Ionicons name="checkmark-done-circle" size={24} color="white" />
            <Text style={tw`text-white font-bold text-lg ml-2`}>
              Confirm Delivery & Complete
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Top Bar */}
      <View style={tw`absolute top-10 left-4 right-4 flex-row justify-between items-center z-10`}>
        <TouchableOpacity onPress={() => setDropdownVisible(true)} style={tw`flex-row items-center bg-white rounded-full px-2 py-1 shadow-lg`}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/150?img=4' }}
            style={tw`w-10 h-10 rounded-full border-2 border-yellow-500`}
          />
          <View style={tw`ml-2 mr-3`}>
            <Text style={tw`text-sm text-gray-600`}>Welcome back,</Text>
            <Text style={tw`text-base font-bold`}>{riderName}</Text>
          </View>
          <View style={tw`bg-yellow-500 w-6 h-6 rounded-full items-center justify-center`}>
            <Text style={tw`text-white text-xs font-bold`}>{riderRating}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={tw`bg-yellow-600 px-4 py-2 rounded-full shadow-lg flex-row items-center`}>
          <FontAwesome name="money" size={16} color="white" />
          <Text style={tw`text-white font-bold ml-2`}>₦{riderBalance.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>

      {/* New Order Indicator */}
      {nearbyOrders.length > 0 && !selectedOrder && !acceptedOrder && (
        <Animated.View style={[
          tw`absolute top-28 left-0 right-0 items-center z-20`,
          { transform: [{ scale: pulseAnim }] }
        ]}>
          <TouchableOpacity 
            style={tw`bg-red-500 px-6 py-3 rounded-full shadow-lg flex-row items-center`}
            onPress={() => setShowOrderModal(true)}
          >
            <Ionicons name="notifications" size={20} color="white" />
            <Text style={tw`text-white font-bold ml-2`}>
              {nearbyOrders.length} New Order{nearbyOrders.length > 1 ? 's' : ''} Nearby!
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Current Location Indicator */}
      <View style={tw`absolute bottom-40 left-4 bg-white/90 rounded-full px-4 py-2 shadow-lg z-10`}>
        <Text style={tw`text-sm text-gray-600`}>📍 {address}</Text>
      </View>

      {/* Active/Inactive Button */}
      {!acceptedOrder && (
        <View style={tw`absolute bottom-28 left-0 right-0 items-center z-10`}>
          <TouchableOpacity
            style={tw`${isActive ? 'bg-green-600' : 'bg-gray-400'} rounded-full w-28 h-28 justify-center items-center shadow-2xl border-4 border-white`}
            onPress={handleToggleActive}
          >
            <FontAwesome
              name={isActive ? 'toggle-on' : 'toggle-off'}
              size={50}
              color="white"
            />
            <Text style={tw`text-white text-xs mt-1 font-bold`}>
              {isActive ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status Bar */}
      <View style={tw`absolute bottom-16 left-4 right-4 bg-white rounded-xl shadow-lg p-4 z-10`}>
        <View style={tw`flex-row justify-between items-center`}>
          <View style={tw`flex-row items-center`}>
            <View style={tw`w-3 h-3 rounded-full ${riderStatus === 'available' ? 'bg-green-500' : riderStatus === 'busy' ? 'bg-yellow-500' : 'bg-gray-400'} mr-2`} />
            <Text style={tw`text-gray-700 font-semibold`}>
              Status: {riderStatus.charAt(0).toUpperCase() + riderStatus.slice(1)}
            </Text>
          </View>
          <View style={tw`flex-row items-center`}>
            <Ionicons name="bicycle" size={20} color="#666" />
            <Text style={tw`ml-1 text-gray-600 font-bold`}>{totalDeliveries}</Text>
          </View>
        </View>
        
        {acceptedOrder && (
          <View style={tw`mt-2 p-2 bg-blue-50 rounded-lg`}>
            <Text style={tw`text-blue-800 font-semibold`}>
              Current Order: #{acceptedOrder.id}
            </Text>
            <Text style={tw`text-blue-600 text-sm`}>
              {orderStage === 'accepted' ? '→ Proceed to pickup location' : 
               orderStage === 'picked' ? '→ Proceed to delivery location' : 'Complete'}
            </Text>
            {orderStage === 'accepted' && isAtPickup && (
              <Text style={tw`text-green-600 text-sm font-bold mt-1`}>
                ⚡ You're at pickup location! Confirm pickup above.
              </Text>
            )}
            {orderStage === 'picked' && isAtDelivery && (
              <Text style={tw`text-green-600 text-sm font-bold mt-1`}>
                ⚡ You're at delivery location! Complete delivery above.
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Dropdown Menu */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity 
          style={tw`flex-1 bg-black/50`}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={tw`absolute top-20 left-4 bg-white rounded-xl shadow-2xl w-64`}>
            <View style={tw`p-4 border-b border-gray-200 flex-row items-center`}>
              <Image
                source={{ uri: 'https://i.pravatar.cc/150?img=4' }}
                style={tw`w-16 h-16 rounded-full border-2 border-yellow-500`}
              />
              <View style={tw`ml-3`}>
                <Text style={tw`text-lg font-bold`}>{riderName}</Text>
                <Text style={tw`text-sm text-gray-500`}>⭐ {riderRating} • {totalDeliveries} deliveries</Text>
              </View>
            </View>
            
            <FlatList
              data={menuOptions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleMenuSelect(item)}
                  style={tw`px-4 py-3 flex-row items-center border-b border-gray-100 ${
                    item.action === 'logout' ? 'bg-red-50' : ''
                  }`}
                >
                  <Feather 
                    name={item.icon} 
                    size={20} 
                    color={item.action === 'logout' ? '#ef4444' : '#666'} 
                  />
                  <Text 
                    style={tw`ml-3 ${
                      item.action === 'logout' ? 'text-red-600 font-bold' : 'text-gray-800'
                    }`}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Order Details Modal */}
      <Modal
        visible={showOrderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOrderModal(false)}
      >
        <View style={tw`flex-1 bg-black/50 justify-end`}>
          <View style={tw`bg-white rounded-t-3xl p-6 h-3/4`}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedOrder && (
                <>
                  <View style={tw`flex-row justify-between items-center mb-4`}>
                    <Text style={tw`text-2xl font-bold`}>Order #{selectedOrder.id}</Text>
                    <View style={tw`bg-${selectedOrder.priority === 'High' ? 'red' : 'yellow'}-100 px-3 py-1 rounded-full`}>
                      <Text style={tw`text-${selectedOrder.priority === 'High' ? 'red' : 'yellow'}-800 font-semibold`}>
                        {selectedOrder.priority} Priority
                      </Text>
                    </View>
                  </View>

                  {/* Customer Info */}
                  <View style={tw`bg-gray-50 p-4 rounded-xl mb-4`}>
                    <View style={tw`flex-row items-center`}>
                      <Image source={{ uri: selectedOrder.customer.avatar }} style={tw`w-12 h-12 rounded-full`} />
                      <View style={tw`ml-3 flex-1`}>
                        <Text style={tw`text-lg font-bold`}>{selectedOrder.customer.name}</Text>
                        <View style={tw`flex-row items-center`}>
                          <FontAwesome name="star" size={14} color="#fbbf24" />
                          <Text style={tw`ml-1 text-gray-600`}>{selectedOrder.customer.rating}</Text>
                          <Text style={tw`mx-2 text-gray-400`}>•</Text>
                          <Feather name="phone" size={12} color="#666" />
                          <Text style={tw`ml-1 text-gray-600`}>{selectedOrder.customer.phone}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Fare and Payment */}
                  <View style={tw`bg-green-50 p-4 rounded-xl mb-4`}>
                    <Text style={tw`text-gray-600 mb-1`}>Total Fare</Text>
                    <Text style={tw`text-3xl font-bold text-green-600`}>₦{selectedOrder.fare.toFixed(2)}</Text>
                    <View style={tw`flex-row items-center mt-2`}>
                      <View style={tw`bg-green-200 px-2 py-1 rounded-full`}>
                        <Text style={tw`text-green-800 text-xs`}>{selectedOrder.paymentMethod}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Package Details */}
                  <View style={tw`bg-gray-50 p-4 rounded-xl mb-4`}>
                    <Text style={tw`text-lg font-bold mb-2`}>Package Details</Text>
                    <View style={tw`flex-row`}>
                      <Image 
                        source={{ uri: selectedOrder.package.photo }} 
                        style={tw`w-20 h-20 rounded-lg`}
                      />
                      <View style={tw`ml-3 flex-1`}>
                        <Text style={tw`font-semibold`}>{selectedOrder.package.type}</Text>
                        <Text style={tw`text-gray-600 text-sm mt-1`}>Weight: {selectedOrder.package.weight}</Text>
                        <Text style={tw`text-gray-600 text-sm`}>Size: {selectedOrder.package.size}</Text>
                        <Text style={tw`text-gray-600 text-sm`}>Value: ₦{selectedOrder.package.value.toLocaleString()}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Locations with distances */}
                  <View style={tw`mb-4`}>
                    <View style={tw`bg-blue-50 p-4 rounded-xl mb-2`}>
                      <View style={tw`flex-row items-center mb-2`}>
                        <View style={tw`w-6 h-6 bg-green-500 rounded-full items-center justify-center mr-2`}>
                          <Text style={tw`text-white text-xs`}>A</Text>
                        </View>
                        <Text style={tw`flex-1 font-semibold`}>Pickup Location</Text>
                      </View>
                      <Text style={tw`text-gray-700 ml-8`}>{selectedOrder.pickup.address}</Text>
                      <Text style={tw`text-gray-500 text-sm ml-8`}>Landmark: {selectedOrder.pickup.landmark}</Text>
                      <Text style={tw`text-gray-500 text-sm ml-8`}>Exact: {selectedOrder.pickup.exactLocation}</Text>
                      
                      {location && (
                        <View style={tw`mt-2 ml-8 flex-row items-center`}>
                          <Ionicons name="location" size={14} color="#666" />
                          <Text style={tw`text-gray-600 text-sm ml-1`}>
                            {calculateDistance(
                              location.coords.latitude, location.coords.longitude,
                              selectedOrder.pickup.latitude, selectedOrder.pickup.longitude
                            ).toFixed(2)}km away • {calculateTime(calculateDistance(
                              location.coords.latitude, location.coords.longitude,
                              selectedOrder.pickup.latitude, selectedOrder.pickup.longitude
                            ))} mins
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={tw`bg-purple-50 p-4 rounded-xl`}>
                      <View style={tw`flex-row items-center mb-2`}>
                        <View style={tw`w-6 h-6 bg-blue-500 rounded-full items-center justify-center mr-2`}>
                          <Text style={tw`text-white text-xs`}>B</Text>
                        </View>
                        <Text style={tw`flex-1 font-semibold`}>Delivery Location</Text>
                      </View>
                      <Text style={tw`text-gray-700 ml-8`}>{selectedOrder.delivery.address}</Text>
                      <Text style={tw`text-gray-500 text-sm ml-8`}>Landmark: {selectedOrder.delivery.landmark}</Text>
                      <Text style={tw`text-gray-500 text-sm ml-8`}>Exact: {selectedOrder.delivery.exactLocation}</Text>
                      
                      <View style={tw`mt-2 ml-8 flex-row items-center`}>
                        <Ionicons name="time" size={14} color="#666" />
                        <Text style={tw`text-gray-600 text-sm ml-1`}>
                          {calculateDistance(
                            selectedOrder.pickup.latitude, selectedOrder.pickup.longitude,
                            selectedOrder.delivery.latitude, selectedOrder.delivery.longitude
                          ).toFixed(2)}km trip • {calculateTime(calculateDistance(
                            selectedOrder.pickup.latitude, selectedOrder.pickup.longitude,
                            selectedOrder.delivery.latitude, selectedOrder.delivery.longitude
                          ))} mins delivery
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={tw`flex-row mt-4 mb-6`}>
                    <TouchableOpacity
                      style={tw`flex-1 bg-red-500 py-4 rounded-xl mr-2 flex-row items-center justify-center`}
                      onPress={handleRejectOrder}
                    >
                      <Feather name="x" size={20} color="white" />
                      <Text style={tw`text-white font-bold ml-2`}>Reject</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={tw`flex-1 bg-green-500 py-4 rounded-xl ml-2 flex-row items-center justify-center`}
                      onPress={handleAcceptOrder}
                    >
                      <Feather name="check" size={20} color="white" />
                      <Text style={tw`text-white font-bold ml-2`}>Accept</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={tw`bg-blue-500 py-4 rounded-xl flex-row items-center justify-center mb-4`}
                    onPress={() => {
                      setShowChatModal(true);
                      setShowOrderModal(false);
                    }}
                  >
                    <Ionicons name="chatbubble" size={20} color="white" />
                    <Text style={tw`text-white font-bold ml-2`}>Chat with Customer</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Chat Modal */}
      <Modal
        visible={showChatModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChatModal(false)}
      >
        <View style={tw`flex-1 bg-white`}>
          <View style={tw`bg-yellow-600 p-4 flex-row items-center justify-between`}>
            <TouchableOpacity onPress={() => setShowChatModal(false)}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={tw`text-white font-bold text-lg`}>
              Chat with {selectedOrder?.customer.name}
            </Text>
            <View style={tw`w-8`} />
          </View>

          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            style={tw`flex-1 p-4`}
            renderItem={({ item }) => (
              <View style={tw`${item.sender === 'rider' ? 'items-end' : 'items-start'} mb-2`}>
                <View style={tw`${item.sender === 'rider' ? 'bg-yellow-500' : 'bg-gray-200'} max-w-3/4 p-3 rounded-lg`}>
                  <Text style={tw`${item.sender === 'rider' ? 'text-white' : 'text-gray-800'}`}>
                    {item.text}
                  </Text>
                </View>
                <Text style={tw`text-xs text-gray-500 mt-1`}>
                  {new Date(item.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            )}
          />

          <View style={tw`p-4 border-t border-gray-200 flex-row`}>
            <TextInput
              style={tw`flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2`}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
            />
            <TouchableOpacity
              style={tw`bg-yellow-500 w-10 h-10 rounded-full items-center justify-center`}
              onPress={handleSendMessage}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Route Navigation Modal */}
      <Modal
        visible={showRouteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRouteModal(false)}
      >
        <View style={tw`flex-1 bg-white`}>
          <View style={tw`bg-blue-600 p-4 flex-row items-center justify-between`}>
            <TouchableOpacity onPress={() => setShowRouteModal(false)}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={tw`text-white font-bold text-lg`}>Route Navigation</Text>
            <View style={tw`w-8`} />
          </View>

          {acceptedOrder && (
            <View style={tw`flex-1`}>
              {/* Mini Map Preview */}
              <View style={tw`h-1/2 bg-gray-200`}>
                <MapView
                  style={tw`flex-1`}
                  initialRegion={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                >
                  <Marker coordinate={location.coords} title="Your Location" pinColor="blue" />
                  <Marker coordinate={acceptedOrder.pickup} title="Pickup" pinColor="green" />
                  <Marker coordinate={acceptedOrder.delivery} title="Delivery" pinColor="red" />
                  
                  {/* Pickup Zone */}
                  <Circle
                    center={acceptedOrder.pickup}
                    radius={50}
                    strokeColor="rgba(34, 197, 94, 0.5)"
                    fillColor="rgba(34, 197, 94, 0.1)"
                  />
                  
                  {/* Delivery Zone */}
                  <Circle
                    center={acceptedOrder.delivery}
                    radius={50}
                    strokeColor="rgba(59, 130, 246, 0.5)"
                    fillColor="rgba(59, 130, 246, 0.1)"
                  />
                  
                  {/* Route */}
                  <Polyline
                    coordinates={[
                      location.coords,
                      acceptedOrder.pickup,
                      acceptedOrder.delivery
                    ]}
                    strokeColor="#3b82f6"
                    strokeWidth={4}
                    lineDashPattern={orderStage === 'accepted' ? [1] : []}
                  />
                </MapView>
              </View>

              {/* Navigation Details */}
              <ScrollView style={tw`p-4`}>
                <View style={tw`bg-blue-50 p-4 rounded-xl mb-4`}>
                  <Text style={tw`text-lg font-bold mb-2`}>Trip Summary</Text>
                  
                  {orderStage === 'accepted' && (
                    <View style={tw`mb-3 p-2 bg-green-50 rounded-lg`}>
                      <Text style={tw`text-gray-600`}>To Pickup:</Text>
                      <Text style={tw`text-xl font-bold text-green-600`}>
                        {calculateDistance(
                          location.coords.latitude, location.coords.longitude,
                          acceptedOrder.pickup.latitude, acceptedOrder.pickup.longitude
                        ).toFixed(2)} km
                      </Text>
                      <Text style={tw`text-gray-500`}>
                        ETA: {calculateTime(calculateDistance(
                          location.coords.latitude, location.coords.longitude,
                          acceptedOrder.pickup.latitude, acceptedOrder.pickup.longitude
                        ))} mins
                      </Text>
                      {isAtPickup && (
                        <Text style={tw`text-green-600 font-bold mt-1`}>
                          ✓ You have arrived at pickup zone
                        </Text>
                      )}
                    </View>
                  )}

                  <View style={tw`mb-3 p-2 ${orderStage === 'picked' ? 'bg-green-50' : 'bg-gray-50'} rounded-lg`}>
                    <Text style={tw`text-gray-600`}>Pickup to Delivery:</Text>
                    <Text style={tw`text-xl font-bold text-blue-600`}>
                      {calculateDistance(
                        acceptedOrder.pickup.latitude, acceptedOrder.pickup.longitude,
                        acceptedOrder.delivery.latitude, acceptedOrder.delivery.longitude
                      ).toFixed(2)} km
                    </Text>
                    <Text style={tw`text-gray-500`}>
                      ETA: {calculateTime(calculateDistance(
                        acceptedOrder.pickup.latitude, acceptedOrder.pickup.longitude,
                        acceptedOrder.delivery.latitude, acceptedOrder.delivery.longitude
                      ))} mins
                    </Text>
                  </View>

                  <View style={tw`border-t border-gray-300 pt-3`}>
                    <Text style={tw`text-gray-600`}>Total Trip:</Text>
                    <Text style={tw`text-xl font-bold text-purple-600`}>
                      {(calculateDistance(
                        location.coords.latitude, location.coords.longitude,
                        acceptedOrder.pickup.latitude, acceptedOrder.pickup.longitude
                      ) + calculateDistance(
                        acceptedOrder.pickup.latitude, acceptedOrder.pickup.longitude,
                        acceptedOrder.delivery.latitude, acceptedOrder.delivery.longitude
                      )).toFixed(2)} km
                    </Text>
                  </View>
                </View>

                {/* Step-by-step instructions */}
                <View style={tw`bg-gray-50 p-4 rounded-xl mb-4`}>
                  <Text style={tw`font-bold mb-3`}>Delivery Steps:</Text>
                  
                  <View style={tw`flex-row items-center mb-3`}>
                    <View style={tw`w-8 h-8 ${orderStage === 'accepted' ? 'bg-green-500' : orderStage === 'picked' || orderStage === 'delivered' ? 'bg-green-500' : 'bg-gray-400'} rounded-full items-center justify-center mr-3`}>
                      {orderStage === 'accepted' || orderStage === 'picked' || orderStage === 'delivered' ? (
                        <Ionicons name="checkmark" size={16} color="white" />
                      ) : (
                        <Text style={tw`text-white font-bold`}>1</Text>
                      )}
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`font-semibold ${orderStage === 'accepted' || orderStage === 'picked' || orderStage === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                        {orderStage === 'accepted' || orderStage === 'picked' || orderStage === 'delivered' ? '✓ ' : ''}Go to Pickup Location
                      </Text>
                      <Text style={tw`text-gray-500 text-sm`}>{acceptedOrder.pickup.address}</Text>
                      {orderStage === 'accepted' && isAtPickup && (
                        <Text style={tw`text-green-600 text-sm font-bold mt-1`}>
                          ⚡ You're here! Confirm pickup to continue
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={tw`flex-row items-center mb-3`}>
                    <View style={tw`w-8 h-8 ${orderStage === 'picked' || orderStage === 'delivered' ? 'bg-green-500' : 'bg-gray-400'} rounded-full items-center justify-center mr-3`}>
                      {orderStage === 'picked' || orderStage === 'delivered' ? (
                        <Ionicons name="checkmark" size={16} color="white" />
                      ) : (
                        <Text style={tw`text-white font-bold`}>2</Text>
                      )}
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`font-semibold ${orderStage === 'picked' || orderStage === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                        {orderStage === 'picked' || orderStage === 'delivered' ? '✓ ' : ''}Pick up package
                      </Text>
                      <Text style={tw`text-gray-500 text-sm`}>Collect from {acceptedOrder.customer.name}</Text>
                    </View>
                  </View>
                  
                  <View style={tw`flex-row items-center`}>
                    <View style={tw`w-8 h-8 ${orderStage === 'delivered' ? 'bg-green-500' : 'bg-gray-400'} rounded-full items-center justify-center mr-3`}>
                      {orderStage === 'delivered' ? (
                        <Ionicons name="checkmark" size={16} color="white" />
                      ) : (
                        <Text style={tw`text-white font-bold`}>3</Text>
                      )}
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`font-semibold ${orderStage === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                        {orderStage === 'delivered' ? '✓ ' : ''}Deliver to customer
                      </Text>
                      <Text style={tw`text-gray-500 text-sm`}>{acceptedOrder.delivery.address}</Text>
                      {orderStage === 'picked' && isAtDelivery && (
                        <Text style={tw`text-green-600 text-sm font-bold mt-1`}>
                          ⚡ You're at delivery location! Complete delivery to earn
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Location Details */}
                <View style={tw`bg-yellow-50 p-4 rounded-xl mb-4`}>
                  <Text style={tw`font-bold mb-2`}>📍 Exact Locations:</Text>
                  <View style={tw`mb-2`}>
                    <Text style={tw`text-sm font-semibold text-green-600`}>Pickup:</Text>
                    <Text style={tw`text-gray-700`}>{acceptedOrder.pickup.exactLocation}</Text>
                  </View>
                  <View>
                    <Text style={tw`text-sm font-semibold text-blue-600`}>Delivery:</Text>
                    <Text style={tw`text-gray-700`}>{acceptedOrder.delivery.exactLocation}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={tw`flex-row mb-6`}>
                  <TouchableOpacity
                    style={tw`flex-1 bg-blue-500 py-3 rounded-lg mr-2 flex-row items-center justify-center`}
                    onPress={() => {
                      const destination = orderStage === 'accepted' ? acceptedOrder.pickup : acceptedOrder.delivery;
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;
                      // Open in maps app
                    }}
                  >
                    <Ionicons name="navigate" size={20} color="white" />
                    <Text style={tw`text-white font-bold ml-2`}>Navigate</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={tw`flex-1 bg-green-500 py-3 rounded-lg ml-2 flex-row items-center justify-center`}
                    onPress={() => {
                      setShowChatModal(true);
                    }}
                  >
                    <Ionicons name="chatbubble" size={20} color="white" />
                    <Text style={tw`text-white font-bold ml-2`}>Chat</Text>
                  </TouchableOpacity>
                </View>

                {/* Pickup/Delivery Progress */}
                <View style={tw`bg-gray-100 p-4 rounded-xl mb-4`}>
                  <Text style={tw`font-bold mb-2`}>📍 Progress Tracker:</Text>
                  
                  <View style={tw`flex-row items-center justify-between mb-2`}>
                    <Text style={tw`text-gray-600`}>To Pickup:</Text>
                    <Text style={tw`font-bold ${isAtPickup ? 'text-green-600' : 'text-blue-600'}`}>
                      {calculateDistance(
                        location.coords.latitude, location.coords.longitude,
                        acceptedOrder.pickup.latitude, acceptedOrder.pickup.longitude
                      ).toFixed(2)} km
                    </Text>
                  </View>
                  
                  <View style={tw`h-2 bg-gray-300 rounded-full overflow-hidden mb-3`}>
                    <View 
                      style={[
                        tw`h-full bg-green-500`,
                        { width: `${Math.min(100, (1 - calculateDistance(
                          location.coords.latitude, location.coords.longitude,
                          acceptedOrder.pickup.latitude, acceptedOrder.pickup.longitude
                        ) / 2) * 100)}%` }
                      ]} 
                    />
                  </View>

                  {orderStage === 'picked' && (
                    <>
                      <View style={tw`flex-row items-center justify-between mb-2`}>
                        <Text style={tw`text-gray-600`}>To Delivery:</Text>
                        <Text style={tw`font-bold ${isAtDelivery ? 'text-green-600' : 'text-blue-600'}`}>
                          {calculateDistance(
                            location.coords.latitude, location.coords.longitude,
                            acceptedOrder.delivery.latitude, acceptedOrder.delivery.longitude
                          ).toFixed(2)} km
                        </Text>
                      </View>
                      
                      <View style={tw`h-2 bg-gray-300 rounded-full overflow-hidden`}>
                        <View 
                          style={[
                            tw`h-full bg-blue-500`,
                            { width: `${Math.min(100, (1 - calculateDistance(
                              location.coords.latitude, location.coords.longitude,
                              acceptedOrder.delivery.latitude, acceptedOrder.delivery.longitude
                            ) / 3) * 100)}%` }
                          ]} 
                        />
                      </View>
                    </>
                  )}
                </View>

                {/* Earnings Preview */}
                {orderStage === 'picked' && isAtDelivery && (
                  <View style={tw`bg-green-100 p-4 rounded-xl mb-6 border-2 border-green-500`}>
                    <View style={tw`items-center`}>
                      <Ionicons name="cash" size={40} color="#22c55e" />
                      <Text style={tw`text-lg font-bold text-green-700 mt-2`}>
                        Complete Delivery to Earn
                      </Text>
                      <Text style={tw`text-3xl font-bold text-green-600 my-2`}>
                        ₦{acceptedOrder.fare.toFixed(2)}
                      </Text>
                      <TouchableOpacity
                        style={tw`bg-green-600 px-8 py-3 rounded-full mt-2`}
                        onPress={handleConfirmDelivery}
                      >
                        <Text style={tw`text-white font-bold text-lg`}>
                          Complete Delivery
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* Loading Overlay for Logout */}
      {isLoggingOut && (
        <View style={tw`absolute inset-0 bg-black/50 items-center justify-center z-50`}>
          <View style={tw`bg-white p-6 rounded-xl items-center`}>
            <ActivityIndicator size="large" color="#fbbf24" />
            <Text style={tw`mt-4 text-gray-600 font-semibold`}>Logging out...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default AlsRiderScreen;