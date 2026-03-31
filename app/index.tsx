// import React, { useEffect, useState } from 'react';
// import { 
//   View, 
//   Text, 
//   TextInput, 
//   TouchableOpacity, 
//   Animated, 
//   KeyboardAvoidingView, 
//   Platform, 
//   Alert, 
//   ActivityIndicator,
//   Image,
//   StatusBar,
//   Modal,
//   Button
// } from 'react-native';
// import tw from 'twrnc';
// import { router } from 'expo-router';
// import { Easing } from 'react-native-reanimated';
// import { user_login } from "./api/user_api"
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { FontAwesome5 } from '@expo/vector-icons';
// import TermsandConditionModal from '@/components/TermsandConditionModal';
// import { useAuth } from '@/context/auth';

// const COLORS = {
//   primary: '#FDB623',
//   primaryDark: '#E5A50A',
//   background: '#FFFFFF',
//   surface: '#F9FAFB',
//   text: {
//     primary: '#1F2937',
//     secondary: '#6B7280',
//     light: '#9CA3AF',
//   },
//   border: '#E5E7EB',
// };

// const LoginScreen = () => {
//   // States for normal login
//   const [mobileNumber, setMobileNumber] = useState('');
//   const [password, setPassword] = useState('');
//   const [passwordVisible, setPasswordVisible] = useState(false);

//   // States for Google verification flow
//   const [showVerificationModal, setShowVerificationModal] = useState(false);
//   const [verificationMobile, setVerificationMobile] = useState('');
//   const [verificationPassword, setVerificationPassword] = useState('');
//   const [verificationPasswordVisible, setVerificationPasswordVisible] = useState(false);
//   const [googleUserInfo, setGoogleUserInfo] = useState<any>(null);
//   const [isProcessingGoogle, setIsProcessingGoogle] = useState(false);

//   // Animated values
//   const [fadeAnimation] = useState(new Animated.Value(0));
//   const [slideAnimation] = useState(new Animated.Value(50));
//   const [scaleAnimation] = useState(new Animated.Value(0.95));

//   // Modal visibility
//   const [isTermVisible, setIsTermVisible] = useState(false);
//   const [isWorking, setIsWorking] = useState(false);
//   const [isCheckingAuth, setIsCheckingAuth] = useState(true);

//   const { user, isLoading, signIn} = useAuth();

//   // Check token and redirect if already logged in
//   const checkTokenAndRedirect = async () => {
//     try {
//       const dataToken = await AsyncStorage.getItem("AccessToken");
//       const userType = await AsyncStorage.getItem("user_type");
      
//       if (dataToken) {
//         if (userType == "customer") {
//           router.replace("/(tabs)/");
//         } else if (userType == "rider" || userType == "driver") {
//           router.replace("/RidersDashboard");
//         } else if (userType == 'alsrider') {
//           router.replace("/AlsRiderDashboard");
//         }
//         return true;
//       }
//       return false;
//     } catch (error) {
//       console.error('Error checking token:', error);
//       return false;
//     } finally {
//       setIsCheckingAuth(false);
//     }
//   };

// // Add this to your index.tsx component
// const debugAsyncStorage = async () => {
//   try {
//     const keys = await AsyncStorage.getAllKeys();
//     console.log("🔍 All AsyncStorage keys:", keys);
    
//     const oauthCode = await AsyncStorage.getItem("oauth_code");
//     const oauthState = await AsyncStorage.getItem("oauth_state");
//     console.log("🔍 OAuth code stored:", oauthCode ? "Yes" : "No");
//     console.log("🔍 OAuth state stored:", oauthState ? "Yes" : "No");
    
//     const accessToken = await AsyncStorage.getItem("AccessToken");
//     console.log("🔍 AccessToken stored:", accessToken ? "Yes" : "No");
//   } catch (error) {
//     console.error("Debug error:", error);
//   }
// };





//   useEffect(() => {
//     checkTokenAndRedirect();
    
//     Animated.parallel([
//       Animated.timing(fadeAnimation, {
//         toValue: 1,
//         duration: 800,
//         easing: Easing.ease,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnimation, {
//         toValue: 0,
//         duration: 600,
//         easing: Easing.ease,
//         useNativeDriver: true,
//       }),
//       Animated.timing(scaleAnimation, {
//         toValue: 1,
//         duration: 600,
//         easing: Easing.ease,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, []);

