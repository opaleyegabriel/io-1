import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import tw from 'twrnc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const TopBar = ({ balance, handleScreenChange, onViewHistory, onGoHome }) => {
  const [mobile, setMobile] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const myMobile = await AsyncStorage.getItem('mobile');
        const profileimage = await AsyncStorage.getItem('ProfileImage');
        const name = await AsyncStorage.getItem('name');
        
        setMobile(myMobile);
        setProfileImage(profileimage);
        setCustomerName(name || 'Customer');
      } catch (error) {
        console.log('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  const handleProfilePress = () => {
    Alert.alert(
      'Account Options',
      `Welcome, ${customerName}`,
      [
        { text: 'View Profile', onPress: () => router.push('/(tabs)/account') },
        { text: 'Wallet History', onPress: () => router.push('/(tabs)/WalletHistory') },
        { text: 'My Orders', onPress: onViewHistory },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={tw`bg-yellow-600 border-b border-gray-600 shadow-md`}>
      {/* Main Top Bar */}
      <View style={tw`flex-row justify-between items-center px-4 py-3`}>
        {/* Left side - Profile and Balance */}
        <View style={tw`flex-row items-center`}>
          <TouchableOpacity 
            
            style={tw`mr-3 relative`}
          >
            <Image
              source={{ 
                uri: profileImage 
                  ? `${profileImage}`
                  : 'https://hoog.ng/uploads/default-avatar.png'
              }}
              style={tw`w-12 h-12 rounded-full border-2 border-white`}
              resizeMode="cover"
            />
            <View style={tw`absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white`} />
          </TouchableOpacity>
          
          <View>
            <Text style={tw`text-white text-xs opacity-80`}>Welcome back,</Text>
            <Text style={tw`text-white font-bold text-base`} numberOfLines={1}>
              {customerName.length > 15 ? customerName.substring(0, 15) + '...' : customerName}
            </Text>
            <View style={tw`flex-row items-center mt-1`}>
              <MaterialCommunityIcons name="wallet" size={16} color="white" />
              <Text style={tw`text-white font-bold ml-1 text-lg`}>₦{Number(balance)?.toLocaleString() || '0'}</Text>
            </View>
          </View>
        </View>

        {/* Right side - Navigation Icons */}
        <View style={tw`flex-row items-center`}>
          <TouchableOpacity 
            style={tw`items-center mx-2`}
            onPress={() => handleScreenChange('comboBox')}
          >
            <MaterialCommunityIcons name="plus-circle" size={26} color="white" />
            <Text style={tw`text-white text-xs mt-1 font-medium`}>New</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={tw`items-center mx-2`}
            onPress={onViewHistory}
          >
            <MaterialCommunityIcons name="format-list-bulleted" size={24} color="white" />
            <Text style={tw`text-white text-xs mt-1 font-medium`}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={tw`items-center mx-2`}
            onPress={onViewHistory}
          >
            <MaterialCommunityIcons name="history" size={24} color="white" />
            <Text style={tw`text-white text-xs mt-1 font-medium`}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={tw`items-center ml-2 bg-yellow-700 px-3 py-1 rounded-full`}
            onPress={onGoHome}
          >
            <MaterialCommunityIcons name="home" size={20} color="white" />
            <Text style={tw`text-white text-xs mt-0.5 font-medium`}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats Bar */}
      <View style={tw`flex-row justify-around bg-yellow-700 py-2 px-4`}>
        <TouchableOpacity 
          style={tw`items-center`}
          onPress={onViewHistory}
        >
          <Text style={tw`text-white text-xs opacity-80`}>Active Orders</Text>
          <Text style={tw`text-white font-bold text-sm`}>0</Text>
        </TouchableOpacity>

        <View style={tw`w-px h-8 bg-yellow-500`} />

        <TouchableOpacity 
          style={tw`items-center`}
          onPress={() => Alert.alert('Coming Soon', 'Rider tracking feature coming soon!')}
        >
          <Text style={tw`text-white text-xs opacity-80`}>Rider Nearby</Text>
          <Text style={tw`text-white font-bold text-sm`}>--</Text>
        </TouchableOpacity>

        <View style={tw`w-px h-8 bg-yellow-500`} />

        <TouchableOpacity 
          style={tw`items-center`}
          onPress={() => router.push('/(tabs)/Wallet')}
        >
          <Text style={tw`text-white text-xs opacity-80`}>Wallet</Text>
          <Text style={tw`text-white font-bold text-sm`}>₦{balance?.toLocaleString() || '0'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TopBar;