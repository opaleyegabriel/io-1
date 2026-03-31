import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import tw from 'twrnc';

export default function OrderSummary() {
  const params = useLocalSearchParams();
  const { selectedItems, grandTotal, onPlaceOrder } = params;
  const items = selectedItems ? JSON.parse(selectedItems as string) : [];
  const [orderNote, setOrderNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      await onPlaceOrder();
    } catch (error) {
      Alert.alert('Error', 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const calculateItemTotal = (price, quantity) => price * quantity;

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      {/* Header */}
      <View style={tw`bg-white px-4 py-3 border-b border-gray-200`}>
        <View style={tw`flex-row items-center`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`mr-3`}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          <View>
            <Text style={tw`text-xl font-bold text-gray-800`}>Review Order</Text>
            <Text style={tw`text-sm text-gray-500`}>Confirm your items before checkout</Text>
          </View>
        </View>
      </View>

      <ScrollView style={tw`flex-1 p-4`}>
        {/* Pickup Address */}
        <View style={tw`bg-white rounded-xl p-4 mb-4`}>
          <View style={tw`flex-row items-center mb-2`}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#D97706" />
            <Text style={tw`font-bold ml-2`}>Pickup Address</Text>
          </View>
          <Text style={tw`text-gray-600`}>{params.address || 'Address not set'}</Text>
        </View>

        {/* Order Items */}
        <View style={tw`bg-white rounded-xl p-4 mb-4`}>
          <View style={tw`flex-row items-center mb-3`}>
            <MaterialCommunityIcons name="format-list-bulleted" size={20} color="#D97706" />
            <Text style={tw`font-bold ml-2`}>Order Items</Text>
          </View>

          {items.map((item, index) => (
            <View key={index} style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}>
              <View style={tw`flex-1`}>
                <Text style={tw`font-medium`}>{item.description}</Text>
                <Text style={tw`text-sm text-gray-500`}>x{item.quantity}</Text>
              </View>
              <Text style={tw`font-bold text-[#D97706]`}>
                ₦{calculateItemTotal(item.price, item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}

          {/* Subtotal */}
          <View style={tw`flex-row justify-between items-center mt-3 pt-3 border-t border-gray-200`}>
            <Text style={tw`font-bold`}>Subtotal</Text>
            <Text style={tw`font-bold text-lg text-[#D97706]`}>₦{grandTotal}</Text>
          </View>
        </View>

        {/* Order Notes */}
        <View style={tw`bg-white rounded-xl p-4 mb-4`}>
          <View style={tw`flex-row items-center mb-2`}>
            <MaterialCommunityIcons name="note-text" size={20} color="#D97706" />
            <Text style={tw`font-bold ml-2`}>Special Instructions (Optional)</Text>
          </View>
          <TextInput
            style={tw`bg-gray-50 rounded-lg p-3 text-base`}
            placeholder="e.g., Handle with care, specific pickup time..."
            value={orderNote}
            onChangeText={setOrderNote}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Delivery Info */}
        <View style={tw`bg-blue-50 rounded-xl p-4 mb-4`}>
          <View style={tw`flex-row items-center mb-2`}>
            <MaterialCommunityIcons name="truck-delivery" size={20} color="#2563EB" />
            <Text style={tw`font-bold ml-2 text-blue-600`}>Delivery Information</Text>
          </View>
          <Text style={tw`text-gray-600 text-sm mb-1`}>
            • Pickup within 30 minutes - 1 hour after order confirmation
          </Text>
          <Text style={tw`text-gray-600 text-sm mb-1`}>
            • Delivery within 24-48 hours depending on service type
          </Text>
          <Text style={tw`text-gray-600 text-sm`}>
            • Track your order status in real-time
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={tw`bg-white border-t border-gray-200 px-4 py-3`}>
        <View style={tw`flex-row gap-3`}>
          <TouchableOpacity
            style={tw`flex-1 bg-gray-200 rounded-xl py-4`}
            onPress={() => router.back()}
          >
            <Text style={tw`text-center font-bold text-gray-700`}>Edit Order</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`flex-1 bg-[#D97706] rounded-xl py-4 ${loading ? 'opacity-50' : ''}`}
            onPress={handlePlaceOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={tw`text-center font-bold text-white`}>Place Order</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}