// const handleGoogleSignIn = async () => {
//   setIsWorking(true);
//   try {
//     console.log("Initiating Google Sign-In...");
//     await signIn();
//     // The useEffect will handle the rest
//   } catch (error) {
//     console.error('Google sign-in error:', error);
//     Alert.alert('Error', 'Failed to sign in with Google');
//     setIsWorking(false);
//   }
// };

// // Update the useEffect for Google user


//   useEffect(() => {
//     const checkGoogleUser = async () => {
//       // Don't process if we're already processing or showing modal
//       if (isProcessingGoogle || showVerificationModal) {
//         return;
//       }
      
//       // Check if we have a user AND we're not already processing
//       if (user && !isProcessingGoogle) {
//         setIsProcessingGoogle(true);
//         setIsWorking(true);
        
//         try {
//           console.log("Google User Detected:", user.email);
//           console.log("Access Token available:", accessToken ? "Yes" : "No");
          
//           // First check if user already has a token stored
//           const existingToken = await AsyncStorage.getItem("AccessToken");
//           const existingUserType = await AsyncStorage.getItem("user_type");
          
//           // If we already have a valid token and user type, just redirect
//           if (existingToken && existingUserType) {
//             console.log("User already has valid token, redirecting...");
//             if (existingUserType === 'customer') {
//               router.replace("/(tabs)/");
//             } else if (existingUserType === 'rider' || existingUserType === 'driver') {
//               router.replace("/RidersDashboard");
//             } else if (existingUserType === 'alsrider') {
//               router.replace("/AlsRiderDashboard");
//             }
//             setIsProcessingGoogle(false);
//             setIsWorking(false);
//             return;
//           }
          
//           // Check if user exists in your database
//           const checkResponse = await fetch('https://hoog.ng/infiniteorder/api/Customers/check-google-user.php', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ 
//               email: user.email 
//             }),
//           });
          
//           const checkData = await checkResponse.json();
//           console.log("Check user response:", checkData);
          
//           if (checkData.exists || checkData.id) {
//             // User exists - auto login
//             console.log("User exists, auto-logging in");
            
//             // Store the access token from the auth context
//             if (accessToken) {
//               console.log("Storing access token from auth context");
//               await AsyncStorage.setItem("AccessToken", accessToken);
//             } else {
//               console.log("No access token from auth context, using existing or placeholder");
//               // If no access token, use the one from the response or a placeholder
//               await AsyncStorage.setItem("AccessToken", checkData.token || "google-auth-token");
//             }
            
//             await AsyncStorage.setItem("email", user.email);
//             await AsyncStorage.setItem("name", user.name || "");
//             await AsyncStorage.setItem("user_type", checkData.user_type || "customer");
//             await AsyncStorage.setItem("google_linked", "true");
            
//             if (checkData.customer_image) {
//               await AsyncStorage.setItem("ProfileImage", checkData.customer_image);
//             }
            
//             // Navigate based on user type
//             if (checkData.user_type === 'customer') {
//               router.replace("/(tabs)/");
//             } else if (checkData.user_type === 'rider' || checkData.user_type === 'driver') {
//               if (checkData.mobile) {
//                 await getRiderLoginDetails(checkData.mobile);
//               }
//               router.replace("/RidersDashboard");
//             } else if (checkData.user_type === 'alsrider') {
//               if (checkData.mobile) {
//                 await getRiderLoginDetails(checkData.mobile);
//               }
//               router.replace("/AlsRiderDashboard");
//             }
//           } else {
//             // New user - show registration modal
//             console.log("New user, showing registration modal");
//             setGoogleUserInfo({
//               email: user.email,
//               name: user.name || "",
//               picture: user.picture || ""
//             });
//             setShowVerificationModal(true);
//           }
          
//           setIsWorking(false);
//         } catch (error) {
//           console.error('Error checking Google user:', error);
//           Alert.alert('Error', 'Failed to verify Google account');
//         } finally {
//           setIsProcessingGoogle(false);
//           setIsWorking(false);
//         }
//       }
//     };
    
//     checkGoogleUser();
//   }, [user, isProcessingGoogle, showVerificationModal]);



