import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import tw from 'twrnc';
import { BlurView } from 'expo-blur';

// Store
import { selectOrigin, selectDestination, setOrigin, setDestination } from '@/store/ioSlices';

const { width, height } = Dimensions.get('window');

const COLORS = {
  gold: '#FDB623',
  text: {
    primary: '#1A1A1A',
    secondary: '#666666',
    light: '#999999',
  },
  border: '#EFEFEF',
  background: '#FFFFFF',
  surface: '#FAFAFA',
  success: '#34A853',
  error: '#EA4335',
};

// Vehicle types with their details
const VEHICLE_TYPES = {
  BIKE: {
    id: 'bike',
    name: 'Bike',
    icon: 'bicycle',
    baseFare: 300,
    ratePerKm: 100,
    maxPassengers: 1,
    timeMultiplier: 0.8,
    image: '🚲',
    description: 'Fast & Affordable',
  },
  CAR: {
    id: 'car',
    name: 'Car',
    icon: 'car',
    baseFare: 500,
    ratePerKm: 150,
    maxPassengers: 4,
    timeMultiplier: 1,
    image: '🚗',
    description: 'Comfortable & Spacious',
  },
};

// Popular destinations in Lagos
const POPULAR_DESTINATIONS = [
  { 
    id: 1, 
    name: 'MMIA Airport', 
    address: 'Ikeja, Lagos',
    coordinates: { lat: 6.5774, lng: 3.3210 },
    icon: 'airplane',
    color: '#FF6B6B',
  },
  { 
    id: 2, 
    name: 'Ikeja City Mall', 
    address: 'Alausa, Ikeja',
    coordinates: { lat: 6.6018, lng: 3.3515 },
    icon: 'cart',
    color: '#4ECDC4',
  },
  { 
    id: 3, 
    name: 'Victoria Island', 
    address: 'Lagos',
    coordinates: { lat: 6.4281, lng: 3.4219 },
    icon: 'water',
    color: '#45B7D1',
  },
  { 
    id: 4, 
    name: 'Lekki Phase 1', 
    address: 'Lagos',
    coordinates: { lat: 6.4488, lng: 3.4723 },
    icon: 'business',
    color: '#96CEB4',
  },
];

// Recent searches
const RECENT_SEARCHES = [
  { 
    id: 1, 
    name: 'Home', 
    address: '12 Admiralty Way, Lekki Phase 1',
    coordinates: { lat: 6.4488, lng: 3.4723 },
    icon: 'home',
  },
  { 
    id: 2, 
    name: 'Work', 
    address: '25 Marina, Lagos Island',
    coordinates: { lat: 6.4531, lng: 3.3958 },
    icon: 'briefcase',
  },
];

interface RouteInfo {
  distance: number;
  duration: number;
  polyline: string;
}

