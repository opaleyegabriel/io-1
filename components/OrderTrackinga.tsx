import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import tw from 'twrnc';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Order statuses matching admin
const ORDER_STATUSES = [
  { id: 'pending', label: 'Pending', color: 'bg-yellow-500', icon: '⏳', description: 'Order received and awaiting confirmation' },
  { id: 'accepted', label: 'Accepted', color: 'bg-blue-500', icon: '✅', description: 'Order has been accepted for processing' },
  { id: 'washing', label: 'Washing', color: 'bg-blue-500', icon: '🧼', description: 'Your items are being washed' },
  { id: 'ironing', label: 'Ironing', color: 'bg-purple-500', icon: '✨', description: 'Ironing in progress' },
  { id: 'packing', label: 'Packing', color: 'bg-indigo-500', icon: '📦', description: 'Packing your clean clothes' },
  { id: 'ready', label: 'Ready for Delivery', color: 'bg-green-500', icon: '🟢', description: 'Order ready for delivery' },
  { id: 'delivery', label: 'Out for Delivery', color: 'bg-orange-500', icon: '🚚', description: 'On the way to you' },
  { id: 'delivered', label: 'Delivered', color: 'bg-green-700', icon: '🏁', description: 'Order delivered successfully' },
];

// Pickup statuses
const PICKUP_STATUSES = [
  { id: 'pending_schedule', label: 'Awaiting Schedule', color: 'bg-yellow-500', icon: '⏳' },
  { id: 'scheduled', label: 'Pickup Scheduled', color: 'bg-blue-500', icon: '📅' },
  { id: 'assigned', label: 'Rider Assigned', color: 'bg-purple-500', icon: '🛵' },
  { id: 'enroute', label: 'Rider Enroute', color: 'bg-indigo-500', icon: '🚚' },
  { id: 'picked_up', label: 'Picked Up', color: 'bg-green-500', icon: '✅' },
];