//   // Handle verification submission - SIMPLIFIED
//   const handleVerificationSubmit = async () => {
//     // Validation
//     if (!verificationMobile.trim()) {
//       Alert.alert('Error', 'Mobile number cannot be empty');
//       return;
//     }
    
//     if (!verificationPassword.trim()) {
//       Alert.alert('Error', 'Password cannot be empty');
//       return;
//     }

//     if (verificationMobile.length !== 11 || !/^\d+$/.test(verificationMobile)) {
//       Alert.alert('Error', 'Mobile number must be exactly 11 digits');
//       return;
//     }

//     setIsWorking(true);

//     try {
//       console.log("📝 Submitting to google-login-update.php...");
//       console.log("Params:", {
//         mobile: verificationMobile,
//         fullname: googleUserInfo.name,
//         address: googleUserInfo.email,
//         password: verificationPassword,
//         customer_image: googleUserInfo.picture
//       });
      
//       // STEP 1: Execute the endpoint first (handles both old and new users)
//       const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/google-login-update.php', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           mobile: verificationMobile,
//           fullname: googleUserInfo.name,
//           address: googleUserInfo.email,
//           password: verificationPassword,
//           customer_image: googleUserInfo.picture
//         }),
//       });
      
//       const data = await response.json();
//       console.log("Endpoint response:", data);
      
//       // STEP 2: Check if successful (status 201)
//       if (data.status === 201 || data.success === true) {
//         console.log("✅ Endpoint successful (status 201) - now logging in...");
        
//         // STEP 3: Now login with the credentials
//         const loginResult = await user_login({
//           mobile: verificationMobile,
//           password: verificationPassword
//         });
        
//         console.log("Login result:", loginResult);
        
//         // STEP 4: Handle successful login
//         if (loginResult.status === 200) {
//           await handleSuccessfulLogin(loginResult);
//         } else {
//           Alert.alert('Error', 'Account processed but login failed. Please try logging in manually.');
//           setIsWorking(false);
//           setShowVerificationModal(false);
//         }
//       } else {
//         // Endpoint failed
//         Alert.alert('Error', data.message || 'Failed to process your request');
//         setIsWorking(false);
//       }
//     } catch (error) {
//       console.error('Verification error:', error);
//       Alert.alert('Error', 'Network error. Please try again.');
//       setIsWorking(false);
//     }
//   };

//   // Handle successful login
//   const handleSuccessfulLogin = async (result: any) => {
//     console.log("✅ Login successful, storing user data...");
//     await AsyncStorage.setItem("AccessToken", result.data.token);
//     await AsyncStorage.setItem("mobile", result.data.mobile);
//     await AsyncStorage.setItem("name", result.data.fullname);
//     await AsyncStorage.setItem("email", result.data.email);
//     await AsyncStorage.setItem("user_type", result.data.user_type);
//     await AsyncStorage.setItem("google_linked", "true");
    
//     setShowVerificationModal(false);
    
//     if (result.data.user_type == 'customer') {
//       router.replace("/(tabs)/");
//     } else if (result.data.user_type == 'rider' || result.data.user_type == 'driver') {
//       await getRiderLoginDetails(result.data.mobile);
//       router.replace("/RidersDashboard");
//     } else if (result.data.user_type == 'alsrider') {
//       await getRiderLoginDetails(result.data.mobile);
//       router.replace("/AlsRiderDashboard");
//     }
//   };

//   // Handle normal login with mobile/password
//   const handleLogin = async () => {
//     if (!mobileNumber.trim()) {
//       Alert.alert('Error', 'Mobile number cannot be empty');
//       return;
//     }
//     if (!password.trim()) {
//       Alert.alert('Error', 'Password cannot be empty');
//       return;
//     }

//     if (mobileNumber.length !== 11 || !/^\d+$/.test(mobileNumber)) {
//       Alert.alert('Error', 'Mobile number must be exactly 11 digits');
//       return;
//     }

//     setIsWorking(true);
//     try {
//       const result = await user_login({
//         mobile: mobileNumber,
//         password: password
//       });

//       if (result.status == 200) {
//         await handleSuccessfulLogin(result);
//       } else {
//         Alert.alert('Login Failed', 'Invalid credentials');
//         setIsWorking(false);
//       }
//     } catch (err) {
//       console.error(err);
//       Alert.alert('Error', 'Network error. Please try again.');
//       setIsWorking(false);
//     }
//   };

