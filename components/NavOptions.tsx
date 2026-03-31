import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { navData } from '@/constants'
import tw from 'twrnc';
import { router } from 'expo-router';
import { TabBarIcon } from './navigation/TabBarIcon';
import { useSelector } from 'react-redux';
import { selectOrigin } from '@/store/ioSlices';



const NavOptions = () => {
        const origin = useSelector(selectOrigin)
        const [isLoading, setIsLoading] = useState(false);
   
    return (
        <View>
            <View style={tw`h-[2px] bg-yellow-600 w-full `} />
            <Text style={[tw`pt-6`,{fontFamily:"RobotoB", fontSize:15}]}>Then Pick a Service</Text>
            <Text style={[tw`pt-1 pb-2`,{fontFamily:"Nunito", fontSize:10}]}>Please select an address from the "Where From" section to activate any service, or use your current location.</Text>
        <FlatList 
    data={navData}
    horizontal
    keyExtractor={(item) => item?._id}
    renderItem={({ item }) => (
        <View style={tw`mt-0 pl-1 p-1 bg-gray-100 mr-1 rounded-lg border border-yellow-600 w-20 h-32 items-center justify-between`} >
        <TouchableOpacity onPress={() => router.replace(item?.screen)} disabled={!origin}>
            <View style={tw`${origin ? "opacity-100" : "opacity-20"}`}>
                <Image source={item.image} style={{ width: 30, height: 30, resizeMode: "contain" }} />
            </View>
        </TouchableOpacity>
    
        <TouchableOpacity onPress={() => router.replace(item?.screen)} disabled={!origin}>
            <Text style={tw`py-1 text-sm text-yellow-600 font-semibold text-center`}>{item?.title}</Text>
        </TouchableOpacity>
    
        <TouchableOpacity onPress={() => router.replace(item?.screen)} disabled={!origin}>
            <View style={tw`p-2 bg-black rounded-full w-7 h-7 items-center justify-center`}>
                <TabBarIcon name="arrow-forward" size={10} color={"#ffffff"} />
            </View>
        </TouchableOpacity>
    </View>
    
    )}
/>  
</View>
  );
};

export default NavOptions