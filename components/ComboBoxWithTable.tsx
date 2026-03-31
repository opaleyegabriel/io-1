import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Modal,
  RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { selectOrigin } from '@/store/ioSlices';
import { router } from 'expo-router';
import tw from 'twrnc';

const ComboBoxWithTable = ({ 
  alsUsableAmt, 
  mobile, 
  onProceedToSummary,
  initialItems = null,
  onUpdateOrder = null,
  onCancelEdit = null,
  isEditing = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  const Origin = useSelector(selectOrigin);

  // Load initial items if editing
  useEffect(() => {
    if (initialItems && isEditing) {
      setSelectedItems(initialItems);
    }
  }, [initialItems, isEditing]);

  const serviceCategories = [
    { id: 'all', name: 'All', icon: '📋' },
    { id: 'washing', name: 'Washing', icon: '🧼' },
    { id: 'ironing', name: 'Ironing', icon: '✨' },
    { id: 'drycleaning', name: 'Dry Clean', icon: '🧹' },
    { id: 'men', name: 'Men', icon: '👔' },
    { id: 'women', name: 'Women', icon: '👗' },
    { id: 'household', name: 'Household', icon: '🏠' },
  ];

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('https://hoog.ng/infiniteorder/api/Settings/readClothList.php');
      const data = await response.json();
      if (data) {
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      Alert.alert('Error', 'Unable to load items. Please pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectItem = (item) => {
    const isItemSelected = selectedItems.some((selectedItem) => selectedItem.id === item.id);

    if (isItemSelected) {
      Alert.alert(
        'Item Already Added',
        'This item is already in your order. Would you like to increase the quantity?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Add More', 
            onPress: () => {
              setSelectedItems((prevItems) =>
                prevItems.map((selectedItem) =>
                  selectedItem.id === item.id
                    ? { ...selectedItem, quantity: selectedItem.quantity + 1 }
                    : selectedItem
                )
              );
            }
          }
        ]
      );
      return;
    }

    setSelectedItems((prevItems) => [
      ...prevItems,
      { ...item, quantity: 1 }
    ]);
  };

  const handleQuantityChange = (id, type) => {
    setSelectedItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          if (type === 'decrement') {
            return item.quantity === 1 ? null : { ...item, quantity: item.quantity - 1 };
          } else {
            return { ...item, quantity: item.quantity + 1 };
          }
        }
        return item;
      }).filter((item) => item !== null)
    );
  };

  const handleItemRemoval = (id) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          onPress: () => setSelectedItems((prevItems) => prevItems.filter((item) => item.id !== id)),
          style: 'destructive'
        }
      ]
    );
  };

  const calculateItemTotal = (price, quantity) => price * quantity;
  const calculateGrandTotal = () => {
    return selectedItems.reduce((total, item) => total + calculateItemTotal(item.price, item.quantity), 0);
  };

  const validateBeforeProceed = () => {
    if (!Origin?.location.lat || !Origin?.location.lng) {
      Alert.alert(
        'Location Required',
        'Please select your pickup address or use current location',
        [
          { text: 'OK', onPress: () => router.push('/(tabs)/ChooseLocation') }
        ]
      );
      return false;
    }

    const total = calculateGrandTotal();
    if (total < 2000) {
      Alert.alert('Minimum Order', 'Minimum order amount is ₦2,000');
      return false;
    }

    if (selectedItems.length === 0) {
      Alert.alert('Empty Order', 'Please add items to your order');
      return false;
    }

    return true;
  };

  const handleProceed = () => {
    if (validateBeforeProceed()) {
      if (isEditing && onUpdateOrder) {
        onUpdateOrder(selectedItems, calculateGrandTotal());
      } else {
        onProceedToSummary(selectedItems, calculateGrandTotal());
      }
    }
  };

  const handleCancelEdit = () => {
    if (isEditing) {
      setShowCancelModal(true);
    }
  };

  const CategoryPills = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-4`}>
      <View style={tw`flex-row gap-2`}>
        {serviceCategories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={tw`
              flex-row items-center px-4 py-2 rounded-full 
              ${selectedCategory === cat.name ? 'bg-yellow-600' : 'bg-gray-200'}
            `}
            onPress={() => setSelectedCategory(cat.name)}
          >
            <Text style={tw`mr-1`}>{cat.icon}</Text>
            <Text style={tw`
              font-medium
              ${selectedCategory === cat.name ? 'text-white' : 'text-gray-700'}
            `}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  // Cancel Edit Modal
  const CancelEditModal = () => (
    <Modal
      visible={showCancelModal}
      transparent
      animationType="fade"
    >
      <View style={tw`flex-1 justify-center items-center bg-black/50`}>
        <View style={tw`bg-white rounded-2xl p-6 m-4 w-11/12 max-w-md`}>
          <View style={tw`items-center mb-4`}>
            <View style={tw`w-16 h-16 bg-red-100 rounded-full items-center justify-center`}>
              <MaterialCommunityIcons name="close-circle" size={32} color="#EF4444" />
            </View>
          </View>
          
          <Text style={tw`text-xl font-bold text-center mb-2`}>Cancel Editing?</Text>
          <Text style={tw`text-gray-600 text-center mb-6`}>
            Any changes you made will be lost. Are you sure you want to cancel?
          </Text>

          <TouchableOpacity
            style={tw`bg-red-500 py-3 rounded-xl mb-2`}
            onPress={() => {
              setShowCancelModal(false);
              if (onCancelEdit) onCancelEdit();
            }}
          >
            <Text style={tw`text-white text-center font-bold text-lg`}>Yes, Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`bg-gray-200 py-3 rounded-xl`}
            onPress={() => setShowCancelModal(false)}
          >
            <Text style={tw`text-gray-700 text-center font-medium`}>Continue Editing</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      {/* Edit Mode Header */}
      {isEditing && (
        <View style={tw`bg-yellow-100 px-4 py-3 border-b border-yellow-300`}>
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
              <MaterialCommunityIcons name="pencil-circle" size={24} color="#D97706" />
              <Text style={tw`text-yellow-800 font-bold ml-2`}>Editing Order</Text>
            </View>
            <TouchableOpacity onPress={handleCancelEdit}>
              <MaterialCommunityIcons name="close" size={24} color="#D97706" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search Bar */}
      <View style={tw`px-4 py-3 bg-white border-b border-gray-200`}>
        <View style={tw`flex-row items-center bg-gray-100 rounded-xl px-4 py-2`}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            style={tw`flex-1 ml-2 text-base`}
            placeholder="Search items..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#9CA3AF"
          />
          {searchTerm !== '' && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <View style={tw`bg-white px-4 py-2 border-b border-gray-200`}>
        <CategoryPills />
      </View>

      {/* Items Grid */}
      <View style={tw`flex-1 px-2 pt-2`}>
        {loading && !refreshing ? (
          <View style={tw`flex-1 justify-center items-center`}>
            <ActivityIndicator size="large" color="#D97706" />
            <Text style={tw`mt-2 text-gray-600`}>Loading items...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => {
              const isSelected = selectedItems.some((selectedItem) => selectedItem.id === item.id);
              
              return (
                <TouchableOpacity
                  style={tw`
                    flex-1 m-1 p-3 bg-white rounded-xl border-2 
                    ${isSelected ? 'border-yellow-600 bg-yellow-50' : 'border-gray-100'}
                  `}
                  onPress={() => handleSelectItem(item)}
                >
                  <View style={tw`items-center`}>
                    <Text style={tw`text-3xl mb-2`}>
                      {item.category === 'washing' && '🧼'}
                      {item.category === 'ironing' && '✨'}
                      {item.category === 'drycleaning' && '🧹'}
                      {item.category === 'men' && '👔'}
                      {item.category === 'women' && '👗'}
                      {item.category === 'household' && '🏠'}
                      {!item.category && '👕'}
                    </Text>
                    <Text style={tw`font-medium text-center`} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <Text style={tw`text-yellow-600 font-bold mt-1`}>
                      ₦{item.price}
                    </Text>
                    {isSelected && (
                      <View style={tw`absolute top-1 right-1`}>
                        <MaterialCommunityIcons name="check-circle" size={20} color="#D97706" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={tw`py-10 items-center`}>
                <MaterialCommunityIcons name="package-variant" size={48} color="#D1D5DB" />
                <Text style={tw`text-gray-400 mt-2`}>No items found</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Selected Items Preview */}
      {selectedItems.length > 0 && (
        <View style={tw`bg-white border-t border-gray-200 px-4 py-3`}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-2`}>
            <View style={tw`flex-row gap-2`}>
              {selectedItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={tw`bg-gray-100 rounded-lg px-3 py-2 flex-row items-center`}
                  onPress={() => {
                    Alert.alert(
                      item.description,
                      `Quantity: ${item.quantity}\nPrice: ₦${item.price}\nTotal: ₦${item.price * item.quantity}`,
                      [
                        { text: 'OK' },
                        { 
                          text: 'Remove', 
                          onPress: () => handleItemRemoval(item.id),
                          style: 'destructive'
                        }
                      ]
                    );
                  }}
                >
                  <Text style={tw`mr-1 text-lg`}>
                    {item.category === 'washing' && '🧼'}
                    {item.category === 'ironing' && '✨'}
                    {item.category === 'drycleaning' && '🧹'}
                    {item.category === 'men' && '👔'}
                    {item.category === 'women' && '👗'}
                    {item.category === 'household' && '🏠'}
                    {!item.category && '👕'}
                  </Text>
                  <Text style={tw`text-sm font-medium`}>{item.quantity}x</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={tw`flex-row gap-2`}>
            {/* Cancel Button (only in edit mode) */}
            {isEditing && (
              <TouchableOpacity
                style={tw`flex-1 bg-gray-300 rounded-xl py-4`}
                onPress={handleCancelEdit}
              >
                <Text style={tw`text-center font-bold text-gray-700`}>Cancel</Text>
              </TouchableOpacity>
            )}

            {/* Proceed/Update Button */}
            <TouchableOpacity
              style={tw`${isEditing ? 'flex-1' : 'w-full'} bg-yellow-600 rounded-xl py-4`}
              onPress={handleProceed}
            >
              <View style={tw`flex-row items-center justify-between px-4`}>
                <View>
                  <Text style={tw`text-white text-sm`}>{selectedItems.length} items</Text>
                  <Text style={tw`text-white font-bold text-lg`}>
                    ₦{calculateGrandTotal().toLocaleString()}
                  </Text>
                </View>
                <View style={tw`flex-row items-center`}>
                  <Text style={tw`text-white font-medium mr-2`}>
                    {isEditing ? 'Update Order' : 'Review Order'}
                  </Text>
                  <MaterialCommunityIcons name="arrow-right-circle" size={24} color="white" />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Cancel Edit Modal */}
      <CancelEditModal />
    </SafeAreaView>
  );
};

export default ComboBoxWithTable;