//   // Get Rider Profile Info
//   const getRiderLoginDetails = async (mobile: string) => {
//     try {
//       const response = await fetch(`https://hoog.ng/infiniteorder/api/Riders/riderProfile.php?mobile=${mobile}`);
//       const data = await response.json();
      
//       await AsyncStorage.setItem("ProfileImage", data.riders_image1);
//       await AsyncStorage.setItem("BikeRegNO", data.bike_regno);
//       await AsyncStorage.setItem("BikeType", data.bike_type);
//       await AsyncStorage.setItem("BikeColor", data.color);
//       await AsyncStorage.setItem('Bank', data.bank);
//       await AsyncStorage.setItem('AcctNo', data.account_number);
//     } catch (error) {
//       console.error('Error fetching rider:', error);
//     }
//   };

//   // Handle modal close
//   const handleCloseModal = () => {
//     setShowVerificationModal(false);
//     setVerificationMobile('');
//     setVerificationPassword('');
//     signOut(); // Sign out from Google if they cancel
//   };

//   // Loading state
//   if (isLoading || isCheckingAuth) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//       </View>
//     );
//   }

//   // If user is authenticated from useAuth() AND has completed Google linking
//   if (user && !showVerificationModal && !isProcessingGoogle) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <Text>Welcome {user.name}</Text>
//         <Text>Email: {user.email}</Text>
//         <Button title="Sign Out" onPress={() => signOut()} />
//       </View>
//     );
//   }

//   // Main render (when not authenticated)
//   return (
//     <KeyboardAvoidingView
//       style={tw`flex-1 bg-white`}
//       behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//     >
//       <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
//       {/* Header */}
//       <View style={tw`h-56 bg-[${COLORS.primary}] rounded-b-3xl relative overflow-hidden`}>
//         <Animated.View 
//           style={[
//             tw`absolute -right-20 -top-20 w-64 h-64 bg-[${COLORS.primaryDark}] rounded-full opacity-20`,
//             { transform: [{ scale: scaleAnimation }] }
//           ]} 
//         />
//         <Animated.View 
//           style={[
//             tw`absolute -left-20 bottom-10 w-48 h-48 bg-white rounded-full opacity-10`,
//             { transform: [{ scale: scaleAnimation }] }
//           ]} 
//         />
//         <View style={tw`flex-1 justify-center items-center`} />
//       </View>

//       {/* Login Form */}
//       <Animated.View 
//         style={[
//           tw`flex-1 px-6 pt-8`,
//           {
//             opacity: fadeAnimation,
//             transform: [{ translateY: slideAnimation }]
//           }
//         ]}
//       >
//         <Text style={[tw`text-4xl font-bold text-[${COLORS.text.primary}] mb-2`, { fontFamily: 'RobotoB' }]}>
//           Welcome Back 
//         </Text>
//         <Text style={[tw`text-[${COLORS.text.secondary}] mb-8`, { fontFamily: 'RobotoM' }]}>
//           Sign in to continue to your account
//         </Text>

//         {/* Mobile Number Input */}
//         <View style={tw`mb-4`}>
//           <Text style={[tw`text-[${COLORS.text.secondary}] text-sm mb-2 ml-1`, { fontFamily: 'RobotoR' }]}>
//             Mobile Number
//           </Text>
//           <View style={tw`flex-row items-center bg-[${COLORS.surface}] rounded-xl border border-[${COLORS.border}] px-4`}>
//             <FontAwesome5 name="phone-alt" size={18} color={COLORS.primary} />
//             <TextInput
//               style={tw`flex-1 py-4 px-3 text-[${COLORS.text.primary}]`}
//               placeholder="Enter 11-digit mobile number"
//               placeholderTextColor={COLORS.text.light}
//               keyboardType="phone-pad"
//               value={mobileNumber}
//               onChangeText={setMobileNumber}
//               maxLength={11}
//             />
//           </View>
//         </View>

