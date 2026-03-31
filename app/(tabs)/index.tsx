import { useEffect, useRef, useState } from 'react';
import { 
  Text, 
  View, 
  TouchableOpacity, 
  Animated, 
  Image, 
  Platform, 
  Linking, 
  Alert,
  ScrollView,
  StatusBar,
  RefreshControl,
  Dimensions,
  SafeAreaView,
  FlatList,
  Modal,
  PanResponder,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from 'twrnc';
import { router } from 'expo-router';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// OPay-inspired color palette - Clean and professional
const COLORS = {
  primary: '#b7790f',
  primaryLight: '#FFE55C',
  primaryDark: '#F59E00',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  card: '#FFFFFF',
  text: {
    primary: '#1A1A1A',
    secondary: '#666666',
    tertiary: '#999999',
    light: '#FFFFFF',
    gold: '#FFD700',
  },
  border: '#E5E5E5',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Notification Item Component
const NotificationItem = ({ item, onPress, onDone }) => {
  const pan = useRef(new Animated.Value(0)).current;
  
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx < 0) {
        pan.setValue(gestureState.dx);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -50) {
        Animated.timing(pan, {
          toValue: -width,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onDone(item.id);
        });
      } else {
        Animated.spring(pan, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        tw`mb-2 rounded-xl overflow-hidden`,
        {
          transform: [{ translateX: pan }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => onPress(item)}
        activeOpacity={0.7}
        style={tw`bg-white p-4 border border-[${COLORS.border}] rounded-xl`}
      >
        <View style={tw`flex-row items-start`}>
          <View style={tw`w-10 h-10 rounded-full bg-[${COLORS.surface}] items-center justify-center mr-3`}>
            <Ionicons 
              name={item.icon || 'notifications'} 
              size={20} 
              color={item.status === 'unread' ? COLORS.primary : COLORS.text.secondary} 
            />
          </View>
          <View style={tw`flex-1`}>
            <View style={tw`flex-row justify-between items-center mb-1`}>
              <Text style={tw`text-[${COLORS.text.primary}] font-bold text-sm flex-1`}>
                {item.title}
              </Text>
              {item.status === 'unread' && (
                <View style={tw`w-2 h-2 rounded-full bg-[${COLORS.primary}] ml-2`} />
              )}
            </View>
            <Text style={tw`text-[${COLORS.text.secondary}] text-xs mb-1`} numberOfLines={2}>
              {item.message}
            </Text>
            <Text style={tw`text-[${COLORS.text.tertiary}] text-xs`}>
              {item.time || 'Just now'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Notification Detail Modal Component
const NotificationDetailModal = ({ visible, notification, onClose, onDone }) => {
  if (!notification) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 bg-black/50`}>
        <View style={tw`flex-1 mt-16 bg-white rounded-t-3xl`}>
          <View style={tw`flex-row items-center p-4 border-b border-[${COLORS.border}]`}>
            <TouchableOpacity 
              onPress={onClose}
              style={tw`mr-3 p-1`}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={tw`text-[${COLORS.text.primary}] text-lg font-bold`}>Notification Details</Text>
          </View>

          <ScrollView style={tw`flex-1 p-4`}>
            <View style={tw`items-center mb-6`}>
              <View style={tw`w-20 h-20 rounded-full bg-[${COLORS.surface}] items-center justify-center mb-4`}>
                <Ionicons 
                  name={notification.icon || 'notifications'} 
                  size={40} 
                  color={COLORS.primary} 
                />
              </View>
              <Text style={tw`text-[${COLORS.text.primary}] text-xl font-bold text-center mb-2`}>
                {notification.title}
              </Text>
              <Text style={tw`text-[${COLORS.text.tertiary}] text-sm`}>
                {notification.time || 'Just now'}
              </Text>
            </View>

            <View style={tw`bg-[${COLORS.surface}] rounded-xl p-4 mb-6`}>
              <Text style={tw`text-[${COLORS.text.primary}] text-base leading-6`}>
                {notification.message}
              </Text>
            </View>

            {notification.data && (
              <View style={tw`mb-6`}>
                <Text style={tw`text-[${COLORS.text.secondary}] text-sm font-medium mb-2`}>Additional Information</Text>
                <View style={tw`bg-white rounded-xl border border-[${COLORS.border}] p-4`}>
                  {Object.entries(notification.data).map(([key, value]) => (
                    <View key={key} style={tw`flex-row justify-between py-2 border-b border-[${COLORS.border}] last:border-b-0`}>
                      <Text style={tw`text-[${COLORS.text.secondary}] text-sm capitalize`}>{key}:</Text>
                      <Text style={tw`text-[${COLORS.text.primary}] text-sm font-medium`}>{value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={tw`bg-[${COLORS.primary}] py-3 rounded-lg mb-3`}
              onPress={() => {
                onDone(notification.id);
                onClose();
              }}
            >
              <Text style={tw`text-[${COLORS.text.primary}] text-center font-bold text-sm`}>
                Mark as Done
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`py-3`}
              onPress={onClose}
            >
              <Text style={tw`text-[${COLORS.text.secondary}] text-center text-sm`}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Main Notification Modal Component
const NotificationModal = ({ 
  visible, 
  onClose, 
  notifications, 
  loading, 
  unreadCount, 
  onNotificationPress, 
  onNotificationDone, 
  onMarkAllRead,
  selectedNotification,
  onSelectedNotificationClose
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 bg-black/50`}>
        <View style={tw`flex-1 mt-16 bg-white rounded-t-3xl`}>
          <View style={tw`flex-row justify-between items-center p-4 border-b border-[${COLORS.border}]`}>
            <View style={tw`flex-row items-center`}>
              <TouchableOpacity 
                onPress={onClose}
                style={tw`mr-3 p-1`}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
              <Text style={tw`text-[${COLORS.text.primary}] text-lg font-bold`}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={tw`ml-2 bg-[${COLORS.primary}] px-2 py-0.5 rounded-full`}>
                  <Text style={tw`text-white text-xs font-bold`}>{unreadCount} new</Text>
                </View>
              )}
            </View>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={onMarkAllRead}>
                <Text style={tw`text-[${COLORS.primary}] text-sm font-medium`}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={tw`flex-1 justify-center items-center`}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : notifications.length === 0 ? (
            <View style={tw`flex-1 justify-center items-center px-4`}>
              <Ionicons name="notifications-off-outline" size={64} color={COLORS.text.tertiary} />
              <Text style={tw`text-[${COLORS.text.secondary}] text-base mt-4 text-center`}>
                No notifications yet
              </Text>
              <Text style={tw`text-[${COLORS.text.tertiary}] text-sm text-center mt-2`}>
                We'll notify you when something important happens
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={({ item }) => (
                <NotificationItem 
                  item={item} 
                  onPress={onNotificationPress}
                  onDone={onNotificationDone}
                />
              )}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={tw`p-4`}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>

      <NotificationDetailModal
        visible={selectedNotification !== null}
        notification={selectedNotification}
        onClose={onSelectedNotificationClose}
        onDone={onNotificationDone}
      />
    </Modal>
  );
};

export default function HomeScreen() {
  // State management
  const [rideBalance, setRideBalance] = useState(0);
  const [rideBonus, setRideBonus] = useState(0);
  const [alsBalance, setAlsBalance] = useState(0);
  const [PROW, setPROW] = useState(0);
  const [alsBonus, setAlsBonus] = useState(0);
  const [mobile, setMobile] = useState('');
  const [appMessage, setAppMessage] = useState('');
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [appUpgrade, setAppUpgrade] = useState(false);
  const [appUpgradeStatus, setAppUpgradeStatus] = useState('');
  const [verification, setVerification] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [showPendingOrderOverlay, setShowPendingOrderOverlay] = useState(false);
  const [appMode, setAppMode] = useState('');

  // Transaction state - ONLY 3 most recent transactions
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Header animations
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  // Quick actions data
  // const quickActions = [
  //   { id: 1, name: 'Ride', icon: 'car', route: '/Ride', color: COLORS.primary, bgColor: '#FFF9E6' },
  //   { id: 2, name: 'Laundry', icon: 'tshirt', route: '/als', color: COLORS.text.primary, bgColor: '#F5F5F5' },
  //   { id: 3, name: 'Logistic', icon: 'truck', route: '/Logistic', color: COLORS.primary, bgColor: '#FFF9E6' },
  //   { id: 4, name: 'Food', icon: 'pizza-slice', route: '/Food', color: COLORS.text.primary, bgColor: '#F5F5F5' },
  //   { id: 5, name: 'PROW', icon: 'credit-card', route: '/Prow', color: COLORS.primary, bgColor: '#FFF9E6' },
  //   { id: 6, name: 'Shop', icon: 'store', route: '/Shop', color: COLORS.text.primary, bgColor: '#F5F5F5' },
  // ];
  const quickActions = [
    { id: 1, name: 'Ride', icon: 'car', route: '#', color: COLORS.primary, bgColor: '#FFF9E6' },
    { id: 2, name: 'Laundry', icon: 'tshirt', route: '/als', color: COLORS.text.primary, bgColor: '#F5F5F5' },
    { id: 3, name: 'Logistic', icon: 'truck', route: '#', color: COLORS.primary, bgColor: '#FFF9E6' },
    { id: 4, name: 'Food', icon: 'pizza-slice', route: '#', color: COLORS.text.primary, bgColor: '#F5F5F5' },
    { id: 5, name: 'PROW', icon: 'credit-card', route: '#', color: COLORS.primary, bgColor: '#FFF9E6' },
    { id: 6, name: 'Shop', icon: 'store', route: '#', color: COLORS.text.primary, bgColor: '#F5F5F5' },
  ];

  // Promotions data
  const promotions = [
    { id: 1, title: 'First Ride', description: 'Get 50% off', icon: 'car', bgColor: COLORS.primary },
    { id: 2, title: 'Laundry Day', description: 'Free pickup', icon: 'water', bgColor: COLORS.text.primary },
    { id: 3, title: 'Refer & Earn', description: 'N500 bonus', icon: 'people', bgColor: COLORS.primary },
  ];

  // API Functions
  const fetchTransactions = async () => {
    if (!mobile) return;
    
    setLoadingTransactions(true);
    try {
      const response = await fetch(`https://hoog.ng/infiniteorder/api/CustomerService/get_Transactions.php?mobile=${mobile}`);
      const result = await response.json();
      
      if (result.success) {
        // The API already returns ONLY 3 most recent transactions
        setRecentTransactions(result.data);
      }
    } catch (error) {
      console.log('Error fetching transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchData = async () => {
    if (!mobile) return;
    
    try {
      const [rideRes, alsRes, prowRes, profileRes, orderRes] = await Promise.all([
        fetch(`https://hoog.ng/infiniteorder/api/Customers/sumRideBalance.php?mobile=${mobile}`),
        fetch(`https://hoog.ng/infiniteorder/api/Customers/sumAlsBalance.php?mobile=${mobile}`),
        fetch(`https://hoog.ng/infiniteorder/api/Customers/sumProwBalance.php?mobile=${mobile}`),
        fetch(`https://hoog.ng/infiniteorder/api/Customers/readProfile.php?mobile=${mobile}`),
        fetch(`https://hoog.ng/infiniteorder/api/Customers/getOrderStatus.php?mobile=${mobile}`)
      ]);

      const rideData = await rideRes.json();
      const alsData = await alsRes.json();
      const prowData = await prowRes.json();
      const profileData = await profileRes.json();
      const orderData = await orderRes.json();

      setRideBonus(rideData[0]?.bonus || 0);
      setRideBalance(rideData[0]?.balance || 0);
      setAlsBonus(alsData[0]?.bonus || 0);
      setAlsBalance(alsData[0]?.balance || 0);
      setPROW(prowData[0]?.balance || 0);
      setVerification(profileData[0]?.verification_status);
      setUserName(profileData[0]?.fullname || 'User');
      setProfileImage(profileData[0]?.customer_image || '');

      if (orderData[0]?.orderStatus !== 'Completed') {
        setPendingOrder(orderData[0]);
        setShowPendingOrderOverlay(true);
      }
    } catch (error) {
      console.log('Error fetching data:', error);
    }
  };

  // Notification Functions
  const fetchNotifications = async () => {
    if (!mobile) return;
    
    setLoadingNotifications(true);
    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/getNotifications.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });
      
      const result = await response.json();
      
      if (result.status === 200 && Array.isArray(result.data)) {
        setNotifications(result.data);
        const unread = result.data.filter(n => n.status === 'unread').length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.log('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/markNotificationAsRead.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          notification_id: notificationId,
          mobile: mobile 
        }),
      });
      
      const result = await response.json();
      
      if (result.status === 200) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, status: 'read' } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.log('Error marking notification as read:', error);
    }
  };

  const markNotificationAsDone = async (notificationId) => {
    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/markNotificationAsDone.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          notification_id: notificationId,
          mobile: mobile 
        }),
      });
      
      const result = await response.json();
      
      if (result.status === 200) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (selectedNotification?.id === notificationId) {
          setSelectedNotification(null);
        }
        setUnreadCount(prev => {
          const wasUnread = notifications.find(n => n.id === notificationId)?.status === 'unread';
          return wasUnread ? Math.max(0, prev - 1) : prev;
        });
      }
    } catch (error) {
      console.log('Error marking notification as done:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/markAllNotificationsAsRead.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobile }),
      });
      
      const result = await response.json();
      
      if (result.status === 200) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, status: 'read' }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.log('Error marking all as read:', error);
    }
  };

  const fetchAppMessage = async () => {
    try {
      const res = await fetch('https://hoog.ng/infiniteorder/api/Settings/readAppMessage.php');
      const data = await res.json();
      setAppMessage(data[0]?.message || '');
    } catch (error) {
      console.log('Error fetching app message:', error);
    }
  };

  const fetchAppUpgrade = async () => {
    try {
      const res = await fetch('https://hoog.ng/infiniteorder/api/Settings/readAppupgrade.php');
      const data = await res.json();
      setAppUpgradeStatus(data[0]?.upgrade);
      if (data[0]?.upgrade === 'Y') {
        setAppUpgrade(true);
      }
    } catch (error) {
      console.log('Error fetching app upgrade:', error);
    }
  };

  // Effects
  useEffect(() => {
    const initializeApp = async () => {
      const myMobile = await AsyncStorage.getItem('mobile');
      const appmode = await AsyncStorage.getItem('AppMode');

      if (myMobile) {
        setMobile(myMobile);
        setAppMode(appmode);
      }

      await fetchAppMessage();
      await fetchAppUpgrade();
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (mobile) {
      fetchData();
      fetchTransactions(); // Fetch ONLY 3 most recent transactions
      fetchNotifications();
      
      const interval = setInterval(() => {
        fetchData();
        fetchTransactions(); // Refresh transactions every 10 seconds
        fetchNotifications();
        fetchAppMessage();
        fetchAppUpgrade();
      }, 100000);

      return () => clearInterval(interval);
    }
  }, [mobile]);

  useEffect(() => {
    if (verification === 'N' && appUpgradeStatus !== 'Y') {
      setIsOverlayVisible(true);
      animateOverlay(true);
    }
  }, [verification, appUpgradeStatus]);

  // Animation functions
  const animateOverlay = (show) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: show ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: show ? 0 : 20,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: show ? 1 : 0.95,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handlers
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchData(), 
      fetchTransactions(), // Refresh transactions on pull-to-refresh
      fetchNotifications()
    ]);
    setRefreshing(false);
  };

  const hideOverlay = () => {
    animateOverlay(false);
    setTimeout(() => setIsOverlayVisible(false), 300);
  };

  const hideUpgradeOverlay = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setAppUpgrade(false));
  };

  const openAppDownload = () => {
    const url = Platform.OS === 'android'
      ? 'https://infiniteorder.ng/download/app-release.apk'
      : 'https://infiniteorder.ng/download/app-release.ipa';
    Linking.openURL(url);
  };

  const deleteUnacceptedOrder = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          onPress: async () => {
            try {
              await fetch('https://hoog.ng/infiniteorder/api/TransportOrders/deleteCustomerUnpickedOrder.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile }),
              });
              setShowPendingOrderOverlay(false);
              setPendingOrder(null);
              Alert.alert('Success', 'Ride cancelled successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel ride');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleNotificationPress = (notification) => {
    setSelectedNotification(notification);
    if (notification.status === 'unread') {
      markNotificationAsRead(notification.id);
    }
  };

  const handleNotificationDone = (notificationId) => {
    Alert.alert(
      'Mark as Done',
      'Are you sure you want to remove this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Remove', 
          onPress: () => markNotificationAsDone(notificationId),
          style: 'destructive'
        }
      ]
    );
  };

  const formatCurrency = (amount) => `₦${amount?.toLocaleString() || '0'}`;
  const totalBalance = Number(rideBalance || 0) + Number(alsBalance || 0) + Number(PROW || 0);

  // Render Functions
  const renderHeader = () => (
    <Animated.View style={{ opacity: headerOpacity }}>
      <View style={tw`bg-yellow-100 pt-12 pb-4 px-4`}>
        <View style={tw`flex-row justify-between items-center`}>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/account')}
            style={tw`flex-row items-center`}
            activeOpacity={0.7}
          >
            <View style={tw`relative`}>
              {profileImage ? (
                <Image
                  source={{ uri: `${profileImage}` }}
                  style={tw`w-12 h-12 rounded-full border-2 border-white`}
                />
              ) : (
                <View style={tw`w-12 h-12 rounded-full bg-black items-center justify-center border-2 border-white`}>
                  <Text style={tw`text-[${COLORS.primary}] text-lg font-bold`}>
                    {userName?.charAt(0) || 'IO'}
                  </Text>
                </View>
              )}
              <View style={tw`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white`} />
            </View>
            
            <View style={tw`ml-3`}>
              <Text style={tw`text-black/60 text-xs`}>Welcome back</Text>
              <Text style={tw`text-black text-base font-bold`}>
                {userName?.split(' ')[0] || 'User'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={tw`flex-row`}>
            <TouchableOpacity 
              style={tw`bg-black/10 p-2 rounded-full mr-2`}
              onPress={() => setShowBalance(!showBalance)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={showBalance ? 'eye-outline' : 'eye-off-outline'} 
                size={20} 
                color={COLORS.text.primary} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={tw`bg-black/10 p-2 rounded-full relative`}
              onPress={() => {
                fetchNotifications();
                setShowNotifications(true);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={20} color={COLORS.text.primary} />
              {unreadCount > 0 && (
                <View style={tw`absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full items-center justify-center px-1`}>
                  <Text style={tw`text-white text-xs font-bold`}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderBalanceCard = () => (
    <View style={tw`px-4 -mt-4`}>
      <View style={tw`bg-white rounded-xl p-4 shadow-sm border border-[${COLORS.border}]`}>
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <Text style={tw`text-[${COLORS.text.secondary}] text-sm`}>Total Balance</Text>
          <TouchableOpacity onPress={() => router.push('/AllTransactionHistory')}>
            <Text style={tw`text-[${COLORS.primary}] text-xs font-medium`}>View Details</Text>
          </TouchableOpacity>
        </View>

        <Text style={tw`text-[${COLORS.text.primary}] text-3xl font-bold mb-4`}>
          {showBalance ? formatCurrency(totalBalance) : '₦••••••'}
        </Text>

        <View style={tw`flex-row justify-between pt-4 border-t border-[${COLORS.border}]`}>
          {/* Ride Wallet */}
          <View style={tw`flex-1`}>
            <View style={tw`flex-row items-center justify-between mb-1`}>
              <Text style={tw`text-[${COLORS.text.tertiary}] text-xs`}>Ride</Text>
              <TouchableOpacity 
                onPress={() => router.push({
                  pathname: '/AddMoney',
                  params: { walletType: 'ride' }
                })}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={tw`w-5 h-5 rounded-full bg-[${COLORS.primary}] items-center justify-center`}>
                  <Ionicons name="add" size={14} color={COLORS.text.primary} />
                </View>
              </TouchableOpacity>
            </View>
            <Text style={tw`text-[${COLORS.text.primary}] font-bold text-base`}>
              {showBalance ? formatCurrency(Number(rideBalance)) : '₦•••'}
            </Text>
            {rideBonus > 0 && (
              <Text style={tw`text-[${COLORS.success}] text-xs mt-1`}>+₦{rideBonus} bonus</Text>
            )}
          </View>
          
          <View style={tw`w-px h-14 bg-[${COLORS.border}] mx-2`} />
          
          {/* Laundry Wallet */}
          <View style={tw`flex-1`}>
            <View style={tw`flex-row items-center justify-between mb-1`}>
              <Text style={tw`text-[${COLORS.text.tertiary}] text-xs`}>Laundry</Text>
              <TouchableOpacity 
                onPress={() => router.push({
                  pathname: '/AddMoney',
                  params: { walletType: 'laundry' }
                })}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={tw`w-5 h-5 rounded-full bg-[${COLORS.primary}] items-center justify-center`}>
                  <Ionicons name="add" size={14} color={COLORS.text.primary} />
                </View>
              </TouchableOpacity>
            </View>
            <Text style={tw`text-[${COLORS.text.primary}] font-bold text-base`}>
              {showBalance ? formatCurrency(Number(alsBalance)) : '₦•••'}
            </Text>
            {alsBonus > 0 && (
              <Text style={tw`text-[${COLORS.success}] text-xs mt-1`}>{}20 orders for bonus</Text>
            )}
          </View>
          
          <View style={tw`w-px h-14 bg-[${COLORS.border}] mx-2`} />
          
          {/* PROW Wallet */}
          <View style={tw`flex-1`}>
            <View style={tw`flex-row items-center justify-between mb-1`}>
              <Text style={tw`text-[${COLORS.text.tertiary}] text-xs`}>PROW</Text>
              <TouchableOpacity 
                onPress={() => router.push({
                  pathname: '/AddMoney',
                  params: { walletType: 'prow' }
                })}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={tw`w-5 h-5 rounded-full bg-[${COLORS.primary}] items-center justify-center`}>
                  <Ionicons name="add" size={14} color={COLORS.text.primary} />
                </View>
              </TouchableOpacity>
            </View>
            <Text style={tw`text-[${COLORS.text.primary}] font-bold text-base`}>
              {showBalance ? formatCurrency(Number(PROW)) : '₦•••'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={tw`px-4 mt-6`}>
      <Text style={tw`text-[${COLORS.text.primary}] font-bold text-base mb-3`}>Quick Actions</Text>
      <View style={tw`flex-row flex-wrap`}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={tw`w-[16.666%] items-center`}
            onPress={() => router.push(action.route)}
            activeOpacity={0.7}
          >
            <View style={[tw`w-12 h-12 rounded-full items-center justify-center mb-1`, { backgroundColor: action.bgColor }]}>
              <FontAwesome5 name={action.icon} size={20} color={action.color} />
            </View>
            <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>{action.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPromotions = () => (
    <View style={tw`mt-6`}>
      <View style={tw`flex-row justify-between items-center px-4 mb-3`}>
        <Text style={tw`text-[${COLORS.text.primary}] font-bold text-base`}>Special Offers(Coming Soon!)</Text>
        <TouchableOpacity>
          <Text style={tw`text-[${COLORS.primary}] text-xs font-medium`}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tw`px-4`}
      >
        {promotions.map((promo) => (
          <TouchableOpacity
            key={promo.id}
            style={tw`mr-3`}
            activeOpacity={0.7}
          >
            <View style={[tw`w-32 h-32 rounded-xl p-3`, { backgroundColor: promo.bgColor }]}>
              <View style={tw`w-8 h-8 bg-white/20 rounded-full items-center justify-center mb-2`}>
                <Ionicons name={promo.icon} size={16} color="white" />
              </View>
              <Text style={tw`text-white font-bold text-sm`}>{promo.title}</Text>
              <Text style={tw`text-white/80 text-xs mt-1`}>{promo.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Updated renderTransactions function to display ONLY 3 most recent transactions
  const renderTransactions = () => (
    <View style={tw`px-4 mt-6 mb-8`}>
      <View style={tw`flex-row justify-between items-center mb-3`}>
        <Text style={tw`text-[${COLORS.text.primary}] font-bold text-base`}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => router.push('/AllTransactionHistory')}>
          <Text style={tw`text-[${COLORS.primary}] text-xs font-medium`}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={tw`bg-white rounded-xl border border-[${COLORS.border}]`}>
        {loadingTransactions ? (
          <View style={tw`py-8 items-center`}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={tw`text-[${COLORS.text.secondary}] text-sm mt-2`}>Loading transactions...</Text>
          </View>
        ) : recentTransactions.length > 0 ? (
          recentTransactions.map((transaction, index) => (
            <TouchableOpacity
              key={transaction.id}
              style={tw`flex-row items-center p-3 ${index !== recentTransactions.length - 1 ? 'border-b border-[${COLORS.border}]' : ''}`}
              activeOpacity={0.7}
              onPress={() => {
                // Optional: Navigate to transaction details
                // router.push({
                //   pathname: '/TransactionDetails',
                //   params: { transaction: JSON.stringify(transaction) }
                // });
              }}
            >
              <View style={tw`w-10 h-10 rounded-full bg-[${COLORS.surface}] items-center justify-center mr-3`}>
                <Ionicons 
                  name={transaction.icon} 
                  size={18} 
                  color={transaction.type === 'credit' ? COLORS.success : COLORS.text.primary} 
                />
              </View>
              
              <View style={tw`flex-1`}>
                <Text style={tw`text-[${COLORS.text.primary}] font-medium text-sm`}>
                  {transaction.title}
                </Text>
                <Text style={tw`text-[${COLORS.text.tertiary}] text-xs mt-0.5`}>
                  {transaction.date}
                </Text>
              </View>
              
              <Text style={[
                tw`font-bold text-sm`,
                transaction.type === 'credit' ? tw`text-green-600` : tw`text-red-600`
              ]}>
                {transaction.amount}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={tw`py-8 items-center`}>
            <Ionicons name="receipt-outline" size={40} color={COLORS.text.tertiary} />
            <Text style={tw`text-[${COLORS.text.secondary}] text-sm mt-2`}>No transactions yet</Text>
            <TouchableOpacity 
              style={tw`mt-3 bg-[${COLORS.primary}] px-4 py-2 rounded-lg`}
              onPress={() => router.push('/AddMoney')}
            >
              <Text style={tw`text-[${COLORS.text.primary}] text-xs font-medium`}>Fund Wallet</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderAppMessage = () => (
    appMessage ? (
      <View style={tw`bg-[${COLORS.text.primary}] py-2 px-4`}>
        <View style={tw`flex-row items-center`}>
          <Ionicons name="megaphone" size={14} color={COLORS.primary} />
          <Text style={tw`text-[${COLORS.primary}] text-xs ml-2`}>{appMessage}</Text>
        </View>
      </View>
    ) : null
  );

  const renderVerificationOverlay = () => (
    <Animated.View
      style={[
        tw`absolute top-0 left-0 right-0 bottom-0 justify-center items-center z-50`,
        { backgroundColor: COLORS.overlay, opacity: fadeAnim }
      ]}
    >
      <Animated.View 
        style={[
          tw`bg-white rounded-2xl w-[85%] p-6`,
          {
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <View style={tw`items-center mb-4`}>
          <View style={tw`w-16 h-16 rounded-full bg-[${COLORS.primary}] items-center justify-center mb-3`}>
            <Ionicons name="shield-checkmark" size={32} color={COLORS.text.primary} />
          </View>
          <Text style={tw`text-[${COLORS.text.primary}] text-lg font-bold mb-2`}>Verify Your Account</Text>
          <Text style={tw`text-[${COLORS.text.secondary}] text-center text-sm`}>
            Complete verification to unlock all features and earn N2,500 bonus
          </Text>
        </View>

        <TouchableOpacity
          style={tw`bg-[${COLORS.primary}] py-3 rounded-lg mb-3`}
          onPress={() => router.push('/VerifyImages')}
          activeOpacity={0.7}
        >
          <Text style={tw`text-[${COLORS.text.primary}] text-center font-bold text-sm`}>Verify Now</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={hideOverlay}>
          <Text style={tw`text-[${COLORS.text.secondary}] text-center text-sm`}>Skip for now</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );

  const renderUpgradeOverlay = () => (
    <Animated.View
      style={[
        tw`absolute top-0 left-0 right-0 bottom-0 justify-center items-center z-50`,
        { backgroundColor: COLORS.overlay, opacity: fadeAnim }
      ]}
    >
      <Animated.View 
        style={[
          tw`bg-white rounded-2xl w-[85%] p-6`,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <View style={tw`items-center mb-4`}>
          <View style={tw`w-16 h-16 rounded-full bg-[${COLORS.primary}] items-center justify-center mb-3`}>
            <Ionicons name="rocket" size={32} color={COLORS.text.primary} />
          </View>
          <Text style={tw`text-[${COLORS.text.primary}] text-lg font-bold mb-2`}>Update Available</Text>
          <Text style={tw`text-[${COLORS.text.secondary}] text-center text-sm mb-4`}>
            New features and improvements are waiting for you
          </Text>

          <View style={tw`w-full bg-[${COLORS.surface}] rounded-lg p-3 mb-4`}>
            <View style={tw`flex-row items-center mb-2`}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={tw`text-[${COLORS.text.primary}] text-xs ml-2`}>Faster performance</Text>
            </View>
            <View style={tw`flex-row items-center mb-2`}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={tw`text-[${COLORS.text.primary}] text-xs ml-2`}>New features</Text>
            </View>
            <View style={tw`flex-row items-center`}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={tw`text-[${COLORS.text.primary}] text-xs ml-2`}>Security improvements</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={tw`bg-[${COLORS.primary}] py-3 rounded-lg mb-3`}
          onPress={openAppDownload}
          activeOpacity={0.7}
        >
          <Text style={tw`text-[${COLORS.text.primary}] text-center font-bold text-sm`}>Update Now</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={hideUpgradeOverlay}>
          <Text style={tw`text-[${COLORS.text.secondary}] text-center text-sm`}>Maybe Later</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );

  const renderPendingOrderOverlay = () => (
    <Animated.View
      style={[
        tw`absolute top-0 left-0 right-0 bottom-0 justify-center items-center z-50`,
        { backgroundColor: COLORS.overlay, opacity: fadeAnim }
      ]}
    >
      <Animated.View 
        style={[
          tw`bg-white rounded-2xl w-[85%] p-6`,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <View style={tw`items-center mb-4`}>
          <View style={tw`w-16 h-16 rounded-full bg-[${COLORS.primary}] items-center justify-center mb-3`}>
            <Ionicons name="car" size={32} color={COLORS.text.primary} />
          </View>
          <Text style={tw`text-[${COLORS.text.primary}] text-lg font-bold mb-2`}>Pending Ride</Text>
        </View>

        <View style={tw`bg-[${COLORS.surface}] rounded-lg p-3 mb-4`}>
          <View style={tw`flex-row items-center mb-2`}>
            <Ionicons name="location" size={14} color={COLORS.text.secondary} />
            <Text style={tw`text-[${COLORS.text.primary}] text-xs ml-2 flex-1`} numberOfLines={1}>
              {pendingOrder?.origin}
            </Text>
          </View>
          <View style={tw`flex-row items-center`}>
            <Ionicons name="flag" size={14} color={COLORS.text.secondary} />
            <Text style={tw`text-[${COLORS.text.primary}] text-xs ml-2 flex-1`} numberOfLines={1}>
              {pendingOrder?.destination}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={tw`bg-[${COLORS.primary}] py-3 rounded-lg mb-2`}
          onPress={() => router.push('/map')}
          activeOpacity={0.7}
        >
          <Text style={tw`text-[${COLORS.text.primary}] text-center font-bold text-sm`}>Continue Ride</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`py-3`}
          onPress={deleteUnacceptedOrder}
        >
          <Text style={tw`text-[${COLORS.error}] text-center text-sm`}>Cancel Ride</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );

  const renderNotificationModal = () => (
    <NotificationModal
      visible={showNotifications}
      onClose={() => setShowNotifications(false)}
      notifications={notifications}
      loading={loadingNotifications}
      unreadCount={unreadCount}
      onNotificationPress={handleNotificationPress}
      onNotificationDone={handleNotificationDone}
      onMarkAllRead={markAllAsRead}
      selectedNotification={selectedNotification}
      onSelectedNotificationClose={() => setSelectedNotification(null)}
    />
  );

  return (
  <SafeAreaView style={tw`flex-1 bg-[${COLORS.background}]`}>
    <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />
    
    {/* Safely render app message */}
    {appMessage ? (
      <View style={tw`bg-[${COLORS.text.primary}] py-2 px-4`}>
        <View style={tw`flex-row items-center`}>
          <Ionicons name="megaphone" size={14} color={COLORS.primary} />
          <Text style={tw`text-[${COLORS.primary}] text-xs ml-2`}>{appMessage}</Text>
        </View>
      </View>
    ) : null}
    
    {renderHeader()}

    <Animated.ScrollView
      showsVerticalScrollIndicator={false}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor={COLORS.primary}
        />
      }
    >
      {renderBalanceCard()}
      {renderQuickActions()}
      {renderPromotions()}
      {renderTransactions()}
    </Animated.ScrollView>

    {appUpgrade && renderUpgradeOverlay()}
    {isOverlayVisible && renderVerificationOverlay()}
    {showPendingOrderOverlay && pendingOrder && renderPendingOrderOverlay()}
    {renderNotificationModal()}
  </SafeAreaView>
);
}