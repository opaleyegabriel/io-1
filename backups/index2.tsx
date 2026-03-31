import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Animated, 
  KeyboardAvoidingView, 
  Platform, 
  Alert, 
  ActivityIndicator,
  Image,
  StatusBar,
  Modal,
  Button
} from 'react-native';
import tw from 'twrnc';
import { router } from 'expo-router';
import { Easing } from 'react-native-reanimated';
import { user_login } from "./api/user_api"
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import TermsandConditionModal from '@/components/TermsandConditionModal';
import { useAuth } from '@/context/auth';

const COLORS = {
  primary: '#FDB623',
  primaryDark: '#E5A50A',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    light: '#9CA3AF',
  },
  border: '#E5E7EB',
};

const LoginScreen = () => {
  // States for normal login
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  // States for Google verification flow
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationMobile, setVerificationMobile] = useState('');
  const [verificationPassword, setVerificationPassword] = useState('');
  const [verificationPasswordVisible, setVerificationPasswordVisible] = useState(false);
  const [googleUserInfo, setGoogleUserInfo] = useState<any>(null);
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [existingUserData, setExistingUserData] = useState<any>(null);
  const [isProcessingGoogle, setIsProcessingGoogle] = useState(false);

  // Animated values
  const [fadeAnimation] = useState(new Animated.Value(0));
  const [slideAnimation] = useState(new Animated.Value(50));
  const [scaleAnimation] = useState(new Animated.Value(0.95));

  // Modal visibility
  const [isTermVisible, setIsTermVisible] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const { user, isLoading, signIn, signOut } = useAuth();

  // Check token and redirect if already logged in
  const checkTokenAndRedirect = async () => {
    try {
      const dataToken = await AsyncStorage.getItem("AccessToken");
      const userType = await AsyncStorage.getItem("user_type");
      
      if (dataToken) {
        if (userType == "customer") {
          router.replace("/(tabs)/");
        } else if (userType == "rider" || userType == "driver") {
          router.replace("/RidersDashboard");
        } else if (userType == 'alsrider') {
          router.replace("/AlsRiderDashboard");
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking token:', error);
      return false;
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkTokenAndRedirect();
    
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 800,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 600,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 600,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handle Google user authentication check
  useEffect(() => {
    const checkGoogleUser = async () => {
      // Only proceed if we have a user from Google sign-in and not already processing
      if (user && !isProcessingGoogle && !showVerificationModal) {
        setIsProcessingGoogle(true);
        setIsWorking(true);
        
        try {
          console.log("Google User Detected:", user);
          
          // Get email from Google user
          const googleEmail = user.email || user.user?.email;
          
          if (!googleEmail) {
            console.log("No email found in Google user");
            setIsProcessingGoogle(false);
            setIsWorking(false);
            return;
          }
          
          // Check if this Google user exists in your database
          const checkResponse = await fetch('https://hoog.ng/infiniteorder/api/Customers/check-google-user.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: googleEmail
            }),
          });
          
          const checkData = await checkResponse.json();
          console.log("Check User Response:", checkData);
          
          // Check if user exists (has id property)
          if (checkData.id) {
            // User exists in database
            console.log("Existing user found:", checkData);
            setExistingUserData(checkData);
            
            setGoogleUserInfo({
              email: googleEmail,
              name: user.name || user.user?.name,
              id: user.sub || user.user?.id,
              picture: user.picture || user.user?.picture
            });
            
            // Pre-fill the mobile number from database
            setVerificationMobile(checkData.mobile || '');
            setIsExistingCustomer(true);
            setShowVerificationModal(true);
          } 
          else {
            // No user found (status 404 message)
            console.log("No existing user found");
            
            setGoogleUserInfo({
              email: googleEmail,
              name: user.name || user.user?.name,
              id: user.sub || user.user?.id,
              picture: user.picture || user.user?.picture
            });
            setIsExistingCustomer(false);
            setShowVerificationModal(true);
          }
        } catch (error) {
          console.error('Error checking Google user:', error);
          Alert.alert('Error', 'Failed to verify Google account');
        } finally {
          setIsProcessingGoogle(false);
          setIsWorking(false);
        }
      }
    };
    
    checkGoogleUser();
  }, [user]); // Runs whenever the user object changes

  // Handle Google Sign-In button press
  const handleGoogleSignIn = async () => {
    setIsWorking(true);
    try {
      // Call signIn from useAuth() hook
      await signIn();
      // The useEffect above will handle the rest when user object is updated
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Error', 'Failed to sign in with Google');
      setIsWorking(false);
    }
  };

  // Handle verification submission
  const handleVerificationSubmit = async () => {
    if (!verificationMobile.trim()) {
      Alert.alert('Error', 'Mobile number cannot be empty');
      return;
    }
    
    if (!verificationPassword.trim()) {
      Alert.alert('Error', 'Password cannot be empty');
      return;
    }

    if (verificationMobile.length !== 11 || !/^\d+$/.test(verificationMobile)) {
      Alert.alert('Error', 'Mobile number must be exactly 11 digits');
      return;
    }

    setIsWorking(true);

    try {
      let response;
      let data;
      
      if (isExistingCustomer && existingUserData) {
        // Verify existing customer with mobile/password
        const loginResult = await user_login({
          mobile: verificationMobile,
          password: verificationPassword
        });

        if (loginResult.status === 200) {
          // Login successful - now link Google account to this user
          // You'll need to create this endpoint
          const linkResponse = await fetch('https://hoog.ng/infiniteorder/api/Customers/google-login-update.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: existingUserData.id,
              google_email: googleUserInfo.email,
              google_id: googleUserInfo.id
            }),
          });
          
          const linkData = await linkResponse.json();
          
          if (linkData.success) {
            // Proceed with login
            await handleSuccessfulLogin(loginResult);
          } else {
            Alert.alert('Error', 'Failed to link Google account');
            setIsWorking(false);
          }
        } else {
          Alert.alert('Login Failed', 'Invalid mobile number or password');
          setIsWorking(false);
        }
      } else {
        // Create new user with Google info
        // You'll need to create this endpoint
        response = await fetch('https://hoog.ng/infiniteorder/api/Customers/register-with-google.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mobile: verificationMobile,
            password: verificationPassword,
            fullname: googleUserInfo.name,
            email: googleUserInfo.email,
            google_id: googleUserInfo.id
          }),
        });
        
        data = await response.json();

        if (data.status === 200) {
          // Registration successful - now login
          const loginResult = await user_login({
            mobile: verificationMobile,
            password: verificationPassword
          });
          
          if (loginResult.status === 200) {
            await handleSuccessfulLogin(loginResult);
          } else {
            Alert.alert('Error', 'Account created but login failed');
            setIsWorking(false);
          }
        } else {
          Alert.alert('Error', data.message || 'Registration failed');
          setIsWorking(false);
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
      setIsWorking(false);
    }
  };

  // Handle successful login
  const handleSuccessfulLogin = async (result: any) => {
    await AsyncStorage.setItem("AccessToken", result.data.token);
    await AsyncStorage.setItem("mobile", result.data.mobile);
    await AsyncStorage.setItem("name", result.data.fullname);
    await AsyncStorage.setItem("email", result.data.email);
    await AsyncStorage.setItem("user_type", result.data.user_type);
    await AsyncStorage.setItem("google_linked", "true");
    
    setShowVerificationModal(false);
    
    if (result.data.user_type == 'customer') {
      router.replace("/(tabs)/");
    } else if (result.data.user_type == 'rider' || result.data.user_type == 'driver') {
      await getRiderLoginDetails(result.data.mobile);
      router.replace("/RidersDashboard");
    } else if (result.data.user_type == 'alsrider') {
      await getRiderLoginDetails(result.data.mobile);
      router.replace("/AlsRiderDashboard");
    }
  };

  // Handle normal login with mobile/password
  const handleLogin = async () => {
    if (!mobileNumber.trim()) {
      Alert.alert('Error', 'Mobile number cannot be empty');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Password cannot be empty');
      return;
    }

    if (mobileNumber.length !== 11 || !/^\d+$/.test(mobileNumber)) {
      Alert.alert('Error', 'Mobile number must be exactly 11 digits');
      return;
    }

    setIsWorking(true);
    try {
      const result = await user_login({
        mobile: mobileNumber,
        password: password
      });

      if (result.status == 200) {
        await handleSuccessfulLogin(result);
      } else {
        Alert.alert('Login Failed', 'Invalid credentials');
        setIsWorking(false);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error. Please try again.');
      setIsWorking(false);
    }
  };

  // Get Rider Profile Info
  const getRiderLoginDetails = async (mobile: string) => {
    try {
      const response = await fetch(`https://hoog.ng/infiniteorder/api/Riders/riderProfile.php?mobile=${mobile}`);
      const data = await response.json();
      
      await AsyncStorage.setItem("ProfileImage", data.riders_image1);
      await AsyncStorage.setItem("BikeRegNO", data.bike_regno);
      await AsyncStorage.setItem("BikeType", data.bike_type);
      await AsyncStorage.setItem("BikeColor", data.color);
      await AsyncStorage.setItem('Bank', data.bank);
      await AsyncStorage.setItem('AcctNo', data.account_number);
    } catch (error) {
      console.error('Error fetching rider:', error);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowVerificationModal(false);
    setVerificationMobile('');
    setVerificationPassword('');
    // Optionally sign out from Google if they cancel
    signOut();
  };

  // Loading state
  if (isLoading || isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // If user is authenticated from useAuth() AND has completed Google linking, show user info or redirect
  // This is a temporary display - in production, they should be redirected automatically
  if (user && !showVerificationModal && !isProcessingGoogle) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Welcome {user.name}</Text>
        <Text>Email: {user.email}</Text>
        <Button title="Sign Out" onPress={() => signOut()} />
      </View>
    );
  }

  // Main render (when not authenticated)
  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-white`}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={tw`h-56 bg-[${COLORS.primary}] rounded-b-3xl relative overflow-hidden`}>
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
        <View style={tw`flex-1 justify-center items-center`} />
      </View>

      {/* Login Form */}
      <Animated.View 
        style={[
          tw`flex-1 px-6 pt-8`,
          {
            opacity: fadeAnimation,
            transform: [{ translateY: slideAnimation }]
          }
        ]}
      >
        <Text style={[tw`text-4xl font-bold text-[${COLORS.text.primary}] mb-2`, { fontFamily: 'RobotoB' }]}>
          Welcome Back 
        </Text>
        <Text style={[tw`text-[${COLORS.text.secondary}] mb-8`, { fontFamily: 'RobotoM' }]}>
          Sign in to continue to your account
        </Text>

        {/* Mobile Number Input */}
        <View style={tw`mb-4`}>
          <Text style={[tw`text-[${COLORS.text.secondary}] text-sm mb-2 ml-1`, { fontFamily: 'RobotoR' }]}>
            Mobile Number
          </Text>
          <View style={tw`flex-row items-center bg-[${COLORS.surface}] rounded-xl border border-[${COLORS.border}] px-4`}>
            <FontAwesome5 name="phone-alt" size={18} color={COLORS.primary} />
            <TextInput
              style={tw`flex-1 py-4 px-3 text-[${COLORS.text.primary}]`}
              placeholder="Enter 11-digit mobile number"
              placeholderTextColor={COLORS.text.light}
              keyboardType="phone-pad"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              maxLength={11}
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={tw`mb-2`}>
          <Text style={[tw`text-[${COLORS.text.secondary}] text-sm mb-2 ml-1`, { fontFamily: 'RobotoR' }]}>
            Password
          </Text>
          <View style={tw`flex-row items-center bg-[${COLORS.surface}] rounded-xl border border-[${COLORS.border}] px-4`}>
            <FontAwesome5 name="lock" size={18} color={COLORS.primary} />
            <TextInput
              style={tw`flex-1 py-4 px-3 text-[${COLORS.text.primary}]`}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.text.light}
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
              <FontAwesome5 name={passwordVisible ? 'eye-slash' : 'eye'} size={18} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity onPress={() => router.replace("/forgotpassword")} style={tw`self-end mb-6`}>
          <Text style={[tw`text-[${COLORS.primary}] text-sm`, { fontFamily: 'RobotoR' }]}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[tw`bg-[${COLORS.primary}] py-4 rounded-xl mb-4`, isWorking && tw`opacity-70`]}
          onPress={handleLogin}
          disabled={isWorking}
        >
          {isWorking ? <ActivityIndicator color="white" size="small" /> : 
            <Text style={tw`text-white text-center font-bold text-lg`}>Sign In</Text>
          }
        </TouchableOpacity>

        {/* Divider */}
        <View style={tw`flex-row items-center mb-6`}>
          <View style={tw`flex-1 h-[1px] bg-[${COLORS.border}]`} />
          <Text style={tw`mx-4 text-[${COLORS.text.light}]`}>OR</Text>
          <View style={tw`flex-1 h-[1px] bg-[${COLORS.border}]`} />
        </View>

        {/* Google Sign In */}
        <TouchableOpacity
          style={tw`flex-row items-center justify-center bg-white border border-[${COLORS.border}] py-4 rounded-xl mb-8`}
          onPress={handleGoogleSignIn}
          disabled={isWorking}
        >
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
            style={tw`w-6 h-6 mr-3`}
          />
          <Text style={[tw`text-[${COLORS.text.primary}] font-medium`, { fontFamily: 'RobotoR' }]}>
            Continue with Google
          </Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View style={tw`flex-row justify-center items-center`}>
          <Text style={[tw`text-[${COLORS.text.secondary}]`, { fontFamily: 'RobotoR' }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.replace("/SignUpScreen")}>
            <Text style={[tw`text-[${COLORS.primary}] font-bold`, { fontFamily: 'RobotoB' }]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {/* Terms and Conditions */}
        <TouchableOpacity onPress={() => setIsTermVisible(true)} style={tw`mt-6 mb-4`}>
          <Text style={[tw`text-[${COLORS.text.light}] text-xs text-center`, { fontFamily: 'LatoR' }]}>
            By continuing, you agree to our{' '}
            <Text style={tw`text-[${COLORS.primary}]`}>Terms of Service</Text> and{' '}
            <Text style={tw`text-[${COLORS.primary}]`}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Verification Modal for Google Users */}
      <Modal
        visible={showVerificationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text.primary, marginBottom: 10 }}>
              {isExistingCustomer ? 'Verify Your Account' : 'Create Your Account'}
            </Text>
            <Text style={{ color: COLORS.text.secondary, marginBottom: 20 }}>
              {isExistingCustomer 
                ? `Hello ${googleUserInfo?.name}, we found your account. Please verify with your mobile number and password to link your Google account.`
                : `Hello ${googleUserInfo?.name}, please provide your mobile number and create a password to complete registration.`}
            </Text>

            {/* Mobile Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: COLORS.text.secondary, fontSize: 14, marginBottom: 8 }}>
                Mobile Number
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16 }}>
                <FontAwesome5 name="phone-alt" size={18} color={COLORS.primary} />
                <TextInput
                  style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 12, color: COLORS.text.primary }}
                  placeholder="Enter 11-digit mobile number"
                  keyboardType="phone-pad"
                  value={verificationMobile}
                  onChangeText={setVerificationMobile}
                  maxLength={11}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: COLORS.text.secondary, fontSize: 14, marginBottom: 8 }}>
                Password
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16 }}>
                <FontAwesome5 name="lock" size={18} color={COLORS.primary} />
                <TextInput
                  style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 12, color: COLORS.text.primary }}
                  placeholder="Enter password"
                  secureTextEntry={!verificationPasswordVisible}
                  value={verificationPassword}
                  onChangeText={setVerificationPassword}
                />
                <TouchableOpacity onPress={() => setVerificationPasswordVisible(!verificationPasswordVisible)}>
                  <FontAwesome5 name={verificationPasswordVisible ? 'eye-slash' : 'eye'} size={18} color={COLORS.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: COLORS.border, paddingVertical: 16, borderRadius: 12, marginRight: 8 }}
                onPress={handleCloseModal}
                disabled={isWorking}
              >
                <Text style={{ color: COLORS.text.primary, textAlign: 'center', fontWeight: '500' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, marginLeft: 8 }}
                onPress={handleVerificationSubmit}
                disabled={isWorking}
              >
                {isWorking ? <ActivityIndicator color="white" size="small" /> : 
                  <Text style={{ color: 'white', textAlign: 'center', fontWeight: '500' }}>Submit</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Terms Modal */}
      <TermsandConditionModal visible={isTermVisible} onClose={() => setIsTermVisible(false)} />
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;