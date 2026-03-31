import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  KeyboardAvoidingView, 
  Platform, 
  Alert, 
  ActivityIndicator,
  Easing // Standard RN Easing
} from 'react-native';
import tw from 'twrnc';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ForgotPassword = () => {
  const [mobile, setMobile] = useState('');
  const [fadeAnimation] = useState(new Animated.Value(0));
  const [scaleAnimation] = useState(new Animated.Value(0));
  const [slideAnimation] = useState(new Animated.Value(screenHeight));
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.ease), // Standard API syntax
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 800,
        delay: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatMobileNumber = (num: string) => {
    if (num && num.length === 11 && num.startsWith('0')) {
      return '+234' + num.slice(1);
    }
    return num;
  };

  const send4DigitPwd = async () => {
    if (!mobile) {
      Alert.alert("Error", "Mobile number cannot be empty");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Settings/forgotpassword.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });

      const data = await response.json();

      if (response.status === 200) {
        const message = `Your infiniteOrder verification code is ${data.otp} one-time use only`;
        const apiKey = 'TLNaLyWOdFAqUHRVMxpNUNdmRezfSaePkhskSgWRdIdpUQSVRatompmkFwMKRI';
        const fnumber = formatMobileNumber(mobile);

        const smsResponse = await fetch('https://v3.api.termii.com/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: fnumber,
            from: 'N-Alert',
            sms: message,
            type: 'plain',
            api_key: apiKey,
            channel: 'dnd',
          }),
        });

        if (!smsResponse.ok) throw new Error('Failed to send SMS');

        setIsSent(true);
        Alert.alert("Success", "Password reset code sent to your mobile.");
        
        // Wait a moment so user can see the success state before redirecting
        setTimeout(() => {
            router.replace("/");
        }, 3000);

      } else {
        Alert.alert("User Error", data?.message || "Mobile Number does not exist");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 justify-center items-center bg-yellow-600`}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View
        style={[
          tw`w-full px-8 py-12 bg-yellow-600 rounded-xl shadow-lg max-w-md`,
          {
            opacity: fadeAnimation,
            transform: [{ translateY: slideAnimation }],
          },
        ]}
      >
        {!isSent ? (
          <>
            <Animated.Text style={[tw`text-2xl font-semibold text-center text-yellow-50 mb-3`, { transform: [{ scale: scaleAnimation }] }]}>
              Password Recovery
            </Animated.Text>

            <View style={tw`relative mb-6`}>
              <FontAwesome5 name="phone-alt" size={20} color="gray" style={tw`absolute top-3 left-3 z-10`} />
              <TextInput
                style={tw`h-12 pl-10 pr-4 bg-gray-100 rounded-lg shadow-sm border border-gray-300`}
                placeholder="Mobile Number"
                keyboardType="phone-pad"
                value={mobile}
                onChangeText={setMobile}
              />
            </View>

            <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
              {isLoading ? (
                <ActivityIndicator size="large" color="#FFFFFF" style={tw`mb-4`} />
              ) : (
                <TouchableOpacity onPress={send4DigitPwd} style={tw`w-full bg-yellow-50 py-4 rounded-lg`}>
                  <Text style={tw`text-yellow-600 text-xl font-semibold text-center`}>Reset Password</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </>
        ) : (
          <Animated.Text style={[tw`text-xl font-semibold text-center text-yellow-50 mb-3`, { opacity: fadeAnimation }]}>
            Kindly login with the Infinite Order PIN sent to your mobile number.
          </Animated.Text>
        )}

        <View style={tw`flex-row justify-center mt-6`}>
          <Text style={tw`text-lg text-black`}>Back to </Text>
          <TouchableOpacity onPress={() => router.replace("/")}>
            <Text style={tw`text-yellow-50 text-lg font-bold`}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

export default ForgotPassword;