//         {/* Password Input */}
//         <View style={tw`mb-2`}>
//           <Text style={[tw`text-[${COLORS.text.secondary}] text-sm mb-2 ml-1`, { fontFamily: 'RobotoR' }]}>
//             Password
//           </Text>
//           <View style={tw`flex-row items-center bg-[${COLORS.surface}] rounded-xl border border-[${COLORS.border}] px-4`}>
//             <FontAwesome5 name="lock" size={18} color={COLORS.primary} />
//             <TextInput
//               style={tw`flex-1 py-4 px-3 text-[${COLORS.text.primary}]`}
//               placeholder="Enter your password"
//               placeholderTextColor={COLORS.text.light}
//               secureTextEntry={!passwordVisible}
//               value={password}
//               onChangeText={setPassword}
//             />
//             <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
//               <FontAwesome5 name={passwordVisible ? 'eye-slash' : 'eye'} size={18} color={COLORS.text.secondary} />
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Forgot Password */}
//         <TouchableOpacity onPress={() => router.replace("/forgotpassword")} style={tw`self-end mb-6`}>
//           <Text style={[tw`text-[${COLORS.primary}] text-sm`, { fontFamily: 'RobotoR' }]}>
//             Forgot Password?
//           </Text>
//         </TouchableOpacity>

//         {/* Login Button */}
//         <TouchableOpacity
//           style={[tw`bg-[${COLORS.primary}] py-4 rounded-xl mb-4`, isWorking && tw`opacity-70`]}
//           onPress={handleLogin}
//           disabled={isWorking}
//         >
//           {isWorking ? <ActivityIndicator color="white" size="small" /> : 
//             <Text style={tw`text-white text-center font-bold text-lg`}>Sign In</Text>
//           }
//         </TouchableOpacity>

//         {/* Divider */}
//         <View style={tw`flex-row items-center mb-6`}>
//           <View style={tw`flex-1 h-[1px] bg-[${COLORS.border}]`} />
//           <Text style={tw`mx-4 text-[${COLORS.text.light}]`}>OR</Text>
//           <View style={tw`flex-1 h-[1px] bg-[${COLORS.border}]`} />
//         </View>

//         {/* Google Sign In */}
//         <TouchableOpacity
//           style={tw`flex-row items-center justify-center bg-white border border-[${COLORS.border}] py-4 rounded-xl mb-8`}
//           onPress={handleGoogleSignIn}
//           disabled={isWorking}
//         >
//           <Image
//             source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
//             style={tw`w-6 h-6 mr-3`}
//           />
//           <Text style={[tw`text-[${COLORS.text.primary}] font-medium`, { fontFamily: 'RobotoR' }]}>
//             Continue with Google
//           </Text>
//         </TouchableOpacity>

//         {/* Sign Up Link */}
//         <View style={tw`flex-row justify-center items-center`}>
//           <Text style={[tw`text-[${COLORS.text.secondary}]`, { fontFamily: 'RobotoR' }]}>
//             Don't have an account?{' '}
//           </Text>
//           <TouchableOpacity onPress={() => router.replace("/SignUpScreen")}>
//             <Text style={[tw`text-[${COLORS.primary}] font-bold`, { fontFamily: 'RobotoB' }]}>
//               Sign Up
//             </Text>
//           </TouchableOpacity>
//         </View>

//         {/* Terms and Conditions */}
//         <TouchableOpacity onPress={() => setIsTermVisible(true)} style={tw`mt-6 mb-4`}>
//           <Text style={[tw`text-[${COLORS.text.light}] text-xs text-center`, { fontFamily: 'LatoR' }]}>
//             By continuing, you agree to our{' '}
//             <Text style={tw`text-[${COLORS.primary}]`}>Terms of Service</Text> and{' '}
//             <Text style={tw`text-[${COLORS.primary}]`}>Privacy Policy</Text>
//           </Text>
//         </TouchableOpacity>
//       </Animated.View>

//       {/* Verification Modal for Google Users */}
//       <Modal
//         visible={showVerificationModal}
//         transparent={true}
//         animationType="slide"
//         onRequestClose={handleCloseModal}
//       >
//         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
//           <View style={{ width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 20 }}>
//             <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text.primary, marginBottom: 10 }}>
//               Complete Your Registration
//             </Text>
//             <Text style={{ color: COLORS.text.secondary, marginBottom: 20 }}>
//               Hello {googleUserInfo?.name}, please provide your mobile number and create a password to continue.
//             </Text>

