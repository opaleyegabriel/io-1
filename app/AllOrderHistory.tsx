import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert,
  SectionList,
} from 'react-native';
import tw from 'twrnc';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

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
  info: '#3B82F6',
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusColor = (status) => {
  const statusMap = {
    'pending': COLORS.warning,
    'processing': COLORS.info,
    'completed': COLORS.success,
    'cancelled': COLORS.error,
    'delivered': COLORS.success,
    'picked': COLORS.success,
    'created': COLORS.info,
  };
  return statusMap[status?.toLowerCase()] || COLORS.text.secondary;
};

// ALS Order History Component
const ALSOrderHistory = ({ orders, onRefresh, refreshing }) => {
  const [expandedOrder, setExpandedOrder] = useState(null);

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const renderItem = ({ item }) => {
    const isExpanded = expandedOrder === item.orderId;
    const grandTotal = item.items?.reduce((total, itm) => total + (itm.qty * itm.price), 0) || 0;
    const statusColor = getStatusColor(item.status);

    return (
      <View style={tw`bg-white rounded-xl mb-3 overflow-hidden border border-[${COLORS.border}]`}>
        {/* Order Header */}
        <TouchableOpacity
          onPress={() => toggleExpand(item.orderId)}
          style={tw`p-4 flex-row justify-between items-center bg-[${COLORS.surface}]`}
        >
          <View style={tw`flex-1`}>
            <View style={tw`flex-row items-center mb-1`}>
              <Text style={tw`text-[${COLORS.text.primary}] font-bold text-base`}>
                Order #{item.orderNo || item.orderId}
              </Text>
              <View style={[tw`ml-2 px-2 py-0.5 rounded-full`, { backgroundColor: `${statusColor}20` }]}>
                <Text style={[tw`text-xs font-medium`, { color: statusColor }]}>
                  {item.status || 'Pending'}
                </Text>
              </View>
            </View>
            <Text style={tw`text-[${COLORS.text.light}] text-xs mb-1`}>
              {formatDate(item.date)}
            </Text>
            <Text style={tw`text-[${COLORS.gold}] font-bold text-base`}>
              {formatCurrency(item.amount || grandTotal)}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={COLORS.text.secondary}
          />
        </TouchableOpacity>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={tw`p-4 border-t border-[${COLORS.border}]`}>
            {/* Items Table */}
            <View style={tw`bg-[${COLORS.surface}] rounded-lg p-3 mb-3`}>
              <View style={tw`flex-row border-b border-[${COLORS.border}] pb-2 mb-2`}>
                <Text style={[tw`flex-[0.5] text-[${COLORS.text.secondary}] text-xs font-medium`]}>#</Text>
                <Text style={[tw`flex-[3] text-[${COLORS.text.secondary}] text-xs font-medium`]}>Item</Text>
                <Text style={[tw`flex-[1] text-[${COLORS.text.secondary}] text-xs font-medium text-right`]}>Qty</Text>
                <Text style={[tw`flex-[1.5] text-[${COLORS.text.secondary}] text-xs font-medium text-right`]}>Price</Text>
                <Text style={[tw`flex-[1.5] text-[${COLORS.text.secondary}] text-xs font-medium text-right`]}>Total</Text>
              </View>
              {item.items?.map((itm, idx) => (
                <View key={idx} style={tw`flex-row mb-2`}>
                  <Text style={[tw`flex-[0.5] text-[${COLORS.text.primary}] text-xs`]}>{idx + 1}</Text>
                  <Text style={[tw`flex-[3] text-[${COLORS.text.primary}] text-xs`]} numberOfLines={1}>
                    {itm.description}
                  </Text>
                  <Text style={[tw`flex-[1] text-[${COLORS.text.primary}] text-xs text-right`]}>{itm.qty}</Text>
                  <Text style={[tw`flex-[1.5] text-[${COLORS.text.primary}] text-xs text-right`]}>
                    {formatCurrency(itm.price)}
                  </Text>
                  <Text style={[tw`flex-[1.5] text-[${COLORS.gold}] text-xs text-right font-medium`]}>
                    {formatCurrency(itm.qty * itm.price)}
                  </Text>
                </View>
              ))}
              <View style={tw`flex-row justify-end mt-3 pt-2 border-t border-[${COLORS.border}]`}>
                <Text style={tw`text-[${COLORS.text.primary}] font-bold text-sm mr-4`}>Grand Total:</Text>
                <Text style={tw`text-[${COLORS.gold}] font-bold text-base`}>
                  {formatCurrency(grandTotal)}
                </Text>
              </View>
            </View>

            {/* Delivery Info */}
            {item.pickup_address || item.delivery_address ? (
              <View style={tw`bg-[${COLORS.surface}] rounded-lg p-3`}>
                <Text style={tw`text-[${COLORS.text.primary}] font-medium text-sm mb-2`}>Delivery Details</Text>
                {item.pickup_address && (
                  <View style={tw`flex-row items-start mb-2`}>
                    <Ionicons name="location" size={16} color={COLORS.gold} style={tw`mt-0.5`} />
                    <Text style={tw`flex-1 text-[${COLORS.text.secondary}] text-xs ml-2`}>
                      Pickup: {item.pickup_address}
                    </Text>
                  </View>
                )}
                {item.delivery_address && (
                  <View style={tw`flex-row items-start`}>
                    <Ionicons name="location" size={16} color={COLORS.error} style={tw`mt-0.5`} />
                    <Text style={tw`flex-1 text-[${COLORS.text.secondary}] text-xs ml-2`}>
                      Delivery: {item.delivery_address}
                    </Text>
                  </View>
                )}
              </View>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={orders}
      renderItem={renderItem}
      keyExtractor={(item) => item.orderId?.toString() || Math.random().toString()}
      contentContainerStyle={tw`p-4 pb-8`}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.gold]} />
      }
      ListEmptyComponent={
        <View style={tw`items-center justify-center py-10`}>
          <Ionicons name="cart-outline" size={64} color={COLORS.text.light} />
          <Text style={tw`text-[${COLORS.text.light}] text-center mt-4`}>
            No laundry orders found
          </Text>
        </View>
      }
    />
  );
};

