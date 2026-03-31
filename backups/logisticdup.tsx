import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import tw from 'twrnc';

const LogisticScreen = () => {
  const router = useRouter();

  return (
    <View style={tw`flex-1 bg-yellow-500 justify-center items-center`}> 
      <Text style={tw`text-xl font-bold text-white`}>Coming Soon... Food & Logistics</Text>
      
      <TouchableOpacity 
        onPress={() => router.replace("/(tabs)")} 
        style={tw`mt-6 bg-white px-6 py-3 rounded-lg shadow-lg`}>
        <Text style={tw`text-black font-semibold`}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LogisticScreen;