export default function RideScreen() {
  const dispatch = useDispatch();
  const origin = useSelector(selectOrigin);
  const destination = useSelector(selectDestination);
  
  // State management
  const [loading, setLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLE_TYPES.CAR.id);
  const [mobile, setMobile] = useState('');
  const [appMode, setAppMode] = useState('Normal');
  const [showRiderCard, setShowRiderCard] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchType, setSearchType] = useState<'origin' | 'destination'>('origin');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [bottomSheetHeight] = useState(new Animated.Value(120));
  const [applock, setApplock] = useState(false);
  const [appLockMessage, setAppLockMessage] = useState('');
  
  // Refs
  const mapRef = useRef(null);
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);

  // Load user data and app lock status on mount
  useEffect(() => {
    loadUserData();
    getUserLocation();
    getAppLockStatus();
    const intervalId = setInterval(() => getAppLockStatus(), 10000);
    return () => clearInterval(intervalId);
  }, []);

  // Fit map to show both markers when origin and destination are set
  useEffect(() => {
    if (origin && destination && mapRef.current) {
      fitMapToCoordinates();
      getRoute();
      Animated.spring(bottomSheetHeight, {
        toValue: 350, // Height for vehicle selection + fare + confirm button
        useNativeDriver: false,
        friction: 8,
      }).start();
    } else {
      Animated.spring(bottomSheetHeight, {
        toValue: 120,
        useNativeDriver: false,
        friction: 8,
      }).start();
    }
  }, [origin, destination]);

  // Calculate fare when route is ready or vehicle changes
  useEffect(() => {
    if (routeInfo && selectedVehicle) {
      calculateFare();
    }
  }, [routeInfo, selectedVehicle]);

  const loadUserData = async () => {
    try {
      const userMobile = await AsyncStorage.getItem('mobile');
      const mode = await AsyncStorage.getItem('AppMode');
      if (userMobile) setMobile(userMobile);
      if (mode) setAppMode(mode);
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const getAppLockStatus = async () => {
    try {
      const response = await fetch(`https://hoog.ng/infiniteorder/api/Settings/readAppLock.php`);
      const result = await response.json();
      if (Array.isArray(result) && result.length > 0) {
        setAppLockMessage(result[0].lockmessage);
        setApplock(result[0].applock === 'YES');
      }
    } catch (error) {
      console.log('Error fetching app lock:', error);
    }
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location access');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;
      
      setUserLocation({ latitude, longitude });
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      // Get address from coordinates
      getAddressFromCoordinates(latitude, longitude);
    } catch (error) {
      console.log('Error getting location:', error);
    }
  };

  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        dispatch(setOrigin({
          location: { lat, lng },
          description: data.display_name,
          shortDescription: data.address?.road || 'Current Location',
        }));
      }
    } catch (error) {
      console.log('Error getting address:', error);
    }
  };

  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    try {
      // Use Nominatim API with focus on Nigeria
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Nigeria')}&format=json&addressdetails=1&limit=10`
      );
      const data = await response.json();
      
      const formattedSuggestions = data.map((item: any) => ({
        description: item.display_name,
        place_id: item.place_id,
        structured_formatting: {
          main_text: item.address?.road || item.name || item.display_name.split(',')[0],
          secondary_text: [
            item.address?.suburb,
            item.address?.city,
            item.address?.state
          ].filter(Boolean).join(', '),
        },
        coordinates: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        },
      }));
      
      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.log('Error searching locations:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocations(text), 500);
  };

  const handleSelectLocation = (suggestion: any) => {
    if (applock) {
      Alert.alert('App Locked', appLockMessage || 'The app is currently locked');
      return;
    }

    const locationData = {
      location: suggestion.coordinates,
      description: suggestion.description,
      shortDescription: suggestion.structured_formatting.main_text,
    };

    if (searchType === 'origin') {
      dispatch(setOrigin(locationData));
    } else {
      dispatch(setDestination(locationData));
    }

    setSearchModalVisible(false);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleSelectPopularDestination = (item) => {
    if (applock) {
      Alert.alert('App Locked', appLockMessage);
      return;
    }
    dispatch(setDestination({
      location: item.coordinates,
      description: `${item.name}, ${item.address}`,
      shortDescription: item.name,
    }));
    setSearchModalVisible(false);
  };

  const handleSelectRecentLocation = (item) => {
    if (applock) {
      Alert.alert('App Locked', appLockMessage);
      return;
    }
    if (searchType === 'origin') {
      dispatch(setOrigin({
        location: item.coordinates,
        description: item.address,
        shortDescription: item.name,
      }));
    } else {
      dispatch(setDestination({
        location: item.coordinates,
        description: item.address,
        shortDescription: item.name,
      }));
    }
    setSearchModalVisible(false);
  };

  const handleUseCurrentLocation = async () => {
    if (applock) {
      Alert.alert('App Locked', appLockMessage);
      return;
    }
    
    setLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.display_name) {
        dispatch(setOrigin({
          location: { lat: latitude, lng: longitude },
          description: data.display_name,
          shortDescription: data.address?.road || 'Current Location',
        }));
        setSearchModalVisible(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get current location');
    } finally {
      setLoading(false);
    }
  };

  const fitMapToCoordinates = () => {
    if (!origin || !destination || !mapRef.current) return;

    const coordinates = [
      { latitude: origin.location.lat, longitude: origin.location.lng },
      { latitude: destination.location.lat, longitude: destination.location.lng },
    ];

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { 
        top: 120,
        right: 40, 
        bottom: 400, // Increased to show route clearly above bottom sheet
        left: 40 
      },
      animated: true,
    });
  };

  const getRoute = async () => {
    if (!origin || !destination) return;

    setRouteLoading(true);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/` +
        `${origin.location.lng},${origin.location.lat};` +
        `${destination.location.lng},${destination.location.lat}?overview=full&geometries=polyline`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        setRouteInfo({
          distance: route.distance / 1000,
          duration: route.duration / 60,
          polyline: route.geometry,
        });
      }
    } catch (error) {
      console.log('Error getting route:', error);
    } finally {
      setRouteLoading(false);
    }
  };

  const calculateFare = () => {
    if (!routeInfo || !selectedVehicle) return;

    const vehicle = VEHICLE_TYPES[selectedVehicle.toUpperCase()];
    if (!vehicle) return;

    const distance = routeInfo.distance;
    const duration = routeInfo.duration;
    
    let fare = vehicle.baseFare + (distance * vehicle.ratePerKm);
    
    // Peak hours adjustment (7-9am, 5-8pm)
    const hour = new Date().getHours();
    const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);
    
    if (isPeakHour) {
      fare *= 1.2;
    }
    
    // Traffic adjustment based on speed
    const avgSpeed = distance / (duration / 60);
    if (avgSpeed < 15) {
      fare *= 1.15;
    }

    // Round to nearest 100 for cleaner pricing
    fare = Math.round(fare / 100) * 100;

    setEstimatedFare({
      distance: distance.toFixed(1),
      duration: Math.round(duration),
      baseFare: vehicle.baseFare,
      ratePerKm: vehicle.ratePerKm,
      amount: fare,
      vehicleType: vehicle.id,
      maxPassengers: vehicle.maxPassengers,
      isPeakHour,
      traffic: avgSpeed < 15 ? 'Heavy' : 'Normal',
    });
  };

  const handleRequestRide = async () => {
    if (!origin || !destination) {
      Alert.alert('Error', 'Please select pickup and dropoff locations');
      return;
    }

    if (!selectedVehicle) {
      Alert.alert('Error', 'Please select a vehicle type');
      return;
    }

    if (applock) {
      Alert.alert('App Locked', appLockMessage);
      return;
    }

    // Show confirmation with price
    Alert.alert(
      'Confirm Ride',
      `Confirm ${VEHICLE_TYPES[selectedVehicle.toUpperCase()].name} ride\n` +
      `From: ${origin.shortDescription}\n` +
      `To: ${destination.shortDescription}\n` +
      `Distance: ${estimatedFare?.distance} km\n` +
      `Duration: ${estimatedFare?.duration} mins\n` +
      `Fare: ₦${estimatedFare?.amount}\n\n` +
      `Do you want to continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm Ride', onPress: createOrder }
      ]
    );
  };

  const createOrder = async () => {
    setLoading(true);
    try {
      const vehicle = VEHICLE_TYPES[selectedVehicle.toUpperCase()];
      
      const orderData = {
        mobile,
        origin: origin.description,
        destination: destination.description,
        origin_lat: origin.location.lat,
        origin_lng: origin.location.lng,
        destination_lat: destination.location.lat,
        destination_lng: destination.location.lng,
        vehicle_type: selectedVehicle,
        distance: estimatedFare?.distance || 0,
        estimated_fare: estimatedFare?.amount || 0,
        base_fare: vehicle.baseFare,
        rate_per_km: vehicle.ratePerKm,
        app_mode: appMode,
        estimated_duration: estimatedFare?.duration,
      };

      const response = await fetch('https://hoog.ng/infiniteorder/api/TransportOrders/createOrder.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();
      
      if (response.ok) {
        setShowRiderCard(true);
        Animated.spring(bottomSheetHeight, {
          toValue: 0,
          useNativeDriver: false,
          friction: 8,
        }).start();
      } else {
        Alert.alert('Error', result.message || 'Failed to request ride');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openSearchModal = (type: 'origin' | 'destination') => {
    setSearchType(type);
    setSearchModalVisible(true);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleCloseRiderCard = () => {
    setShowRiderCard(false);
    if (origin && destination) {
      Animated.spring(bottomSheetHeight, {
        toValue: 350,
        useNativeDriver: false,
        friction: 8,
      }).start();
    }
  };

  const handleSwapLocations = () => {
    if (origin && destination) {
      dispatch(setOrigin(destination));
      dispatch(setDestination(origin));
    }
  };

  const clearLocation = (type: 'origin' | 'destination') => {
    if (type === 'origin') {
      dispatch(setOrigin(null));
    } else {
      dispatch(setDestination(null));
    }
    setRouteInfo(null);
    setEstimatedFare(null);
  };

  const decodePolyline = (t: string, e: number = 5) => {
    let points = [];
    let index = 0, len = t.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: (lat / 1e5),
        longitude: (lng / 1e5),
      });
    }
    return points;
  };

  const renderHeader = () => (
    <View style={tw`absolute top-0 left-0 right-0 z-20`}>
      <BlurView intensity={80} tint="light" style={tw`pt-12 pb-4 px-4`}>
        <View style={tw`flex-row items-center justify-between`}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={tw`w-10 h-10 rounded-full bg-white items-center justify-center shadow-md`}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          
          <View style={tw`flex-row items-center bg-white px-4 py-2 rounded-full shadow-md`}>
            <MaterialCommunityIcons name="motorbike" size={20} color={COLORS.gold} />
            <Text style={tw`text-[${COLORS.text.primary}] font-medium ml-1`}>
              {showRiderCard ? 'Your Ride' : 'Book a Ride'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={tw`w-10 h-10 rounded-full bg-white items-center justify-center shadow-md`}
            onPress={() => origin && destination && Linking.openURL(`https://www.google.com/maps/dir/?api=1&origin=${origin.location.lat},${origin.location.lng}&destination=${destination.location.lat},${destination.location.lng}`)}
          >
            <Ionicons name="navigate-outline" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>
        
        {/* App Lock Warning */}
        {applock && (
          <View style={tw`mt-2 bg-red-100 rounded-lg p-2`}>
            <Text style={tw`text-red-600 text-center text-sm`}>{appLockMessage}</Text>
          </View>
        )}
      </BlurView>
    </View>
  );

  const renderLocationSummary = () => (
    <View style={tw`bg-white rounded-2xl shadow-lg border border-[${COLORS.border}] overflow-hidden`}>
      {/* Pickup Location */}
      <TouchableOpacity 
        style={tw`flex-row items-center p-4`}
        onPress={() => openSearchModal('origin')}
      >
        <View style={tw`w-8 items-center`}>
          <View style={tw`w-3 h-3 rounded-full bg-[${COLORS.gold}]`} />
        </View>
        <View style={tw`flex-1 ml-2`}>
          <Text style={tw`text-[${COLORS.text.light}] text-xs`}>PICKUP</Text>
          <Text style={tw`text-[${COLORS.text.primary}] font-medium`} numberOfLines={1}>
            {origin?.shortDescription || 'Select pickup location'}
          </Text>
        </View>
        {origin && (
          <TouchableOpacity onPress={() => clearLocation('origin')}>
            <Ionicons name="close-circle" size={20} color={COLORS.text.light} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Swap Button */}
      {origin && destination && (
        <TouchableOpacity 
          style={tw`absolute right-4 top-12 bg-white rounded-full p-1.5 shadow-md z-10 border border-[${COLORS.border}]`}
          onPress={handleSwapLocations}
        >
          <Ionicons name="swap-vertical" size={18} color={COLORS.gold} />
        </TouchableOpacity>
      )}

      {/* Divider */}
      <View style={tw`h-px bg-[${COLORS.border}] ml-12`} />

      {/* Destination Location */}
      <TouchableOpacity 
        style={tw`flex-row items-center p-4`}
        onPress={() => openSearchModal('destination')}
      >
        <View style={tw`w-8 items-center`}>
          <View style={tw`w-3 h-3 rounded-full bg-[${COLORS.error}]`} />
        </View>
        <View style={tw`flex-1 ml-2`}>
          <Text style={tw`text-[${COLORS.text.light}] text-xs`}>DROPOFF</Text>
          <Text style={tw`text-[${COLORS.text.primary}] font-medium`} numberOfLines={1}>
            {destination?.shortDescription || 'Where are you going?'}
          </Text>
        </View>
        {destination && (
          <TouchableOpacity onPress={() => clearLocation('destination')}>
            <Ionicons name="close-circle" size={20} color={COLORS.text.light} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderVehicleSelection = () => (
    <View style={tw`bg-white rounded-2xl shadow-lg border border-[${COLORS.border}] p-4`}>
      <Text style={tw`text-[${COLORS.text.primary}] font-medium mb-3`}>
        Choose your ride
      </Text>
      
      <View style={tw`flex-row justify-between`}>
        {Object.values(VEHICLE_TYPES).map((vehicle) => {
          const isSelected = selectedVehicle === vehicle.id;
          return (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                tw`flex-1 mx-1 p-3 rounded-xl items-center border-2`,
                isSelected 
                  ? tw`border-[${COLORS.gold}] bg-[${COLORS.gold}]/5` 
                  : tw`border-[${COLORS.border}]`
              ]}
              onPress={() => setSelectedVehicle(vehicle.id)}
            >
              <View style={[
                tw`w-14 h-14 rounded-full items-center justify-center mb-2`,
                isSelected ? tw`bg-[${COLORS.gold}]/10` : tw`bg-[${COLORS.surface}]`
              ]}>
                <Text style={tw`text-2xl`}>{vehicle.image}</Text>
              </View>
              <Text style={[
                tw`font-medium text-sm`,
                isSelected ? tw`text-[${COLORS.gold}]` : tw`text-[${COLORS.text.primary}]`
              ]}>
                {vehicle.name}
              </Text>
              <Text style={tw`text-[${COLORS.text.light}] text-xs mt-1`}>
                ₦{vehicle.ratePerKm}/km
              </Text>
              <Text style={tw`text-[${COLORS.text.light}] text-xs`}>
                {vehicle.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderFareEstimate = () => (
    estimatedFare && (
      <View style={tw`bg-white rounded-2xl shadow-lg border border-[${COLORS.border}] p-4 mt-3`}>
        {/* Price Breakdown */}
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <View>
            <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>TOTAL FARE</Text>
            <Text style={tw`text-[${COLORS.gold}] text-3xl font-bold`}>
              ₦{estimatedFare.amount}
            </Text>
          </View>
          
          <View style={tw`bg-[${COLORS.surface}] rounded-lg p-2`}>
            <Text style={tw`text-[${COLORS.text.primary}] font-medium`}>
              {estimatedFare.distance} km
            </Text>
            <Text style={tw`text-[${COLORS.text.light}] text-xs`}>
              {estimatedFare.duration} mins
            </Text>
          </View>
        </View>

        {/* Price Details */}
        <View style={tw`bg-[${COLORS.surface}] rounded-xl p-3 mb-3`}>
          <View style={tw`flex-row justify-between mb-2`}>
            <Text style={tw`text-[${COLORS.text.light}]`}>Base fare</Text>
            <Text style={tw`text-[${COLORS.text.primary}]`}>₦{estimatedFare.baseFare}</Text>
          </View>
          <View style={tw`flex-row justify-between mb-2`}>
            <Text style={tw`text-[${COLORS.text.light}]`}>Distance ({estimatedFare.distance} km × ₦{estimatedFare.ratePerKm})</Text>
            <Text style={tw`text-[${COLORS.text.primary}]`}>₦{Math.round(estimatedFare.distance * estimatedFare.ratePerKm)}</Text>
          </View>
          {estimatedFare.isPeakHour && (
            <View style={tw`flex-row justify-between mb-2`}>
              <Text style={tw`text-[${COLORS.text.light}]`}>Peak hour surcharge (20%)</Text>
              <Text style={tw`text-[${COLORS.error}]`}>+₦{Math.round(estimatedFare.amount * 0.2)}</Text>
            </View>
          )}
          {estimatedFare.traffic === 'Heavy' && (
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-[${COLORS.text.light}]`}>Heavy traffic adjustment</Text>
              <Text style={tw`text-[${COLORS.error}]`}>+15%</Text>
            </View>
          )}
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[
            tw`bg-[${COLORS.gold}] py-4 rounded-xl items-center shadow-lg`,
            loading && tw`opacity-50`
          ]}
          onPress={handleRequestRide}
          disabled={loading || applock}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <View>
              <Text style={tw`text-white font-bold text-lg`}>
                Confirm {VEHICLE_TYPES[selectedVehicle.toUpperCase()]?.name}
              </Text>
              <Text style={tw`text-white text-xs text-center mt-1`}>
                Tap to review before booking
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    )
  );

  const renderSearchModal = () => (
    <Modal
      visible={searchModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setSearchModalVisible(false)}
    >
      <SafeAreaView style={tw`flex-1 bg-white`}>
        <View style={tw`flex-row items-center p-4 border-b border-[${COLORS.border}]`}>
          <TouchableOpacity 
            onPress={() => setSearchModalVisible(false)}
            style={tw`p-2`}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          
          <Text style={tw`flex-1 text-center font-medium text-base`}>
            {searchType === 'origin' ? 'Pickup Location' : 'Dropoff Location'}
          </Text>
          
          <View style={tw`w-10`} />
        </View>

        <View style={tw`p-4`}>
          <View style={tw`flex-row items-center bg-[${COLORS.surface}] rounded-lg px-3 border border-[${COLORS.border}]`}>
            <Ionicons name="search" size={20} color={COLORS.text.light} />
            <TextInput
              ref={searchInputRef}
              style={tw`flex-1 p-3 text-[${COLORS.text.primary}]`}
              placeholder="Search for location"
              placeholderTextColor={COLORS.text.light}
              value={searchQuery}
              onChangeText={handleSearchChange}
              editable={!applock}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searching && (
              <ActivityIndicator size="small" color={COLORS.gold} />
            )}
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setSuggestions([]);
              }}>
                <Ionicons name="close-circle" size={20} color={COLORS.text.light} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {searchQuery.length < 2 ? (
          <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
            {searchType === 'origin' && !applock && (
              <TouchableOpacity
                style={tw`flex-row items-center p-4 border-b border-[${COLORS.border}]`}
                onPress={handleUseCurrentLocation}
                disabled={loading}
              >
                <View style={tw`w-10 h-10 rounded-full bg-[${COLORS.gold}]/10 items-center justify-center mr-3`}>
                  {loading ? (
                    <ActivityIndicator size="small" color={COLORS.gold} />
                  ) : (
                    <Ionicons name="locate" size={20} color={COLORS.gold} />
                  )}
                </View>
                <View>
                  <Text style={tw`text-[${COLORS.text.primary}] font-medium`}>
                    Use Current Location
                  </Text>
                  <Text style={tw`text-[${COLORS.text.light}] text-xs mt-1`}>
                    GPS accuracy: {userLocation ? 'High' : 'Unknown'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <Text style={tw`text-[${COLORS.text.primary}] font-medium px-4 py-2`}>
              Recent Locations
            </Text>
            {RECENT_SEARCHES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={tw`flex-row items-center px-4 py-3 border-b border-[${COLORS.border}]`}
                onPress={() => handleSelectRecentLocation(item)}
                disabled={applock}
              >
                <View style={tw`w-10 h-10 rounded-full bg-[${COLORS.surface}] items-center justify-center mr-3`}>
                  <Ionicons name={item.icon} size={20} color={COLORS.text.secondary} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-[${COLORS.text.primary}] font-medium`}>
                    {item.name}
                  </Text>
                  <Text style={tw`text-[${COLORS.text.light}] text-xs mt-1`}>
                    {item.address}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            <Text style={tw`text-[${COLORS.text.primary}] font-medium px-4 py-2`}>
              Popular Destinations
            </Text>
            {POPULAR_DESTINATIONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={tw`flex-row items-center px-4 py-3 border-b border-[${COLORS.border}]`}
                onPress={() => handleSelectPopularDestination(item)}
                disabled={applock}
              >
                <View style={[tw`w-10 h-10 rounded-full items-center justify-center mr-3`, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-[${COLORS.text.primary}] font-medium`}>
                    {item.name}
                  </Text>
                  <Text style={tw`text-[${COLORS.text.light}] text-xs mt-1`}>
                    {item.address}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id?.toString() || Math.random().toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={tw`flex-row items-center px-4 py-3 border-b border-[${COLORS.border}]`}
                onPress={() => handleSelectLocation(item)}
                disabled={applock}
              >
                <View style={tw`w-10 h-10 rounded-full bg-[${COLORS.surface}] items-center justify-center mr-3`}>
                  <Ionicons name="location" size={20} color={COLORS.text.secondary} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-[${COLORS.text.primary}] font-medium`}>
                    {item.structured_formatting?.main_text || 'Location'}
                  </Text>
                  <Text style={tw`text-[${COLORS.text.light}] text-xs mt-1`} numberOfLines={1}>
                    {item.structured_formatting?.secondary_text || item.description}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              searching ? (
                <View style={tw`items-center justify-center py-10`}>
                  <ActivityIndicator size="large" color={COLORS.gold} />
                  <Text style={tw`text-[${COLORS.text.light}] mt-2`}>
                    Searching...
                  </Text>
                </View>
              ) : (
                <View style={tw`items-center justify-center py-10`}>
                  <Ionicons name="search-outline" size={48} color={COLORS.text.light} />
                  <Text style={tw`text-[${COLORS.text.light}] mt-2`}>
                    No locations found
                  </Text>
                </View>
              )
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderMap = () => (
    <View style={tw`flex-1`}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={tw`flex-1`}
        region={mapRegion}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        rotateEnabled
        scrollEnabled
        zoomEnabled
        mapPadding={{
          top: 100,
          bottom: 400,
        }}
      >
        {origin && (
          <Marker
            coordinate={{
              latitude: origin.location.lat,
              longitude: origin.location.lng,
            }}
            title="Pickup Location"
            description={origin.description}
          >
            <View style={tw`items-center`}>
              <View style={tw`w-6 h-6 rounded-full bg-[${COLORS.gold}] border-2 border-white shadow-md`} />
            </View>
          </Marker>
        )}

        {destination && (
          <Marker
            coordinate={{
              latitude: destination.location.lat,
              longitude: destination.location.lng,
            }}
            title="Dropoff Location"
            description={destination.description}
          >
            <View style={tw`items-center`}>
              <View style={tw`w-6 h-6 rounded-full bg-[${COLORS.error}] border-2 border-white shadow-md`} />
            </View>
          </Marker>
        )}

        {routeInfo?.polyline && (
          <Polyline
            coordinates={decodePolyline(routeInfo.polyline)}
            strokeColor={COLORS.gold}
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Route Loading Overlay */}
      {routeLoading && (
        <View style={tw`absolute top-32 left-1/2 transform -translate-x-16 z-10`}>
          <View style={tw`bg-white rounded-full px-4 py-2 shadow-md flex-row items-center`}>
            <ActivityIndicator size="small" color={COLORS.gold} />
            <Text style={tw`text-[${COLORS.text.primary}] ml-2 text-sm`}>
              Calculating route...
            </Text>
          </View>
        </View>
      )}

      {/* Search Modal */}
      {renderSearchModal()}
    </View>
  );

  return (
    <View style={tw`flex-1 bg-white`}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {renderHeader()}
      {renderMap()}

      {/* Bottom Sheet */}
      <Animated.View 
        style={[
          tw`absolute bottom-0 left-0 right-0 px-4`,
          {
            height: bottomSheetHeight.interpolate({
              inputRange: [0, 120, 350],
              outputRange: [0, 120, 350]
            }),
            opacity: bottomSheetHeight.interpolate({
              inputRange: [0, 80],
              outputRange: [0, 1]
            })
          }
        ]}
      >
        {!showRiderCard && (
          <>
            {/* Location Summary - Always visible when locations not set */}
            {(!origin || !destination) && (
              <View style={tw`mb-2`}>
                {renderLocationSummary()}
              </View>
            )}

            {/* When both locations are set, show compact view */}
            {origin && destination && !showRiderCard && (
              <View>
                {/* Compact Location Summary */}
                <TouchableOpacity 
                  style={tw`bg-white rounded-2xl shadow-lg border border-[${COLORS.border}] p-3 mb-2 flex-row items-center`}
                  onPress={() => openSearchModal('origin')}
                >
                  <View style={tw`flex-1 flex-row items-center`}>
                    <View style={tw`w-6 items-center`}>
                      <View style={tw`w-2 h-2 rounded-full bg-[${COLORS.gold}]`} />
                    </View>
                    <Text style={tw`flex-1 text-[${COLORS.text.primary}] text-sm ml-1`} numberOfLines={1}>
                      {origin.shortDescription}
                    </Text>
                  </View>
                  
                  <Ionicons name="arrow-down" size={16} color={COLORS.text.light} />
                  
                  <View style={tw`flex-1 flex-row items-center ml-2`}>
                    <View style={tw`w-6 items-center`}>
                      <View style={tw`w-2 h-2 rounded-full bg-[${COLORS.error}]`} />
                    </View>
                    <Text style={tw`flex-1 text-[${COLORS.text.primary}] text-sm ml-1`} numberOfLines={1}>
                      {destination.shortDescription}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Vehicle Selection */}
                {renderVehicleSelection()}
                
                {/* Fare Estimate with Confirm Button */}
                {estimatedFare && renderFareEstimate()}
              </View>
            )}
          </>
        )}
      </Animated.View>

      {/* Rider Card */}
      {showRiderCard && (
        <Animated.View 
          style={[
            tw`absolute bottom-0 left-0 right-0`,
            {
              height: bottomSheetHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [height * 0.8, 0]
              }),
              transform: [{
                translateY: bottomSheetHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, height]
                })
              }]
            }
          ]}
        >
          <RiderCards 
            setShowRider={handleCloseRiderCard}
            mobile={mobile}
            appMode={appMode}
            estimatedFare={estimatedFare}
            origin={origin}
            destination={destination}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  textInput: {
    padding: 10,
    fontSize: 15,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 50,
  },
});