import { View, Text, TextInput, TouchableOpacity, Animated, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import InfiniteHeader from '@/components/InfiniteHeader'
import ProfileHeadInfo from '@/components/ProfileHeadInfo'
import Container from '@/components/container'
import tw from 'twrnc'
import { useNavigation } from '@react-navigation/native'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'

const HelpScreen = () => {
  const [priority, setPriority] = useState('Normal') // ComboBox State
  const [helpText, setHelpText] = useState('') // TextInput (TextArea) State
  const [scaleAnim] = useState(new Animated.Value(1)) // Animation for scaling the button
  const navigation = useNavigation() // React Navigation hook for navigation
  const [mobile, setMobile] = useState('');
  const maxLength = 5000

  // Calculate remaining character count
  const remainingCount = maxLength - helpText.length

  useEffect(() => {
    const handleGotToken = async () => {
      const myMobile = await AsyncStorage.getItem('mobile');
      if (myMobile) {
        setMobile(myMobile);
      } else {
        alert('Your account name not found');
      }
    };

    handleGotToken();
  }, []);
  const handleSave = async () => {
    // Logic for saving help goes here
    const userData = {
      mobile:mobile,
      priority:priority,
      message:helpText
    };

    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/help.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      let data = null;
      
      // Attempt to parse JSON only if the response body is non-empty and is of JSON type
      const contentLength = response.headers.get("content-length");
      if (response.ok && contentLength && parseInt(contentLength) > 0 && response.headers.get("content-type")?.includes("application/json")) {
        data = await response.json();
      }
      // console.log(response.status);
      
      if (response.status === 500) {
        Alert.alert("Pick Update fail", data?.message || "Pickup update failed");
      } else if (response.status === 201) {
       
        alert("Help successfully created, someone will contact your soon");
        router.replace("/(tabs)/");

      } else {
        alert("unforeseen problem occur");
        
      }
    } catch (error) {
      alert("An error occurred. Please check your network and try again.");
      
    } finally {
      
    }
   
  }

  const goBack = () =>{
    router.replace("/(tabs)/");
  }
  const priorityOptions = ['Normal', 'Top Urgent', 'Extremely Urgent']

  // Button press animation
  const animateButtonPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95, // Scale down the button
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const animateButtonPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1, // Reset scale
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Container className='p-0 bg-yellow-50 pb-40'>
      <View>
        <InfiniteHeader />
      </View>
      <View>
        <ProfileHeadInfo />
      </View>
      <View style={tw`p-4 mt-5`}>
        {/* Priority Selection */}
        <Text style={tw`text-lg font-semibold mb-2`}>Select Priority</Text>

        {/* Option Buttons (Radio Style) */}
        <View>
          {priorityOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={tw`flex-row items-center mb-2`} // Adding margin bottom for spacing
              onPress={() => setPriority(option)} // Set selected priority
            >
              <View
                style={tw`w-5 h-5 rounded-full border-2 mr-2 flex items-center justify-center ${priority === option ? 'bg-yellow-500' : 'bg-white'}`}
              >
                {priority === option && <View style={tw`w-3 h-3 rounded-full bg-white`} />}
              </View>
              <Text style={tw`text-lg ${priority === option ? 'font-semibold text-yellow-500' : 'text-gray-800'}`}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TextArea (TextInput) */}
        <Text style={tw`text-lg font-semibold mb-2`}>Help Description</Text>
        <TextInput
          style={tw`border rounded-md p-4 h-48 text-base mb-2`}
          multiline
          maxLength={maxLength}
          value={helpText}
          onChangeText={setHelpText}
          placeholder="Enter your help description (max 5000 characters)"
        />

        {/* Character count */}
        <Text style={tw`text-sm text-gray-500`}>
          {remainingCount} characters remaining
        </Text>

        {/* Save Button with Animation */}
        <Animated.View
          style={{ transform: [{ scale: scaleAnim }] }}
        >
          <TouchableOpacity
            onPressIn={animateButtonPressIn} // On press down
            onPressOut={animateButtonPressOut} // On press release
            onPress={handleSave}
            style={tw`bg-yellow-500 py-2 px-4 rounded-full mt-4`}
          >
            <Text style={tw`text-white text-lg text-center`}>Create Help</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Go Back Button */}
        <TouchableOpacity
          onPress={() => goBack()} // Go back to the previous screen
          style={tw`bg-gray-500 py-2 px-4 rounded-full mt-4`}
        >
          <Text style={tw`text-white text-lg text-center`}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </Container>
  )
}

export default HelpScreen