//             {/* Mobile Input */}
//             <View style={{ marginBottom: 16 }}>
//               <Text style={{ color: COLORS.text.secondary, fontSize: 14, marginBottom: 8 }}>
//                 Mobile Number
//               </Text>
//               <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16 }}>
//                 <FontAwesome5 name="phone-alt" size={18} color={COLORS.primary} />
//                 <TextInput
//                   style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 12, color: COLORS.text.primary }}
//                   placeholder="Enter 11-digit mobile number"
//                   keyboardType="phone-pad"
//                   value={verificationMobile}
//                   onChangeText={setVerificationMobile}
//                   maxLength={11}
//                 />
//               </View>
//             </View>

//             {/* Password Input */}
//             <View style={{ marginBottom: 24 }}>
//               <Text style={{ color: COLORS.text.secondary, fontSize: 14, marginBottom: 8 }}>
//                 Password
//               </Text>
//               <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16 }}>
//                 <FontAwesome5 name="lock" size={18} color={COLORS.primary} />
//                 <TextInput
//                   style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 12, color: COLORS.text.primary }}
//                   placeholder="Enter password"
//                   secureTextEntry={!verificationPasswordVisible}
//                   value={verificationPassword}
//                   onChangeText={setVerificationPassword}
//                 />
//                 <TouchableOpacity onPress={() => setVerificationPasswordVisible(!verificationPasswordVisible)}>
//                   <FontAwesome5 name={verificationPasswordVisible ? 'eye-slash' : 'eye'} size={18} color={COLORS.text.secondary} />
//                 </TouchableOpacity>
//               </View>
//             </View>

//             {/* Buttons */}
//             <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
//               <TouchableOpacity
//                 style={{ flex: 1, backgroundColor: COLORS.border, paddingVertical: 16, borderRadius: 12, marginRight: 8 }}
//                 onPress={handleCloseModal}
//                 disabled={isWorking}
//               >
//                 <Text style={{ color: COLORS.text.primary, textAlign: 'center', fontWeight: '500' }}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={{ flex: 1, backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, marginLeft: 8 }}
//                 onPress={handleVerificationSubmit}
//                 disabled={isWorking}
//               >
//                 {isWorking ? <ActivityIndicator color="white" size="small" /> : 
//                   <Text style={{ color: 'white', textAlign: 'center', fontWeight: '500' }}>Submit</Text>
//                 }
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {/* Terms Modal */}
//       <TermsandConditionModal visible={isTermVisible} onClose={() => setIsTermVisible(false)} />
//     </KeyboardAvoidingView>
//   );
// };

