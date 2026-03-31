import React, { useState, useEffect } from 'react';
import { 
  Animated, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import tw from 'twrnc';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';

import BasicSignUpInfo from '@/components/BasicSignUpInfo';
import PrivacyPolicyModal from '@/components/PrivacyPolicyModal';
import TermsandConditionModal from '@/components/TermsandConditionModal';

const COLORS = {
  primary: '#FDB623', // Gold
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

// Initialize WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

const SignUpScreen = () => {
  const [isPrivacyPolicyVisible, setPrivacyPolicyVisible] = useState(false);
  const [isTermVisible, setIsTermVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnimation] = useState(new Animated.Value(0));
  const [slideAnimation] = useState(new Animated.Value(50));
  const [scaleAnimation] = useState(new Animated.Value(0.95));

  // Google Sign-In configuration
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  });

  // Animation effect
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handle Google Sign-In response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignUp(id_token);
    }
  }, [response]);

  const handleGoogleSignUp = async (idToken: string) => {
    setIsLoading(true);
    try {
      // You'll need to implement your Google signup API endpoint
      const result = await fetch('https://hoog.ng/infiniteorder/api/Customers/googleSignup.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: idToken }),
      });
      
      const data = await result.json();
      if (data.status === 201) {
        Alert.alert(
          'Success', 
          'Account created successfully! Please login.',
          [{ text: 'OK', onPress: () => router.replace("/") }]
        );
      } else {
        Alert.alert('Sign Up Failed', data.message || 'Could not create account with Google');
      }
    } catch (error) {
      console.error('Google signup error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = () => {
    // Handle OTP verification
  };

  const handleSignUp = async (formData) => {
    setIsLoading(true);
    try {
      // Your existing signup API call
      const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/signup.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (result.status === 201) {
        Alert.alert(
          'Success', 
          'Account created successfully! Please login.',
          [{ text: 'OK', onPress: () => router.replace("/") }]
        );
      } else {
        Alert.alert('Sign Up Failed', result.message || 'Unable to create account');
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInRedirect = () => {
    router.replace("/");
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-white`}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header with gradient effect */}
      <View style={tw`h-48 bg-[${COLORS.primary}] rounded-b-3xl relative overflow-hidden`}>
        <Animated.View 
          style={[
            tw`absolute -right-20 -top-20 w-64 h-64 bg-[${COLORS.primaryDark}] rounded-full opacity-20`,
            { transform: [{ scale: scaleAnimation }] }
          ]} 
        />
        <Animated.View 
          style={[
            tw`absolute -left-20 bottom-10 w-48 h-48 bg-white rounded-full opacity-10`,
            { transform: [{ scale: scaleAnimation }] }
          ]} 
        />
        
        <View style={tw`flex-1 justify-center items-center`}>
          <Animated.View
            style={[
              {
                opacity: fadeAnimation,
                transform: [{ translateY: slideAnimation }]
              }
            ]}
          >
            <Text style={tw`text-white text-3xl font-bold`}>Create Account</Text>
            <Text style={tw`text-white/80 text-base mt-2`}>Join InfiniteOrder today</Text>
          </Animated.View>
        </View>
      </View>

      {/* Sign Up Form */}
      <ScrollView 
        style={tw`flex-1`}
        contentContainerStyle={tw`px-6 pt-6 pb-4`}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            {
              opacity: fadeAnimation,
              transform: [{ translateY: slideAnimation }]
            }
          ]}
        >
          {/* Basic SignUp Info Component */}
          <View style={tw`bg-white rounded-xl border border-[${COLORS.border}] p-4 mb-6`}>
            <BasicSignUpInfo 
              onVerify={handleVerify} 
              onSignUp={handleSignUp} 
              isLoading={isLoading}
            />
          </View>

          {/* Divider */}
          <View style={tw`flex-row items-center mb-6`}>
            <View style={tw`flex-1 h-[1px] bg-[${COLORS.border}]`} />
            <Text style={tw`mx-4 text-[${COLORS.text.light}]`}>OR</Text>
            <View style={tw`flex-1 h-[1px] bg-[${COLORS.border}]`} />
          </View>

          {/* Google Sign Up */}
          <TouchableOpacity
            style={tw`flex-row items-center justify-center bg-white border border-[${COLORS.border}] py-4 rounded-xl mb-8`}
            onPress={() => promptAsync()}
            disabled={isLoading}
          >
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
              style={tw`w-6 h-6 mr-3`}
            />
            <Text style={[tw`text-[${COLORS.text.primary}] font-medium`, { fontFamily: 'RobotoR' }]}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={tw`flex-row justify-center items-center mb-6`}>
            <Text style={[tw`text-[${COLORS.text.secondary}]`, { fontFamily: 'RobotoR' }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={handleSignInRedirect}>
              <Text style={[tw`text-[${COLORS.primary}] font-bold`, { fontFamily: 'RobotoB' }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>

          {/* Terms and Privacy */}
          <View style={tw`items-center`}>
            <View style={tw`flex-row items-center mb-2`}>
              <Ionicons 
                name="infinite" 
                size={20} 
                color={COLORS.primary}
              />
              <Text style={[tw`text-[${COLORS.primary}] font-bold ml-1`, { fontFamily: 'RobotoB' }]}>
                InfiniteOrder
              </Text>
            </View>
            
            <Text style={[tw`text-[${COLORS.text.light}] text-xs text-center`, { fontFamily: 'LatoR' }]}>
              © {new Date().getFullYear()} All rights reserved
            </Text>
            
            <View style={tw`flex-row mt-3`}>
              <TouchableOpacity onPress={() => setIsTermVisible(true)}>
                <Text style={[tw`text-[${COLORS.primary}] text-xs`, { fontFamily: 'RobotoR' }]}>
                  Terms & Conditions
                </Text>
              </TouchableOpacity>
              <Text style={tw`text-[${COLORS.text.light}] text-xs mx-2`}>•</Text>
              <TouchableOpacity onPress={() => setPrivacyPolicyVisible(true)}>
                <Text style={[tw`text-[${COLORS.primary}] text-xs`, { fontFamily: 'RobotoR' }]}>
                  Privacy Policy
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={tw`absolute inset-0 bg-black/50 items-center justify-center`}>
          <View style={tw`bg-white p-6 rounded-2xl`}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={tw`text-[${COLORS.text.primary}] mt-3 font-medium`}>
              Creating account...
            </Text>
          </View>
        </View>
      )}

      {/* Modals */}
      <PrivacyPolicyModal
        visible={isPrivacyPolicyVisible}
        onClose={() => setPrivacyPolicyVisible(false)}
      />
      
      <TermsandConditionModal
        visible={isTermVisible}
        onClose={() => setIsTermVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;