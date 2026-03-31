import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  TextInput
} from 'react-native';
import tw from 'twrnc';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Progress from 'react-native-progress';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface TrackingStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  timestamp?: string;
  icon: keyof typeof Ionicons.glyphMap;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
  instructions?: string;
}

interface LocationInfo {
  address: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
  distance_from_office?: number;
}

interface DriverInfo {
  name: string;
  phone: string;
  vehicle: string;
  licensePlate: string;
  photo?: string;
  rating: number;
  completedDeliveries: number;
}

interface OrderTrackingProps {
  orderId: string;
  onBack: () => void;
}

const COLORS = {
  gold: '#b7790f',
  goldLight: '#fbbf24',
  goldDark: '#92400e',
  primary: '#4F46E5',
  secondary: '#10B981',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    light: '#9CA3AF',
  },
  border: '#E5E7EB',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  overlay: 'rgba(0,0,0,0.5)',
};

const OrderTracking: React.FC<OrderTrackingProps> = ({ orderId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [trackingSteps, setTrackingSteps] = useState<TrackingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [driverLocation, setDriverLocation] = useState({
    latitude: 8.4815407,
    longitude: 4.5621774,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{text: string, isUser: boolean, timestamp: Date}>>([]);
  const [showChat, setShowChat] = useState(false);
  const [orderSummaryExpanded, setOrderSummaryExpanded] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');

  useEffect(() => {
    fetchTrackingData();
    startLiveTracking();
    return () => stopLiveTracking();
  }, [orderId]);

  const fetchTrackingData = async () => {
    setLoading(true);
    try {
      // Simulate API call - Replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data - Replace with actual API response
      const mockOrder = {
        orderId: orderId,
        status: 'in-transit',
        serviceOption: 'delivery',
        pickupAddress: '123 Customer Street, Ikeja, Lagos',
        deliveryAddress: '456 Business Avenue, Ibadan, Oyo State',
        pickupLocation: { lat: 8.4815407, lng: 4.5621774, address: '123 Customer Street, Ikeja, Lagos' },
        deliveryLocation: { lat: 7.3775, lng: 3.9470, address: '456 Business Avenue, Ibadan, Oyo State' },
        estimatedDelivery: 'Today, 2:30 PM',
        items: [
          { id: '1', description: 'Premium Cotton Shirts', quantity: 3, price: 2500, total: 7500 },
          { id: '2', description: 'Business Suits - Dry Clean', quantity: 2, price: 5000, total: 10000 },
          { id: '3', description: 'Delicate Silk Blouses', quantity: 2, price: 3500, total: 7000, instructions: 'Hand wash only, no heat' },
        ],
        totalAmount: 24500,
        deliveryFee: 1500,
        pickupFee: 1200,
        baseFee: 300,
        customerName: 'John Doe',
        customerPhone: '+234 801 234 5678',
        orderDate: '2024-01-15 10:30 AM',
      };

      const mockDriver: DriverInfo = {
        name: 'James Okonkwo',
        phone: '+234 802 345 6789',
        vehicle: 'Toyota Hiace',
        licensePlate: 'LAG 123 ABC',
        rating: 4.8,
        completedDeliveries: 1250,
      };

      const mockSteps: TrackingStep[] = [
        {
          id: '1',
          title: 'Order Confirmed',
          description: 'Your order has been received and confirmed',
          status: 'completed',
          timestamp: 'Yesterday, 10:30 AM',
          icon: 'checkmark-circle',
          location: mockOrder.pickupLocation,
        },
        {
          id: '2',
          title: 'Processing',
          description: 'Your laundry is being processed with care',
          status: 'completed',
          timestamp: 'Yesterday, 2:45 PM',
          icon: 'sync',
        },
        {
          id: '3',
          title: 'Picked Up',
          description: 'Your items have been picked up by our driver',
          status: 'completed',
          timestamp: 'Today, 9:15 AM',
          icon: 'bicycle',
          location: mockOrder.pickupLocation,
        },
        {
          id: '4',
          title: 'In Transit',
          description: 'On the way to delivery location',
          status: 'in-progress',
          timestamp: 'Today, 11:20 AM',
          icon: 'car',
          location: { lat: 8.0, lng: 4.2, address: 'En route to Ibadan' },
        },
        {
          id: '5',
          title: 'Out for Delivery',
          description: 'Driver is on the final leg to your location',
          status: 'pending',
          icon: 'location',
        },
        {
          id: '6',
          title: 'Delivered',
          description: 'Order delivered successfully',
          status: 'pending',
          icon: 'checkmark-done',
        },
      ];

      setOrder(mockOrder);
      setDriverInfo(mockDriver);
      setTrackingSteps(mockSteps);
      
      const completedSteps = mockSteps.filter(s => s.status === 'completed').length;
      setCurrentStep(completedSteps);
      setEstimatedDelivery(mockOrder.estimatedDelivery);

      // Update driver location periodically (simulated)
      updateDriverLocation();

    } catch (error) {
      console.error('Error fetching tracking data:', error);
      Alert.alert('Error', 'Failed to load tracking information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const startLiveTracking = () => {
    // In production, this would set up WebSocket or polling
    const interval = setInterval(updateDriverLocation, 10000);
    return () => clearInterval(interval);
  };

  const stopLiveTracking = () => {
    // Cleanup
  };

  const updateDriverLocation = () => {
    // Simulate driver moving towards destination
    setDriverLocation(prev => ({
      ...prev,
      latitude: prev.latitude + 0.001,
      longitude: prev.longitude + 0.001,
    }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrackingData();
  };

  const handleContactDriver = () => {
    Alert.alert(
      'Contact Driver',
      `Call ${driverInfo?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => Alert.alert('Calling', `Connecting to ${driverInfo?.phone}`),
          style: 'default'
        },
      ]
    );
  };

  const handleShareLiveLocation = () => {
    Alert.alert(
      'Share Live Location',
      'Share your live location with the driver?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Share', 
          onPress: () => Alert.alert('Success', 'Live location shared with driver'),
          style: 'default'
        },
      ]
    );
  };

  const handleReportIssue = () => {
    setShowSupportModal(true);
  };

  const sendSupportMessage = () => {
    if (supportMessage.trim()) {
      setChatMessages([...chatMessages, { text: supportMessage, isUser: true, timestamp: new Date() }]);
      setSupportMessage('');
      
      // Simulate response
      setTimeout(() => {
        setChatMessages(prev => [...prev, { 
          text: 'Thank you for your message. A support agent will respond shortly.', 
          isUser: false, 
          timestamp: new Date() 
        }]);
      }, 2000);
    }
  };

  const getStepIcon = (step: TrackingStep, index: number) => {
    const isCompleted = step.status === 'completed';
    const isInProgress = step.status === 'in-progress';
    
    if (isCompleted) {
      return (
        <View style={tw`w-10 h-10 rounded-full bg-green-100 items-center justify-center`}>
          <Ionicons name="checkmark" size={20} color={COLORS.success} />
        </View>
      );
    } else if (isInProgress) {
      return (
        <View style={tw`w-10 h-10 rounded-full bg-[${COLORS.gold}]/20 items-center justify-center`}>
          <View style={tw`w-4 h-4 rounded-full bg-[${COLORS.gold}]`} />
        </View>
      );
    } else {
      return (
        <View style={tw`w-10 h-10 rounded-full bg-gray-100 items-center justify-center`}>
          <Ionicons name={step.icon as any} size={20} color={COLORS.text.light} />
        </View>
      );
    }
  };

  const renderLiveMap = () => {
    if (!showMap) return null;

    return (
      <Modal
        visible={showMap}
        animationType="slide"
        onRequestClose={() => setShowMap(false)}
      >
        <View style={tw`flex-1`}>
          {/* Map Header */}
          <View style={tw`absolute top-0 left-0 right-0 z-10`}>
            <LinearGradient
              colors={['rgba(0,0,0,0.7)', 'transparent']}
              style={tw`pt-12 pb-8 px-4`}
            >
              <View style={tw`flex-row items-center justify-between`}>
                <TouchableOpacity onPress={() => setShowMap(false)} style={tw`bg-white/20 p-2 rounded-full`}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                <View style={tw`flex-row`}>
                  <TouchableOpacity 
                    onPress={() => setMapType('standard')}
                    style={tw`bg-white/20 px-3 py-1 rounded-l-full ${mapType === 'standard' ? 'bg-white/40' : ''}`}
                  >
                    <Text style={tw`text-white text-xs`}>Standard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setMapType('satellite')}
                    style={tw`bg-white/20 px-3 py-1 rounded-r-full ${mapType === 'satellite' ? 'bg-white/40' : ''}`}
                  >
                    <Text style={tw`text-white text-xs`}>Satellite</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Map */}
          <MapView
            provider={PROVIDER_GOOGLE}
            style={tw`flex-1`}
            initialRegion={{
              ...driverLocation,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            mapType={mapType}
            showsUserLocation
            showsMyLocationButton
            showsCompass
            showsTraffic
          >
            {/* Driver Location */}
            <Marker
              coordinate={{
                latitude: driverLocation.latitude,
                longitude: driverLocation.longitude,
              }}
              title="Driver"
              description={driverInfo?.name}
            >
              <View style={tw`bg-[${COLORS.gold}] p-2 rounded-full border-2 border-white`}>
                <Ionicons name="car" size={20} color="white" />
              </View>
            </Marker>

            {/* Pickup Location */}
            {order?.pickupLocation && (
              <Marker
                coordinate={{
                  latitude: order.pickupLocation.lat,
                  longitude: order.pickupLocation.lng,
                }}
                title="Pickup Location"
                description={order.pickupAddress}
              >
                <View style={tw`bg-blue-500 p-2 rounded-full border-2 border-white`}>
                  <Ionicons name="location" size={20} color="white" />
                </View>
              </Marker>
            )}

            {/* Delivery Location */}
            {order?.deliveryLocation && (
              <Marker
                coordinate={{
                  latitude: order.deliveryLocation.lat,
                  longitude: order.deliveryLocation.lng,
                }}
                title="Delivery Location"
                description={order.deliveryAddress}
              >
                <View style={tw`bg-green-500 p-2 rounded-full border-2 border-white`}>
                  <Ionicons name="flag" size={20} color="white" />
                </View>
              </Marker>
            )}

            {/* Route Line */}
            {order?.pickupLocation && order?.deliveryLocation && (
              <Polyline
                coordinates={[
                  { latitude: order.pickupLocation.lat, longitude: order.pickupLocation.lng },
                  { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
                  { latitude: order.deliveryLocation.lat, longitude: order.deliveryLocation.lng },
                ]}
                strokeColor={COLORS.gold}
                strokeWidth={3}
                lineDashPattern={[1]}
              />
            )}
          </MapView>

          {/* Bottom Info Card */}
          <View style={tw`absolute bottom-4 left-4 right-4 bg-white rounded-xl p-4 shadow-lg`}>
            <View style={tw`flex-row items-center justify-between`}>
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-10 h-10 rounded-full bg-[${COLORS.gold}]/20 items-center justify-center`}>
                  <Ionicons name="car" size={20} color={COLORS.gold} />
                </View>
                <View style={tw`ml-3`}>
                  <Text style={tw`text-[${COLORS.text.primary}] font-bold`}>Driver: {driverInfo?.name}</Text>
                  <Text style={tw`text-[${COLORS.text.light}] text-xs`}>ETA: 15 mins</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={tw`bg-[${COLORS.gold}] p-3 rounded-full`}
                onPress={handleContactDriver}
              >
                <Ionicons name="call" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderSupportModal = () => (
    <Modal
      visible={showSupportModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowSupportModal(false)}
    >
      <View style={tw`flex-1 bg-black/50`}>
        <View style={tw`flex-1 justify-end`}>
          <View style={tw`bg-white rounded-t-3xl`}>
            <View style={tw`items-center pt-2`}>
              <View style={tw`w-12 h-1 bg-gray-300 rounded-full`} />
            </View>

            <View style={tw`p-4`}>
              <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={tw`text-xl font-bold text-[${COLORS.text.primary}]`}>Support</Text>
                <TouchableOpacity onPress={() => setShowSupportModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
              </View>

              {/* Quick Actions */}
              <View style={tw`flex-row mb-4`}>
                <TouchableOpacity 
                  style={tw`flex-1 bg-[${COLORS.surface}] p-3 rounded-xl mr-2 items-center`}
                  onPress={() => {
                    setShowSupportModal(false);
                    Alert.alert('Call Support', 'Calling +234 800 123 4567');
                  }}
                >
                  <Ionicons name="call-outline" size={24} color={COLORS.gold} />
                  <Text style={tw`text-[${COLORS.text.primary}] text-xs mt-1`}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={tw`flex-1 bg-[${COLORS.surface}] p-3 rounded-xl mr-2 items-center`}
                  onPress={() => {
                    setShowSupportModal(false);
                    setShowChat(true);
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={24} color={COLORS.gold} />
                  <Text style={tw`text-[${COLORS.text.primary}] text-xs mt-1`}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={tw`flex-1 bg-[${COLORS.surface}] p-3 rounded-xl items-center`}
                  onPress={() => {
                    setShowSupportModal(false);
                    Alert.alert('WhatsApp', 'Opening WhatsApp...');
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={24} color={COLORS.gold} />
                  <Text style={tw`text-[${COLORS.text.primary}] text-xs mt-1`}>WhatsApp</Text>
                </TouchableOpacity>
              </View>

              {/* Message Input */}
              <Text style={tw`text-[${COLORS.text.primary}] font-medium mb-2`}>Send a message</Text>
              <TextInput
                style={tw`bg-[${COLORS.surface}] p-3 rounded-xl border border-[${COLORS.border}] text-[${COLORS.text.primary}] mb-3`}
                placeholder="Type your message..."
                placeholderTextColor={COLORS.text.light}
                value={supportMessage}
                onChangeText={setSupportMessage}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={tw`bg-[${COLORS.gold}] p-4 rounded-xl items-center`}
                onPress={sendSupportMessage}
              >
                <Text style={tw`text-white font-bold`}>Send Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderChatModal = () => (
    <Modal
      visible={showChat}
      animationType="slide"
      onRequestClose={() => setShowChat(false)}
    >
      <View style={tw`flex-1 bg-white`}>
        <LinearGradient
          colors={[COLORS.gold, COLORS.goldDark]}
          style={tw`p-4 pt-12 flex-row items-center`}
        >
          <TouchableOpacity onPress={() => setShowChat(false)} style={tw`mr-4`}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={tw`flex-1`}>
            <Text style={tw`text-white text-xl font-bold`}>Support Chat</Text>
            <Text style={tw`text-white/80 text-sm`}>Order #{orderId}</Text>
          </View>
        </LinearGradient>

        <ScrollView style={tw`flex-1 p-4`}>
          {chatMessages.map((msg, index) => (
            <View 
              key={index} 
              style={[
                tw`mb-4 max-w-[80%]`,
                msg.isUser ? tw`self-end` : tw`self-start`
              ]}
            >
              <View style={[
                tw`p-3 rounded-2xl`,
                msg.isUser 
                  ? tw`bg-[${COLORS.gold}] rounded-tr-none` 
                  : tw`bg-[${COLORS.surface}] rounded-tl-none`
              ]}>
                <Text style={[
                  tw`text-sm`,
                  msg.isUser ? tw`text-white` : tw`text-[${COLORS.text.primary}]`
                ]}>
                  {msg.text}
                </Text>
              </View>
              <Text style={[
                tw`text-xs text-[${COLORS.text.light}] mt-1`,
                msg.isUser ? tw`text-right` : tw`text-left`
              ]}>
                {msg.timestamp.toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={tw`p-4 border-t border-[${COLORS.border}] flex-row`}>
          <TextInput
            style={tw`flex-1 bg-[${COLORS.surface}] p-3 rounded-xl mr-2 border border-[${COLORS.border}]`}
            placeholder="Type a message..."
            value={supportMessage}
            onChangeText={setSupportMessage}
          />
          <TouchableOpacity 
            style={tw`bg-[${COLORS.gold}] p-3 rounded-xl`}
            onPress={sendSupportMessage}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderTrackingTimeline = () => {
    return (
      <View style={tw`bg-white rounded-xl p-6 shadow-sm border border-[${COLORS.border}] mb-4`}>
        <View style={tw`flex-row justify-between items-center mb-6`}>
          <Text style={tw`text-lg font-bold text-[${COLORS.text.primary}]`}>Tracking Timeline</Text>
          {estimatedDelivery && (
            <View style={tw`bg-[${COLORS.gold}]/10 px-3 py-1 rounded-full`}>
              <Text style={tw`text-[${COLORS.gold}] text-xs font-medium`}>
                Est: {estimatedDelivery}
              </Text>
            </View>
          )}
        </View>

        {/* Progress Bar */}
        <View style={tw`mb-6`}>
          <View style={tw`flex-row justify-between mb-2`}>
            <Text style={tw`text-sm text-[${COLORS.text.secondary}]`}>Progress</Text>
            <Text style={tw`text-sm font-bold text-[${COLORS.gold}]`}>
              {Math.round((currentStep / trackingSteps.length) * 100)}%
            </Text>
          </View>
          <Progress.Bar
            progress={currentStep / trackingSteps.length}
            width={null}
            height={8}
            color={COLORS.gold}
            unfilledColor="#E5E7EB"
            borderWidth={0}
            borderRadius={4}
          />
        </View>

        {/* Timeline Steps */}
        {trackingSteps.map((step, index) => {
          const isLast = index === trackingSteps.length - 1;
          const isCompleted = step.status === 'completed';
          const isInProgress = step.status === 'in-progress';

          return (
            <View key={step.id} style={tw`flex-row mb-4`}>
              {/* Icon Column */}
              <View style={tw`items-center mr-4`}>
                {getStepIcon(step, index)}
                {!isLast && (
                  <View style={[
                    tw`w-0.5 h-12 mt-2`,
                    isCompleted ? tw`bg-green-500` : tw`bg-gray-200`
                  ]} />
                )}
              </View>

              {/* Content Column */}
              <View style={tw`flex-1 pb-${isLast ? '0' : '4'}`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={[
                    tw`font-bold`,
                    isCompleted ? tw`text-green-600` :
                    isInProgress ? tw`text-[${COLORS.gold}]` :
                    tw`text-[${COLORS.text.light}]`
                  ]}>
                    {step.title}
                  </Text>
                  {step.timestamp && (
                    <Text style={tw`text-xs text-[${COLORS.text.light}]`}>
                      {step.timestamp}
                    </Text>
                  )}
                </View>
                <Text style={tw`text-sm text-[${COLORS.text.secondary}] mt-1`}>
                  {step.description}
                </Text>

                {/* Live Update Badge for In-Progress */}
                {isInProgress && (
                  <View style={tw`flex-row items-center mt-2`}>
                    <View style={tw`w-2 h-2 rounded-full bg-[${COLORS.gold}] mr-2`} />
                    <Text style={tw`text-xs text-[${COLORS.gold}] font-medium`}>
                      Live Update
                    </Text>
                  </View>
                )}

                {/* Location for step if available */}
                {step.location && (
                  <TouchableOpacity 
                    style={tw`flex-row items-center mt-2`}
                    onPress={() => Alert.alert('Location', step.location?.address)}
                  >
                    <Ionicons name="location-outline" size={14} color={COLORS.gold} />
                    <Text style={tw`text-xs text-[${COLORS.gold}] ml-1`}>
                      View Location
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderDriverInfo = () => {
    if (!driverInfo) return null;

    return (
      <View style={tw`bg-white rounded-xl p-6 shadow-sm border border-[${COLORS.border}] mb-4`}>
        <Text style={tw`text-lg font-bold text-[${COLORS.text.primary}] mb-4`}>Driver Information</Text>
        
        <View style={tw`flex-row items-center`}>
          <View style={tw`w-16 h-16 rounded-full bg-[${COLORS.gold}]/20 items-center justify-center`}>
            <Ionicons name="person" size={32} color={COLORS.gold} />
          </View>
          
          <View style={tw`flex-1 ml-4`}>
            <Text style={tw`text-[${COLORS.text.primary}] font-bold text-lg`}>{driverInfo.name}</Text>
            <View style={tw`flex-row items-center mt-1`}>
              <Ionicons name="star" size={16} color={COLORS.gold} />
              <Text style={tw`text-[${COLORS.text.secondary}] ml-1`}>{driverInfo.rating} • {driverInfo.completedDeliveries} deliveries</Text>
            </View>
            <Text style={tw`text-[${COLORS.text.light}] text-sm mt-1`}>
              {driverInfo.vehicle} • {driverInfo.licensePlate}
            </Text>
          </View>
        </View>

        <View style={tw`flex-row mt-4`}>
          <TouchableOpacity 
            style={tw`flex-1 bg-[${COLORS.gold}] py-3 rounded-xl mr-2 flex-row items-center justify-center`}
            onPress={handleContactDriver}
          >
            <Ionicons name="call-outline" size={18} color="white" />
            <Text style={tw`text-white font-medium ml-2`}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={tw`flex-1 bg-[${COLORS.surface}] py-3 rounded-xl ml-2 flex-row items-center justify-center border border-[${COLORS.border}]`}
            onPress={handleShareLiveLocation}
          >
            <Ionicons name="share-outline" size={18} color={COLORS.text.primary} />
            <Text style={tw`text-[${COLORS.text.primary}] font-medium ml-2`}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderOrderSummary = () => {
    if (!order) return null;

    return (
      <View style={tw`bg-white rounded-xl p-6 shadow-sm border border-[${COLORS.border}] mb-4`}>
        <TouchableOpacity 
          style={tw`flex-row justify-between items-center`}
          onPress={() => setOrderSummaryExpanded(!orderSummaryExpanded)}
        >
          <Text style={tw`text-lg font-bold text-[${COLORS.text.primary}]`}>
            Order Summary
          </Text>
          <Ionicons 
            name={orderSummaryExpanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={COLORS.gold} 
          />
        </TouchableOpacity>

        {orderSummaryExpanded && (
          <View style={tw`mt-4`}>
            <View style={tw`mb-4`}>
              <Text style={tw`text-sm text-[${COLORS.text.light}] mb-1`}>Order ID</Text>
              <Text style={tw`text-base font-medium text-[${COLORS.text.primary}]`}>
                #{order.orderId}
              </Text>
            </View>

            <View style={tw`mb-4`}>
              <Text style={tw`text-sm text-[${COLORS.text.light}] mb-1`}>Service Type</Text>
              <View style={tw`flex-row items-center`}>
                <Ionicons 
                  name={
                    order.serviceOption === 'delivery' ? 'car' : 
                    order.serviceOption === 'self-pickup' ? 'arrow-down' : 
                    order.serviceOption === 'self-delivery' ? 'arrow-up' : 'person'
                  } 
                  size={16} 
                  color={COLORS.gold} 
                />
                <Text style={tw`text-base text-[${COLORS.text.primary}] ml-2 capitalize`}>
                  {order.serviceOption?.replace('-', ' ')}
                </Text>
              </View>
            </View>

            {/* Locations */}
            <View style={tw`mb-4`}>
              <View style={tw`flex-row items-center mb-2`}>
                <Ionicons name="location-outline" size={16} color={COLORS.gold} />
                <Text style={tw`text-sm text-[${COLORS.text.light}] ml-1`}>Pickup</Text>
              </View>
              <Text style={tw`text-sm text-[${COLORS.text.primary}] ml-5`}>
                {order.pickupAddress}
              </Text>
            </View>

            <View style={tw`mb-4`}>
              <View style={tw`flex-row items-center mb-2`}>
                <Ionicons name="navigate-outline" size={16} color={COLORS.gold} />
                <Text style={tw`text-sm text-[${COLORS.text.light}] ml-1`}>Delivery</Text>
              </View>
              <Text style={tw`text-sm text-[${COLORS.text.primary}] ml-5`}>
                {order.deliveryAddress}
              </Text>
            </View>

            {/* Items */}
            <View style={tw`mb-4`}>
              <View style={tw`flex-row items-center mb-2`}>
                <Ionicons name="cube-outline" size={16} color={COLORS.gold} />
                <Text style={tw`text-sm text-[${COLORS.text.light}] ml-1`}>Items</Text>
              </View>
              {order.items.map((item: OrderItem, index: number) => (
                <View key={item.id || index} style={tw`ml-5 mb-2`}>
                  <View style={tw`flex-row justify-between`}>
                    <Text style={tw`text-sm text-[${COLORS.text.primary}] flex-1`}>{item.description}</Text>
                    <Text style={tw`text-sm text-[${COLORS.gold}] font-medium`}>x{item.quantity}</Text>
                  </View>
                  {item.instructions && (
                    <Text style={tw`text-xs text-[${COLORS.text.light}] mt-1`}>
                      📝 {item.instructions}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* Price Breakdown */}
            <View style={tw`bg-[${COLORS.surface}] p-3 rounded-lg`}>
              <View style={tw`flex-row justify-between mb-2`}>
                <Text style={tw`text-[${COLORS.text.secondary}] text-sm`}>Subtotal</Text>
                <Text style={tw`text-[${COLORS.text.primary}] text-sm`}>₦{order.totalAmount.toLocaleString()}</Text>
              </View>
              <View style={tw`flex-row justify-between mb-2`}>
                <Text style={tw`text-[${COLORS.text.secondary}] text-sm`}>Pickup Fee</Text>
                <Text style={tw`text-[${COLORS.text.primary}] text-sm`}>₦{order.pickupFee.toLocaleString()}</Text>
              </View>
              <View style={tw`flex-row justify-between mb-2`}>
                <Text style={tw`text-[${COLORS.text.secondary}] text-sm`}>Delivery Fee</Text>
                <Text style={tw`text-[${COLORS.text.primary}] text-sm`}>₦{order.deliveryFee.toLocaleString()}</Text>
              </View>
              <View style={tw`flex-row justify-between pt-2 border-t border-[${COLORS.border}]`}>
                <Text style={tw`text-[${COLORS.text.primary}] font-bold`}>Total</Text>
                <Text style={tw`text-[${COLORS.gold}] font-bold`}>
                  ₦{(order.totalAmount + order.pickupFee + order.deliveryFee).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderActionButtons = () => {
    return (
      <View style={tw`bg-white rounded-xl p-4 shadow-sm border border-[${COLORS.border}] mb-4`}>
        <View style={tw`flex-row flex-wrap`}>
          <TouchableOpacity 
            style={tw`w-1/2 p-2 items-center`}
            onPress={() => setShowMap(true)}
          >
            <View style={tw`w-12 h-12 rounded-full bg-[${COLORS.gold}]/10 items-center justify-center mb-2`}>
              <Ionicons name="map" size={24} color={COLORS.gold} />
            </View>
            <Text style={tw`text-[${COLORS.text.primary}] text-sm`}>Live Map</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={tw`w-1/2 p-2 items-center`}
            onPress={handleShareLiveLocation}
          >
            <View style={tw`w-12 h-12 rounded-full bg-[${COLORS.gold}]/10 items-center justify-center mb-2`}>
              <Ionicons name="share" size={24} color={COLORS.gold} />
            </View>
            <Text style={tw`text-[${COLORS.text.primary}] text-sm`}>Share Location</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={tw`w-1/2 p-2 items-center`}
            onPress={handleReportIssue}
          >
            <View style={tw`w-12 h-12 rounded-full bg-[${COLORS.gold}]/10 items-center justify-center mb-2`}>
              <Ionicons name="alert-circle" size={24} color={COLORS.gold} />
            </View>
            <Text style={tw`text-[${COLORS.text.primary}] text-sm`}>Report Issue</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={tw`w-1/2 p-2 items-center`}
            onPress={handleRefresh}
          >
            <View style={tw`w-12 h-12 rounded-full bg-[${COLORS.gold}]/10 items-center justify-center mb-2`}>
              <Ionicons name="refresh" size={24} color={COLORS.gold} />
            </View>
            <Text style={tw`text-[${COLORS.text.primary}] text-sm`}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderNeedHelp = () => {
    return (
      <View style={tw`bg-white rounded-xl p-6 shadow-sm border border-[${COLORS.border}] mb-6`}>
        <View style={tw`flex-row items-center mb-3`}>
          <Ionicons name="help-circle-outline" size={24} color={COLORS.gold} />
          <Text style={tw`text-lg font-bold text-[${COLORS.text.primary}] ml-2`}>Need Help?</Text>
        </View>
        <Text style={tw`text-[${COLORS.text.secondary}] mb-4`}>
          Having issues with your order? Our support team is available 24/7
        </Text>
        <View style={tw`flex-row`}>
          <TouchableOpacity 
            style={tw`flex-1 bg-[${COLORS.gold}] py-3 rounded-xl mr-2 flex-row items-center justify-center`}
            onPress={() => Alert.alert('Call Support', 'Calling +234 800 123 4567')}
          >
            <Ionicons name="call-outline" size={18} color="white" />
            <Text style={tw`text-white font-medium ml-2`}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={tw`flex-1 bg-[${COLORS.surface}] py-3 rounded-xl ml-2 flex-row items-center justify-center border border-[${COLORS.border}]`}
            onPress={() => setShowSupportModal(true)}
          >
            <Ionicons name="chatbubble-outline" size={18} color={COLORS.text.primary} />
            <Text style={tw`text-[${COLORS.text.primary}] font-medium ml-2`}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={tw`flex-1 bg-white`}>
        <LinearGradient
          colors={[COLORS.gold, COLORS.goldDark]}
          style={tw`p-4 pt-12 flex-row items-center`}
        >
          <TouchableOpacity onPress={onBack} style={tw`mr-4`}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={tw`text-white text-xl font-bold flex-1`}>Track Order</Text>
        </LinearGradient>
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={tw`text-[${COLORS.text.secondary}] mt-2`}>Loading tracking information...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-[${COLORS.surface}]`}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[COLORS.gold, COLORS.goldDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={tw`p-4 pt-12`}
      >
        <View style={tw`flex-row items-center`}>
          <TouchableOpacity onPress={onBack} style={tw`mr-4`}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={tw`flex-1`}>
            <Text style={tw`text-white text-xl font-bold`}>Track Order</Text>
            <Text style={tw`text-white/80 text-sm mt-1`}>#{orderId}</Text>
          </View>
          <TouchableOpacity 
            style={tw`bg-white/20 p-2 rounded-full`}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Status Banner */}
        <View style={tw`bg-white/10 rounded-xl p-3 mt-4 flex-row items-center`}>
          <View style={tw`bg-white/20 p-2 rounded-full mr-3`}>
            <Ionicons name="car" size={20} color="white" />
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`text-white font-bold text-base`}>
              {order?.status === 'in-transit' ? 'Order In Transit' : order?.status}
            </Text>
            <Text style={tw`text-white/70 text-sm`}>
              {order?.estimatedDelivery ? `Est: ${order.estimatedDelivery}` : 'Live tracking active'}
            </Text>
          </View>
          <View style={tw`bg-green-500 px-2 py-1 rounded-full`}>
            <Text style={tw`text-white text-xs font-medium`}>LIVE</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={tw`flex-1`} 
        contentContainerStyle={tw`p-4`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.gold]} />
        }
      >
        {/* Driver Info */}
        {renderDriverInfo()}

        {/* Action Buttons */}
        {renderActionButtons()}

        {/* Tracking Timeline */}
        {renderTrackingTimeline()}

        {/* Order Summary */}
        {renderOrderSummary()}

        {/* Need Help Section */}
        {renderNeedHelp()}
      </ScrollView>

      {/* Modals */}
      {renderLiveMap()}
      {renderSupportModal()}
      {renderChatModal()}
    </View>
  );
};

export default OrderTracking;