// export default LoginScreen;
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
  Button,
  Easing // Use standard RN Easing
} from 'react-native';
import tw from 'twrnc';
import { router } from 'expo-router';
// DELETE: import { Easing } from 'react-native-reanimated';
import { user_login } from "./api/user_api";
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
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationMobile, setVerificationMobile] = useState('');
  const [verificationPassword, setVerificationPassword] = useState('');
  const [verificationPasswordVisible, setVerificationPasswordVisible] = useState(false);
  const [googleUserInfo, setGoogleUserInfo] = useState<any>(null);
  const [isProcessingGoogle, setIsProcessingGoogle] = useState(false);

  const [fadeAnimation] = useState(new Animated.Value(0));
  const [slideAnimation] = useState(new Animated.Value(50));
  const [scaleAnimation] = useState(new Animated.Value(0.95));

  const [isTermVisible, setIsTermVisible] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Destructure auth context - safely check for accessToken if your context provides it
  const { user, isLoading, signIn, signOut } = useAuth(); 

  const checkTokenAndRedirect = async () => {
    try {
      const dataToken = await AsyncStorage.getItem("AccessToken");
      const userType = await AsyncStorage.getItem("user_type");
      
      if (dataToken) {
        if (userType === "customer") {
          router.replace("/(tabs)/");
        } else if (userType === "rider" || userType === "driver") {
          router.replace("/RidersDashboard");
        } else if (userType === 'alsrider') {
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
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsWorking(true);
    try {
      await signIn();
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Error', 'Failed to sign in with Google');
      setIsWorking(false);
    }
  };

  useEffect(() => {
    const checkGoogleUser = async () => {
      if (!user || isProcessingGoogle || showVerificationModal) return;
      
      setIsProcessingGoogle(true);
      setIsWorking(true);
      
      try {
        const existingToken = await AsyncStorage.getItem("AccessToken");
        const existingUserType = await AsyncStorage.getItem("user_type");
        
        if (existingToken && existingUserType) {
          redirectUser(existingUserType);
          return;
        }

        const checkResponse = await fetch('https://hoog.ng/infiniteorder/api/Customers/check-google-user.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        });
        
        const checkData = await checkResponse.json();
        
        if (checkData.exists || checkData.id) {
          // Store data and redirect
          await AsyncStorage.setItem("AccessToken", checkData.token || "google-auth-token");
          await AsyncStorage.setItem("email", user.email);
          await AsyncStorage.setItem("name", user.name || "");
          await AsyncStorage.setItem("user_type", checkData.user_type || "customer");
          await AsyncStorage.setItem("google_linked", "true");
          
          if (checkData.customer_image) {
            await AsyncStorage.setItem("ProfileImage", checkData.customer_image);
          }
          
          redirectUser(checkData.user_type || "customer", checkData.mobile);
        } else {
          setGoogleUserInfo({
            email: user.email,
            name: user.name || "",
            picture: user.picture || ""
          });
          setShowVerificationModal(true);
        }
      } catch (error) {
        console.error('Error checking Google user:', error);
        Alert.alert('Error', 'Failed to verify Google account');
      } finally {
        setIsProcessingGoogle(false);
        setIsWorking(false);
      }
    };
    
    checkGoogleUser();
  }, [user]);

  const redirectUser = async (type: string, mobile?: string) => {
    if ((type === 'rider' || type === 'driver' || type === 'alsrider') && mobile) {
      await getRiderLoginDetails(mobile);
    }

    if (type === 'customer') router.replace("/(tabs)/");
    else if (type === 'rider' || type === 'driver') router.replace("/RidersDashboard");
    else if (type === 'alsrider') router.replace("/AlsRiderDashboard");
  };

  const handleVerificationSubmit = async () => {
    if (!verificationMobile.trim() || verificationMobile.length !== 11) {
      Alert.alert('Error', 'Please enter a valid 11-digit mobile number');
      return;
    }
    if (!verificationPassword.trim()) {
      Alert.alert('Error', 'Password cannot be empty');
      return;
    }

    setIsWorking(true);
    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/google-login-update.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: verificationMobile,
          fullname: googleUserInfo.name,
          address: googleUserInfo.email,
          password: verificationPassword,
          customer_image: googleUserInfo.picture
        }),
      });
      
      const data = await response.json();
      
      if (data.status === 201 || data.success === true) {
        const loginResult = await user_login({
          mobile: verificationMobile,
          password: verificationPassword
        });
        
        if (loginResult.status === 200) {
          await handleSuccessfulLogin(loginResult);
        } else {
          Alert.alert('Error', 'Account created but login failed. Please sign in manually.');
          setShowVerificationModal(false);
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to process request');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleSuccessfulLogin = async (result: any) => {
    await AsyncStorage.setItem("AccessToken", result.data.token);
    await AsyncStorage.setItem("mobile", result.data.mobile);
    await AsyncStorage.setItem("name", result.data.fullname);
    await AsyncStorage.setItem("email", result.data.email);
    await AsyncStorage.setItem("user_type", result.data.user_type);
    await AsyncStorage.setItem("google_linked", "true");
    
    setShowVerificationModal(false);
    redirectUser(result.data.user_type, result.data.mobile);
  };

  const handleLogin = async () => {
    if (mobileNumber.length !== 11) {
      Alert.alert('Error', 'Enter a valid 11-digit mobile number');
      return;
    }
    setIsWorking(true);
    try {
      const result = await user_login({ mobile: mobileNumber, password });
      if (result.status === 200) {
        await handleSuccessfulLogin(result);
      } else {
        Alert.alert('Login Failed', 'Invalid credentials');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error.');
    } finally {
      setIsWorking(false);
    }
  };

  const getRiderLoginDetails = async (mobile: string) => {
    try {
      const response = await fetch(`https://hoog.ng/infiniteorder/api/Riders/riderProfile.php?mobile=${mobile}`);
      const data = await response.json();
      await AsyncStorage.setItem("ProfileImage", data.riders_image1 || "");
      await AsyncStorage.setItem("BikeRegNO", data.bike_regno || "");
    } catch (error) {
      console.error('Error fetching rider profile:', error);
    }
  };

  if (isLoading || isCheckingAuth) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={tw`flex-1 bg-white`} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" />
      
      <View style={tw`h-40 bg-[${COLORS.primary}] rounded-b-3xl justify-center items-center`}>
        <Text style={tw`text-white text-3xl font-bold`}>InfiniteOrder</Text>
      </View>

      <Animated.View style={[tw`flex-1 px-6 pt-8`, { opacity: fadeAnimation, transform: [{ translateY: slideAnimation }] }]}>
        <Text style={tw`text-3xl font-bold text-gray-800 mb-2`}>Welcome Back</Text>
        <Text style={tw`text-gray-500 mb-8`}>Sign in to continue</Text>

        <View style={tw`mb-4`}>
          <View style={tw`flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4`}>
            <FontAwesome5 name="phone-alt" size={16} color={COLORS.primary} />
            <TextInput
              style={tw`flex-1 py-4 px-3 text-black`}
              placeholder="Mobile Number"
              keyboardType="phone-pad"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              maxLength={11}
            />
          </View>
        </View>

        <View style={tw`mb-6`}>
          <View style={tw`flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4`}>
            <FontAwesome5 name="lock" size={16} color={COLORS.primary} />
            <TextInput
              style={tw`flex-1 py-4 px-3 text-black`}
              placeholder="Password"
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
              <FontAwesome5 name={passwordVisible ? 'eye-slash' : 'eye'} size={16} color="gray" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={handleLogin} disabled={isWorking} style={tw`bg-[${COLORS.primary}] py-4 rounded-xl items-center`}>
          {isWorking ? <ActivityIndicator color="white" /> : <Text style={tw`text-white font-bold text-lg`}>Sign In</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/forgotpassword")} style={tw`mt-4 items-center`}>
          <Text style={tw`text-[${COLORS.primary}]`}>Forgot Password?</Text>
        </TouchableOpacity>

        <View style={tw`flex-row items-center my-6`}>
            <View style={tw`flex-1 h-[1px] bg-gray-200`} />
            <Text style={tw`mx-4 text-gray-400`}>OR</Text>
            <View style={tw`flex-1 h-[1px] bg-gray-200`} />
        </View>

        <TouchableOpacity onPress={handleGoogleSignIn} style={tw`flex-row justify-center items-center border border-gray-200 py-4 rounded-xl`}>
          <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} style={tw`w-5 h-5 mr-2`} />
          <Text style={tw`text-gray-700 font-medium`}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={tw`flex-row justify-center mt-8`}>
            <Text>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.replace("/SignUpScreen")}>
                <Text style={tw`text-[${COLORS.primary}] font-bold`}>Sign Up</Text>
            </TouchableOpacity>
        </View>
      </Animated.View>

      <Modal visible={showVerificationModal} transparent animationType="slide">
        <View style={tw`flex-1 justify-center items-center bg-black/50`}>
          <View style={tw`w-[90%] bg-white rounded-3xl p-6`}>
            <Text style={tw`text-xl font-bold mb-4`}>Complete Registration</Text>
            <TextInput
              style={tw`bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4`}
              placeholder="Mobile Number"
              keyboardType="phone-pad"
              value={verificationMobile}
              onChangeText={setVerificationMobile}
              maxLength={11}
            />
            <TextInput
              style={tw`bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6`}
              placeholder="Create Password"
              secureTextEntry
              value={verificationPassword}
              onChangeText={setVerificationPassword}
            />
            <View style={tw`flex-row gap-4`}>
                <TouchableOpacity style={tw`flex-1 bg-gray-200 py-4 rounded-xl items-center`} onPress={() => setShowVerificationModal(false)}>
                    <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={tw`flex-1 bg-[${COLORS.primary}] py-4 rounded-xl items-center`} onPress={handleVerificationSubmit}>
                    <Text style={tw`text-white font-bold`}>Submit</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TermsandConditionModal visible={isTermVisible} onClose={() => setIsTermVisible(false)} />
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;