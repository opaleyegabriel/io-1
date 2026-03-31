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
  Easing // Use standard RN Easing
} from 'react-native';
import tw from 'twrnc';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Changepassword = () => {
  // --- STATES ---
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // --- ANIMATION VALUES ---
  const [fadeAnimation] = useState(new Animated.Value(0));
  const [scaleAnimation] = useState(new Animated.Value(0));
  const [slideAnimation] = useState(new Animated.Value(screenHeight));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.ease),
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

  const handleChangePassword = async () => {
    if (!password) {
      Alert.alert("Error", "Please enter a new password");
      return;
    }

    setIsLoading(true);
    try {
      // Note: Update this URL to your actual Change Password endpoint if different
      const response = await fetch('https://hoog.ng/infiniteorder/api/Settings/changepassword.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }), 
      });

      if (response.ok) {
        setIsSent(true);
        Alert.alert("Success", "Password updated successfully!");
        setTimeout(() => router.replace("/"), 2000);
      } else {
        Alert.alert("Error", "Failed to update password. Please try again.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Connection error.");
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
            <Animated.Text
              style={[
                tw`text-2xl font-semibold text-center text-yellow-50 mb-6`,
                { transform: [{ scale: scaleAnimation }] },
              ]}
            >
              Update Password
            </Animated.Text>

            <View style={tw`relative mb-6`}>
              <FontAwesome5
                name="lock"
                size={18}
                color="gray"
                style={tw`absolute top-3.5 left-3.5 z-10`}
              />
              <TextInput
                style={tw`h-12 pl-10 pr-12 bg-white rounded-lg shadow-sm border border-gray-300 text-black`}
                placeholder="New Password"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={tw`absolute top-3 right-3 z-10`}
                onPress={() => setPasswordVisible(!passwordVisible)}
              >
                <FontAwesome5
                  name={passwordVisible ? 'eye-slash' : 'eye'}
                  size={18}
                  color="gray"
                />
              </TouchableOpacity>
            </View>

            <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
              {isLoading ? (
                <ActivityIndicator size="large" color="#FFFFFF" style={tw`mb-4`} />
              ) : (
                <TouchableOpacity
                  onPress={handleChangePassword}
                  style={tw`w-full bg-yellow-50 py-4 rounded-lg shadow-md`}
                >
                  <Text style={tw`text-yellow-600 text-xl font-bold text-center`}>
                    Update Now
                  </Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </>
        ) : (
          <Text style={tw`text-xl text-white text-center font-bold`}>
            Password changed! Redirecting...
          </Text>
        )}

        <View style={tw`flex-row justify-center mt-8`}>
          <Text style={tw`text-lg text-black`}>Cancel? </Text>
          <TouchableOpacity onPress={() => router.replace("/")}>
            <Text style={tw`text-yellow-50 text-lg font-bold underline`}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

export default Changepassword;