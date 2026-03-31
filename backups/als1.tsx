import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, TextInput, Modal, FlatList, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Container from '@/components/container';
import tw from 'twrnc';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { selectOrigin } from '@/store/ioSlices';

// Components
import TopBar from '@/components/TopBar';
import OrderSummary from '@/components/OrderSummary';
import OrderTracking from '@/components/OrderTrackinga';
import OrderHistory from '@/components/OrderHistorydup';

const COLORS = {
  gold: '#b7790f',
  primary: '#4F46E5',
  secondary: '#10B981',
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    light: '#9CA3AF',
  },
  border: '#E5E7EB',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

// Company office location (simulated for now)
const COMPANY_OFFICE = {
  lat: 8.4815407000, // Lagos coordinates
  lng: 4.5621774000,
  address: "1, Opp Railway Line, Unity Road, Ilorin, Kwara State.",
  name: "Ilorin Main Office"
};

// Base delivery fee for pickup and delivery combined
const BASE_DELIVERY_FEE = 300; // ₦500 static fee
const RATE_PER_KM = 100; // ₦100 per 2km (so ₦50 per km)

interface CartItem {
  id: string;
  description: string;
  price: number;
  quantity: number;
  category?: string;
}

interface LocationSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface CustomerLocation {
  city: string;
  state: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distanceFromOffice: number; // in km
  deliveryFee: number; // calculated fee for this location
  fullDescription: string;
}

interface LaundryItem {
  id: string;
  description: string;
  price: number;
  category?: string;
}

interface OrderData {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  pickupLocation: CustomerLocation;
  deliveryLocation: CustomerLocation;
}