const OrderTracking = ({ orderId, onBack }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobile, setMobile] = useState('');
  const [riderLocation, setRiderLocation] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (mobile && orderId) {
      fetchOrderDetails();
      // Set up real-time tracking if order is out for delivery
      const intervalId = setInterval(() => {
        fetchOrderDetails();
        if (order?.status === 'delivery') {
          simulateRiderLocation();
        }
      }, 10000); // Update every 10 seconds

      return () => clearInterval(intervalId);
    }
  }, [mobile, orderId, order?.status]);

  const loadUserData = async () => {
    const myMobile = await AsyncStorage.getItem('mobile');
    setMobile(myMobile);
  };

  const fetchOrderDetails = async () => {
    try {
      // In production, replace with actual API endpoint
      // For demo, we'll simulate with stored data
      const response = await fetch(`https://hoog.ng/infiniteorder/api/Customers/getOrderDetails.php?orderId=${orderId}&mobile=${mobile}`);
      const data = await response.json();
      
      if (data) {
        setOrder(data);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderDetails();
  };

  const simulateRiderLocation = () => {
    // Simulate rider moving closer
    if (order?.status === 'delivery') {
      const progress = Math.random() * 100;
      setRiderLocation({
        lat: 6.5244 + (Math.random() - 0.5) * 0.01,
        lng: 3.3792 + (Math.random() - 0.5) * 0.01,
        estimatedMinutes: Math.max(5, Math.floor(30 - (progress / 100) * 25)),
        progress: progress
      });
    }
  };

  const getCurrentStatusIndex = () => {
    return ORDER_STATUSES.findIndex(s => s.id === order?.status);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-NG', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (statusId) => {
    const status = ORDER_STATUSES.find(s => s.id === statusId);
    return status?.color || 'bg-gray-500';
  };

  const getStatusIcon = (statusId) => {
    const status = ORDER_STATUSES.find(s => s.id === statusId);
    return status?.icon || '📦';
  };

  const handleContactRider = () => {
    if (order?.assignedRider?.phone) {
      Alert.alert(
        'Contact Rider',
        `Call rider ${order.assignedRider.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: () => Alert.alert('Calling', `Dialing ${order.assignedRider.phone}`) }
        ]
      );
    } else {
      Alert.alert('No Rider Assigned', 'A rider will be assigned soon.');
    }
  };

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={tw`mt-4 text-gray-600`}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50 p-4`}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#9CA3AF" />
        <Text style={tw`text-xl font-bold text-gray-800 mt-4`}>Order Not Found</Text>
        <Text style={tw`text-gray-600 text-center mt-2`}>
          The order you're looking for doesn't exist or has been removed.
        </Text>
        <TouchableOpacity
          style={tw`mt-6 bg-yellow-600 px-6 py-3 rounded-xl`}
          onPress={onBack}
        >
          <Text style={tw`text-white font-bold`}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* Header */}
      <View style={tw`bg-white px-4 py-3 border-b border-gray-200`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center`}>
            <TouchableOpacity onPress={onBack} style={tw`mr-3`}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
            </TouchableOpacity>
            <View>
              <Text style={tw`text-xl font-bold text-gray-800`}>Track Order</Text>
              <Text style={tw`text-sm text-gray-500`}>Order #{order.id}</Text>
            </View>
          </View>
          <View style={tw`bg-yellow-100 px-3 py-1 rounded-full`}>
            <Text style={tw`text-yellow-700 font-medium text-xs`}>
              {getStatusIcon(order.status)} {ORDER_STATUSES.find(s => s.id === order.status)?.label}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={tw`flex-1 p-4`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Progress Tracker */}
        <View style={tw`bg-white rounded-xl p-4 mb-4`}>
          <Text style={tw`font-bold text-gray-800 mb-4`}>Order Progress</Text>
          
          {/* Progress Bar */}
          <View style={tw`h-2 bg-gray-200 rounded-full mb-4`}>
            <View 
              style={[
                tw`h-2 bg-yellow-600 rounded-full`,
                { width: `${((getCurrentStatusIndex() + 1) / ORDER_STATUSES.length) * 100}%` }
              ]} 
            />
          </View>

          {/* Status Timeline */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={tw`flex-row items-center`}>
              {ORDER_STATUSES.map((status, index) => {
                const currentIndex = getCurrentStatusIndex();
                const isCompleted = index <= currentIndex;
                const isCurrent = index === currentIndex;

                return (
                  <View key={status.id} style={tw`flex-row items-center`}>
                    <View style={tw`items-center`}>
                      <View style={tw`
                        w-12 h-12 rounded-full items-center justify-center
                        ${isCompleted ? status.color : 'bg-gray-300'}
                        ${isCurrent ? 'ring-2 ring-yellow-600 ring-offset-2' : ''}
                      `}>
                        <Text style={tw`text-white text-xl`}>{status.icon}</Text>
                      </View>
                      <Text style={tw`
                        text-xs mt-1 font-medium
                        ${isCompleted ? 'text-gray-800' : 'text-gray-400'}
                      `}>
                        {status.label}
                      </Text>
                    </View>
                    {index < ORDER_STATUSES.length - 1 && (
                      <View style={tw`w-8 h-0.5 mx-1 ${index < currentIndex ? 'bg-yellow-600' : 'bg-gray-300'}`} />
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Live Tracking (for out for delivery) */}
        {order.status === 'delivery' && (
          <View style={tw`bg-white rounded-xl p-4 mb-4`}>
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <View style={tw`flex-row items-center`}>
                <MaterialCommunityIcons name="map-marker-radius" size={20} color="#D97706" />
                <Text style={tw`font-bold ml-2`}>Live Tracking</Text>
              </View>
              <View style={tw`bg-green-100 px-2 py-1 rounded-full`}>
                <Text style={tw`text-green-700 text-xs font-medium`}>🟢 Live</Text>
              </View>
            </View>

            {/* Map Placeholder */}
            <View style={tw`h-40 bg-gray-200 rounded-xl mb-3 relative overflow-hidden`}>
              <View style={tw`absolute inset-0 items-center justify-center`}>
                <MaterialCommunityIcons name="map-outline" size={48} color="#9CA3AF" />
                <Text style={tw`text-gray-500 text-sm mt-2`}>Map View</Text>
              </View>
              
              {/* Simulated Rider Position */}
              {riderLocation && (
                <View style={tw`absolute bottom-2 left-2 bg-white rounded-lg px-2 py-1 shadow-md`}>
                  <Text style={tw`text-xs`}>🚚 {riderLocation.estimatedMinutes} mins away</Text>
                </View>
              )}
            </View>

            {/* Rider Info */}
            {order.assignedRider && (
              <View style={tw`flex-row items-center justify-between bg-gray-50 p-3 rounded-lg`}>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`w-10 h-10 bg-yellow-600 rounded-full items-center justify-center`}>
                    <Text style={tw`text-white font-bold`}>
                      {order.assignedRider.name?.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={tw`ml-3`}>
                    <Text style={tw`font-medium`}>{order.assignedRider.name}</Text>
                    <Text style={tw`text-xs text-gray-500`}>{order.assignedRider.bikeNumber}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={tw`bg-yellow-600 px-4 py-2 rounded-lg`}
                  onPress={handleContactRider}
                >
                  <Text style={tw`text-white font-medium text-xs`}>Contact</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Pickup Information */}
        <View style={tw`bg-white rounded-xl p-4 mb-4`}>
          <View style={tw`flex-row items-center mb-3`}>
            <MaterialCommunityIcons name="truck-fast" size={20} color="#D97706" />
            <Text style={tw`font-bold ml-2`}>Pickup Details</Text>
          </View>
          
          <View style={tw`bg-gray-50 p-3 rounded-lg`}>
            <View style={tw`flex-row justify-between mb-2`}>
              <Text style={tw`text-gray-600`}>Status:</Text>
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-2 h-2 rounded-full ${order.pickupStatus === 'picked_up' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <Text style={tw`ml-1 font-medium`}>
                  {PICKUP_STATUSES.find(s => s.id === order.pickupStatus)?.label || 'Pending'}
                </Text>
              </View>
            </View>
            
            <Text style={tw`text-gray-600`}>Address:</Text>
            <Text style={tw`font-medium`}>{order.customer?.address}</Text>
            
            {order.scheduledPickup && (
              <View style={tw`mt-2 pt-2 border-t border-gray-200`}>
                <Text style={tw`text-gray-600`}>Scheduled:</Text>
                <Text style={tw`font-medium`}>
                  {order.scheduledPickup.date} at {order.scheduledPickup.time}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Order Items */}
        <View style={tw`bg-white rounded-xl p-4 mb-4`}>
          <View style={tw`flex-row items-center mb-3`}>
            <MaterialCommunityIcons name="format-list-bulleted" size={20} color="#D97706" />
            <Text style={tw`font-bold ml-2`}>Order Items</Text>
          </View>

          {order.items?.map((item, index) => (
            <View key={index} style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}>
              <View style={tw`flex-1`}>
                <Text style={tw`font-medium`}>{item.service?.name || item.description}</Text>
                <Text style={tw`text-sm text-gray-500`}>x{item.quantity}</Text>
              </View>
              <Text style={tw`font-bold text-yellow-600`}>
                ₦{(item.price * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}

          <View style={tw`flex-row justify-between items-center mt-3 pt-3 border-t border-gray-200`}>
            <Text style={tw`font-bold`}>Total</Text>
            <Text style={tw`font-bold text-lg text-yellow-600`}>₦{order.total?.toLocaleString()}</Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={tw`bg-white rounded-xl p-4 mb-4`}>
          <View style={tw`flex-row items-center mb-3`}>
            <MaterialCommunityIcons name="timeline-clock" size={20} color="#D97706" />
            <Text style={tw`font-bold ml-2`}>Timeline</Text>
          </View>

          {order.timeline?.map((event, index) => (
            <View key={index} style={tw`flex-row mb-3`}>
              <View style={tw`items-center mr-3`}>
                <View style={tw`w-8 h-8 rounded-full ${getStatusColor(event.status)} items-center justify-center`}>
                  <Text style={tw`text-white`}>{getStatusIcon(event.status)}</Text>
                </View>
                {index < order.timeline.length - 1 && (
                  <View style={tw`w-0.5 h-8 bg-gray-300 mt-1`} />
                )}
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`font-medium`}>{event.note || ORDER_STATUSES.find(s => s.id === event.status)?.label}</Text>
                <Text style={tw`text-xs text-gray-500`}>{formatDate(event.timestamp)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Need Help */}
        <TouchableOpacity
          style={tw`bg-red-50 rounded-xl p-4 mb-6 flex-row items-center justify-between`}
          onPress={() => Alert.alert(
            'Need Help?',
            'Contact customer support:\n\n📞 01-2345678\n📧 support@infiniteorder.com',
            [
              { text: 'Call', onPress: () => Alert.alert('Calling', 'Dialing 01-2345678') },
              { text: 'Email', onPress: () => Alert.alert('Email', 'Opening email client') },
              { text: 'Cancel', style: 'cancel' }
            ]
          )}
        >
          <View style={tw`flex-row items-center`}>
            <MaterialCommunityIcons name="headset" size={20} color="#EF4444" />
            <Text style={tw`text-red-600 font-medium ml-2`}>Need Help?</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#EF4444" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrderTracking;