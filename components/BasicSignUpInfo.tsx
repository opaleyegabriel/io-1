import { router } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import tw from 'twrnc';
import TermsandConditionModal from './TermsandConditionModal';

const COLORS = {
  primary: '#FDB623',
  primaryDark: '#E5A50A',
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    light: '#9CA3AF',
  },
  border: '#E5E7EB',
  surface: '#F9FAFB',
  error: '#EF4444',
  success: '#10B981',
  white: '#FFFFFF',
  black: '#000000',
};

const BasicSignUpInfo = ({ onVerify, onSignUp, isLoading: parentLoading }) => {
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [rMobile, setRMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nin, setNin] = useState('');
  const [messageEmail, setMessageEmail] = useState('');
  const [messageNIN, setMessageNIN] = useState('');
  
  // Password visibility states
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  
  // Terms acceptance
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpResendTime, setOtpResendTime] = useState(120);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [isVerifyClicked, setIsVerifyClicked] = useState(false);
  const [isTermVisible, setTermVisible] = useState(false);
  const [allowSignUp, setAllowSignUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const otpRefs = useRef([]);

  // Handle OTP timer countdown
  useEffect(() => {
    let timer: any;
    if (otpResendTime > 0) {
      timer = setInterval(() => {
        setOtpResendTime((prevTime) => prevTime - 1);
      }, 1000);
    } else {
      handleOtpReset();
      setCanResendOtp(true);
    }

    return () => clearInterval(timer);
  }, [otpResendTime]);

  const handleOtpReset = async () => {
    try {
      await fetch('https://hoog.ng/infiniteorder/api/Customers/deleteOTP.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobileNumber }),
      });
    } catch (error) {
      console.error(error);
    }
  }

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text.length === 1 && index < otp.length - 1) {
      otpRefs.current[index + 1].focus();
    }

    if (index === otp.length - 1 && text.length > 0) {
      verifyOtp(newOtp.join(''));
    }
  };

  const verifyOtp = async (enteredOtp) => {
    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/updateOTP.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobileNumber, otp: enteredOtp }),
      });

      if (response.status === 200) {
        setOtpVerified(true);
        Alert.alert('Success', 'OTP verified successfully');
        onVerify();
      } else {
        Alert.alert('Invalid OTP', 'Please check the code and try again');
        setOtp(['', '', '', '']);
        otpRefs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert('Network Error', 'Please check your internet connection.');
    }
  };

  const handleVerify = async () => {
    if (!mobileNumber) {
      Alert.alert('Error', 'Please enter a mobile number');
      return;
    }

    if (mobileNumber.length !== 11 || !/^\d+$/.test(mobileNumber)) {
      Alert.alert('Error', 'Mobile number must be exactly 11 digits');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/createSMSOTP.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobileNumber }),
      });

      if (response.status === 409) {
        fetchProfile();
      } else if (response.status === 201) {
        try {
          await findOTP(mobileNumber);
          setOtpResendTime(120);
          setCanResendOtp(false);
          setIsVerifyClicked(true);
          Alert.alert('Success', 'OTP has been sent to your mobile number');
        } catch (error) {
          console.log(error);
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Network Error', 'Please check your internet connection.');
    } finally {
      setIsVerifying(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch(`https://hoog.ng/infiniteorder/api/Customers/readProfile.php?mobile=${mobileNumber}`);
      const data = await response.json();

      if (data && data.length > 0) {
        setFullName(data[0].fullname);
        setRMobile(data[0].rmobile);
        Alert.alert("Success", "Your registration was successful. Please proceed to sign in.");
      } else {
        setOtpVerified(true);
        setAllowSignUp(true);
        onVerify();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!mobileNumber) {
      Alert.alert('Error', 'Please enter a mobile number');
      return;
    }

    setIsResendLoading(true);

    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/resendOTP.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobileNumber }),
      });

      if (response.status === 201) {
        await findOTP(mobileNumber);
        setOtpResendTime(120);
        setCanResendOtp(false);
        Alert.alert('Success', 'OTP has been resent to your mobile number');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Please check your internet connection.');
    } finally {
      setIsResendLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!nin) {
      newErrors.nin = 'NIN is required';
    } else if (nin.length !== 11 || !/^\d+$/.test(nin)) {
      newErrors.nin = 'NIN must be exactly 11 digits';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    const finalRMobile = rMobile || "08034453549";

    setIsLoading(true);

    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/create.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: mobileNumber,
          fullname: fullName,
          address: email,
          NIN: nin,
          password: confirmPassword,
          rmobile: finalRMobile
        }),
      });

      if (response.status === 201) {
        Alert.alert('Success', 'Account created successfully', [
          { text: 'OK', onPress: () => router.replace("/") }
        ]);
      } else if (response.status === 409) {
        const data = await response.json();
        Alert.alert('Duplicate', data.message || 'Account already exists');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailBlur = async () => {
    if (!email) return;

    try {
      const response = await fetch(`https://hoog.ng/infiniteorder/api/Customers/verifyEmail.php?address=${encodeURIComponent(email)}`);

      if (response.status === 200) {
        setMessageEmail("Email already exists. Please use another email");
        setErrors(prev => ({ ...prev, email: 'Email already exists' }));
      } else if (response.status === 404) {
        setMessageEmail('');
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      }
    } catch (error) {
      setMessageEmail('Error verifying email');
    }
  };

  const handleNinBlur = async () => {
    if (!nin || nin.length !== 11) return;

    try {
      const response = await fetch(`https://hoog.ng/infiniteorder/api/Customers/verifyNIN.php?NIN=${encodeURIComponent(nin)}`);

      if (response.status === 200) {
        setMessageNIN("NIN already registered");
        setErrors(prev => ({ ...prev, nin: 'NIN already exists' }));
      } else if (response.status === 404) {
        setMessageNIN('');
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.nin;
          return newErrors;
        });
      }
    } catch (error) {
      setMessageNIN('Error verifying NIN');
    }
  };

  const formatMobileNumber = (mobile) => {
    if (mobile && mobile.length === 11 && mobile.startsWith('0')) {
      return '+234' + mobile.slice(1);
    }
    return mobile;
  };

  const findOTP = async (mobile) => {
    try {
      const response = await fetch(`https://hoog.ng/infiniteorder/api/Customers/pickOTP.php?mobile=${mobile}`);
      const data = await response.json();
      const otp = data.otp;
      
      if (!otp) throw new Error('OTP not found');

      const message = `Your infiniteOrder verification code is ${otp} one-time use only`;
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
      
      setAllowSignUp(true);
      return await smsResponse.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <View>
      {/* Mobile Number Input */}
      <View style={tw`mb-4`}>
        <Text style={[tw`text-[${COLORS.text.secondary}] text-sm mb-2 ml-1`, { fontFamily: 'RobotoR' }]}>
          Mobile Number <Text style={tw`text-[${COLORS.error}]`}>*</Text>
        </Text>
        <View style={tw`flex-row items-center bg-[${COLORS.surface}] rounded-xl border border-[${COLORS.border}] px-4`}>
          <FontAwesome5 name="phone-alt" size={16} color={COLORS.primary} />
          <TextInput
            style={tw`flex-1 py-4 px-3 text-[${COLORS.text.primary}]`}
            placeholder="Enter 11-digit mobile number"
            placeholderTextColor={COLORS.text.light}
            keyboardType="phone-pad"
            maxLength={11}
            value={mobileNumber}
            onChangeText={(text) => {
              if (text.length <= 11 && !otpVerified) {
                setMobileNumber(text);
              }
            }}
            editable={!otpVerified}
          />
        </View>
      </View>

      {/* Verify Button */}
      {mobileNumber.length === 11 && !isVerifyClicked && !otpVerified && (
        isVerifying ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={tw`mb-4`} />
        ) : (
          <TouchableOpacity
            style={tw`bg-[${COLORS.primary}] py-4 rounded-xl mb-6`}
            onPress={handleVerify}
          >
            <Text style={tw`text-white text-center font-bold text-lg`}>
              Verify Number
            </Text>
          </TouchableOpacity>
        )
      )}

      {/* OTP Section */}
      {isVerifyClicked && !otpVerified && (
        <View style={tw`mb-6`}>
          <Text style={[tw`text-center text-[${COLORS.text.secondary}] mb-4`, { fontFamily: 'RobotoR' }]}>
            Enter the 4-digit code sent to {mobileNumber}
          </Text>
          
          <View style={tw`flex-row justify-between mb-4 px-4`}>
            {otp.map((digit, index) => (
              <View key={index} style={tw`w-14 h-14 bg-[${COLORS.surface}] rounded-xl border border-[${COLORS.border}] items-center justify-center`}>
                <TextInput
                  ref={(el) => (otpRefs.current[index] = el)}
                  style={tw`w-full h-full text-center text-xl font-bold text-[${COLORS.text.primary}]`}
                  keyboardType="numeric"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                />
              </View>
            ))}
          </View>

          {otpResendTime > 0 ? (
            <Text style={tw`text-center text-[${COLORS.text.secondary}]`}>
              Resend code in {Math.floor(otpResendTime / 60)}:{(otpResendTime % 60).toString().padStart(2, '0')}
            </Text>
          ) : (
            <TouchableOpacity
              style={tw`py-3`}
              onPress={handleResendOtp}
              disabled={isResendLoading}
            >
              {isResendLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={tw`text-center text-[${COLORS.primary}] font-semibold`}>
                  Resend Code
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Registration Form */}
      {otpVerified && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Full Name */}
          <View style={tw`mb-4`}>
            <Text style={[tw`text-[${COLORS.text.secondary}] text-sm mb-2 ml-1`, { fontFamily: 'RobotoR' }]}>
              Full Name <Text style={tw`text-[${COLORS.error}]`}>*</Text>
            </Text>
            <View style={tw`flex-row items-center bg-[${COLORS.surface}] rounded-xl border ${errors.fullName ? `border-[${COLORS.error}]` : `border-[${COLORS.border}]`} px-4`}>
              <FontAwesome5 name="user" size={16} color={COLORS.primary} />
              <TextInput
                style={tw`flex-1 py-4 px-3 text-[${COLORS.text.primary}]`}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.text.light}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
            {errors.fullName && (
              <Text style={tw`text-[${COLORS.error}] text-xs mt-1 ml-1`}>{errors.fullName}</Text>
            )}
          </View>

          {/* Email */}
          <View style={tw`mb-4`}>
            <Text style={[tw`text-[${COLORS.text.secondary}] text-sm mb-2 ml-1`, { fontFamily: 'RobotoR' }]}>
              Email Address <Text style={tw`text-[${COLORS.error}]`}>*</Text>
            </Text>
            <View style={tw`flex-row items-center bg-[${COLORS.surface}] rounded-xl border ${errors.email ? `border-[${COLORS.error}]` : `border-[${COLORS.border}]`} px-4`}>
              <FontAwesome5 name="envelope" size={16} color={COLORS.primary} />
              <TextInput
                style={tw`flex-1 py-4 px-3 text-[${COLORS.text.primary}]`}
                placeholder="Enter your email"
                placeholderTextColor={COLORS.text.light}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onBlur={handleEmailBlur}
              />
            </View>
            {messageEmail ? (
              <Text style={tw`text-[${COLORS.error}] text-xs mt-1 ml-1`}>{messageEmail}</Text>
            ) : errors.email && (
              <Text style={tw`text-[${COLORS.error}] text-xs mt-1 ml-1`}>{errors.email}</Text>
            )}
          </View>

          {/* NIN */}
          <View style={tw`mb-4`}>
            <Text style={[tw`text-[${COLORS.text.secondary}] text-sm mb-2 ml-1`, { fontFamily: 'RobotoR' }]}>
              NIN <Text style={tw`text-[${COLORS.error}]`}>*</Text>
            </Text>
            <View style={tw`flex-row items-center bg-[${COLORS.surface}] rounded-xl border ${errors.nin ? `border-[${COLORS.error}]` : `border-[${COLORS.border}]`} px-4`}>
              <FontAwesome5 name="id-card" size={16} color={COLORS.primary} />
              <TextInput
                style={tw`flex-1 py-4 px-3 text-[${COLORS.text.primary}]`}
                placeholder="Enter 11-digit NIN"
                placeholderTextColor={COLORS.text.light}
                keyboardType="numeric"
                maxLength={11}
                value={nin}
                onChangeText={(text) => {
                  if (text.length <= 11) setNin(text);
                }}
                onBlur={handleNinBlur}
              />
            </View>
            {messageNIN ? (
              <Text style={tw`text-[${COLORS.error}] text-xs mt-1 ml-1`}>{messageNIN}</Text>
            ) : errors.nin && (
              <Text style={tw`text-[${COLORS.error}] text-xs mt-1 ml-1`}>{errors.nin}</Text>
            )}
          </View>

          {/* Password */}
          <View style={tw`mb-4`}>
            <Text style={[tw`text-[${COLORS.text.secondary}] text-sm mb-2 ml-1`, { fontFamily: 'RobotoR' }]}>
              Password <Text style={tw`text-[${COLORS.error}]`}>*</Text>
            </Text>
            <View style={tw`flex-row items-center bg-[${COLORS.surface}] rounded-xl border ${errors.password ? `border-[${COLORS.error}]` : `border-[${COLORS.border}]`} px-4`}>
              <FontAwesome5 name="lock" size={16} color={COLORS.primary} />
              <TextInput
                style={tw`flex-1 py-4 px-3 text-[${COLORS.text.primary}]`}
                placeholder="Create a password"
                placeholderTextColor={COLORS.text.light}
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                <FontAwesome5
                  name={passwordVisible ? 'eye-slash' : 'eye'}
                  size={16}
                  color={COLORS.text.secondary}
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={tw`text-[${COLORS.error}] text-xs mt-1 ml-1`}>{errors.password}</Text>
            )}
          </View>

          {/* Confirm Password */}
          <View style={tw`mb-4`}>
            <Text style={[tw`text-[${COLORS.text.secondary}] text-sm mb-2 ml-1`, { fontFamily: 'RobotoR' }]}>
              Confirm Password <Text style={tw`text-[${COLORS.error}]`}>*</Text>
            </Text>
            <View style={tw`flex-row items-center bg-[${COLORS.surface}] rounded-xl border ${errors.confirmPassword ? `border-[${COLORS.error}]` : `border-[${COLORS.border}]`} px-4`}>
              <FontAwesome5 name="lock" size={16} color={COLORS.primary} />
              <TextInput
                style={tw`flex-1 py-4 px-3 text-[${COLORS.text.primary}]`}
                placeholder="Confirm your password"
                placeholderTextColor={COLORS.text.light}
                secureTextEntry={!confirmPasswordVisible}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}>
                <FontAwesome5
                  name={confirmPasswordVisible ? 'eye-slash' : 'eye'}
                  size={16}
                  color={COLORS.text.secondary}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={tw`text-[${COLORS.error}] text-xs mt-1 ml-1`}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Referral Mobile */}
          <View style={tw`mb-4`}>
            <Text style={[tw`text-[${COLORS.text.secondary}] text-sm mb-2 ml-1`, { fontFamily: 'RobotoR' }]}>
              Referral Mobile Number <Text style={tw`text-[${COLORS.text.light}] text-xs`}>(Optional)</Text>
            </Text>
            <View style={tw`flex-row items-center bg-[${COLORS.surface}] rounded-xl border border-[${COLORS.border}] px-4`}>
              <FontAwesome5 name="phone" size={16} color={COLORS.primary} />
              <TextInput
                style={tw`flex-1 py-4 px-3 text-[${COLORS.text.primary}]`}
                placeholder="Referral mobile (optional)"
                placeholderTextColor={COLORS.text.light}
                keyboardType="phone-pad"
                maxLength={11}
                value={rMobile}
                onChangeText={setRMobile}
              />
            </View>
          </View>

          {/* Terms Acceptance */}
          <TouchableOpacity
            style={tw`flex-row items-center mb-4`}
            onPress={() => setAcceptTerms(!acceptTerms)}
          >
            <View style={[
              tw`w-5 h-5 rounded border ${acceptTerms ? `bg-[${COLORS.primary}] border-[${COLORS.primary}]` : `border-[${COLORS.border}] bg-white`} items-center justify-center mr-2`,
            ]}>
              {acceptTerms && <FontAwesome5 name="check" size={12} color="white" />}
            </View>
            <Text style={[tw`text-[${COLORS.text.secondary}] text-sm flex-1`, { fontFamily: 'RobotoR' }]}>
              I agree to the{' '}
              <Text style={tw`text-[${COLORS.primary}]`} onPress={() => setTermVisible(true)}>
                Terms and Conditions
              </Text>
            </Text>
          </TouchableOpacity>
          {errors.terms && (
            <Text style={tw`text-[${COLORS.error}] text-xs mt-1 ml-1 mb-2`}>{errors.terms}</Text>
          )}

          {/* Sign Up Button */}
          {allowSignUp ? (
            <TouchableOpacity
              style={[
                tw`bg-[${COLORS.primary}] py-4 rounded-xl mb-4`,
                (isLoading || parentLoading) && tw`opacity-70`
              ]}
              onPress={handleSignUp}
              disabled={isLoading || parentLoading}
            >
              {(isLoading || parentLoading) ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={tw`text-white text-center font-bold text-lg`}>
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={tw`bg-[${COLORS.surface}] py-4 rounded-xl mb-4 border border-[${COLORS.border}]`}>
              <Text style={[tw`text-[${COLORS.text.secondary}] text-center`, { fontFamily: 'RobotoR' }]}>
                You've already signed up. Please{' '}
                <Text style={tw`text-[${COLORS.primary}] font-bold`} onPress={() => router.replace("/")}>
                  Sign In
                </Text>
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <TermsandConditionModal
        visible={isTermVisible}
        onClose={() => setTermVisible(false)}
      />
    </View>
  );
};

export default BasicSignUpInfo;