// Rider Order History Component
const RiderOrderHistory = ({ orders, onRefresh, refreshing }) => {
  const [expandedOrder, setExpandedOrder] = useState(null);

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const renderItem = ({ item }) => {
    const isExpanded = expandedOrder === item.orderId;
    const statusColor = getStatusColor(item.status);

    return (
      <View style={tw`bg-white rounded-xl mb-3 overflow-hidden border border-[${COLORS.border}]`}>
        {/* Order Header */}
        <TouchableOpacity
          onPress={() => toggleExpand(item.orderId)}
          style={tw`p-4 bg-[${COLORS.surface}]`}
        >
          <View style={tw`flex-row justify-between items-start mb-2`}>
            <View>
              <Text style={tw`text-[${COLORS.text.primary}] font-bold text-base`}>
                Ride #{item.orderNo || item.orderId}
              </Text>
              <Text style={tw`text-[${COLORS.text.light}] text-xs mt-1`}>
                {formatDate(item.date)}
              </Text>
            </View>
            <View style={[tw`px-2 py-0.5 rounded-full`, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[tw`text-xs font-medium`, { color: statusColor }]}>
                {item.status || 'Completed'}
              </Text>
            </View>
          </View>

          {/* Trip Route Preview */}
          <View style={tw`flex-row items-center`}>
            <View style={tw`items-center mr-3`}>
              <View style={tw`w-2 h-2 rounded-full bg-[${COLORS.gold}]`} />
              <View style={tw`w-0.5 h-6 bg-[${COLORS.border}] my-1`} />
              <View style={tw`w-2 h-2 rounded-full bg-[${COLORS.error}]`} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-[${COLORS.text.primary}] text-sm font-medium`} numberOfLines={1}>
                {item.originDescription}
              </Text>
              <Text style={tw`text-[${COLORS.text.light}] text-xs my-1`}>to</Text>
              <Text style={tw`text-[${COLORS.text.primary}] text-sm font-medium`} numberOfLines={1}>
                {item.destinationDescription}
              </Text>
            </View>
            <View style={tw`items-end`}>
              <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>Fare</Text>
              <Text style={tw`text-[${COLORS.gold}] font-bold text-lg`}>
                {formatCurrency(item.paymentAmount || item.amount)}
              </Text>
              <Text style={tw`text-[${COLORS.text.light}] text-xs`}>
                {item.distance ? `${Math.ceil(item.distance)} km` : ''}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={tw`p-4 border-t border-[${COLORS.border}]`}>
            <View style={tw`bg-[${COLORS.surface}] rounded-lg p-3`}>
              <Text style={tw`text-[${COLORS.text.primary}] font-medium text-sm mb-2`}>Trip Details</Text>
              
              <View style={tw`flex-row justify-between mb-2`}>
                <Text style={tw`text-[${COLORS.text.light}] text-xs`}>Vehicle Type</Text>
                <Text style={tw`text-[${COLORS.text.primary}] text-xs font-medium`}>
                  {item.vehicleType || 'Car'}
                </Text>
              </View>
              
              <View style={tw`flex-row justify-between mb-2`}>
                <Text style={tw`text-[${COLORS.text.light}] text-xs`}>Distance</Text>
                <Text style={tw`text-[${COLORS.text.primary}] text-xs font-medium`}>
                  {item.distance ? `${item.distance} km` : 'N/A'}
                </Text>
              </View>
              
              <View style={tw`flex-row justify-between mb-2`}>
                <Text style={tw`text-[${COLORS.text.light}] text-xs`}>Duration</Text>
                <Text style={tw`text-[${COLORS.text.primary}] text-xs font-medium`}>
                  {item.duration ? `${Math.ceil(item.duration)} mins` : 'N/A'}
                </Text>
              </View>
              
              {item.driverName && (
                <View style={tw`flex-row justify-between`}>
                  <Text style={tw`text-[${COLORS.text.light}] text-xs`}>Driver</Text>
                  <Text style={tw`text-[${COLORS.text.primary}] text-xs font-medium`}>
                    {item.driverName}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={orders}
      renderItem={renderItem}
      keyExtractor={(item) => item.orderId?.toString() || Math.random().toString()}
      contentContainerStyle={tw`p-4 pb-8`}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.gold]} />
      }
      ListEmptyComponent={
        <View style={tw`items-center justify-center py-10`}>
          <Ionicons name="car-outline" size={64} color={COLORS.text.light} />
          <Text style={tw`text-[${COLORS.text.light}] text-center mt-4`}>
            No ride orders found
          </Text>
        </View>
      }
    />
  );
};

// Logistics Order History Component
const LogisticsOrderHistory = ({ orders, onRefresh, refreshing }) => {
  const [expandedOrder, setExpandedOrder] = useState(null);

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const renderItem = ({ item }) => {
    const isExpanded = expandedOrder === item.id;
    const statusColor = getStatusColor(item.orderStatus);

    return (
      <View style={tw`bg-white rounded-xl mb-3 overflow-hidden border border-[${COLORS.border}]`}>
        {/* Order Header */}
        <TouchableOpacity
          onPress={() => toggleExpand(item.id)}
          style={tw`p-4 bg-[${COLORS.surface}]`}
        >
          <View style={tw`flex-row justify-between items-start mb-2`}>
            <View>
              <Text style={tw`text-[${COLORS.text.primary}] font-bold text-base`}>
                Logistics #{item.id}
              </Text>
              <Text style={tw`text-[${COLORS.text.light}] text-xs mt-1`}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
            <View style={[tw`px-2 py-0.5 rounded-full`, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[tw`text-xs font-medium`, { color: statusColor }]}>
                {item.orderStatus || 'Created'}
              </Text>
            </View>
          </View>

          {/* Route Preview */}
          <View style={tw`flex-row items-center`}>
            <View style={tw`items-center mr-3`}>
              <View style={tw`w-2 h-2 rounded-full bg-[${COLORS.gold}]`} />
              <View style={tw`w-0.5 h-6 bg-[${COLORS.border}] my-1`} />
              <View style={tw`w-2 h-2 rounded-full bg-[${COLORS.error}]`} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-[${COLORS.text.primary}] text-sm font-medium`} numberOfLines={1}>
                {item.origin || 'Pickup'}
              </Text>
              <Text style={tw`text-[${COLORS.text.light}] text-xs my-1`}>to</Text>
              <Text style={tw`text-[${COLORS.text.primary}] text-sm font-medium`} numberOfLines={1}>
                {item.destination || 'Delivery'}
              </Text>
            </View>
            <View style={tw`items-end`}>
              <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>Cost</Text>
              <Text style={tw`text-[${COLORS.gold}] font-bold text-lg`}>
                {formatCurrency(item.cost)}
              </Text>
              {item.distance > 0 && (
                <Text style={tw`text-[${COLORS.text.light}] text-xs`}>
                  {item.distance} km
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={tw`p-4 border-t border-[${COLORS.border}]`}>
            <View style={tw`bg-[${COLORS.surface}] rounded-lg p-3`}>
              <Text style={tw`text-[${COLORS.text.primary}] font-medium text-sm mb-2`}>Delivery Details</Text>
              
              <View style={tw`mb-3`}>
                <Text style={tw`text-[${COLORS.text.light}] text-xs mb-1`}>Pickup Address</Text>
                <Text style={tw`text-[${COLORS.text.primary}] text-sm`}>{item.origin}</Text>
              </View>
              
              <View style={tw`mb-3`}>
                <Text style={tw`text-[${COLORS.text.light}] text-xs mb-1`}>Delivery Address</Text>
                <Text style={tw`text-[${COLORS.text.primary}] text-sm`}>{item.destination}</Text>
              </View>
              
              <View style={tw`flex-row justify-between mb-2`}>
                <Text style={tw`text-[${COLORS.text.light}] text-xs`}>Deliver To</Text>
                <Text style={tw`text-[${COLORS.text.primary}] text-xs font-medium`}>
                  {item.deliverTo || 'N/A'}
                </Text>
              </View>
              
              <View style={tw`flex-row justify-between mb-2`}>
                <Text style={tw`text-[${COLORS.text.light}] text-xs`}>Distance</Text>
                <Text style={tw`text-[${COLORS.text.primary}] text-xs font-medium`}>
                  {item.distance ? `${item.distance} km` : 'N/A'}
                </Text>
              </View>
              
              {item.riderName && (
                <View style={tw`flex-row justify-between mb-2`}>
                  <Text style={tw`text-[${COLORS.text.light}] text-xs`}>Rider</Text>
                  <Text style={tw`text-[${COLORS.text.primary}] text-xs font-medium`}>
                    {item.riderName}
                  </Text>
                </View>
              )}
              
              <View style={tw`flex-row justify-between`}>
                <Text style={tw`text-[${COLORS.text.light}] text-xs`}>Pickup Status</Text>
                <Text style={[
                  tw`text-xs font-medium`,
                  item.pickupStatus === 'Picked' ? tw`text-[${COLORS.success}]` : tw`text-[${COLORS.warning}]`
                ]}>
                  {item.pickupStatus || 'Not Picked'}
                </Text>
              </View>
              
              {item.pickupTime && (
                <View style={tw`flex-row justify-between mt-2`}>
                  <Text style={tw`text-[${COLORS.text.light}] text-xs`}>Pickup Time</Text>
                  <Text style={tw`text-[${COLORS.text.primary}] text-xs font-medium`}>
                    {formatDate(item.pickupTime)}
                  </Text>
                </View>
              )}
              
              {item.droppedTime && (
                <View style={tw`flex-row justify-between mt-2`}>
                  <Text style={tw`text-[${COLORS.text.light}] text-xs`}>Delivery Time</Text>
                  <Text style={tw`text-[${COLORS.text.primary}] text-xs font-medium`}>
                    {formatDate(item.droppedTime)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={orders}
      renderItem={renderItem}
      keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
      contentContainerStyle={tw`p-4 pb-8`}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.gold]} />
      }
      ListEmptyComponent={
        <View style={tw`items-center justify-center py-10`}>
          <Ionicons name="cube-outline" size={64} color={COLORS.text.light} />
          <Text style={tw`text-[${COLORS.text.light}] text-center mt-4`}>
            No logistics orders found
          </Text>
        </View>
      }
    />
  );
};

// Main Screen
const AllOrderHistory = () => {
  const [selectedView, setSelectedView] = useState('ride');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [riderOrders, setRiderOrders] = useState([]);
  const [alsOrders, setAlsOrders] = useState([]);
  const [logisticsOrders, setLogisticsOrders] = useState([]);
  const [mobile, setMobile] = useState(null);

  useEffect(() => {
    loadMobileAndFetch();
  }, []);

  const loadMobileAndFetch = async () => {
    try {
      const myMobile = await AsyncStorage.getItem('mobile');
      if (!myMobile) {
        Alert.alert('Error', 'Account not found. Please login again.');
        router.replace('/login');
        return;
      }
      setMobile(myMobile);
      await fetchAllOrders(myMobile);
    } catch (error) {
      console.error('Error loading mobile:', error);
    }
  };

  const fetchAllOrders = async (mobileNumber) => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchRiderOrders(mobileNumber),
        fetchAlsOrders(mobileNumber),
        fetchLogisticsOrders(mobileNumber),
      ]);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (mobile) {
      fetchAllOrders(mobile);
    }
  }, [mobile]);

  const fetchRiderOrders = async (mobileNumber) => {
    try {
      const response = await fetch(
        `https://hoog.ng/infiniteorder/api/Customers/rideOrderHistory.php?mobile=${mobileNumber}`
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setRiderOrders(data);
      } else {
        setRiderOrders([]);
      }
    } catch (error) {
      console.error('Error fetching ride orders:', error);
      setRiderOrders([]);
    }
  };

  const fetchAlsOrders = async (mobileNumber) => {
    try {
      const response = await fetch(
        `https://hoog.ng/infiniteorder/api/Customers/alsOrderHistory.php?mobile=${mobileNumber}`
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setAlsOrders(data);
      } else {
        setAlsOrders([]);
      }
    } catch (error) {
      console.error('Error fetching ALS orders:', error);
      setAlsOrders([]);
    }
  };

  const fetchLogisticsOrders = async (mobileNumber) => {
    try {
      const response = await axios.get(
        `https://hoog.ng/infiniteorder/api/Logistics/getLogisticsOrders.php?mobile=${mobileNumber}`
      );
      
      if (response.data.status === 200 && Array.isArray(response.data.data)) {
        const normalizedOrders = response.data.data.map((order) => ({
          id: order.id,
          cost: parseFloat(order.cost || "0"),
          createdAt: order.created_at || "",
          origin: order.origin || "",
          destination: order.destination || "",
          deliverTo: order.deliverTo || "",
          distance: parseFloat(order.distance || "0"),
          orderStatus: order.orderStatus || "Created",
          riderName: order.riderName || null,
          riderId: order.riderId || null,
          pickupStatus: order.pickupstatus === "1" ? "Picked" : "Not Picked",
          pickupTime: order.pickUpTime !== "0000-00-00 00:00:00" ? order.pickUpTime : null,
          droppedTime: order.droppedTime !== "0000-00-00 00:00:00" ? order.droppedTime : null,
        }));

        const sortedOrders = normalizedOrders.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setLogisticsOrders(sortedOrders);
      } else {
        setLogisticsOrders([]);
      }
    } catch (error) {
      console.error('Error fetching logistics orders:', error);
      setLogisticsOrders([]);
    }
  };

  const renderTabButton = (view, label, icon) => (
    <TouchableOpacity
      onPress={() => setSelectedView(view)}
      style={[
        tw`flex-1 flex-row items-center justify-center py-3 mx-1 rounded-lg`,
        selectedView === view ? tw`bg-[${COLORS.gold}]` : tw`bg-[${COLORS.surface}] border border-[${COLORS.border}]`
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={selectedView === view ? 'white' : COLORS.text.secondary}
        style={tw`mr-2`}
      />
      <Text style={[
        tw`font-medium`,
        selectedView === view ? tw`text-white` : tw`text-[${COLORS.text.secondary}]`
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (isLoading && !refreshing) {
      return (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={tw`text-[${COLORS.text.secondary}] mt-4`}>Loading your orders...</Text>
        </View>
      );
    }

    switch (selectedView) {
      case 'ride':
        return (
          <RiderOrderHistory
            orders={riderOrders}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        );
      case 'als':
        return (
          <ALSOrderHistory
            orders={alsOrders}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        );
      case 'logistics':
        return (
          <LogisticsOrderHistory
            orders={logisticsOrders}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[${COLORS.background}]`}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={tw`bg-white border-b border-[${COLORS.border}] px-4 py-3`}>
        <View style={tw`flex-row items-center`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`p-2 -ml-2`}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={tw`flex-1 text-center text-[${COLORS.text.primary}] font-bold text-lg`}>
            Order History
          </Text>
          <View style={tw`w-10`} />
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={tw`flex-row p-4 bg-white border-b border-[${COLORS.border}]`}>
        {renderTabButton('ride', 'Rides', 'car')}
        {renderTabButton('als', 'Laundry', 'shirt')}
        {renderTabButton('logistics', 'Logistics', 'cube')}
      </View>

      {/* Content */}
      <View style={tw`flex-1 bg-[${COLORS.surface}]`}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

export default AllOrderHistory;