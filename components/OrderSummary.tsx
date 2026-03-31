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
import { useSelector } from 'react-redux';
import { selectOrigin } from '@/store/ioSlices';
import { router } from 'expo-router';
import tw from 'twrnc';

const OrderSummary = ({ 
  items, 
  grandTotal, 
  alsUsableAmt, 
  mobile, 
  onBack, 
  onEditOrder,
  onOrderPlaced 
}) => {
  const [orderNote, setOrderNote] = useState('');
  const [loading, setLoading] = useState(false);
  const Origin = useSelector(selectOrigin);

  const calculateItemTotal = (price, quantity) => price * quantity;

  const placeOrder = async () => {
    if (grandTotal > alsUsableAmt) {
      Alert.alert(
        'Insufficient Balance',
        `You need ₦${(grandTotal - alsUsableAmt).toLocaleString()} more in your wallet. Please fund your wallet to continue.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Fund Wallet', onPress: () => router.push('/(tabs)/FundWallet') }
        ]
      );
      return;
    }

    setLoading(true);

    const orderDetails = {
      mobile: mobile,
      amount: grandTotal,
      address: Origin?.description,
      origin_lat: Origin?.location.lat,
      origin_lng: Origin?.location.lng,
      note: orderNote,
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        total: calculateItemTotal(item.price, item.quantity),
      }))
    };

    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Customers/alsOrdering.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderDetails),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      if (result.status === 201) {
        Alert.alert(
          '🎉 Order Placed Successfully!',
          'Your order has been received. A rider will be assigned within 30 minutes to pickup your laundry.',
          [
            {
              text: 'Track Order',
              onPress: () => {
                onOrderPlaced();
                router.push('/(tabs)/OrderHistory');
              }
            },
            {
              text: 'Back to Home',
              onPress: () => {
                onOrderPlaced();
                router.replace("/(tabs)");
              },
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Something went wrong!');
      }
    } catch (error) {
      console.error('Error saving order:', error);
      Alert.alert('Error', 'There was an issue saving your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      {/* Header */}
      <View style={tw`bg-white px-4 py-3 border-b border-gray-200`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center`}>
            <TouchableOpacity onPress={onBack} style={tw`mr-3`}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
            </TouchableOpacity>
            <View>
              <Text style={tw`text-xl font-bold text-gray-800`}>Review Order</Text>
              <Text style={tw`text-sm text-gray-500`}>Confirm your items before checkout</Text>
            </View>
          </View>
          
          {/* Edit Button */}
          <TouchableOpacity 
            onPress={onEditOrder}
            style={tw`bg-yellow-100 px-4 py-2 rounded-full flex-row items-center`}
          >
            <MaterialCommunityIcons name="pencil" size={16} color="#D97706" />
            <Text style={tw`text-yellow-700 font-medium ml-1`}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={tw`flex-1 p-4`}>
        {/* Pickup Address */}
        <View style={tw`bg-white rounded-xl p-4 mb-4`}>
          <View style={tw`flex-row items-center mb-2`}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#D97706" />
            <Text style={tw`font-bold ml-2`}>Pickup Address</Text>
          </View>
          <Text style={tw`text-gray-600`}>{Origin?.description || 'Address not set'}</Text>
          {(!Origin?.location.lat || !Origin?.location.lng) && (
            <TouchableOpacity 
              style={tw`mt-2 bg-red-100 p-2 rounded-lg`}
              onPress={() => router.push('/(tabs)/ChooseLocation')}
            >
              <Text style={tw`text-red-600 text-center`}>⚠️ Location Required - Tap to set</Text>
            </TouchableOpacity>
          )}
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
              <Text style={tw`font-bold text-yellow-600`}>
                ₦{calculateItemTotal(item.price, item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}

          <View style={tw`flex-row justify-between items-center mt-3 pt-3 border-t border-gray-200`}>
            <Text style={tw`font-bold`}>Subtotal</Text>
            <Text style={tw`font-bold text-lg text-yellow-600`}>₦{grandTotal.toLocaleString()}</Text>
          </View>
        </View>

        {/* Wallet Balance */}
        <View style={tw`bg-white rounded-xl p-4 mb-4`}>
          <View style={tw`flex-row items-center mb-2`}>
            <MaterialCommunityIcons name="wallet" size={20} color="#D97706" />
            <Text style={tw`font-bold ml-2`}>Wallet Balance</Text>
          </View>
          <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-gray-600`}>Available:</Text>
            <Text style={tw`font-bold text-green-600`}>₦{alsUsableAmt.toLocaleString()}</Text>
          </View>
          {grandTotal > alsUsableAmt && (
            <View style={tw`mt-2 bg-red-50 p-2 rounded-lg`}>
              <Text style={tw`text-red-600 text-center`}>
                ⚠️ Insufficient balance. Need ₦{(grandTotal - alsUsableAmt).toLocaleString()} more
              </Text>
            </View>
          )}
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
            onPress={onBack}
          >
            <Text style={tw`text-center font-bold text-gray-700`}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`flex-1 bg-yellow-600 rounded-xl py-4 ${loading ? 'opacity-50' : ''}`}
            onPress={placeOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={tw`text-center font-bold text-white`}>
                {grandTotal > alsUsableAmt ? 'Insufficient Balance' : 'Place Order'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default OrderSummary;