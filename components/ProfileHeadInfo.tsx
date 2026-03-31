import { View, Text, Image, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import tw from "twrnc"
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'


const ProfileHeadInfo = () => {
  const [customerName, setCustomerName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [mobile, setMobile] = useState('');
  const [verified, setVerified] = useState('');
  const [profileImage, setProfileImage] = useState('');

//check if customer already approved with NIN and Passport

//check customer profile)
const checkProfile = (mobile) => {
  fetch(`https://hoog.ng/infiniteorder/api/Customers/readProfile.php?mobile=${mobile}`)
  .then(res => {
    
    return res.json();
  })
  .then(
    (result) => {
      let data= result;
     
      if (result && result[0] && result[0].customer_image) {
        AsyncStorage.setItem("ProfileImage", result[0].customer_image);
      } 
      if (result && Array.isArray(result) && result.length > 0 && result[0].verification_status !== undefined) {
        const verificationStatus = result[0].verification_status;
      
        if (verificationStatus !== "Y") {
          setVerified(verificationStatus);
          AsyncStorage.setItem("verified", verificationStatus)
        }else if(verificationStatus === "Y"){
          setVerified(verificationStatus);
          AsyncStorage.setItem("verified", verificationStatus)
        }
      }
     
     
  },
    (error) => {
      console.log(error);
    }
  )
};




  //extract first name
  const extraBeforeSpace = (inputText) => {
    const result = inputText.match(/(.*)(?= )/);
    return result ? result[0].trim() : '';
  };

  useEffect(() => {
    handleGotToken();
    checkProfile(mobile);
  });
  
  const handleGotToken = async () => {
    const cusName = await AsyncStorage.getItem("name");
    let pickMobile = await AsyncStorage.getItem("mobile");
    let imgurl = await AsyncStorage.getItem('ProfileImage');
   
    setCustomerName(cusName);
    setMobile(pickMobile);
    setProfileImage(imgurl);
    const fname = extraBeforeSpace(cusName);
    setFirstName(fname);
  }
  



    const GotoHelp = () =>{
        router.replace("/HelpScreen");
    }
    const CaptureImages = () => {
      router.replace("/VerifyImages");
    }


  return (
    <View style={tw`pl-0 pr-0`}>
    <View style={tw`flex-row justify-between items-center p-1`}>
  {/* Left Side: Small Circle with Number and Greeting */}
  <View style={tw`flex-row items-center`}>
    {/* Small Circle with Number */}
    <View
  style={[
    tw`w-8 h-8 rounded-full bg-yellow-600 justify-center items-center`,
    { marginRight: 8 }, // Adds space between the circle and the greeting
  ]}
>
  {!profileImage && (
    <Text style={tw`text-white font-bold text-sm`}>?</Text>
  )}

  {profileImage && (
    <Image
      source={{ uri: `${profileImage}` }}
      style={{
        width: '100%', // Make the image fill the circle
        height: '100%', // Ensure the image is fully contained
        borderRadius: 50, // Ensures the image is displayed in a circular shape
      }}
      resizeMode="cover" // This keeps the image aspect ratio intact
    />
  )}
</View>


    {/* Greeting Message */}
    <TouchableOpacity 
    
    >
    <Text style={[tw`text-xl font-semibold`,{fontFamily: 'LatoB', fontSize:11}]}>Hi {firstName}</Text>
    </TouchableOpacity>
  </View>
{verified=="Y" || verified=="N" &&(
    <View style={tw`flex-row items-center`}>
    {/* Notification Bell Icon with Badge */}
    <View style={tw`relative`}>
      <MaterialCommunityIcons name="bell" size={30} color="black" />
      {/* Notification Badge */}
      <TouchableOpacity
          style={[
            tw`absolute top-0.2 right-0 w-5 h-5 rounded-full bg-red-600 justify-center items-center`,
            { transform: [{ translateX: 9 }] },
          ]}
          onPress={() => router.push("/api/MessageList")} // <-- navigate to new screen
        >
          <Text style={tw`text-white font-bold text-xs`}>0</Text>
      </TouchableOpacity>

    </View>

    {/* HELP Button */}
    <TouchableOpacity style={tw`ml-3`}
    onPress={() => {
        
        GotoHelp();
      }}
    
    >
      <Text style={[tw`text-blue-600 font-semibold`,{fontFamily:"KalamB"}]}>Help</Text>
    </TouchableOpacity>

  </View>
)
  
}
{(verified == "N" || verified == "W") &&(
  <TouchableOpacity
  onPress={() => {
    
    CaptureImages();
  }} 
  style={tw`flex-row ml-1 py-1 px-1 bg-yellow-600 rounded-lg shadow-md`}
  
>
  
  <Text style={[
    tw`text-black  text-white py-1 pr-1 pl-1 font-bold`, 
    { fontSize: 14, fontFamily: 'RobotoR' }  // Replace 'Roboto' with your font name
  ]}> Verify</Text>
</TouchableOpacity>
)

}
  
  
  
</View>
</View>
  )
}

export default ProfileHeadInfo