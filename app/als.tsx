import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  TextInput, 
  Modal, 
  FlatList, 
  Alert, 
  ActivityIndicator, 
  RefreshControl 
} from 'react-native';
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
import OrderHistory from '@/components/OrderHistory';

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

// Common laundry instructions
const COMMON_INSTRUCTIONS = [
  "Extra starch",
  "No starch",
  "Gentle wash",
  "Bleach safe",
  "No bleach",
  "Cold water only",
  "Hand wash only",
  "Delicate cycle",
  "Dry clean only",
  "Low heat dry",
  "No heat dry",
  "Fold neatly",
  "Hang dry",
  "Remove stains",
  "Spot clean only",
  "Iron low heat",
  "Iron high heat",
  "No iron",
  "Steam only",
  "Use fabric softener",
  "No fabric softener",
  "Separate colors",
  "Warm water only",
  "Hot water only",
];

interface CartItem {
  id: string;
  description: string;
  price: number;
  quantity: number;
  category?: string;
  instructions?: string; // Special instructions for this item
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
  orderInstructions?: string; // Overall order instructions
}

// Delivery/Pickup option type
type ServiceOption = 'delivery' | 'self-pickup' | 'self-delivery' | 'full-self';

const AlsScreen = () => {
  const [activeScreen, setActiveScreen] = useState('comboBox');
  const [balance, setBalance] = useState(0);
  const [mobile, setMobile] = useState('');

  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  
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
  
  // New state for service options
  const [serviceOption, setServiceOption] = useState<ServiceOption>('delivery');
  const [bypassMinOrder, setBypassMinOrder] = useState(false);
  
  // Location search states
  const [locationSearchModal, setLocationSearchModal] = useState(false);
  const [locationSearchType, setLocationSearchType] = useState<'pickup' | 'delivery'>('pickup');
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [pickupLocation, setPickupLocation] = useState<CustomerLocation | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<CustomerLocation | null>(null);
  const [useSameLocation, setUseSameLocation] = useState(true); // Default to same location for both
  
  // Special instructions states
  const [instructionsModal, setInstructionsModal] = useState(false);
  const [selectedItemForInstructions, setSelectedItemForInstructions] = useState<CartItem | null>(null);
  const [itemInstructions, setItemInstructions] = useState('');
  const [orderInstructions, setOrderInstructions] = useState('');
  const [orderInstructionsModal, setOrderInstructionsModal] = useState(false);
  const [showCommonInstructions, setShowCommonInstructions] = useState(false);
  
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
      const profileimage = await AsyncStorage.getItem('ProfileImage');
      const name = await AsyncStorage.getItem("name");
      const mail = await AsyncStorage.getItem('email');

      setMobile(MyMobile || '');
      setProfileImage(profileimage || '');
      setCustomerName(name || 'User');
      setEmail(mail || '');
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

  // Refresh balance function
  const refreshBalance = useCallback(async () => {
    if (mobile) {
      await getBalanceAls(mobile);
    }
  }, [mobile, getBalanceAls]);

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

  // Handle service option selection
  const handleServiceOptionChange = (option: ServiceOption) => {
    setServiceOption(option);
    
    // If any self-service option is selected, bypass minimum order
    if (option === 'self-pickup' || option === 'self-delivery' || option === 'full-self') {
      setBypassMinOrder(true);
    } else {
      setBypassMinOrder(false);
    }
    
    // Reset locations when changing service option
    if (option === 'delivery') {
      // Keep both locations
    } else if (option === 'self-pickup') {
      // Customer will drop off at office, so only need delivery location
      setPickupLocation(null);
    } else if (option === 'self-delivery') {
      // Customer will pick up from office, so only need pickup location
      setDeliveryLocation(null);
    } else if (option === 'full-self') {
      // Customer handles both pickup and delivery - no locations needed
      setPickupLocation(null);
      setDeliveryLocation(null);
    }
  };

  // Calculate total delivery fee based on service option
  const calculateTotalDeliveryFee = useCallback(() => {
    if (serviceOption === 'full-self') {
      // Customer handles everything themselves - no fee
      return 0;
    } else if (serviceOption === 'self-pickup') {
      // Customer drops off at office, we deliver to them
      return deliveryLocation?.deliveryFee || 0;
    } else if (serviceOption === 'self-delivery') {
      // We pick up from customer, they pick up from office
      return pickupLocation?.deliveryFee || 0;
    } else {
      // Full delivery - both pickup and delivery
      let total = 0;
      if (pickupLocation) total += pickupLocation.deliveryFee;
      if (deliveryLocation) total += deliveryLocation.deliveryFee;
      return total;
    }
  }, [serviceOption, pickupLocation, deliveryLocation]);

  // Calculate total with delivery
  const calculateTotalWithDelivery = useCallback(() => {
    return grandTotal + calculateTotalDeliveryFee();
  }, [grandTotal, calculateTotalDeliveryFee]);

  // Check balance vs total with delivery
  const isBalanceSufficient = useCallback(() => {
    const totalWithDelivery = calculateTotalWithDelivery();
    return totalWithDelivery <= alsUsableAmt;
  }, [calculateTotalWithDelivery, alsUsableAmt]);

  const getBalanceDeficit = useCallback(() => {
    const totalWithDelivery = calculateTotalWithDelivery();
    return Math.max(0, totalWithDelivery - alsUsableAmt);
  }, [calculateTotalWithDelivery, alsUsableAmt]);

  // Update the useEffect that checks balance vs total
  useEffect(() => {
    if (selectedItems.length > 0) {
      const totalWithDelivery = calculateTotalWithDelivery();
      if (totalWithDelivery > alsUsableAmt) {
        console.log("Total with Delivery:", totalWithDelivery);
        console.log("Usable Balance:", alsUsableAmt);
        
        Alert.alert(
          'Insufficient Balance', 
          `Total order cost (including delivery) is ₦${totalWithDelivery.toLocaleString()}. Your usable balance is ₦${alsUsableAmt.toLocaleString()}. Kindly load money to make this order.`
        );
      }
    }
  }, [grandTotal, alsUsableAmt, selectedItems.length, calculateTotalWithDelivery]);

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
        category: item.category,
        instructions: '' // Initialize with empty instructions
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

  // Special instructions handlers
  const handleAddInstructions = (item: CartItem) => {
    setSelectedItemForInstructions(item);
    setItemInstructions(item.instructions || '');
    setInstructionsModal(true);
  };

  const handleSaveInstructions = () => {
    if (selectedItemForInstructions) {
      setSelectedItems((prevItems) =>
        prevItems.map((item) =>
          item.id === selectedItemForInstructions.id
            ? { ...item, instructions: itemInstructions }
            : item
        )
      );
    }
    setInstructionsModal(false);
    setSelectedItemForInstructions(null);
    setItemInstructions('');
  };

  const handleSelectCommonInstruction = (instruction: string) => {
    setItemInstructions(prev => {
      if (prev) {
        return `${prev}, ${instruction}`;
      }
      return instruction;
    });
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

  const validateProceedToLocation = useCallback(() => {
    if (selectedItems.length === 0) {
      Alert.alert('Cart Empty', 'Please add items to your cart first');
      return false;
    }

    // Skip minimum order check for self-service options
    if (!bypassMinOrder && grandTotal < 200) {
      Alert.alert('Minimum Order Limit', 'Minimum Order of ₦2,000 Required');
      return false;
    }

    const totalWithDelivery = calculateTotalWithDelivery();
    if (totalWithDelivery > alsUsableAmt) {
      Alert.alert(
        'Insufficient Balance', 
        `Total order cost (including delivery) is ₦${totalWithDelivery.toLocaleString()}. Your usable balance is ₦${alsUsableAmt.toLocaleString()}. Please add funds to continue.`
      );
      return false;
    }

    return true;
  }, [selectedItems.length, grandTotal, alsUsableAmt, bypassMinOrder, calculateTotalWithDelivery]);

  const handleProceedToLocation = () => {
    if (validateProceedToLocation()) {
      setStep(2);
    }
  };

  const validateProceedToReview = useCallback(() => {
    if (serviceOption === 'delivery') {
      if (!pickupLocation) {
        Alert.alert('Location Required', 'Please select your pickup location');
        return false;
      }
      if (!deliveryLocation) {
        Alert.alert('Location Required', 'Please select your delivery location');
        return false;
      }
    } else if (serviceOption === 'self-pickup') {
      // Customer drops off at office, we deliver to them
      if (!deliveryLocation) {
        Alert.alert('Location Required', 'Please select your delivery location');
        return false;
      }
    } else if (serviceOption === 'self-delivery') {
      // We pick up from customer, they pick up from office
      if (!pickupLocation) {
        Alert.alert('Location Required', 'Please select your pickup location');
        return false;
      }
    } else if (serviceOption === 'full-self') {
      // Customer handles both pickup and delivery - no locations needed
      // Just show office address for reference
      return true;
    }
    return true;
  }, [serviceOption, pickupLocation, deliveryLocation]);

  const handleProceedToReview = () => {
    if (validateProceedToReview()) {
      setStep(3);
    }
  };

  const saveOrder = async () => {
    if (!validateProceedToLocation() || !validateProceedToReview()) {
      return;
    }

    // Refresh balance before final check
    await refreshBalance();

    const totalWithDelivery = calculateTotalWithDelivery();
    
    if (totalWithDelivery > alsUsableAmt) {
      Alert.alert(
        'Insufficient Balance',
        `Total order cost: ₦${totalWithDelivery.toLocaleString()}\nAvailable balance: ₦${alsUsableAmt.toLocaleString()}\n\nPlease add ₦${getBalanceDeficit().toLocaleString()} more to your wallet and try again.`
      );
      return;
    }

    console.log(serviceOption);
    const orderDetails = {
      mobile: mobile,
      amount: grandTotal,
      total_amount: totalWithDelivery, // Add this for reference
      service_option: serviceOption,
      bypass_min_order: bypassMinOrder,
      address: Origin?.description || '',
      origin_lat: Origin?.location.lat,
      origin_lng: Origin?.location.lng,
      office_location: {
        office_address: COMPANY_OFFICE.address,
        office_lat: COMPANY_OFFICE.lat,
        office_lng: COMPANY_OFFICE.lng,
      },
      // For pickup_location - send null if conditions not met or values are missing
      pickup_location: (serviceOption !== 'self-pickup' && serviceOption !== 'full-self' && pickupLocation) 
        ? {
            p_address: pickupLocation.address || null,
            p_lat: pickupLocation.coordinates?.lat ?? null,
            p_lng: pickupLocation.coordinates?.lng ?? null,
            p_city: pickupLocation.city || null,
            p_state: pickupLocation.state || null,
            p_distance_from_office: pickupLocation.distanceFromOffice ?? null,
            p_delivery_fee: pickupLocation.deliveryFee ?? null,
          } 
        : null,
      
      // For delivery_location - send null if conditions not met or values are missing
      delivery_location: (serviceOption !== 'self-delivery' && serviceOption !== 'full-self' && deliveryLocation) 
        ? {
            d_address: deliveryLocation.address || null,
            d_lat: deliveryLocation.coordinates?.lat ?? null,
            d_lng: deliveryLocation.coordinates?.lng ?? null,
            d_city: deliveryLocation.city || null,
            d_state: deliveryLocation.state || null,
            d_distance_from_office: deliveryLocation.distanceFromOffice ?? null,
            d_delivery_fee: deliveryLocation.deliveryFee ?? null,
          } 
        : null,
      
      use_same_location: useSameLocation,
      total_delivery_fee: calculateTotalDeliveryFee(),
      items: selectedItems.map(item => ({
        cloth: item.description,
        qty: item.quantity,
        unitprice: item.price,
        subtotal: calculateItemTotal(item.price, item.quantity),
      })),
      order_instructions: orderInstructions || '',
    };

    setLoading(true);
    try {
      console.log('Sending order:', JSON.stringify(orderDetails));
      
      const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/alsOrdering.php', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(orderDetails),
      });

      const result = await response.json();
      
      if (response.ok && result.status === 201) {
        let successMessage = '';
        if (serviceOption === 'full-self') {
          successMessage = 'Order placed successfully! Please drop off and pick up your laundry at our office.';
        } else if (serviceOption === 'self-pickup') {
          successMessage = 'Order placed successfully! Please drop off your laundry at our office. Delivery will be arranged.';
        } else if (serviceOption === 'self-delivery') {
          successMessage = 'Order placed successfully! We will pick up your laundry. You can pick up from our office when ready.';
        } else {
          successMessage = 'Order placed successfully! Expect pickup within 12-24 hours.';
        }
        
        Alert.alert(
          'Success', 
          successMessage,
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
      Alert.alert('Error', error.message || 'Network error. Please try again.');
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
    setServiceOption('delivery');
    setBypassMinOrder(false);
    setSearchTerm('');
    setShowCart(false);
    setOrderInstructions('');
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

  // Render item instructions modal
  const renderInstructionsModal = useCallback(() => (
    <Modal
      visible={instructionsModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setInstructionsModal(false)}
    >
      <View style={tw`flex-1 bg-black/50 justify-end`}>
        <View style={tw`bg-white rounded-t-3xl`}>
          <View style={tw`items-center pt-2`}>
            <View style={tw`w-12 h-1 bg-gray-300 rounded-full`} />
          </View>
          
          <View style={tw`p-4`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-xl font-bold text-[${COLORS.text.primary}]`}>
                Special Instructions
              </Text>
              <TouchableOpacity onPress={() => setInstructionsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>

            {selectedItemForInstructions && (
              <Text style={tw`text-[${COLORS.gold}] font-medium mb-2`}>
                For: {selectedItemForInstructions.description}
              </Text>
            )}

            <TextInput
              style={tw`bg-[${COLORS.surface}] p-4 rounded-xl border border-[${COLORS.border}] text-[${COLORS.text.primary}] mb-3 min-h-[100px]`}
              placeholder="E.g., No starch, Extra soft, Hand wash only, etc."
              placeholderTextColor={COLORS.text.light}
              value={itemInstructions}
              onChangeText={setItemInstructions}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Common Instructions Toggle */}
            <TouchableOpacity
              style={tw`flex-row items-center mb-3`}
              onPress={() => setShowCommonInstructions(!showCommonInstructions)}
            >
              <Ionicons 
                name={showCommonInstructions ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={COLORS.gold} 
              />
              <Text style={tw`text-[${COLORS.gold}] font-medium ml-2`}>
                Common Instructions
              </Text>
            </TouchableOpacity>

            {/* Common Instructions List */}
            {showCommonInstructions && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={tw`mb-4`}
              >
                <View style={tw`flex-row`}>
                  {COMMON_INSTRUCTIONS.map((instruction, index) => (
                    <TouchableOpacity
                      key={index}
                      style={tw`bg-[${COLORS.surface}] px-3 py-2 rounded-full mr-2 border border-[${COLORS.border}]`}
                      onPress={() => handleSelectCommonInstruction(instruction)}
                    >
                      <Text style={tw`text-[${COLORS.text.primary}] text-sm`}>
                        {instruction}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            <View style={tw`flex-row mt-4`}>
              <TouchableOpacity
                style={tw`flex-1 bg-[${COLORS.surface}] py-3 rounded-xl mr-2 border border-[${COLORS.border}]`}
                onPress={() => {
                  setInstructionsModal(false);
                  setItemInstructions('');
                  setShowCommonInstructions(false);
                }}
              >
                <Text style={tw`text-[${COLORS.text.primary}] text-center font-medium`}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={tw`flex-1 bg-[${COLORS.gold}] py-3 rounded-xl ml-2`}
                onPress={() => {
                  handleSaveInstructions();
                  setShowCommonInstructions(false);
                }}
              >
                <Text style={tw`text-white text-center font-bold`}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  ), [instructionsModal, selectedItemForInstructions, itemInstructions, showCommonInstructions]);

  // Render order instructions modal
  const renderOrderInstructionsModal = useCallback(() => (
    <Modal
      visible={orderInstructionsModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setOrderInstructionsModal(false)}
    >
      <View style={tw`flex-1 bg-black/50 justify-end`}>
        <View style={tw`bg-white rounded-t-3xl`}>
          <View style={tw`items-center pt-2`}>
            <View style={tw`w-12 h-1 bg-gray-300 rounded-full`} />
          </View>
          
          <View style={tw`p-4`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-xl font-bold text-[${COLORS.text.primary}]`}>
                Order Instructions
              </Text>
              <TouchableOpacity onPress={() => setOrderInstructionsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>

            <Text style={tw`text-[${COLORS.text.secondary}] mb-2`}>
              Add any general instructions for your entire order
            </Text>

            <TextInput
              style={tw`bg-[${COLORS.surface}] p-4 rounded-xl border border-[${COLORS.border}] text-[${COLORS.text.primary}] mb-4 min-h-[120px]`}
              placeholder="E.g., Please call before pickup, Leave at doorstep, etc."
              placeholderTextColor={COLORS.text.light}
              value={orderInstructions}
              onChangeText={setOrderInstructions}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <View style={tw`flex-row mt-2`}>
              <TouchableOpacity
                style={tw`flex-1 bg-[${COLORS.surface}] py-3 rounded-xl mr-2 border border-[${COLORS.border}]`}
                onPress={() => setOrderInstructionsModal(false)}
              >
                <Text style={tw`text-[${COLORS.text.primary}] text-center font-medium`}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={tw`flex-1 bg-[${COLORS.gold}] py-3 rounded-xl ml-2`}
                onPress={() => setOrderInstructionsModal(false)}
              >
                <Text style={tw`text-white text-center font-bold`}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  ), [orderInstructionsModal, orderInstructions]);

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

  // Render cart sidebar
  const renderCartSidebar = useCallback(() => {
    const totalWithDelivery = calculateTotalWithDelivery();
    const isSufficient = isBalanceSufficient();
    const deficit = getBalanceDeficit();

    return (
      <Modal
        visible={showCart}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCart(false)}
      >
        <View style={tw`flex-1 bg-black/50`}>
          <View style={tw`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85%]`}>
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
                      <View style={tw`py-3 border-b border-[${COLORS.border}]`}>
                        <View style={tw`flex-row items-center`}>
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
                            
                            {/* Show instructions indicator */}
                            {item.instructions ? (
                              <View style={tw`flex-row items-center mt-1`}>
                                <Ionicons name="document-text" size={14} color={COLORS.gold} />
                                <Text style={tw`text-[${COLORS.gold}] text-xs ml-1`} numberOfLines={1}>
                                  {item.instructions}
                                </Text>
                              </View>
                            ) : null}
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
                        </View>

                        {/* Instructions button */}
                        <TouchableOpacity
                          style={tw`flex-row items-center mt-2 ml-15`}
                          onPress={() => handleAddInstructions(item)}
                        >
                          <Ionicons 
                            name={item.instructions ? "create" : "add-circle-outline"} 
                            size={18} 
                            color={item.instructions ? COLORS.gold : COLORS.text.secondary} 
                          />
                          <Text style={[
                            tw`ml-1 text-sm`,
                            item.instructions ? tw`text-[${COLORS.gold}]` : tw`text-[${COLORS.text.secondary}]`
                          ]}>
                            {item.instructions ? "Edit Instructions" : "Add Instructions"}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          onPress={() => handleItemRemoval(item.id)}
                          style={tw`absolute right-0 top-12`}
                        >
                          <MaterialCommunityIcons name="trash-can" size={20} color="red" />
                        </TouchableOpacity>
                      </View>
                    )}
                    style={tw`max-h-96`}
                    showsVerticalScrollIndicator={false}
                  />

                  {/* Order Instructions Button */}
                  <TouchableOpacity
                    style={tw`flex-row items-center justify-between mt-4 p-3 bg-[${COLORS.surface}] rounded-xl border border-[${COLORS.border}]`}
                    onPress={() => setOrderInstructionsModal(true)}
                  >
                    <View style={tw`flex-row items-center`}>
                      <Ionicons name="document-text-outline" size={22} color={COLORS.gold} />
                      <Text style={tw`text-[${COLORS.text.primary}] font-medium ml-2`}>
                        {orderInstructions ? "Edit Order Instructions" : "Add Order Instructions"}
                      </Text>
                    </View>
                    {orderInstructions ? (
                      <Ionicons name="checkmark-circle" size={22} color={COLORS.gold} />
                    ) : (
                      <Ionicons name="chevron-forward" size={22} color={COLORS.text.light} />
                    )}
                  </TouchableOpacity>

                  {orderInstructions ? (
                    <View style={tw`mt-2 p-2 bg-[${COLORS.surface}] rounded-lg`}>
                      <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>
                        {orderInstructions}
                      </Text>
                    </View>
                  ) : null}

                  <View style={tw`mt-4 pt-4 border-t border-[${COLORS.border}]`}>
                    <View style={tw`flex-row justify-between mb-2`}>
                      <Text style={tw`text-[${COLORS.text.secondary}]`}>Subtotal</Text>
                      <Text style={tw`text-[${COLORS.text.primary}] font-bold`}>
                        ₦{grandTotal.toLocaleString()}
                      </Text>
                    </View>
                    
                    {(pickupLocation || deliveryLocation) && calculateTotalDeliveryFee() > 0 && (
                      <View style={tw`flex-row justify-between mb-2`}>
                        <Text style={tw`text-[${COLORS.text.secondary}]`}>Service Fee</Text>
                        <Text style={tw`text-[${COLORS.text.primary}] font-bold`}>
                          ₦{calculateTotalDeliveryFee().toLocaleString()}
                        </Text>
                      </View>
                    )}
                    
                    <View style={tw`flex-row justify-between mb-2`}>
                      <Text style={tw`text-[${COLORS.text.primary}] font-bold`}>Total</Text>
                      <Text style={tw`text-[${COLORS.gold}] text-xl font-bold`}>
                        ₦{totalWithDelivery.toLocaleString()}
                      </Text>
                    </View>

                    {/* Balance check warning */}
                    {!isSufficient && (
                      <View style={tw`bg-red-50 p-3 rounded-lg mt-2`}>
                        <View style={tw`flex-row items-center`}>
                          <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                          <Text style={tw`text-red-600 font-medium ml-2`}>Insufficient Balance</Text>
                        </View>
                        <Text style={tw`text-red-500 text-xs mt-1`}>
                          Total: ₦{totalWithDelivery.toLocaleString()} | 
                          Balance: ₦{alsUsableAmt.toLocaleString()}
                        </Text>
                        <Text style={tw`text-red-500 text-xs mt-1`}>
                          Please add ₦{deficit.toLocaleString()} more
                        </Text>
                      </View>
                    )}
                    
                    {/* Available balance display */}
                    <View style={tw`bg-[${COLORS.surface}] p-3 rounded-lg mt-2`}>
                      <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>
                        Available Balance: ₦{alsUsableAmt.toLocaleString()}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={tw`bg-[${COLORS.gold}] py-3 rounded-xl items-center mt-4 ${
                        !isSufficient ? 'opacity-50' : ''
                      }`}
                      onPress={() => {
                        setShowCart(false);
                        handleProceedToLocation();
                      }}
                      disabled={!isSufficient}
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
    );
  }, [showCart, selectedItems, grandTotal, pickupLocation, deliveryLocation, orderInstructions, alsUsableAmt, calculateTotalDeliveryFee, calculateTotalWithDelivery, isBalanceSufficient, getBalanceDeficit]);

  // Render service option selector
  const renderServiceOptions = useCallback(() => (
    <View style={tw`px-4 py-3 bg-white border-b border-[${COLORS.border}]`}>
      <Text style={tw`text-[${COLORS.text.primary}] font-medium mb-2`}>Service Option</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={tw`flex-row`}>
          <TouchableOpacity
            style={[
              tw`px-4 py-3 rounded-lg mr-2 border min-w-[100px]`,
              serviceOption === 'delivery' 
                ? tw`bg-[${COLORS.gold}] border-[${COLORS.gold}]` 
                : tw`bg-white border-[${COLORS.border}]`
            ]}
            onPress={() => handleServiceOptionChange('delivery')}
          >
            <Text style={[
              tw`text-center font-medium`,
              serviceOption === 'delivery' ? tw`text-white` : tw`text-[${COLORS.text.primary}]`
            ]}>
              Full Delivery
            </Text>
            <Text style={[
              tw`text-center text-xs mt-1`,
              serviceOption === 'delivery' ? tw`text-white/80` : tw`text-[${COLORS.text.light}]`
            ]}>
              We pick & deliver
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              tw`px-4 py-3 rounded-lg mr-2 border min-w-[100px]`,
              serviceOption === 'self-pickup' 
                ? tw`bg-[${COLORS.gold}] border-[${COLORS.gold}]` 
                : tw`bg-white border-[${COLORS.border}]`
            ]}
            onPress={() => handleServiceOptionChange('self-pickup')}
          >
            <Text style={[
              tw`text-center font-medium`,
              serviceOption === 'self-pickup' ? tw`text-white` : tw`text-[${COLORS.text.primary}]`
            ]}>
              Self Pickup
            </Text>
            <Text style={[
              tw`text-center text-xs mt-1`,
              serviceOption === 'self-pickup' ? tw`text-white/80` : tw`text-[${COLORS.text.light}]`
            ]}>
              You drop, we deliver
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              tw`px-4 py-3 rounded-lg mr-2 border min-w-[100px]`,
              serviceOption === 'self-delivery' 
                ? tw`bg-[${COLORS.gold}] border-[${COLORS.gold}]` 
                : tw`bg-white border-[${COLORS.border}]`
            ]}
            onPress={() => handleServiceOptionChange('self-delivery')}
          >
            <Text style={[
              tw`text-center font-medium`,
              serviceOption === 'self-delivery' ? tw`text-white` : tw`text-[${COLORS.text.primary}]`
            ]}>
              Self Delivery
            </Text>
            <Text style={[
              tw`text-center text-xs mt-1`,
              serviceOption === 'self-delivery' ? tw`text-white/80` : tw`text-[${COLORS.text.light}]`
            ]}>
              We pick, you collect
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              tw`px-4 py-3 rounded-lg border min-w-[100px]`,
              serviceOption === 'full-self' 
                ? tw`bg-[${COLORS.gold}] border-[${COLORS.gold}]` 
                : tw`bg-white border-[${COLORS.border}]`
            ]}
            onPress={() => handleServiceOptionChange('full-self')}
          >
            <Text style={[
              tw`text-center font-medium`,
              serviceOption === 'full-self' ? tw`text-white` : tw`text-[${COLORS.text.primary}]`
            ]}>
              Full Self
            </Text>
            <Text style={[
              tw`text-center text-xs mt-1`,
              serviceOption === 'full-self' ? tw`text-white/80` : tw`text-[${COLORS.text.light}]`
            ]}>
              You pick & deliver
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Info message for bypassing minimum order */}
      {bypassMinOrder && (
        <View style={tw`mt-3 p-2 bg-green-100 rounded-lg`}>
          <Text style={tw`text-green-700 text-xs text-center`}>
            Minimum order of ₦2,000 is waived for self-service options
          </Text>
        </View>
      )}
    </View>
  ), [serviceOption, bypassMinOrder]);

  const renderLocationStep = useCallback(() => {
    const totalWithDelivery = calculateTotalWithDelivery();
    const isSufficient = isBalanceSufficient();

    return (
      <View style={tw`flex-1 bg-white`}>
        <View style={tw`bg-[${COLORS.gold}] p-4`}>
          <TouchableOpacity onPress={() => setStep(1)} style={tw`mb-2`}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={tw`text-white text-xl font-bold`}>
            {serviceOption === 'full-self' ? 'Office Location' : 'Delivery Locations'}
          </Text>
          <Text style={tw`text-white/80 text-sm mt-1`}>Step 2 of 3</Text>
        </View>

        {/* Balance Summary at top */}
        <View style={tw`px-4 py-2 bg-yellow-50 border-b border-yellow-200`}>
          <View style={tw`flex-row justify-between items-center`}>
            <Text style={tw`text-[${COLORS.text.secondary}]`}>Total Cost:</Text>
            <Text style={tw`text-[${COLORS.gold}] font-bold`}>₦{totalWithDelivery.toLocaleString()}</Text>
          </View>
          <View style={tw`flex-row justify-between items-center mt-1`}>
            <Text style={tw`text-[${COLORS.text.secondary}]`}>Your Balance:</Text>
            <Text style={tw`${isSufficient ? 'text-green-600' : 'text-red-600'} font-bold`}>
              ₦{alsUsableAmt.toLocaleString()}
            </Text>
          </View>
          {!isSufficient && (
            <View style={tw`mt-2 p-2 bg-red-100 rounded-lg`}>
              <Text style={tw`text-red-600 text-xs text-center`}>
                Insufficient balance. Please add ₦{getBalanceDeficit().toLocaleString()} more.
              </Text>
            </View>
          )}
        </View>

        {/* Service Options at the top of location step */}
        {renderServiceOptions()}

        <ScrollView style={tw`p-4`} showsVerticalScrollIndicator={false}>
          {/* Company Office Info - Always show this */}
          <View style={tw`bg-[${COLORS.surface}] p-4 rounded-xl border border-[${COLORS.border}] mb-4`}>
            <View style={tw`flex-row items-center mb-2`}>
              <Ionicons name="business" size={20} color={COLORS.gold} />
              <Text style={tw`text-[${COLORS.text.primary}] font-medium ml-2`}>Our Office</Text>
            </View>
            <Text style={tw`text-[${COLORS.text.secondary}] text-sm`}>{COMPANY_OFFICE.address}</Text>
          </View>

          {/* For full-self option, we only show office info */}
          {serviceOption === 'full-self' ? (
            <View style={tw`bg-[${COLORS.surface}] p-4 rounded-xl border border-[${COLORS.border}] mb-6`}>
              <View style={tw`flex-row items-center mb-2`}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.gold} />
                <Text style={tw`text-[${COLORS.text.primary}] font-medium ml-2`}>Fully Self-Service</Text>
              </View>
              <Text style={tw`text-[${COLORS.text.secondary}] text-sm mb-2`}>
                You will handle both pickup and delivery yourself.
              </Text>
              <Text style={tw`text-[${COLORS.text.secondary}] text-sm`}>
                Please visit our office address above to drop off and collect your laundry.
              </Text>
            </View>
          ) : (
            <>
              {/* Same Location Toggle - Only show for full delivery */}
              {serviceOption === 'delivery' && (
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
              )}

              {/* Pickup Location - Show for full delivery and self-delivery */}
              {(serviceOption === 'delivery' || serviceOption === 'self-delivery') && (
                <TouchableOpacity
                  style={tw`bg-[${COLORS.surface}] p-4 rounded-xl border border-[${COLORS.border}] mb-4`}
                  onPress={() => {
                    console.log('Opening pickup modal'); // Debug log
                    setLocationSearchType('pickup');
                    setLocationSearchModal(true);
                  }}
                >
                  <Text style={tw`text-[${COLORS.text.light}] text-xs mb-1`}>
                    {serviceOption === 'self-delivery' ? 'PICKUP LOCATION (WE WILL COLLECT FROM)' : 'PICKUP LOCATION'}
                  </Text>
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
              )}

              {/* Delivery Location - Show for full delivery and self-pickup */}
              {(serviceOption === 'delivery' || serviceOption === 'self-pickup') && (
                <TouchableOpacity
                  style={tw`bg-[${COLORS.surface}] p-4 rounded-xl border border-[${COLORS.border}] ${serviceOption === 'delivery' && !useSameLocation ? 'mb-6' : 'mb-6'}`}
                  onPress={() => {
                    console.log('Opening delivery modal'); // Debug log
                    setLocationSearchType('delivery');
                    setLocationSearchModal(true);
                  }}
                >
                  <Text style={tw`text-[${COLORS.text.light}] text-xs mb-1`}>
                    {serviceOption === 'self-pickup' ? 'DELIVERY LOCATION (WE WILL DELIVER TO)' : 'DELIVERY LOCATION'}
                  </Text>
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

              {/* Show message for self-pickup */}
              {serviceOption === 'self-pickup' && (
                <View style={tw`bg-[${COLORS.surface}] p-4 rounded-xl border border-[${COLORS.border}] mb-4`}>
                  <View style={tw`flex-row items-center mb-2`}>
                    <Ionicons name="information-circle" size={20} color={COLORS.gold} />
                    <Text style={tw`text-[${COLORS.text.primary}] font-medium ml-2`}>Self-Pickup Instructions</Text>
                  </View>
                  <Text style={tw`text-[${COLORS.text.secondary}] text-sm`}>
                    Please drop off your laundry at our office address above. We will deliver to your delivery location when ready.
                  </Text>
                </View>
              )}

              {/* Show message for self-delivery */}
              {serviceOption === 'self-delivery' && (
                <View style={tw`bg-[${COLORS.surface}] p-4 rounded-xl border border-[${COLORS.border}] mb-4`}>
                  <View style={tw`flex-row items-center mb-2`}>
                    <Ionicons name="information-circle" size={20} color={COLORS.gold} />
                    <Text style={tw`text-[${COLORS.text.primary}] font-medium ml-2`}>Self-Delivery Instructions</Text>
                  </View>
                  <Text style={tw`text-[${COLORS.text.secondary}] text-sm`}>
                    We will pick up your laundry from your pickup location. You can collect it from our office when ready.
                  </Text>
                </View>
              )}

              {/* Total Delivery Fee Preview - Only if there are fees */}
              {calculateTotalDeliveryFee() > 0 && (
                <View style={tw`bg-[${COLORS.surface}] p-4 rounded-xl border border-[${COLORS.border}] mb-6`}>
                  <Text style={tw`text-[${COLORS.text.primary}] font-medium mb-2`}>Total Service Fee</Text>
                  <View style={tw`flex-row justify-between items-center`}>
                    <View>
                      {serviceOption === 'delivery' && pickupLocation && (
                        <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>
                          Pickup: ₦{pickupLocation.deliveryFee}
                        </Text>
                      )}
                      {serviceOption === 'delivery' && deliveryLocation && (
                        <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>
                          Delivery: ₦{deliveryLocation.deliveryFee}
                        </Text>
                      )}
                      {serviceOption === 'self-pickup' && deliveryLocation && (
                        <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>
                          Delivery Fee: ₦{deliveryLocation.deliveryFee}
                        </Text>
                      )}
                      {serviceOption === 'self-delivery' && pickupLocation && (
                        <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>
                          Pickup Fee: ₦{pickupLocation.deliveryFee}
                        </Text>
                      )}
                      <Text style={tw`text-[${COLORS.text.secondary}] text-xs mt-1`}>
                        Base fee: ₦{BASE_DELIVERY_FEE} included
                      </Text>
                    </View>
                    <Text style={tw`text-[${COLORS.gold}] font-bold text-xl`}>
                      ₦{calculateTotalDeliveryFee().toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}
            </>
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
              style={tw`flex-1 bg-[${COLORS.gold}] py-3 rounded-xl ml-2 ${
                (serviceOption === 'delivery' && (!pickupLocation || !deliveryLocation)) ||
                (serviceOption === 'self-pickup' && !deliveryLocation) ||
                (serviceOption === 'self-delivery' && !pickupLocation) ||
                !isSufficient ? 'opacity-50' : ''
              }`}
              onPress={handleProceedToReview}
              disabled={
                (serviceOption === 'delivery' && (!pickupLocation || !deliveryLocation)) ||
                (serviceOption === 'self-pickup' && !deliveryLocation) ||
                (serviceOption === 'self-delivery' && !pickupLocation) ||
                !isSufficient
              }
            >
              <Text style={tw`text-white text-center font-bold`}>
                {!isSufficient 
                  ? 'Insufficient Balance' 
                  : serviceOption === 'full-self' 
                    ? 'Continue' 
                    : ((serviceOption === 'delivery' && (!pickupLocation || !deliveryLocation)) ||
                       (serviceOption === 'self-pickup' && !deliveryLocation) ||
                       (serviceOption === 'self-delivery' && !pickupLocation)) 
                      ? 'Select Locations' 
                      : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Render modals */}
        {renderLocationSearchModal()}
        {renderInstructionsModal()}
        {renderOrderInstructionsModal()}
      </View>
    );
  }, [step, pickupLocation, deliveryLocation, useSameLocation, locationSearchModal, serviceOption, bypassMinOrder, alsUsableAmt, renderLocationSearchModal, renderInstructionsModal, renderOrderInstructionsModal, renderServiceOptions, calculateTotalWithDelivery, isBalanceSufficient, getBalanceDeficit]);

  const renderReviewStep = useCallback(() => {
    const totalWithDelivery = calculateTotalWithDelivery();
    const isSufficient = isBalanceSufficient();
    const deficit = getBalanceDeficit();

    return (
      <View style={tw`flex-1 bg-white`}>
        <View style={tw`bg-[${COLORS.gold}] p-4`}>
          <TouchableOpacity onPress={() => setStep(2)} style={tw`mb-2`}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={tw`text-white text-xl font-bold`}>Review Order</Text>
          <Text style={tw`text-white/80 text-sm mt-1`}>Step 3 of 3</Text>
        </View>

        <ScrollView style={tw`p-4`} showsVerticalScrollIndicator={false}>
          {/* Balance Summary */}
          <View style={tw`bg-[${isSufficient ? COLORS.success : COLORS.error}]/10 p-4 rounded-xl border border-[${isSufficient ? COLORS.success : COLORS.error}]/30 mb-4`}>
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <Text style={tw`text-[${COLORS.text.primary}] font-medium`}>Total Order Cost</Text>
              <Text style={tw`text-[${COLORS.gold}] font-bold text-lg`}>₦{totalWithDelivery.toLocaleString()}</Text>
            </View>
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <Text style={tw`text-[${COLORS.text.primary}] font-medium`}>Your Balance</Text>
              <Text style={tw`${isSufficient ? 'text-green-600' : 'text-red-600'} font-bold`}>
                ₦{alsUsableAmt.toLocaleString()}
              </Text>
            </View>
            {!isSufficient && (
              <View style={tw`mt-2 p-3 bg-red-100 rounded-lg`}>
                <Text style={tw`text-red-600 text-sm font-medium text-center`}>
                  ⚠️ Insufficient Balance
                </Text>
                <Text style={tw`text-red-600 text-xs text-center mt-1`}>
                  You need ₦{deficit.toLocaleString()} more to place this order
                </Text>
              </View>
            )}
          </View>

          {/* Service Option Summary */}
          <View style={tw`bg-[${COLORS.surface}] rounded-xl border border-[${COLORS.border}] p-4 mb-4`}>
            <Text style={tw`text-[${COLORS.text.primary}] font-bold mb-2`}>Service Option</Text>
            <View style={tw`flex-row items-center`}>
              <Ionicons 
                name={
                  serviceOption === 'delivery' ? 'car' : 
                  serviceOption === 'self-pickup' ? 'arrow-down' : 
                  serviceOption === 'self-delivery' ? 'arrow-up' : 'person'
                } 
                size={20} 
                color={COLORS.gold} 
              />
              <Text style={tw`text-[${COLORS.text.primary}] ml-2 font-medium`}>
                {serviceOption === 'delivery' ? 'Full Delivery' : 
                 serviceOption === 'self-pickup' ? 'Self Pickup (Drop at Office)' : 
                 serviceOption === 'self-delivery' ? 'Self Delivery (Pick from Office)' :
                 'Full Self-Service (You handle both)'}
              </Text>
            </View>
            {bypassMinOrder && (
              <View style={tw`mt-2 p-2 bg-green-100 rounded-lg`}>
                <Text style={tw`text-green-700 text-xs`}>
                  Minimum order waived for this service option
                </Text>
              </View>
            )}
          </View>

          {/* Items Summary with Instructions */}
          <View style={tw`bg-[${COLORS.surface}] rounded-xl border border-[${COLORS.border}] p-4 mb-4`}>
            <Text style={tw`text-[${COLORS.text.primary}] font-bold mb-3`}>Items ({selectedItems.length})</Text>
            {selectedItems.map((item) => (
              <View key={item.id} style={tw`mb-3 pb-3 border-b border-[${COLORS.border}]`}>
                <View style={tw`flex-row justify-between items-center`}>
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
                
                {/* Show item instructions if any */}
                {item.instructions && (
                  <View style={tw`mt-2 ml-10 p-2 bg-white rounded-lg`}>
                    <View style={tw`flex-row items-center`}>
                      <Ionicons name="document-text" size={14} color={COLORS.gold} />
                      <Text style={tw`text-[${COLORS.text.secondary}] text-xs ml-1 font-medium`}>
                        Instructions:
                      </Text>
                    </View>
                    <Text style={tw`text-[${COLORS.text.primary}] text-sm mt-1`}>
                      {item.instructions}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Order Instructions Summary */}
          {orderInstructions && (
            <View style={tw`bg-[${COLORS.surface}] rounded-xl border border-[${COLORS.border}] p-4 mb-4`}>
              <View style={tw`flex-row items-center mb-2`}>
                <Ionicons name="document-text-outline" size={18} color={COLORS.gold} />
                <Text style={tw`text-[${COLORS.text.primary}] font-bold ml-2`}>Order Instructions</Text>
              </View>
              <Text style={tw`text-[${COLORS.text.secondary}] text-sm`}>
                {orderInstructions}
              </Text>
            </View>
          )}

          {/* Location Summary */}
          <View style={tw`bg-[${COLORS.surface}] rounded-xl border border-[${COLORS.border}] p-4 mb-4`}>
            <Text style={tw`text-[${COLORS.text.primary}] font-bold mb-3`}>
              {serviceOption === 'full-self' ? 'Office Information' : 'Location Details'}
            </Text>
            
            {/* Show office location for all options */}
            <View style={tw`mb-3`}>
              <Text style={tw`text-[${COLORS.text.light}] text-xs mb-1`}>OUR OFFICE</Text>
              <Text style={tw`text-[${COLORS.text.primary}]`}>{COMPANY_OFFICE.address}</Text>
            </View>

            {/* Show pickup location if applicable */}
            {(serviceOption === 'delivery' || serviceOption === 'self-delivery') && pickupLocation && (
              <View style={tw`mb-3`}>
                <Text style={tw`text-[${COLORS.text.light}] text-xs mb-1`}>
                  {serviceOption === 'self-delivery' ? 'PICKUP (WE WILL COLLECT FROM)' : 'PICKUP'}
                </Text>
                <Text style={tw`text-[${COLORS.text.primary}]`}>{pickupLocation.address}</Text>
                <View style={tw`flex-row justify-between mt-1`}>
                  <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>
                    {pickupLocation.distanceFromOffice}km from office
                  </Text>
                  <Text style={tw`text-[${COLORS.gold}] text-sm`}>₦{pickupLocation.deliveryFee}</Text>
                </View>
              </View>
            )}
            
            {/* Show delivery location if applicable */}
            {(serviceOption === 'delivery' || serviceOption === 'self-pickup') && deliveryLocation && (
              <View>
                <Text style={tw`text-[${COLORS.text.light}] text-xs mb-1`}>
                  {serviceOption === 'self-pickup' ? 'DELIVERY (WE WILL DELIVER TO)' : 'DELIVERY'}
                </Text>
                <Text style={tw`text-[${COLORS.text.primary}]`}>{deliveryLocation.address}</Text>
                <View style={tw`flex-row justify-between mt-1`}>
                  <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>
                    {deliveryLocation.distanceFromOffice}km from office
                  </Text>
                  <Text style={tw`text-[${COLORS.gold}] text-sm`}>₦{deliveryLocation.deliveryFee}</Text>
                </View>
              </View>
            )}

            {serviceOption === 'delivery' && useSameLocation && pickupLocation && (
              <View style={tw`mt-2 pt-2 border-t border-[${COLORS.border}]`}>
                <Text style={tw`text-[${COLORS.text.secondary}] text-xs text-center`}>
                  Same location used for both pickup and delivery
                </Text>
              </View>
            )}

            {/* Special instructions for full-self */}
            {serviceOption === 'full-self' && (
              <View style={tw`mt-3 pt-3 border-t border-[${COLORS.border}]`}>
                <View style={tw`flex-row items-center`}>
                  <Ionicons name="information-circle" size={16} color={COLORS.gold} />
                  <Text style={tw`text-[${COLORS.text.primary}] text-sm ml-1 font-medium`}>Instructions</Text>
                </View>
                <Text style={tw`text-[${COLORS.text.secondary}] text-xs mt-1`}>
                  Please drop off your laundry at our office and pick up when ready. No delivery service included.
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
            
            {/* Show delivery fee breakdown based on service option */}
            {calculateTotalDeliveryFee() > 0 ? (
              <>
                {serviceOption === 'delivery' && pickupLocation && (
                  <View style={tw`flex-row justify-between mb-2`}>
                    <Text style={tw`text-[${COLORS.text.secondary}]`}>Pickup Fee</Text>
                    <Text style={tw`text-[${COLORS.text.primary}]`}>₦{pickupLocation.deliveryFee.toLocaleString()}</Text>
                  </View>
                )}
                
                {serviceOption === 'delivery' && deliveryLocation && (
                  <View style={tw`flex-row justify-between mb-2`}>
                    <Text style={tw`text-[${COLORS.text.secondary}]`}>Delivery Fee</Text>
                    <Text style={tw`text-[${COLORS.text.primary}]`}>₦{deliveryLocation.deliveryFee.toLocaleString()}</Text>
                  </View>
                )}

                {serviceOption === 'self-pickup' && deliveryLocation && (
                  <View style={tw`flex-row justify-between mb-2`}>
                    <Text style={tw`text-[${COLORS.text.secondary}]`}>Delivery Fee</Text>
                    <Text style={tw`text-[${COLORS.text.primary}]`}>₦{deliveryLocation.deliveryFee.toLocaleString()}</Text>
                  </View>
                )}

                {serviceOption === 'self-delivery' && pickupLocation && (
                  <View style={tw`flex-row justify-between mb-2`}>
                    <Text style={tw`text-[${COLORS.text.secondary}]`}>Pickup Fee</Text>
                    <Text style={tw`text-[${COLORS.text.primary}]`}>₦{pickupLocation.deliveryFee.toLocaleString()}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={tw`flex-row justify-between mb-2`}>
                <Text style={tw`text-[${COLORS.text.secondary}]`}>Service Fee</Text>
                <Text style={tw`text-[${COLORS.text.primary}]`}>₦0 (Self Service)</Text>
              </View>
            )}
            
            <View style={tw`border-t border-[${COLORS.border}] my-2 pt-2`}>
              <View style={tw`flex-row justify-between`}>
                <Text style={tw`text-[${COLORS.text.primary}] font-bold`}>Total</Text>
                <Text style={tw`text-[${COLORS.gold}] text-xl font-bold`}>
                  ₦{totalWithDelivery.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Final balance check warning */}
            {!isSufficient && (
              <View style={tw`mt-3 p-3 bg-red-50 rounded-lg border border-red-200`}>
                <View style={tw`flex-row items-center mb-1`}>
                  <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                  <Text style={tw`text-red-600 font-medium ml-2`}>Cannot Place Order</Text>
                </View>
                <Text style={tw`text-red-500 text-sm`}>
                  Your balance of ₦{alsUsableAmt.toLocaleString()} is insufficient for this order.
                </Text>
                <Text style={tw`text-red-500 text-sm font-medium mt-1`}>
                  Please add ₦{deficit.toLocaleString()} to your wallet.
                </Text>
              </View>
            )}
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
              style={tw`flex-1 bg-[${COLORS.gold}] py-3 rounded-xl ml-2 ${
                !isSufficient || loading ? 'opacity-50' : ''
              }`}
              onPress={saveOrder}
              disabled={!isSufficient || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={tw`text-white text-center font-bold`}>
                  {!isSufficient ? 'Insufficient Balance' : 'Place Order'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }, [step, selectedItems, pickupLocation, deliveryLocation, useSameLocation, grandTotal, serviceOption, bypassMinOrder, orderInstructions, loading, alsUsableAmt, calculateTotalWithDelivery, isBalanceSufficient, getBalanceDeficit]);

  const renderComboBox = useCallback(() => {
    const totalWithDelivery = calculateTotalWithDelivery();
    const isSufficient = isBalanceSufficient();

    return (
      <View style={tw`flex-1 bg-white`}>
        {/* Header with proper spacing */}
        <View style={tw`bg-[${COLORS.gold}] p-4 pt-6`}>
          <Text style={tw`text-white text-xl font-bold`}>African Lagos Style</Text>
          <Text style={tw`text-white/80 text-sm mt-1`}>Step 1 of 3 - Select Items</Text>
        </View>

        {/* Balance display - moved to a dedicated row */}
        <View style={tw`flex-row justify-between items-center px-4 py-3 bg-yellow-50 border-b border-yellow-200`}>
          <View>
            <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>Available Balance</Text>
            <Text style={tw`text-[${COLORS.gold}] font-bold text-lg`}>₦{alsUsableAmt.toLocaleString()}</Text>
          </View>
          
          {selectedItems.length > 0 && (
            <View style={tw`items-end`}>
              <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>Current Total</Text>
              <Text style={tw`${isSufficient ? 'text-green-600' : 'text-red-600'} font-bold`}>
                ₦{totalWithDelivery.toLocaleString()}
              </Text>
            </View>
          )}
          
          {/* Cart button moved to header row instead of absolute positioning */}
          <TouchableOpacity
            style={tw`bg-[${COLORS.gold}] rounded-full h-10 w-10 items-center justify-center ml-2`}
            onPress={() => setShowCart(true)}
          >
            <Ionicons name="cart" size={20} color="white" />
            {selectedItems.length > 0 && (
              <View style={tw`absolute -top-1 -right-1 bg-red-500 rounded-full h-5 w-5 items-center justify-center`}>
                <Text style={tw`text-white text-xs font-bold`}>{selectedItems.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search bar */}
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

        {/* Categories */}
        {renderCategoryTabs()}

        {/* Items Grid */}
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
                  
                  {isSelected && (
                    <>
                      <View style={tw`absolute top-2 right-2 bg-[${COLORS.gold}] rounded-full h-6 w-6 items-center justify-center`}>
                        <Text style={tw`text-white text-xs font-bold`}>
                          {cartItem?.quantity}
                        </Text>
                      </View>
                      
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

                      {cartItem?.instructions && (
                        <View style={tw`mt-2 p-1 bg-[${COLORS.gold}]/10 rounded-lg`}>
                          <Text style={tw`text-[${COLORS.gold}] text-xs text-center`} numberOfLines={1}>
                            📝 {cartItem.instructions}
                          </Text>
                        </View>
                      )}
                    </>
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
                <View style={tw`px-4 pb-6`}>
                  {!isSufficient && (
                    <View style={tw`mb-3 p-3 bg-red-50 rounded-lg border border-red-200`}>
                      <View style={tw`flex-row items-center mb-1`}>
                        <Ionicons name="alert-circle" size={18} color={COLORS.error} />
                        <Text style={tw`text-red-600 font-medium ml-2 flex-1`} numberOfLines={1}>
                          Insufficient Balance
                        </Text>
                      </View>
                      <Text style={tw`text-red-500 text-xs`}>
                        Need ₦{getBalanceDeficit().toLocaleString()} more
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={tw`bg-[${COLORS.gold}] py-4 rounded-xl items-center shadow-lg ${
                      !isSufficient ? 'opacity-50' : ''
                    }`}
                    onPress={handleProceedToLocation}
                    disabled={!isSufficient}
                  >
                    <Text style={tw`text-white font-bold text-lg`}>
                      {!isSufficient 
                        ? 'Insufficient Balance' 
                        : `Proceed to Delivery • ₦${totalWithDelivery.toLocaleString()}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.gold]} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tw`pb-4`}
          />
        )}
        
        {/* Modals */}
        {renderInstructionsModal()}
        {renderOrderInstructionsModal()}
        {renderCartSidebar()}
      </View>
    );
  }, [loading, refreshing, filteredItems, selectedItems, grandTotal, alsUsableAmt, renderCategoryTabs, renderCartSidebar, renderInstructionsModal, renderOrderInstructionsModal, calculateTotalWithDelivery, isBalanceSufficient, getBalanceDeficit]);

  return (
    <Container className='p-0'>
      <View style={tw`h-auto min-h-[10%] bg-yellow-600`}>
        <TopBar 
          balance={balance} 
          handleScreenChange={handleScreenChange}
          onViewHistory={handleViewHistory}
          onGoHome={goHome} 
          customerName={customerName} // Make sure your TopBar accepts this prop
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
            orderInstructions={orderData.orderInstructions}
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