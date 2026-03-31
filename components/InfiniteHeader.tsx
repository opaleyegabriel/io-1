import { View, Text, Dimensions } from 'react-native';
import React from 'react';
import tw from "twrnc";
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const InfiniteHeader = () => {
  return (
    <View style={tw`w-full`}>
      {/* Main Header Container with Gradient Background */}
      <LinearGradient
        colors={['#FFD700', '#FFC800', '#FFB800']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={tw`pt-12 pb-4 px-4 rounded-b-3xl shadow-lg`}
      >
        <View style={tw`flex-row items-center justify-between`}>
          {/* Logo and Brand Section */}
          <View style={tw`flex-row items-center`}>
            {/* Animated Icon Container */}
            <View style={tw`relative`}>
              <View style={tw`absolute inset-0 bg-white/30 rounded-full blur-xl`} />
              <View style={tw`bg-black/10 p-2 rounded-full`}>
                <Ionicons 
                  name="infinite" 
                  size={34} 
                  color="#1A1A1A" 
                  style={tw`opacity-90`}
                />
              </View>
            </View>
            
            {/* Brand Text with Premium Styling */}
            <View style={tw`ml-3`}>
              <Text style={tw`text-black/60 text-xs font-medium tracking-wider`}>
                WELCOME BACK
              </Text>
              <View style={tw`flex-row items-baseline`}>
                <Text 
                  style={{
                    ...tw`text-black text-2xl font-bold`,
                    textShadowColor: 'rgba(0,0,0,0.1)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 3,
                  }}
                >
                  Infinite
                </Text>
                <Text 
                  style={{
                    ...tw`text-black text-2xl font-extrabold ml-1`,
                    color: '#1A1A1A',
                    textShadowColor: 'rgba(0,0,0,0.15)',
                    textShadowOffset: { width: 1.5, height: 1.5 },
                    textShadowRadius: 4,
                  }}
                >
                  Order
                </Text>
              </View>
            </View>
          </View>

          {/* Right Side - Optional Elements */}
          <View style={tw`flex-row items-center`}>
            
            <View style={tw`w-8 h-8 bg-black/10 rounded-full items-center justify-center`}>
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </View>
          </View>
        </View>

        {/* Decorative Elements */}
        <View style={tw`absolute bottom-0 left-0 right-0 h-1 bg-white/20`} />
        <View style={tw`absolute -bottom-1 left-10 right-10 h-0.5 bg-white/10 rounded-full`} />
      </LinearGradient>

      {/* Optional: Subtle Shadow Line */}
      <View style={tw`h-1 bg-transparent`} />
    </View>
  );
};

export default InfiniteHeader;