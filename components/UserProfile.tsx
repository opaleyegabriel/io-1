import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  Alert, 
  ActivityIndicator, 
  ScrollView,
  StatusBar,
  Clipboard,
  Platform,
  SafeAreaView,
  Animated,
  Dimensions
} from 'react-native';
import { FontAwesome5, MaterialIcons, Ionicons, Feather, SimpleLineIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#b7790f',
  primaryDark: '#E5A50A',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    light: '#9CA3AF',
  },
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
};

const ProfileScreen = ({ user }) => {
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const slideAnim = useRef(new Animated.Value(width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Modal States
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Reset animation when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset animation values
      slideAnim.setValue(width);
      fadeAnim.setValue(0);
      
      // Start entrance animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  useEffect(() => {
    loadUserData();
  }, []);

  const handleGoBack = () => {
    // Exit animation before going back
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  };

  const loadUserData = async () => {
    try {
      const name = await AsyncStorage.getItem("name");
      const phone = await AsyncStorage.getItem("mobile");
      const img = await AsyncStorage.getItem('ProfileImage');
      const mail = await AsyncStorage.getItem('email');

      setCustomerName(name || 'User');
      setMobile(phone || '');
      setProfileImage(img || '');
      setEmail(mail || '');
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // Animate out before logout
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      await AsyncStorage.clear();
      router.replace("/SignUpScreen");
    });
  };

  const copyToClipboard = (phoneNumber) => {
    Clipboard.setString(phoneNumber);
    Alert.alert("Success", "Phone number copied to clipboard");
  };

  const changePassword = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert('Error', 'Please fill in both old and new passwords');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Settings/changepassword.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: mobile,
          oldpwd: oldPassword,
          newpwd: newPassword,
        }),
      });

      const data = await response.json();

      if (response.status === 200) {
        Alert.alert('Success', 'Password changed successfully. Please login again.');
        setPasswordModalVisible(false);
        logout();
      } else if (response.status === 401) {
        Alert.alert('Error', 'Old password does not match');
      } else if (response.status === 404) {
        Alert.alert('Error', 'User not found');
      } else {
        Alert.alert('Error', data.message || 'An unexpected error occurred');
      }
    } catch (error) {
      Alert.alert('Error', 'Network issue. Please try again');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Settings/deleteaccount.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobile }),
      });

      const data = await response.json();

      if (response.status === 200) {
        Alert.alert('Success', 'Account deleted successfully');
        logout();
      } else {
        Alert.alert('Error', data.message || 'Failed to delete account');
      }
    } catch (error) {
      Alert.alert('Error', 'Network issue. Please try again');
    } finally {
      setDeleting(false);
      setDeleteModalVisible(false);
    }
  };

  const navigateToScreen = (screen) => {
    // Exit animation before navigating
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push(screen);
    });
  };

  const menuItems = [
    {
      id: 1,
      title: 'Transaction History',
      description: 'View your past rides, orders and payments',
      icon: 'history',
      iconType: 'MaterialIcons',
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      onPress: () => navigateToScreen('/AllTransactionHistory')
    },
    {
      id: 2,
      title: 'Customer Service',
      description: 'Get help, report issues or send feedback',
      icon: 'headset',
      iconType: 'MaterialIcons',
      color: '#10B981',
      bgColor: '#E7F5E9',
      onPress: () => navigateToScreen('/CustomerService')
    },
    // {
    //   id: 3,
    //   title: 'Invite Friends',
    //   description: 'Share InfiniteOrder and earn rewards',
    //   icon: 'gift',
    //   iconType: 'FontAwesome5',
    //   color: '#F59E0B',
    //   bgColor: '#FEF3C7',
    //   onPress: () => navigateToScreen('/InviteFriends')
    // },
    {
      id: 4,
      title: 'Rate Us',
      description: 'Love our app? Leave a review on Play Store',
      icon: 'star',
      iconType: 'FontAwesome5',
      color: '#F97316',
      bgColor: '#FFF3E0',
      onPress: () => Alert.alert('Rate Us', 'Redirecting to Play Store...')
    },
    {
      id: 5,
      title: 'Change Password',
      description: 'Update your password for security',
      icon: 'lock',
      iconType: 'FontAwesome5',
      color: '#8B5CF6',
      bgColor: '#F3E8FF',
      onPress: () => setPasswordModalVisible(true)
    },
    {
      id: 6,
      title: 'Delete Account',
      description: 'Permanently delete your account and data',
      icon: 'trash-2',
      iconType: 'Feather',
      color: '#EF4444',
      bgColor: '#FEE2E2',
      onPress: () => setDeleteModalVisible(true)
    },
    {
      id: 7,
      title: 'Logout',
      description: 'Sign out from your account',
      icon: 'logout',
      iconType: 'SimpleLineIcons',
      color: '#6B7280',
      bgColor: '#F3F4F6',
      onPress: logout
    }
  ];

  const renderIcon = (item) => {
    const iconProps = { size: 22, color: item.color };
    
    switch(item.iconType) {
      case 'MaterialIcons':
        return <MaterialIcons name={item.icon} {...iconProps} />;
      case 'FontAwesome5':
        return <FontAwesome5 name={item.icon} {...iconProps} />;
      case 'Feather':
        return <Feather name={item.icon} {...iconProps} />;
      case 'SimpleLineIcons':
        return <SimpleLineIcons name={item.icon} {...iconProps} />;
      default:
        return <MaterialIcons name={item.icon} {...iconProps} />;
    }
  };

  const getImageSource = () => {
    if (profileImage) {
      if (profileImage.startsWith('http')) {
        return { uri: profileImage };
      }
      return { uri: `${profileImage}` };
    }
    return require('@/assets/images/favicon.png');
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Animated.View 
      style={{ 
        flex: 1, 
        backgroundColor: COLORS.background,
        transform: [{ translateX: slideAnim }],
        opacity: fadeAnim
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Fixed Header */}
      <View style={{ 
        backgroundColor: COLORS.primary, 
        borderBottomLeftRadius: 30, 
        borderBottomRightRadius: 30,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        zIndex: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
      }}>
        <SafeAreaView>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingBottom: 28,
            paddingTop: Platform.OS === 'ios' ? 0 : 16
          }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
              Profile
            </Text>
            <TouchableOpacity 
              style={{ width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
              onPress={handleGoBack}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          flexGrow: 1,
          paddingTop: 20
        }}
      >
        {/* Profile Card */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ 
            backgroundColor: 'white', 
            borderRadius: 24, 
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ position: 'relative' }}>
                <Image
                  source={getImageSource()}
                  style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: 'white' }}
                />
                <View style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  right: 0, 
                  width: 20, 
                  height: 20, 
                  backgroundColor: COLORS.success, 
                  borderRadius: 10, 
                  borderWidth: 2, 
                  borderColor: 'white' 
                }} />
              </View>
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text.primary }}>
                  {customerName}
                </Text>
                <Text style={{ fontSize: 14, color: COLORS.text.secondary, marginTop: 4 }}>
                  {email || 'No email provided'}
                </Text>
                <TouchableOpacity onPress={() => copyToClipboard(mobile)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <FontAwesome5 name="phone-alt" size={12} color={COLORS.primary} />
                  <Text style={{ fontSize: 14, color: COLORS.primary, marginLeft: 8 }}>
                    {mobile}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-around', 
              marginTop: 20, 
              paddingTop: 20, 
              borderTopWidth: 1, 
              borderTopColor: COLORS.border 
            }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text.primary }}>0</Text>
                <Text style={{ fontSize: 12, color: COLORS.text.secondary }}>Fundings</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text.primary }}>0</Text>
                <Text style={{ fontSize: 12, color: COLORS.text.secondary }}>Orders</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text.primary }}>0</Text>
                <Text style={{ fontSize: 12, color: COLORS.text.secondary }}>Rewards</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text.primary, marginBottom: 16 }}>
            Account Settings
          </Text>
          
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: 'white', 
                borderRadius: 16, 
                padding: 16, 
                marginBottom: 12,
                borderWidth: 1,
                borderColor: COLORS.border
              }}
              onPress={item.onPress}
            >
              <View style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: item.bgColor }}>
                {renderIcon(item)}
              </View>
              
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.text.primary }}>
                  {item.title}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.text.secondary, marginTop: 4 }}>
                  {item.description}
                </Text>
              </View>
              
              <MaterialIcons name="chevron-right" size={24} color={COLORS.text.light} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Version Info */}
        <View style={{ alignItems: 'center', paddingBottom: 32 }}>
          <Text style={{ fontSize: 12, color: COLORS.text.light }}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={passwordModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, width: '90%', maxWidth: 400 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text.primary }}>
                Change Password
              </Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text.light} />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.text.secondary, marginBottom: 8 }}>
                Old Password
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16 }}>
                <FontAwesome5 name="lock" size={18} color={COLORS.primary} />
                <TextInput
                  style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 12, color: COLORS.text.primary }}
                  placeholder="Enter old password"
                  placeholderTextColor={COLORS.text.light}
                  secureTextEntry={!showOldPassword}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                />
                <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
                  <Ionicons name={showOldPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 14, color: COLORS.text.secondary, marginBottom: 8 }}>
                New Password
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16 }}>
                <FontAwesome5 name="lock" size={18} color={COLORS.primary} />
                <TextInput
                  style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 12, color: COLORS.text.primary }}
                  placeholder="Enter new password"
                  placeholderTextColor={COLORS.text.light}
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                  <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
              <>
                <TouchableOpacity
                  onPress={changePassword}
                  style={{ backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, marginBottom: 12 }}
                >
                  <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                    Update Password
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPasswordModalVisible(false)}
                  style={{ backgroundColor: COLORS.border, paddingVertical: 16, borderRadius: 12 }}
                >
                  <Text style={{ color: COLORS.text.primary, textAlign: 'center', fontWeight: 'bold' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, width: '90%', maxWidth: 400 }}>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View style={{ width: 64, height: 64, backgroundColor: '#FEE2E2', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Feather name="alert-triangle" size={32} color={COLORS.error} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text.primary, marginBottom: 8 }}>
                Delete Account?
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.text.secondary, textAlign: 'center' }}>
                This action is permanent and cannot be undone. All your data will be permanently removed.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                style={{ flex: 1, backgroundColor: COLORS.border, paddingVertical: 16, borderRadius: 12, marginRight: 8 }}
              >
                <Text style={{ color: COLORS.text.primary, textAlign: 'center', fontWeight: 'bold' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={deleteAccount}
                style={{ flex: 1, backgroundColor: COLORS.error, paddingVertical: 16, borderRadius: 12, marginLeft: 8 }}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

export default ProfileScreen;