const AlsScreen = () => {
  const [activeScreen, setActiveScreen] = useState('comboBox');
  const [balance, setBalance] = useState(0);
  const [mobile, setMobile] = useState('');
  const [alsUsableAmt, setAlsUsableAmt] = useState(0);
  const [profileImage, setProfileImage] = useState('');
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  
  // States from ComboBoxWithTable
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [items, setItems] = useState<LaundryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const Origin = useSelector(selectOrigin);

  // UI States
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showCart, setShowCart] = useState(false);
  
  // Location search states
  const [locationSearchModal, setLocationSearchModal] = useState(false);
  const [locationSearchType, setLocationSearchType] = useState<'pickup' | 'delivery'>('pickup');
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [pickupLocation, setPickupLocation] = useState<CustomerLocation | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<CustomerLocation | null>(null);
  const [useSameLocation, setUseSameLocation] = useState(true); // Default to same location for both
  
  const [step, setStep] = useState(1);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    await handleGotToken();
    await requestLocationPermission();
    await fetchItems();
  };

  const handleGotToken = async () => {
    try {
      const MyMobile = await AsyncStorage.getItem('mobile');
      const profileimage = await AsyncStorage.getItem('profileimage');
      setMobile(MyMobile || '');
      setProfileImage(profileimage || '');
    } catch (error) {
      console.error('Error getting token:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location access for better delivery experience');
      }
    } catch (error) {
      console.log('Error requesting location permission:', error);
    }
  };

  const getBalanceAls = useCallback(async (mobileNumber: string) => {
    if (!mobileNumber) return;
    try {
      const response = await fetch(`https://hoog.ng/infiniteorder/api/Customers/sumAlsBalance.php?mobile=${mobileNumber}`);
      const result = await response.json();
      if (result[0]?.balance > 0) {
        setBalance(result[0].balance);
        setAlsUsableAmt(result[0].balance - (result[0].bonus || 0));
      }
    } catch (error) {
      console.log('Error fetching balance:', error);
    }
  }, []);

  useEffect(() => {
    if (mobile) {
      getBalanceAls(mobile);
      const intervalId = setInterval(() => {
        getBalanceAls(mobile);
      }, 10000);
      return () => clearInterval(intervalId);
    }
  }, [mobile, getBalanceAls]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Settings/readClothList.php');
      const data = await response.json();
      if (data && Array.isArray(data)) {
        setItems(data);
        
        // Extract unique categories
        const uniqueCategories = ['All', ...new Set(data.map(item => item.category || 'General').filter(Boolean))];
        setCategories(uniqueCategories);
        setSelectedCategory('All');
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      Alert.alert('Error', 'Unable to load items. Please pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItems();
  }, []);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  // Calculate delivery fee based on distance from office
  const calculateDeliveryFeeFromOffice = (lat: number, lng: number) => {
    const distance = calculateDistance(COMPANY_OFFICE.lat, COMPANY_OFFICE.lng, lat, lng);
    
    // Fee calculation: ₦100 per 2km + ₦500 base fee for pickup and delivery combined
    // Since it's round trip (pickup and delivery), we calculate for one way and multiply by 2
    const oneWayFee = (distance / 2) * RATE_PER_KM; // ₦100 per 2km = ₦50 per km
    const totalFee = (oneWayFee * 2) + BASE_DELIVERY_FEE; // Round trip + base fee
    
    return {
      distance: parseFloat(distance.toFixed(2)),
      fee: Math.round(totalFee)
    };
  };

  // Search locations using OpenStreetMap Nominatim
  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    setSearchingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, Nigeria&addressdetails=1&limit=10`
      );
      const data = await response.json();
      
      const suggestions = data.map((item: any) => ({
        place_id: item.place_id,
        description: item.display_name,
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
      
      setLocationSuggestions(suggestions);
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleLocationSearchChange = (text: string) => {
    setLocationSearchQuery(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocations(text), 500);
  };

  const handleSelectLocation = (suggestion: LocationSuggestion) => {
    // Calculate distance and fee from office
    const { distance, fee } = calculateDeliveryFeeFromOffice(
      suggestion.coordinates.lat,
      suggestion.coordinates.lng
    );

    const locationData: CustomerLocation = {
      city: suggestion.structured_formatting.main_text,
      state: suggestion.structured_formatting.secondary_text.split(', ').pop() || '',
      address: suggestion.description,
      coordinates: suggestion.coordinates,
      distanceFromOffice: distance,
      deliveryFee: fee,
      fullDescription: suggestion.description,
    };

    if (locationSearchType === 'pickup') {
      setPickupLocation(locationData);
      // If "use same location" is enabled, also set delivery to same location
      if (useSameLocation) {
        setDeliveryLocation(locationData);
      }
    } else {
      setDeliveryLocation(locationData);
    }

    // Close modal
    setLocationSearchModal(false);
    setLocationSearchQuery('');
    setLocationSuggestions([]);
  };

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location access');
        return;
      }

      setSearchingLocation(true);
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.display_name) {
        // Calculate distance and fee from office
        const { distance, fee } = calculateDeliveryFeeFromOffice(latitude, longitude);

        const locationData: CustomerLocation = {
          city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
          state: data.address?.state || 'Unknown',
          address: data.display_name,
          coordinates: { lat: latitude, lng: longitude },
          distanceFromOffice: distance,
          deliveryFee: fee,
          fullDescription: data.display_name,
        };

        // Set both pickup and delivery to current location
        setPickupLocation(locationData);
        setDeliveryLocation(locationData);
        setUseSameLocation(true);

        // Close modal
        setLocationSearchModal(false);
        setLocationSearchQuery('');
        setLocationSuggestions([]);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Could not get current location');
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleUseSameLocationToggle = (value: boolean) => {
    setUseSameLocation(value);
    if (value && pickupLocation) {
      // If toggled on and pickup exists, copy pickup to delivery
      setDeliveryLocation(pickupLocation);
    }
  };

  // Calculate total delivery fee (sum of pickup and delivery fees)
  const calculateTotalDeliveryFee = useCallback(() => {
    let total = 0;
    if (pickupLocation) total += pickupLocation.deliveryFee;
    if (deliveryLocation) total += deliveryLocation.deliveryFee;
    return total;
  }, [pickupLocation, deliveryLocation]);

  // Memoized filtered items for performance
  const filteredItems = useMemo(() => {
    let filtered = items;
    
    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [items, selectedCategory, searchTerm]);

  const handleSelectItem = (item: LaundryItem) => {
    const isItemSelected = selectedItems.some((selectedItem) => selectedItem.id === item.id);

    if (isItemSelected) {
      Alert.alert('Item Already Selected', 'This item has already been added to the list.');
      return;
    }

    setSelectedItems((prevItems) => [
      ...prevItems,
      { 
        id: item.id, 
        description: item.description, 
        price: item.price, 
        quantity: 1,
        category: item.category 
      }
    ]);
  };

  const handleQuantityChange = (id: string, type: 'increment' | 'decrement') => {
    setSelectedItems((prevItems) => {
      if (type === 'decrement') {
        const item = prevItems.find(item => item.id === id);
        if (item?.quantity === 1) {
          Alert.alert(
            'Remove Item',
            'Do you want to remove this item from cart?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Remove', 
                onPress: () => handleItemRemoval(id),
                style: 'destructive'
              }
            ]
          );
          return prevItems;
        }
      }

      return prevItems.map((item) => {
        if (item.id === id) {
          const newQuantity = type === 'increment' ? item.quantity + 1 : item.quantity - 1;
          return { ...item, quantity: Math.max(1, newQuantity) };
        }
        return item;
      });
    });
  };

  const handleItemRemoval = (id: string) => {
    setSelectedItems((prevItems) =>
      prevItems.filter((item) => item.id !== id) 
    );
  };

  const calculateItemTotal = useCallback((price: number, quantity: number) => {
    return price * quantity;
  }, []);

  const calculateGrandTotal = useCallback(() => {
    return selectedItems.reduce((total, item) => total + calculateItemTotal(item.price, item.quantity), 0);
  }, [selectedItems, calculateItemTotal]);

  // Update grand total when selected items change
  useEffect(() => {
    setGrandTotal(calculateGrandTotal());
  }, [selectedItems, calculateGrandTotal]);

  // Check balance vs total
  useEffect(() => {
    if (grandTotal > alsUsableAmt && selectedItems.length > 0) {
      Alert.alert(
        'Insufficient Balance', 
        `Usable balance is ₦${alsUsableAmt.toLocaleString()}. Kindly load money to make order beyond usable balance.`
      );
    }
  }, [grandTotal, alsUsableAmt, selectedItems.length]);

  const calculateTotalWithDelivery = useCallback(() => {
    return grandTotal + calculateTotalDeliveryFee();
  }, [grandTotal, calculateTotalDeliveryFee]);

  const validateProceedToLocation = useCallback(() => {
    if (selectedItems.length === 0) {
      Alert.alert('Cart Empty', 'Please add items to your cart first');
      return false;
    }

    if (grandTotal < 2000) {
      Alert.alert('Minimum Order Limit', 'Minimum Order of ₦2,000 Required');
      return false;
    }

    if (grandTotal > alsUsableAmt) {
      Alert.alert('Insufficient Balance', 'Your usable balance is insufficient for this order');
      return false;
    }

    return true;
  }, [selectedItems.length, grandTotal, alsUsableAmt]);

  const handleProceedToLocation = () => {
    if (validateProceedToLocation()) {
      setStep(2);
    }
  };

  const validateProceedToReview = useCallback(() => {
    if (!pickupLocation) {
      Alert.alert('Location Required', 'Please select your pickup location');
      return false;
    }
    if (!deliveryLocation) {
      Alert.alert('Location Required', 'Please select your delivery location');
      return false;
    }
    return true;
  }, [pickupLocation, deliveryLocation]);

  const handleProceedToReview = () => {
    if (validateProceedToReview()) {
      setStep(3);
    }
  };

  const saveOrder = async () => {
    if (!validateProceedToLocation() || !validateProceedToReview()) {
      return;
    }

    const orderDetails = {
      mobile: mobile,
      amount: grandTotal,
      address: Origin?.description || '',
      origin_lat: Origin?.location.lat,
      origin_lng: Origin?.location.lng,
      office_location: {
        address: COMPANY_OFFICE.address,
        lat: COMPANY_OFFICE.lat,
        lng: COMPANY_OFFICE.lng,
      },
      pickup_location: {
        address: pickupLocation?.address,
        lat: pickupLocation?.coordinates.lat,
        lng: pickupLocation?.coordinates.lng,
        city: pickupLocation?.city,
        state: pickupLocation?.state,
        distance_from_office: pickupLocation?.distanceFromOffice,
        delivery_fee: pickupLocation?.deliveryFee,
      },
      delivery_location: {
        address: deliveryLocation?.address,
        lat: deliveryLocation?.coordinates.lat,
        lng: deliveryLocation?.coordinates.lng,
        city: deliveryLocation?.city,
        state: deliveryLocation?.state,
        distance_from_office: deliveryLocation?.distanceFromOffice,
        delivery_fee: deliveryLocation?.deliveryFee,
      },
      use_same_location: useSameLocation,
      total_delivery_fee: calculateTotalDeliveryFee(),
      items: selectedItems.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        total: calculateItemTotal(item.price, item.quantity),
      }))
    };

    setLoading(true);
    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/alsOrdering.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderDetails),
      });

      const result = await response.json();
      
      if (response.ok && result.status === 201) {
        Alert.alert(
          'Success', 
          'Order placed successfully! Expect pickup within 12-24 hours.',
          [
            {
              text: 'OK',
              onPress: () => {
                setActiveScreen('orderHistory');
                resetOrderState();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error saving order:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetOrderState = () => {
    setSelectedItems([]);
    setStep(1);
    setPickupLocation(null);
    setDeliveryLocation(null);
    setUseSameLocation(true);
    setSearchTerm('');
    setShowCart(false);
  };

  const handleScreenChange = (screen: string) => {
    setActiveScreen(screen);
    if (screen === 'comboBox') {
      setOrderData(null);
      setIsEditing(false);
      setTrackingOrderId(null);
      resetOrderState();
    }
  };

  const goHome = () => {
    router.replace("/(tabs)/");
  };

  const handleViewOrder = (orderId: string) => {
    setTrackingOrderId(orderId);
    setActiveScreen('orderTracking');
  };

  const handleViewHistory = () => {
    setActiveScreen('orderHistory');
  };

  // Render location search modal
  const renderLocationSearchModal = useCallback(() => (
    <Modal
      visible={locationSearchModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setLocationSearchModal(false)}
    >
      <View style={tw`flex-1 bg-white`}>
        <View style={tw`flex-row items-center p-4 border-b border-[${COLORS.border}]`}>
          <TouchableOpacity 
            onPress={() => setLocationSearchModal(false)} 
            style={tw`p-2`}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={tw`flex-1 text-center font-medium text-base`}>
            {locationSearchType === 'pickup' ? 'Pickup Location' : 'Delivery Location'}
          </Text>
          <View style={tw`w-10`} />
        </View>

        <View style={tw`p-4`}>
          <View style={tw`flex-row items-center bg-[${COLORS.surface}] rounded-lg px-3 border border-[${COLORS.border}]`}>
            <Ionicons name="search" size={20} color={COLORS.text.light} />
            <TextInput
              style={tw`flex-1 p-3 text-[${COLORS.text.primary}]`}
              placeholder="Search for location"
              placeholderTextColor={COLORS.text.light}
              value={locationSearchQuery}
              onChangeText={handleLocationSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchingLocation && (
              <ActivityIndicator size="small" color={COLORS.gold} />
            )}
            {locationSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setLocationSearchQuery('');
                setLocationSuggestions([]);
              }}>
                <Ionicons name="close-circle" size={20} color={COLORS.text.light} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {locationSearchQuery.length < 3 ? (
          <ScrollView style={tw`flex-1`}>
            {/* Current Location Option */}
            <TouchableOpacity
              style={tw`flex-row items-center p-4 border-b border-[${COLORS.border}]`}
              onPress={handleUseCurrentLocation}
            >
              <View style={tw`w-10 h-10 rounded-full bg-[${COLORS.gold}]/10 items-center justify-center mr-3`}>
                <Ionicons name="locate" size={20} color={COLORS.gold} />
              </View>
              <View>
                <Text style={tw`text-[${COLORS.text.primary}] font-medium`}>
                  Use Current Location
                </Text>
                <Text style={tw`text-[${COLORS.text.light}] text-xs mt-1`}>
                  Automatically detect your location
                </Text>
              </View>
            </TouchableOpacity>
            
            <View style={tw`p-4`}>
              <Text style={tw`text-[${COLORS.text.light}] text-center`}>
                Enter at least 3 characters to search for a specific address
              </Text>
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={locationSuggestions}
            keyExtractor={(item) => item.place_id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={tw`flex-row items-center px-4 py-3 border-b border-[${COLORS.border}]`}
                onPress={() => handleSelectLocation(item)}
              >
                <View style={tw`w-10 h-10 rounded-full bg-[${COLORS.surface}] items-center justify-center mr-3`}>
                  <Ionicons name="location" size={20} color={COLORS.text.secondary} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-[${COLORS.text.primary}] font-medium`}>
                    {item.structured_formatting.main_text}
                  </Text>
                  <Text style={tw`text-[${COLORS.text.light}] text-xs mt-1`} numberOfLines={1}>
                    {item.structured_formatting.secondary_text || item.description}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              searchingLocation ? (
                <View style={tw`items-center justify-center py-10`}>
                  <ActivityIndicator size="large" color={COLORS.gold} />
                  <Text style={tw`text-[${COLORS.text.light}] mt-2`}>Searching...</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </Modal>
  ), [locationSearchModal, locationSearchType, locationSearchQuery, locationSuggestions, searchingLocation]);

  // Render functions with proper memoization
  const renderCategoryTabs = useCallback(() => {
    if (categories.length === 0) return null;
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={tw`py-3`}
        contentContainerStyle={tw`px-4`}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              tw`mr-3 px-4 py-2 rounded-full`,
              selectedCategory === category
                ? tw`bg-[${COLORS.gold}]`
                : tw`bg-white border border-[${COLORS.border}]`
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              tw`font-medium`,
              selectedCategory === category ? tw`text-white` : tw`text-[${COLORS.text.primary}]`
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }, [categories, selectedCategory]);

  const renderSearchBar = useCallback(() => (
    <View style={tw`px-4 py-2`}>
      <View style={tw`flex-row items-center bg-white rounded-xl px-3 py-1 border border-[${COLORS.border}]`}>
        <Ionicons name="search" size={20} color={COLORS.text.light} />
        <TextInput
          style={tw`flex-1 p-2 text-[${COLORS.text.primary}]`}
          placeholder="Search items..."
          placeholderTextColor={COLORS.text.light}
          value={searchTerm}
          onChangeText={setSearchTerm}
          returnKeyType="search"
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.text.light} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  ), [searchTerm]);

  const renderCartBadge = useCallback(() => (
    <TouchableOpacity
      style={tw`absolute top-16 right-4 z-10`}
      onPress={() => setShowCart(true)}
    >
      <View style={tw`bg-[${COLORS.gold}] rounded-full h-12 w-12 items-center justify-center shadow-lg`}>
        <Ionicons name="cart" size={24} color="white" />
        {selectedItems.length > 0 && (
          <View style={tw`absolute -top-1 -right-1 bg-red-500 rounded-full h-5 w-5 items-center justify-center`}>
            <Text style={tw`text-white text-xs font-bold`}>{selectedItems.length}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  ), [selectedItems.length]);

  const renderCartSidebar = useCallback(() => (
    <Modal
      visible={showCart}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCart(false)}
    >
      <View style={tw`flex-1 bg-black/50`}>
        <View style={tw`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80%]`}>
          <View style={tw`items-center pt-2`}>
            <View style={tw`w-12 h-1 bg-gray-300 rounded-full`} />
          </View>
          
          <View style={tw`p-4`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-xl font-bold text-[${COLORS.text.primary}]`}>
                Your Cart ({selectedItems.length} items)
              </Text>
              <TouchableOpacity onPress={() => setShowCart(false)}>
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>

            {selectedItems.length === 0 ? (
              <View style={tw`items-center justify-center py-10`}>
                <Ionicons name="cart-outline" size={64} color={COLORS.text.light} />
                <Text style={tw`text-[${COLORS.text.light}] mt-2`}>Your cart is empty</Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={selectedItems}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={tw`flex-row items-center py-3 border-b border-[${COLORS.border}]`}>
                      <View style={tw`w-12 h-12 bg-[${COLORS.surface}] rounded-lg items-center justify-center mr-3`}>
                        <Text style={tw`text-2xl`}>👕</Text>
                      </View>
                      
                      <View style={tw`flex-1`}>
                        <Text style={tw`text-[${COLORS.text.primary}] font-medium`} numberOfLines={1}>
                          {item.description}
                        </Text>
                        <Text style={tw`text-[${COLORS.gold}] font-bold`}>
                          ₦{item.price.toLocaleString()}
                        </Text>
                      </View>

                      <View style={tw`flex-row items-center`}>
                        <TouchableOpacity
                          style={tw`w-8 h-8 bg-[${COLORS.surface}] rounded-full items-center justify-center`}
                          onPress={() => handleQuantityChange(item.id, 'decrement')}
                        >
                          <Text style={tw`text-lg font-bold text-[${COLORS.text.primary}]`}>-</Text>
                        </TouchableOpacity>
                        
                        <Text style={tw`mx-2 font-bold text-[${COLORS.text.primary}]`}>{item.quantity}</Text>
                        
                        <TouchableOpacity
                          style={tw`w-8 h-8 bg-[${COLORS.surface}] rounded-full items-center justify-center`}
                          onPress={() => handleQuantityChange(item.id, 'increment')}
                        >
                          <Text style={tw`text-lg font-bold text-[${COLORS.text.primary}]`}>+</Text>
                        </TouchableOpacity>
                      </View>
                      
                      <TouchableOpacity
                        onPress={() => handleItemRemoval(item.id)}
                        style={tw`ml-2`}
                      >
                        <MaterialCommunityIcons name="trash-can" size={20} color="red" />
                      </TouchableOpacity>
                    </View>
                  )}
                  style={tw`max-h-96`}
                  showsVerticalScrollIndicator={false}
                />

                <View style={tw`mt-4 pt-4 border-t border-[${COLORS.border}]`}>
                  <View style={tw`flex-row justify-between mb-2`}>
                    <Text style={tw`text-[${COLORS.text.secondary}]`}>Subtotal</Text>
                    <Text style={tw`text-[${COLORS.text.primary}] font-bold`}>
                      ₦{grandTotal.toLocaleString()}
                    </Text>
                  </View>
                  
                  {(pickupLocation || deliveryLocation) && (
                    <View style={tw`flex-row justify-between mb-2`}>
                      <Text style={tw`text-[${COLORS.text.secondary}]`}>Delivery Fee</Text>
                      <Text style={tw`text-[${COLORS.text.primary}] font-bold`}>
                        ₦{calculateTotalDeliveryFee().toLocaleString()}
                      </Text>
                    </View>
                  )}
                  
                  <View style={tw`flex-row justify-between mb-4`}>
                    <Text style={tw`text-[${COLORS.text.primary}] font-bold`}>Total</Text>
                    <Text style={tw`text-[${COLORS.gold}] text-xl font-bold`}>
                      ₦{calculateTotalWithDelivery().toLocaleString()}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={tw`bg-[${COLORS.gold}] py-3 rounded-xl items-center`}
                    onPress={() => {
                      setShowCart(false);
                      handleProceedToLocation();
                    }}
                  >
                    <Text style={tw`text-white font-bold text-lg`}>Proceed to Checkout</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  ), [showCart, selectedItems, grandTotal, pickupLocation, deliveryLocation, calculateTotalDeliveryFee, calculateTotalWithDelivery]);

  // CRITICAL FIX: The location step with proper modal trigger
  const renderLocationStep = useCallback(() => {
    console.log('Rendering location step, modal visible:', locationSearchModal); // Debug log
    
    return (
      <View style={tw`flex-1 bg-white`}>
        <View style={tw`bg-[${COLORS.gold}] p-4`}>
          <TouchableOpacity onPress={() => setStep(1)} style={tw`mb-2`}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={tw`text-white text-xl font-bold`}>Delivery Locations</Text>
          <Text style={tw`text-white/80 text-sm mt-1`}>Step 2 of 3</Text>
        </View>

        <ScrollView style={tw`p-4`} showsVerticalScrollIndicator={false}>
          {/* Company Office Info */}
          <View style={tw`bg-[${COLORS.surface}] p-4 rounded-xl border border-[${COLORS.border}] mb-4`}>
            <View style={tw`flex-row items-center mb-2`}>
              <Ionicons name="business" size={20} color={COLORS.gold} />
              <Text style={tw`text-[${COLORS.text.primary}] font-medium ml-2`}>Our Office</Text>
            </View>
            <Text style={tw`text-[${COLORS.text.secondary}] text-sm`}>{COMPANY_OFFICE.address}</Text>
          </View>

          {/* Same Location Toggle */}
          <View style={tw`flex-row items-center justify-between bg-[${COLORS.surface}] p-4 rounded-xl border border-[${COLORS.border}] mb-4`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-[${COLORS.text.primary}] font-medium`}>Same for Pickup & Delivery</Text>
              <Text style={tw`text-[${COLORS.text.light}] text-xs mt-1`}>
                Use the same address for both
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleUseSameLocationToggle(!useSameLocation)}
              style={[
                tw`w-12 h-6 rounded-full p-1`,
                useSameLocation ? tw`bg-[${COLORS.gold}]` : tw`bg-gray-300`
              ]}
            >
              <View style={[
                tw`w-4 h-4 rounded-full bg-white`,
                useSameLocation ? tw`ml-6` : tw`ml-0`
              ]} />
            </TouchableOpacity>
          </View>

          {/* Pickup Location - Direct modal trigger */}
          <TouchableOpacity
            style={tw`bg-[${COLORS.surface}] p-4 rounded-xl border border-[${COLORS.border}] mb-4`}
            onPress={() => {
              console.log('Opening pickup modal'); // Debug log
              setLocationSearchType('pickup');
              setLocationSearchModal(true);
            }}
          >
            <Text style={tw`text-[${COLORS.text.light}] text-xs mb-1`}>PICKUP LOCATION</Text>
            {pickupLocation ? (
              <>
                <Text style={tw`text-[${COLORS.text.primary}] font-medium text-lg`}>
                  {pickupLocation.city}
                </Text>
                <Text style={tw`text-[${COLORS.text.light}] text-sm mt-1`} numberOfLines={2}>
                  {pickupLocation.address}
                </Text>
                <View style={tw`flex-row justify-between mt-2 pt-2 border-t border-[${COLORS.border}]`}>
                  <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>
                    Distance: {pickupLocation.distanceFromOffice}km from office
                  </Text>
                  <Text style={tw`text-[${COLORS.gold}] font-bold`}>
                    ₦{pickupLocation.deliveryFee}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={tw`text-[${COLORS.text.light}]`}>Select pickup location</Text>
            )}
            <Ionicons name="chevron-down" size={20} color={COLORS.text.light} style={tw`absolute right-4 top-4`} />
          </TouchableOpacity>

          {/* Delivery Location - Only show if not using same location */}
          {!useSameLocation && (
            <TouchableOpacity
              style={tw`bg-[${COLORS.surface}] p-4 rounded-xl border border-[${COLORS.border}] mb-6`}
              onPress={() => {
                console.log('Opening delivery modal'); // Debug log
                setLocationSearchType('delivery');
                setLocationSearchModal(true);
              }}
            >
              <Text style={tw`text-[${COLORS.text.light}] text-xs mb-1`}>DELIVERY LOCATION</Text>
              {deliveryLocation ? (
                <>
                  <Text style={tw`text-[${COLORS.text.primary}] font-medium text-lg`}>
                    {deliveryLocation.city}
                  </Text>
                  <Text style={tw`text-[${COLORS.text.light}] text-sm mt-1`} numberOfLines={2}>
                    {deliveryLocation.address}
                  </Text>
                  <View style={tw`flex-row justify-between mt-2 pt-2 border-t border-[${COLORS.border}]`}>
                    <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>
                      Distance: {deliveryLocation.distanceFromOffice}km from office
                    </Text>
                    <Text style={tw`text-[${COLORS.gold}] font-bold`}>
                      ₦{deliveryLocation.deliveryFee}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={tw`text-[${COLORS.text.light}]`}>Select delivery location</Text>
              )}
              <Ionicons name="chevron-down" size={20} color={COLORS.text.light} style={tw`absolute right-4 top-4`} />
            </TouchableOpacity>
          )}

          {/* Show message when using same location */}
          {useSameLocation && pickupLocation && (
            <View style={tw`bg-[${COLORS.surface}] p-4 rounded-xl border border-[${COLORS.border}] mb-6`}>
              <View style={tw`flex-row items-center mb-2`}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.gold} />
                <Text style={tw`text-[${COLORS.text.primary}] font-medium ml-2`}>Same Location for Delivery</Text>
              </View>
              <Text style={tw`text-[${COLORS.text.secondary}] text-sm`}>
                Delivery will be at the same address as pickup
              </Text>
            </View>
          )}

          {/* Total Delivery Fee Preview */}
          {pickupLocation && deliveryLocation && (
            <View style={tw`bg-[${COLORS.surface}] p-4 rounded-xl border border-[${COLORS.border}] mb-6`}>
              <Text style={tw`text-[${COLORS.text.primary}] font-medium mb-2`}>Total Delivery Fee</Text>
              <View style={tw`flex-row justify-between items-center`}>
                <View>
                  <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>
                    Pickup: ₦{pickupLocation.deliveryFee}
                  </Text>
                  <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>
                    Delivery: ₦{deliveryLocation.deliveryFee}
                  </Text>
                  <Text style={tw`text-[${COLORS.text.secondary}] text-xs mt-1`}>
                    Base fee: ₦{BASE_DELIVERY_FEE} included
                  </Text>
                </View>
                <Text style={tw`text-[${COLORS.gold}] font-bold text-xl`}>
                  ₦{(pickupLocation.deliveryFee + deliveryLocation.deliveryFee).toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {/* Navigation Buttons */}
          <View style={tw`flex-row mb-6`}>
            <TouchableOpacity
              style={tw`flex-1 bg-[${COLORS.surface}] py-3 rounded-xl mr-2 border border-[${COLORS.border}]`}
              onPress={() => setStep(1)}
            >
              <Text style={tw`text-[${COLORS.text.primary}] text-center font-medium`}>Back</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={tw`flex-1 bg-[${COLORS.gold}] py-3 rounded-xl ml-2`}
              onPress={handleProceedToReview}
              disabled={!pickupLocation || !deliveryLocation}
            >
              <Text style={tw`text-white text-center font-bold`}>
                {(!pickupLocation || !deliveryLocation) ? 'Select Locations' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Render modal inside the step to ensure it's available */}
        {renderLocationSearchModal()}
      </View>
    );
  }, [step, pickupLocation, deliveryLocation, useSameLocation, locationSearchModal, renderLocationSearchModal]);

  const renderReviewStep = useCallback(() => (
    <View style={tw`flex-1 bg-white`}>
      <View style={tw`bg-[${COLORS.gold}] p-4`}>
        <TouchableOpacity onPress={() => setStep(2)} style={tw`mb-2`}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={tw`text-white text-xl font-bold`}>Review Order</Text>
        <Text style={tw`text-white/80 text-sm mt-1`}>Step 3 of 3</Text>
      </View>

      <ScrollView style={tw`p-4`} showsVerticalScrollIndicator={false}>
        {/* Items Summary */}
        <View style={tw`bg-[${COLORS.surface}] rounded-xl border border-[${COLORS.border}] p-4 mb-4`}>
          <Text style={tw`text-[${COLORS.text.primary}] font-bold mb-3`}>Items ({selectedItems.length})</Text>
          {selectedItems.map((item) => (
            <View key={item.id} style={tw`flex-row justify-between items-center mb-2`}>
              <View style={tw`flex-row items-center flex-1`}>
                <View style={tw`w-8 h-8 bg-white rounded-full items-center justify-center mr-2`}>
                  <Text style={tw`text-lg`}>👕</Text>
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-[${COLORS.text.primary}]`} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <Text style={tw`text-[${COLORS.text.light}] text-xs`}>Qty: {item.quantity}</Text>
                </View>
              </View>
              <Text style={tw`text-[${COLORS.gold}] font-medium`}>
                ₦{(item.price * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Location Summary */}
        <View style={tw`bg-[${COLORS.surface}] rounded-xl border border-[${COLORS.border}] p-4 mb-4`}>
          <Text style={tw`text-[${COLORS.text.primary}] font-bold mb-3`}>Delivery Details</Text>
          
          <View style={tw`mb-3`}>
            <Text style={tw`text-[${COLORS.text.light}] text-xs mb-1`}>PICKUP</Text>
            <Text style={tw`text-[${COLORS.text.primary}]`}>{pickupLocation?.address}</Text>
            <View style={tw`flex-row justify-between mt-1`}>
              <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>
                {pickupLocation?.distanceFromOffice}km from office
              </Text>
              <Text style={tw`text-[${COLORS.gold}] text-sm`}>₦{pickupLocation?.deliveryFee}</Text>
            </View>
          </View>
          
          <View>
            <Text style={tw`text-[${COLORS.text.light}] text-xs mb-1`}>DELIVERY</Text>
            <Text style={tw`text-[${COLORS.text.primary}]`}>{deliveryLocation?.address}</Text>
            <View style={tw`flex-row justify-between mt-1`}>
              <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>
                {deliveryLocation?.distanceFromOffice}km from office
              </Text>
              <Text style={tw`text-[${COLORS.gold}] text-sm`}>₦{deliveryLocation?.deliveryFee}</Text>
            </View>
          </View>

          {useSameLocation && (
            <View style={tw`mt-2 pt-2 border-t border-[${COLORS.border}]`}>
              <Text style={tw`text-[${COLORS.text.secondary}] text-xs text-center`}>
                Same location used for both pickup and delivery
              </Text>
            </View>
          )}
        </View>

        {/* Price Breakdown */}
        <View style={tw`bg-[${COLORS.surface}] rounded-xl border border-[${COLORS.border}] p-4 mb-6`}>
          <Text style={tw`text-[${COLORS.text.primary}] font-bold mb-3`}>Price Details</Text>
          
          <View style={tw`flex-row justify-between mb-2`}>
            <Text style={tw`text-[${COLORS.text.secondary}]`}>Subtotal</Text>
            <Text style={tw`text-[${COLORS.text.primary}]`}>₦{grandTotal.toLocaleString()}</Text>
          </View>
          
          <View style={tw`flex-row justify-between mb-2`}>
            <Text style={tw`text-[${COLORS.text.secondary}]`}>Pickup Fee</Text>
            <Text style={tw`text-[${COLORS.text.primary}]`}>₦{pickupLocation?.deliveryFee.toLocaleString()}</Text>
          </View>
          
          <View style={tw`flex-row justify-between mb-2`}>
            <Text style={tw`text-[${COLORS.text.secondary}]`}>Delivery Fee</Text>
            <Text style={tw`text-[${COLORS.text.primary}]`}>₦{deliveryLocation?.deliveryFee.toLocaleString()}</Text>
          </View>
          
          <View style={tw`border-t border-[${COLORS.border}] my-2 pt-2`}>
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-[${COLORS.text.primary}] font-bold`}>Total</Text>
              <Text style={tw`text-[${COLORS.gold}] text-xl font-bold`}>
                ₦{(grandTotal + (pickupLocation?.deliveryFee || 0) + (deliveryLocation?.deliveryFee || 0)).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={tw`flex-row mb-6`}>
          <TouchableOpacity
            style={tw`flex-1 bg-[${COLORS.surface}] py-3 rounded-xl mr-2 border border-[${COLORS.border}]`}
            onPress={() => setStep(2)}
          >
            <Text style={tw`text-[${COLORS.text.primary}] text-center font-medium`}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={tw`flex-1 bg-[${COLORS.gold}] py-3 rounded-xl ml-2`}
            onPress={saveOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={tw`text-white text-center font-bold`}>Place Order</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  ), [step, selectedItems, pickupLocation, deliveryLocation, useSameLocation, grandTotal, loading]);

  const renderComboBox = useCallback(() => (
    <View style={tw`flex-1 bg-white`}>
      <View style={tw`bg-[${COLORS.gold}] p-4`}>
        <Text style={tw`text-white text-xl font-bold`}>African Lagos Style</Text>
        <Text style={tw`text-white/80 text-sm mt-1`}>Step 1 of 3 - Select Items</Text>
      </View>

      {renderSearchBar()}
      {renderCategoryTabs()}
      {renderCartBadge()}
      {renderCartSidebar()}

      {loading && !refreshing ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={tw`text-[${COLORS.text.secondary}] mt-2`}>Loading items...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={tw`justify-between px-4`}
          renderItem={({ item }) => {
            const cartItem = selectedItems.find(cartItem => cartItem.id === item.id);
            const isSelected = !!cartItem;
            
            return (
              <TouchableOpacity
                style={tw`w-[48%] bg-[${COLORS.surface}] rounded-xl p-3 mb-3 border ${isSelected ? `border-[${COLORS.gold}]` : `border-[${COLORS.border}]`}`}
                onPress={() => handleSelectItem(item)}
                activeOpacity={0.7}
              >
                <View style={tw`items-center mb-2`}>
                  <View style={tw`w-20 h-20 bg-white rounded-full items-center justify-center mb-2 shadow-sm`}>
                    <Text style={tw`text-4xl`}>👕</Text>
                  </View>
                  <Text style={tw`text-[${COLORS.text.primary}] font-medium text-center`} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <Text style={tw`text-[${COLORS.gold}] font-bold mt-1`}>₦{item.price.toLocaleString()}</Text>
                </View>
                
                {/* Quantity indicator on the item */}
                {isSelected && (
                  <View style={tw`absolute top-2 right-2 bg-[${COLORS.gold}] rounded-full h-6 w-6 items-center justify-center`}>
                    <Text style={tw`text-white text-xs font-bold`}>
                      {cartItem?.quantity}
                    </Text>
                  </View>
                )}
                
                {/* + and - buttons on the item */}
                {isSelected && (
                  <View style={tw`flex-row justify-between mt-2 pt-2 border-t border-[${COLORS.border}]`}>
                    <TouchableOpacity
                      style={tw`bg-white rounded-full h-8 w-8 items-center justify-center border border-[${COLORS.border}]`}
                      onPress={() => handleQuantityChange(item.id, 'decrement')}
                    >
                      <Text style={tw`text-lg font-bold text-[${COLORS.text.primary}]`}>-</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={tw`bg-white rounded-full h-8 w-8 items-center justify-center border border-[${COLORS.border}]`}
                      onPress={() => handleQuantityChange(item.id, 'increment')}
                    >
                      <Text style={tw`text-lg font-bold text-[${COLORS.text.primary}]`}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={tw`items-center justify-center py-10`}>
              <Ionicons name="search-outline" size={64} color={COLORS.text.light} />
              <Text style={tw`text-[${COLORS.text.light}] mt-2`}>No items found</Text>
            </View>
          }
          ListFooterComponent={
            selectedItems.length > 0 ? (
              <TouchableOpacity
                style={tw`bg-[${COLORS.gold}] py-4 rounded-xl items-center mx-4 mb-6 shadow-lg`}
                onPress={handleProceedToLocation}
              >
                <Text style={tw`text-white font-bold text-lg`}>
                  Proceed to Delivery • ₦{grandTotal.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.gold]} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-4`}
        />
      )}
    </View>
  ), [loading, refreshing, filteredItems, selectedItems, grandTotal, renderSearchBar, renderCategoryTabs, renderCartBadge, renderCartSidebar]);

  return (
    <Container className='p-0'>
      <View style={tw`h-1/10 bg-yellow-600`}>
        <TopBar 
          balance={balance} 
          handleScreenChange={handleScreenChange}
          onViewHistory={handleViewHistory}
          onGoHome={goHome} 
        />
      </View>

      <View style={tw`h-9/10 bg-gray-50`}>
        {activeScreen === 'comboBox' && (
          step === 1 ? renderComboBox() :
          step === 2 ? renderLocationStep() :
          renderReviewStep()
        )}
        
        {activeScreen === 'orderSummary' && orderData && (
          <OrderSummary
            items={orderData.items}
            grandTotal={orderData.total}
            alsUsableAmt={alsUsableAmt}
            mobile={mobile}
            onBack={() => setActiveScreen('comboBox')}
            onEditOrder={() => {
              setIsEditing(true);
              setActiveScreen('comboBox');
              setStep(1);
            }}
            onOrderPlaced={() => {
              setActiveScreen('orderHistory');
              setOrderData(null);
              resetOrderState();
            }}
            pickupLocation={orderData.pickupLocation}
            deliveryLocation={orderData.deliveryLocation}
          />
        )}
        
        {activeScreen === 'orderTracking' && trackingOrderId && (
          <OrderTracking
            orderId={trackingOrderId}
            onBack={() => setActiveScreen('orderHistory')}
          />
        )}
        
        {activeScreen === 'orderHistory' && (
          <OrderHistory
            onBack={() => setActiveScreen('comboBox')}
            onViewOrder={handleViewOrder}
          />
        )}
      </View>
    </Container>
  );
};

export default AlsScreen;