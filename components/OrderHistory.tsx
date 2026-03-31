import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  ActivityIndicator, 
  RefreshControl,
  Modal 
} from 'react-native';
import tw from 'twrnc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

interface OrderItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  orderId: string;
  orderNo: string;
  date: string;
  status: string;
  amount: number;
  address: string;
  service_option: string;
  delivery_fee: number;
  instructions: string;
  pickup_address: string;
  delivery_address: string;
  itemCount: number;
  items: OrderItem[];
}

interface OrderHistoryProps {
  onBack: () => void;
}

const COLORS = {
  gold: '#b7790f',
  goldLight: '#fbbf24',
  goldDark: '#92400e',
  primary: '#4F46E5',
  secondary: '#10B981',
  text: {
    primary: '#0e0f10',
    secondary: '#6B7280',
    light: '#43464a',
  },
  border: '#9CA3AF',
  background: '#6B7280',
  surface: '#F9FAFB',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

const OrderHistory: React.FC<OrderHistoryProps> = ({ onBack }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobile, setMobile] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  useEffect(() => {
    getMobileAndFetchOrders();
  }, []);

  const getMobileAndFetchOrders = async () => {
    try {
      const storedMobile = await AsyncStorage.getItem('mobile');
      if (storedMobile) {
        setMobile(storedMobile);
        await fetchOrders(storedMobile);
      } else {
        setLoading(false);
        Alert.alert('Error', 'User mobile not found');
      }
    } catch (error) {
      console.error('Error getting mobile:', error);
      setLoading(false);
    }
  };

const fetchOrders = async (mobileNumber: string) => {
  try {
    console.log('Fetching orders for mobile:', mobileNumber);
    
    const response = await fetch(`https://hoog.ng/infiniteorder/api/Customers/alsOrders.php?mobile=${mobileNumber}`);
    const responseText = await response.text();
    console.log('Raw orders response:', responseText);
    
    if (!responseText) {
      console.log('Empty response from server');
      setOrders([]);
      return;
    }

    const data = JSON.parse(responseText);
    console.log('Parsed orders data:', JSON.stringify(data, null, 2));

    if (data.status === 200 && Array.isArray(data.data)) {
      const formattedOrders = data.data.map((order: any) => {
        // Log to see the exact fields from API
        console.log(`Order ${order.orderId} raw fields:`, {
          service_option: order.service_option,
          pickup_address: order.pickup_address,    // This is what API sends
          delivery_address: order.delivery_address, // This is what API sends
          amount: order.amount,
          status: order.status
        });

        return {
          orderId: order.orderId,
          orderNo: order.orderNo || order.orderId,
          date: order.date,
          status: order.status || 'Pending',
          amount: Number(order.amount) || 0,
          address: order.address || '',
          service_option: order.service_option || 'delivery',
          delivery_fee: Number(order.delivery_fee) || 0,
          // Use the exact field names from API
          delivery_address: order.delivery_address || '',  // Direct mapping
          pickup_address: order.pickup_address || '',      // Direct mapping
          instructions: order.instructions || order.order_instructions || '',
          itemCount: order.itemCount || order.items?.length || 0,
          items: Array.isArray(order.items) ? order.items.map((item: any) => ({
            description: item.description || item.cloth || '',
            quantity: Number(item.quantity) || 0,
            price: Number(item.price) || 0,
            total: Number(item.total) || 0
          })) : []
        };
      });
      
      setOrders(formattedOrders);
    } else {
      console.log('Unexpected data format:', data);
      setOrders([]);
    }

  } catch (error) {
    console.error('Error fetching orders:', error);
    Alert.alert('Error', 'Failed to load orders. Please try again.');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (mobile) {
      fetchOrders(mobile);
    } else {
      getMobileAndFetchOrders();
    }
  }, [mobile]);

 // Update the handleViewOrderDetails function
const handleViewOrderDetails = (order: Order) => {
  console.log('=== ORDER DETAILS SELECTED ===');
  console.log('Order ID:', order.orderId);
  console.log('Service option:', order.service_option);
  console.log('Delivery address:', `"${order.delivery_address}"`);
  console.log('Pickup address:', `"${order.pickup_address}"`);
  console.log('=============================');
  
  setSelectedOrder(order);
  setDetailsModalVisible(true);
};

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'created':
      case 'pending':
        return COLORS.warning;
      case 'washing':
      case 'picked up':
      case 'in transit':
        return COLORS.primary;
      case 'completed':
      case 'delivered':
        return COLORS.success;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'created':
      case 'pending':
        return 'time-outline';
      case 'washing':
      case 'picked up':
      case 'in transit':
        return 'sync-outline';
      case 'completed':
      case 'delivered':
        return 'checkmark-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'document-outline';
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service?.toLowerCase()) {
      case 'delivery':
        return 'car-outline';
      case 'self-pickup':
        return 'arrow-down-outline';
      case 'self-delivery':
        return 'arrow-up-outline';
      default:
        return 'person-outline';
    }
  };

  const getServiceDisplayName = (service: string) => {
    switch (service?.toLowerCase()) {
      case 'delivery':
        return 'Full Delivery';
      case 'self-pickup':
        return 'Self Pickup (Drop at Office)';
      case 'self-delivery':
        return 'Self Delivery (Pick from Office)';
      default:
        return service || 'Not specified';
    }
  };

  // Helper function to determine which addresses to show based on service option
  const getAddressesToDisplay = (order: Order) => {
    const addresses: { title: string; address: string; icon: string }[] = [];
    
    switch (order.service_option?.toLowerCase()) {
      case 'delivery':
        // Full Delivery - show both addresses if available
        if (order.pickup_address) {
          addresses.push({
            title: 'PICKUP LOCATION',
            address: order.pickup_address,
            icon: 'location-outline'
          });
        }
        if (order.delivery_address) {
          addresses.push({
            title: 'DELIVERY LOCATION',
            address: order.delivery_address,
            icon: 'location-outline'
          });
        }
        break;
        
      case 'self-pickup':
        // Self Pickup - show delivery address (where to deliver to office)
        if (order.delivery_address) {
          addresses.push({
            title: 'DROP-OFF LOCATION',
            address: order.delivery_address,
            icon: 'arrow-down-outline'
          });
        }
        break;
        
      case 'self-delivery':
        // Self Delivery - show pickup address (where to pick from office)
        if (order.pickup_address) {
          addresses.push({
            title: 'PICKUP LOCATION',
            address: order.pickup_address,
            icon: 'arrow-up-outline'
          });
        }
        break;
        
      default:
        // Fallback - show any available address
        if (order.pickup_address) {
          addresses.push({
            title: 'PICKUP LOCATION',
            address: order.pickup_address,
            icon: 'location-outline'
          });
        }
        if (order.delivery_address) {
          addresses.push({
            title: 'DELIVERY LOCATION',
            address: order.delivery_address,
            icon: 'location-outline'
          });
        }
        break;
    }
    
    return addresses;
  };

  const filterOrders = (orders: Order[]) => {
    if (filter === 'all') return orders;
    if (filter === 'active') {
      return orders.filter(order => 
        !['completed', 'delivered', 'cancelled'].includes(order.status?.toLowerCase())
      );
    }
    if (filter === 'completed') {
      return orders.filter(order => 
        ['completed', 'delivered'].includes(order.status?.toLowerCase())
      );
    }
    return orders;
  };

  const calculateGrandTotal = (order: Order) => {
    return (Number(order.amount) + Number(order.delivery_fee)).toLocaleString();
  };

  const filteredOrders = filterOrders(orders);

  const FilterButton = ({ title, value }: { title: string; value: string }) => (
    <TouchableOpacity
      style={[
        tw`px-4 py-2 rounded-full mr-2`,
        filter === value 
          ? tw`bg-[${COLORS.gold}]` 
          : tw`bg-white border border-[${COLORS.border}]`
      ]}
      onPress={() => setFilter(value)}
    >
      <Text style={[
        tw`font-medium`,
        filter === value ? tw`text-white` : tw`text-[${COLORS.text.primary}]`
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

// Simplified Order Details Modal with proper address display
// Update the address display in modal to be simpler and more direct
const renderOrderDetailsModal = () => (
  <Modal
    visible={detailsModalVisible}
    animationType="slide"
    onRequestClose={() => setDetailsModalVisible(false)}
  >
    <View style={tw`flex-1 bg-white`}>
      <LinearGradient
        colors={[COLORS.gold, COLORS.goldDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={tw`p-4 pt-12 flex-row items-center`}
      >
        <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={tw`mr-4`}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={tw`text-white text-xl font-bold flex-1`}>Order Details</Text>
      </LinearGradient>

      {selectedOrder && (
        <ScrollView style={tw`flex-1 p-4`} showsVerticalScrollIndicator={false}>
          {/* Order Header */}
          <View style={tw`bg-[${COLORS.surface}] rounded-xl p-4 mb-4`}>
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <Text style={tw`text-[${COLORS.text.primary}] font-bold text-lg`}>
                Order #{selectedOrder.orderNo}
              </Text>
              <View style={[
                tw`px-3 py-1 rounded-full`,
                { backgroundColor: getStatusColor(selectedOrder.status) + '20' }
              ]}>
                <View style={tw`flex-row items-center`}>
                  <Ionicons 
                    name={getStatusIcon(selectedOrder.status)} 
                    size={14} 
                    color={getStatusColor(selectedOrder.status)} 
                  />
                  <Text style={[
                    tw`text-sm ml-1 font-medium`,
                    { color: getStatusColor(selectedOrder.status) }
                  ]}>
                    {selectedOrder.status}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={tw`text-[${COLORS.text.light}] text-sm`}>
              {selectedOrder.date}
            </Text>
          </View>

          {/* Service Option */}
          <View style={tw`bg-[${COLORS.surface}] rounded-xl p-4 mb-4`}>
            <Text style={tw`text-[${COLORS.text.primary}] font-bold mb-2`}>Service Option</Text>
            <View style={tw`flex-row items-center`}>
              <Ionicons 
                name={getServiceIcon(selectedOrder.service_option)}
                size={20} 
                color={COLORS.gold} 
              />
              <Text style={tw`text-[${COLORS.text.primary}] ml-2 capitalize`}>
                {selectedOrder.service_option?.replace('-', ' ') || 'Not specified'}
              </Text>
            </View>
          </View>

          {/* Address Display - Using direct field names from API */}
          <View style={tw`bg-[${COLORS.surface}] rounded-xl p-4 mb-4`}>
            <Text style={tw`text-[${COLORS.text.primary}] font-bold mb-3`}>Location Details</Text>
            
            {selectedOrder.service_option?.toLowerCase() === 'delivery' && (
              // Full Delivery - show both addresses
              <View>
                {selectedOrder.pickup_address ? (
                  <View style={tw`mb-3 pb-3 border-b border-[${COLORS.border}]`}>
                    <Text style={tw`text-[${COLORS.text.light}] text-xs mb-1`}>PICKUP ADDRESS</Text>
                    <Text style={tw`text-[${COLORS.text.secondary}]`}>
                      {selectedOrder.pickup_address}
                    </Text>
                  </View>
                ) : null}
                
                {selectedOrder.delivery_address ? (
                  <View>
                    <Text style={tw`text-[${COLORS.text.light}] text-xs mb-1`}>DELIVERY ADDRESS</Text>
                    <Text style={tw`text-[${COLORS.text.secondary}]`}>
                      {selectedOrder.delivery_address}
                    </Text>
                  </View>
                ) : null}

                {!selectedOrder.pickup_address && !selectedOrder.delivery_address && (
                  <Text style={tw`text-[${COLORS.text.light}]`}>No address information available</Text>
                )}
              </View>
            )}

            {selectedOrder.service_option?.toLowerCase() === 'self-pickup' && (
              // Self Pickup - show delivery address
              <View>
                {selectedOrder.delivery_address ? (
                  <>
                    <Text style={tw`text-[${COLORS.text.light}] text-xs mb-1`}>DELIVERY ADDRESS</Text>
                    <Text style={tw`text-[${COLORS.text.secondary}]`}>
                      {selectedOrder.delivery_address}
                    </Text>
                  </>
                ) : (
                  <Text style={tw`text-[${COLORS.text.light}]`}>No delivery address available</Text>
                )}
              </View>
            )}

            {selectedOrder.service_option?.toLowerCase() === 'self-delivery' && (
              // Self Delivery - show pickup address
              <View>
                {selectedOrder.pickup_address ? (
                  <>
                    <Text style={tw`text-[${COLORS.text.light}] text-xs mb-1`}>PICKUP ADDRESS</Text>
                    <Text style={tw`text-[${COLORS.text.secondary}]`}>
                      {selectedOrder.pickup_address}
                    </Text>
                  </>
                ) : (
                  <Text style={tw`text-[${COLORS.text.light}]`}>No pickup address available</Text>
                )}
              </View>
            )}

            {selectedOrder.service_option?.toLowerCase() === 'full-self' && (
              <Text style={tw`text-[${COLORS.text.light}]`}>No address required for full self-service</Text>
            )}
          </View>

          {/* Order Items */}
          <View style={tw`bg-[${COLORS.surface}] rounded-xl p-4 mb-4`}>
            <Text style={tw`text-[${COLORS.text.primary}] font-bold mb-3`}>
              Items ({selectedOrder.items.length})
            </Text>
            {selectedOrder.items.length > 0 ? (
              selectedOrder.items.map((item, index) => (
                <View 
                  key={index} 
                  style={tw`mb-3 pb-3 ${index !== selectedOrder.items.length - 1 ? 'border-b border-[${COLORS.border}]' : ''}`}
                >
                  <View style={tw`flex-row justify-between`}>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-[${COLORS.text.primary}] font-medium`}>
                        {item.description}
                      </Text>
                      <View style={tw`flex-row justify-between mt-1`}>
                        <Text style={tw`text-[${COLORS.text.light}]`}>
                          Qty: {item.quantity} × ₦{item.price.toLocaleString()}
                        </Text>
                        <Text style={tw`text-[${COLORS.gold}] font-medium`}>
                          ₦{item.total.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={tw`text-[${COLORS.text.light}] text-center py-4`}>
                No items found
              </Text>
            )}
          </View>

          {/* Order Instructions */}
          {selectedOrder.instructions && (
            <View style={tw`bg-[${COLORS.surface}] rounded-xl p-4 mb-4`}>
              <Text style={tw`text-[${COLORS.text.primary}] font-bold mb-2`}>Special Instructions</Text>
              <Text style={tw`text-[${COLORS.text.secondary}]`}>
                {selectedOrder.instructions}
              </Text>
            </View>
          )}

          {/* Price Breakdown */}
          <View style={tw`bg-[${COLORS.surface}] rounded-xl p-4 mb-6`}>
            <Text style={tw`text-[${COLORS.text.primary}] font-bold mb-3`}>Price Breakdown</Text>
            
            <View style={tw`flex-row justify-between mb-2`}>
              <Text style={tw`text-[${COLORS.text.secondary}]`}>Subtotal (Items)</Text>
              <Text style={tw`text-[${COLORS.text.primary}] font-medium`}>
                ₦{selectedOrder.amount.toLocaleString()}
              </Text>
            </View>
            
            <View style={tw`flex-row justify-between mb-2`}>
              <Text style={tw`text-[${COLORS.text.secondary}]`}>Delivery Fee</Text>
              <Text style={tw`text-[${COLORS.text.primary}]`}>
                ₦{selectedOrder.delivery_fee.toLocaleString()}
              </Text>
            </View>
            
            <View style={tw`flex-row justify-between mt-2 pt-2 border-t-2 border-[${COLORS.border}]`}>
              <Text style={tw`text-[${COLORS.text.primary}] font-bold text-base`}>Total Amount</Text>
              <Text style={tw`text-[${COLORS.gold}] text-xl font-bold`}>
                ₦{calculateGrandTotal(selectedOrder)}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  </Modal>
);
  const renderOrderItem = ({ item }: { item: Order }) => {
    const grandTotal = Number(item.amount) + Number(item.delivery_fee);
    
    return (
      <TouchableOpacity
        style={tw`bg-white rounded-xl mb-3 border border-[${COLORS.border}] overflow-hidden shadow-sm p-4`}
        onPress={() => handleViewOrderDetails(item)}
        activeOpacity={0.7}
      >
        {/* Header Section - Order ID, Status, Date */}
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <View style={tw`flex-row items-center flex-1`}>
            <View style={[
              tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
              { backgroundColor: getStatusColor(item.status) + '20' }
            ]}>
              <Ionicons 
                name={getStatusIcon(item.status)} 
                size={20} 
                color={getStatusColor(item.status)} 
              />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-[${COLORS.text.primary}] font-medium`}>
                Order #{item.orderNo}
              </Text>
              <Text style={tw`text-[${COLORS.text.light}] text-xs`}>
                {item.date}
              </Text>
            </View>
          </View>
          <View style={[
            tw`px-2 py-1 rounded-full`,
            { backgroundColor: getStatusColor(item.status) + '20' }
          ]}>
            <Text style={[
              tw`text-xs font-medium`,
              { color: getStatusColor(item.status) }
            ]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Service Option and Items Count */}
        <View style={tw`bg-[${COLORS.surface}] rounded-lg p-3`}>
          <View style={tw`flex-row justify-between items-center mb-2`}>
            <View style={tw`flex-row items-center`}>
              <Ionicons 
                name={getServiceIcon(item.service_option)} 
                size={16} 
                color={COLORS.gold} 
              />
              <Text style={tw`text-[${COLORS.text.primary}] text-sm ml-1`}>
                {getServiceDisplayName(item.service_option)}
              </Text>
            </View>
            <View style={tw`flex-row items-center`}>
              <Ionicons name="cube-outline" size={16} color={COLORS.text.secondary} />
              <Text style={tw`text-[${COLORS.text.secondary}] text-sm ml-1`}>
                {item.itemCount} {item.itemCount === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>

          {/* Address Preview based on service option */}
          {item.service_option?.toLowerCase() === 'delivery' && (
            <View style={tw`mt-1`}>
              {item.pickup_address && (
                <View style={tw`flex-row items-center mt-1`}>
                  <Ionicons name="location-outline" size={12} color={COLORS.text.light} />
                  <Text style={tw`text-[${COLORS.text.light}] text-xs ml-1 flex-1`} numberOfLines={1}>
                    Pickup: {item.pickup_address}
                  </Text>
                </View>
              )}
              {item.delivery_address && (
                <View style={tw`flex-row items-center mt-1`}>
                  <Ionicons name="location-outline" size={12} color={COLORS.text.light} />
                  <Text style={tw`text-[${COLORS.text.light}] text-xs ml-1 flex-1`} numberOfLines={1}>
                    Delivery: {item.delivery_address}
                  </Text>
                </View>
              )}
            </View>
          )}

          {item.service_option?.toLowerCase() === 'self-pickup' && item.delivery_address && (
            <View style={tw`flex-row items-center mt-1`}>
              <Ionicons name="arrow-down-outline" size={12} color={COLORS.text.light} />
              <Text style={tw`text-[${COLORS.text.light}] text-xs ml-1 flex-1`} numberOfLines={1}>
                Drop-off: {item.delivery_address}
              </Text>
            </View>
          )}

          {item.service_option?.toLowerCase() === 'self-delivery' && item.pickup_address && (
            <View style={tw`flex-row items-center mt-1`}>
              <Ionicons name="arrow-up-outline" size={12} color={COLORS.text.light} />
              <Text style={tw`text-[${COLORS.text.light}] text-xs ml-1 flex-1`} numberOfLines={1}>
                Pickup: {item.pickup_address}
              </Text>
            </View>
          )}

          {/* First item preview */}
          {item.items.length > 0 && (
            <View style={tw`flex-row items-center mt-2 pt-2 border-t border-[${COLORS.border}]`}>
              <View style={tw`w-6 h-6 bg-white rounded-full items-center justify-center mr-2`}>
                <Text style={tw`text-xs`}>👕</Text>
              </View>
              <Text style={tw`text-[${COLORS.text.secondary}] text-xs flex-1`} numberOfLines={1}>
                {item.items[0].description}
                {item.items.length > 1 ? ` +${item.items.length - 1} more` : ''}
              </Text>
            </View>
          )}

          {/* Delivery Fee and Grand Total */}
          <View style={tw`flex-row justify-between items-center mt-2 pt-2 border-t border-[${COLORS.border}]`}>
            <View style={tw`flex-row items-center`}>
              <Ionicons name="bicycle-outline" size={16} color={COLORS.gold} />
              <Text style={tw`text-[${COLORS.text.secondary}] text-sm ml-1`}>
                Delivery: ₦{item.delivery_fee.toLocaleString()}
              </Text>
            </View>
            <View style={tw`items-end`}>
              <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>Total</Text>
              <Text style={tw`text-[${COLORS.gold}] font-bold text-base`}>
                ₦{grandTotal.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={tw`flex-1 items-center justify-center py-10`}>
      <View style={tw`w-20 h-20 bg-[${COLORS.gold}]/10 rounded-full items-center justify-center mb-4`}>
        <Ionicons name="document-text-outline" size={40} color={COLORS.gold} />
      </View>
      <Text style={tw`text-[${COLORS.text.primary}] font-bold text-lg mt-2`}>
        No orders found
      </Text>
      <Text style={tw`text-[${COLORS.text.light}] text-center mt-1 px-8`}>
        Your order history will appear here once you place your first order
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={tw`flex-1 bg-white`}>
        <LinearGradient
          colors={[COLORS.gold, COLORS.goldDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={tw`p-4 pt-12 flex-row items-center`}
        >
          <TouchableOpacity onPress={onBack} style={tw`mr-4`}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={tw`text-white text-xl font-bold flex-1`}>Order History</Text>
        </LinearGradient>
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={tw`text-[${COLORS.text.secondary}] mt-2`}>Loading orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-[${COLORS.surface}]`}>
      <LinearGradient
        colors={[COLORS.gold, COLORS.goldDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={tw`p-4 pt-12 flex-row items-center`}
      >
        <TouchableOpacity onPress={onBack} style={tw`mr-4`}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={tw`text-white text-xl font-bold flex-1`}>Order History</Text>
        <View style={tw`bg-white/20 px-3 py-1 rounded-full`}>
          <Text style={tw`text-white font-medium`}>{filteredOrders.length}</Text>
        </View>
      </LinearGradient>

      <View style={tw`bg-white px-4 py-3 border-b border-gray-200`}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton title="All Orders" value="all" />
          <FilterButton title="Active" value="active" />
          <FilterButton title="Completed" value="completed" />
        </ScrollView>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.orderId}
        renderItem={renderOrderItem}
        contentContainerStyle={tw`p-4`}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.gold]} />
        }
      />

      {renderOrderDetailsModal()}
    </View>
  );
};

export default OrderHistory;