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

interface Order {
  orderId: string;
  orderDate: string;
  amount: number;
  orderStatus: string;
  itemCount?: number;
  service_option?: string;
  items?: OrderItem[];
  pickup_location?: LocationInfo;
  delivery_location?: LocationInfo;
  order_instructions?: string;
  total_delivery_fee?: number;
}

interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
  instructions?: string;
}

interface LocationInfo {
  address: string;
  city?: string;
  state?: string;
  distance_from_office?: number;
  delivery_fee?: number;
}

interface OrderHistoryProps {
  onBack: () => void;
  onViewOrder: (orderId: string) => void;
}

const COLORS = {
  gold: '#b7790f',
  primary: '#4F46E5',
  secondary: '#10B981',
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    light: '#9CA3AF',
  },
  border: '#E5E7EB',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

const OrderHistory: React.FC<OrderHistoryProps> = ({ onBack, onViewOrder }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobile, setMobile] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState<string | null>(null);
  
  // New states for order details modal
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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
      console.log('Parsed orders data:', data);

      if (data.status === 200 && Array.isArray(data.data)) {
        const formattedOrders = data.data.map((order: any) => ({
          orderId: order.orderId,
          orderDate: order.date,
          amount: order.amount,
          orderStatus: order.status,
          itemCount: order.itemCount || order.items?.length || 0,
          service_option: order.service_option,
          items: order.items || [],
          pickup_location: order.pickup_location,
          delivery_location: order.delivery_location,
          order_instructions: order.order_instructions,
          total_delivery_fee: order.total_delivery_fee,
        }));
        setOrders(formattedOrders);
      } else if (Array.isArray(data)) {
        setOrders(data);
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

  const fetchOrderDetails = async (orderId: string) => {
    setLoadingItems(orderId);
    try {
      const response = await fetch(`https://hoog.ng/infiniteorder/api/Customers/alsOrderDetails.php?orderId=${orderId}&mobile=${mobile}`);
      const responseText = await response.text();
      
      if (!responseText) {
        console.log('Empty response from server');
        return;
      }

      const data = JSON.parse(responseText);
      console.log('Order details for', orderId, ':', data);

      if (data.status === 200 && Array.isArray(data.data)) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.orderId === orderId 
              ? { ...order, items: data.data } 
              : order
          )
        );
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoadingItems(null);
    }
  };

  // New function to fetch complete order details for modal
  const fetchCompleteOrderDetails = async (orderId: string) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`https://hoog.ng/infiniteorder/api/Customers/alsOrderCompleteDetails.php?orderId=${orderId}&mobile=${mobile}`);
      const responseText = await response.text();
      
      if (!responseText) {
        console.log('Empty response from server');
        return;
      }

      const data = JSON.parse(responseText);
      console.log('Complete order details for', orderId, ':', data);

      if (data.status === 200) {
        setSelectedOrder(data.data);
        setDetailsModalVisible(true);
      } else {
        Alert.alert('Error', 'Failed to load complete order details');
      }
    } catch (error) {
      console.error('Error fetching complete order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewFullDetails = (order: Order) => {
    // If we already have complete details, show them
    if (order.items && order.items.length > 0) {
      setSelectedOrder(order);
      setDetailsModalVisible(true);
    } else {
      // Otherwise fetch complete details
      fetchCompleteOrderDetails(order.orderId);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (mobile) {
      fetchOrders(mobile);
    } else {
      getMobileAndFetchOrders();
    }
    setExpandedOrderId(null);
  }, [mobile]);

  const handleOrderPress = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      
      const order = orders.find(o => o.orderId === orderId);
      if (order && (!order.items || order.items.length === 0)) {
        fetchOrderDetails(orderId);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'created':
      case 'pending':
        return COLORS.warning;
      case 'processing':
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
      case 'processing':
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

  const filterOrders = (orders: Order[]) => {
    if (filter === 'all') return orders;
    if (filter === 'active') {
      return orders.filter(order => 
        !['completed', 'delivered', 'cancelled'].includes(order.orderStatus?.toLowerCase())
      );
    }
    if (filter === 'completed') {
      return orders.filter(order => 
        ['completed', 'delivered'].includes(order.orderStatus?.toLowerCase())
      );
    }
    return orders;
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

  // Render Order Details Modal
  const renderOrderDetailsModal = () => (
    <Modal
      visible={detailsModalVisible}
      animationType="slide"
      onRequestClose={() => setDetailsModalVisible(false)}
    >
      <View style={tw`flex-1 bg-white`}>
        {/* Modal Header */}
        <View style={tw`bg-[${COLORS.gold}] p-4 flex-row items-center`}>
          <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={tw`mr-4`}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={tw`text-white text-xl font-bold flex-1`}>Order Details</Text>
        </View>

        {loadingDetails ? (
          <View style={tw`flex-1 items-center justify-center`}>
            <ActivityIndicator size="large" color={COLORS.gold} />
            <Text style={tw`text-[${COLORS.text.secondary}] mt-2`}>Loading order details...</Text>
          </View>
        ) : selectedOrder ? (
          <ScrollView style={tw`flex-1 p-4`} showsVerticalScrollIndicator={false}>
            {/* Order Header Info */}
            <View style={tw`bg-[${COLORS.surface}] rounded-xl p-4 mb-4`}>
              <View style={tw`flex-row justify-between items-center mb-2`}>
                <Text style={tw`text-[${COLORS.text.primary}] font-bold text-lg`}>
                  Order #{selectedOrder.orderId}
                </Text>
                <View style={[
                  tw`px-3 py-1 rounded-full`,
                  { backgroundColor: getStatusColor(selectedOrder.orderStatus) + '20' }
                ]}>
                  <View style={tw`flex-row items-center`}>
                    <Ionicons 
                      name={getStatusIcon(selectedOrder.orderStatus)} 
                      size={14} 
                      color={getStatusColor(selectedOrder.orderStatus)} 
                    />
                    <Text style={[
                      tw`text-sm ml-1 font-medium`,
                      { color: getStatusColor(selectedOrder.orderStatus) }
                    ]}>
                      {selectedOrder.orderStatus || 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={tw`text-[${COLORS.text.light}] text-sm`}>
                {selectedOrder.orderDate || 'Date not available'}
              </Text>
            </View>

            {/* Service Option */}
            {selectedOrder.service_option && (
              <View style={tw`bg-[${COLORS.surface}] rounded-xl p-4 mb-4`}>
                <Text style={tw`text-[${COLORS.text.primary}] font-bold mb-2`}>Service Option</Text>
                <View style={tw`flex-row items-center`}>
                  <Ionicons 
                    name={
                      selectedOrder.service_option === 'delivery' ? 'car' : 
                      selectedOrder.service_option === 'self-pickup' ? 'arrow-down' : 
                      selectedOrder.service_option === 'self-delivery' ? 'arrow-up' : 'person'
                    } 
                    size={20} 
                    color={COLORS.gold} 
                  />
                  <Text style={tw`text-[${COLORS.text.primary}] ml-2`}>
                    {selectedOrder.service_option === 'delivery' ? 'Full Delivery' : 
                     selectedOrder.service_option === 'self-pickup' ? 'Self Pickup (Drop at Office)' : 
                     selectedOrder.service_option === 'self-delivery' ? 'Self Delivery (Pick from Office)' :
                     'Full Self-Service'}
                  </Text>
                </View>
              </View>
            )}

            {/* Items List */}
            <View style={tw`bg-[${COLORS.surface}] rounded-xl p-4 mb-4`}>
              <Text style={tw`text-[${COLORS.text.primary}] font-bold mb-3`}>
                Items ({selectedOrder.items?.length || 0})
              </Text>
              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                selectedOrder.items.map((item, index) => (
                  <View 
                    key={item.id || index} 
                    style={tw`mb-3 pb-3 ${index !== selectedOrder.items!.length - 1 ? 'border-b border-[${COLORS.border}]' : ''}`}
                  >
                    <View style={tw`flex-row justify-between`}>
                      <View style={tw`flex-1`}>
                        <View style={tw`flex-row items-center`}>
                          <View style={tw`w-8 h-8 bg-white rounded-full items-center justify-center mr-2`}>
                            <Text style={tw`text-lg`}>👕</Text>
                          </View>
                          <Text style={tw`text-[${COLORS.text.primary}] font-medium flex-1`}>
                            {item.description}
                          </Text>
                        </View>
                        <View style={tw`flex-row justify-between mt-1 ml-10`}>
                          <Text style={tw`text-[${COLORS.text.light}]`}>
                            Qty: {item.quantity}
                          </Text>
                          <Text style={tw`text-[${COLORS.gold}] font-medium`}>
                            ₦{item.total?.toLocaleString() || (item.price * item.quantity).toLocaleString()}
                          </Text>
                        </View>
                        
                        {/* Item Instructions */}
                        {item.instructions && (
                          <View style={tw`mt-2 ml-10 p-2 bg-white rounded-lg`}>
                            <View style={tw`flex-row items-center`}>
                              <Ionicons name="document-text" size={14} color={COLORS.gold} />
                              <Text style={tw`text-[${COLORS.text.secondary}] text-xs ml-1 font-medium`}>
                                Instructions:
                              </Text>
                            </View>
                            <Text style={tw`text-[${COLORS.text.primary}] text-sm mt-1`}>
                              {item.instructions}
                            </Text>
                          </View>
                        )}
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
            {selectedOrder.order_instructions && (
              <View style={tw`bg-[${COLORS.surface}] rounded-xl p-4 mb-4`}>
                <View style={tw`flex-row items-center mb-2`}>
                  <Ionicons name="document-text-outline" size={18} color={COLORS.gold} />
                  <Text style={tw`text-[${COLORS.text.primary}] font-bold ml-2`}>Order Instructions</Text>
                </View>
                <Text style={tw`text-[${COLORS.text.secondary}]`}>
                  {selectedOrder.order_instructions}
                </Text>
              </View>
            )}

            {/* Location Information */}
            {(selectedOrder.pickup_location || selectedOrder.delivery_location) && (
              <View style={tw`bg-[${COLORS.surface}] rounded-xl p-4 mb-4`}>
                <Text style={tw`text-[${COLORS.text.primary}] font-bold mb-3`}>Locations</Text>
                
                {selectedOrder.pickup_location && (
                  <View style={tw`mb-3`}>
                    <Text style={tw`text-[${COLORS.text.light}] text-xs mb-1`}>PICKUP LOCATION</Text>
                    <Text style={tw`text-[${COLORS.text.primary}]`}>
                      {selectedOrder.pickup_location.address}
                    </Text>
                    {selectedOrder.pickup_location.distance_from_office && (
                      <View style={tw`flex-row justify-between mt-1`}>
                        <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>
                          Distance: {selectedOrder.pickup_location.distance_from_office}km from office
                        </Text>
                        <Text style={tw`text-[${COLORS.gold}] text-sm`}>
                          ₦{selectedOrder.pickup_location.delivery_fee}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                
                {selectedOrder.delivery_location && (
                  <View>
                    <Text style={tw`text-[${COLORS.text.light}] text-xs mb-1`}>DELIVERY LOCATION</Text>
                    <Text style={tw`text-[${COLORS.text.primary}]`}>
                      {selectedOrder.delivery_location.address}
                    </Text>
                    {selectedOrder.delivery_location.distance_from_office && (
                      <View style={tw`flex-row justify-between mt-1`}>
                        <Text style={tw`text-[${COLORS.text.secondary}] text-xs`}>
                          Distance: {selectedOrder.delivery_location.distance_from_office}km from office
                        </Text>
                        <Text style={tw`text-[${COLORS.gold}] text-sm`}>
                          ₦{selectedOrder.delivery_location.delivery_fee}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Price Breakdown */}
            <View style={tw`bg-[${COLORS.surface}] rounded-xl p-4 mb-6`}>
              <Text style={tw`text-[${COLORS.text.primary}] font-bold mb-3`}>Price Details</Text>
              
              <View style={tw`flex-row justify-between mb-2`}>
                <Text style={tw`text-[${COLORS.text.secondary}]`}>Subtotal</Text>
                <Text style={tw`text-[${COLORS.text.primary}]`}>
                  ₦{selectedOrder.amount?.toLocaleString()}
                </Text>
              </View>
              
              {selectedOrder.total_delivery_fee ? (
                <View style={tw`flex-row justify-between mb-2`}>
                  <Text style={tw`text-[${COLORS.text.secondary}]`}>Delivery Fee</Text>
                  <Text style={tw`text-[${COLORS.text.primary}]`}>
                    ₦{selectedOrder.total_delivery_fee.toLocaleString()}
                  </Text>
                </View>
              ) : null}
              
              <View style={tw`border-t border-[${COLORS.border}] my-2 pt-2`}>
                <View style={tw`flex-row justify-between`}>
                  <Text style={tw`text-[${COLORS.text.primary}] font-bold`}>Total</Text>
                  <Text style={tw`text-[${COLORS.gold}] text-xl font-bold`}>
                    ₦{(selectedOrder.amount + (selectedOrder.total_delivery_fee || 0)).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Track Order Button */}
            <TouchableOpacity
              style={tw`bg-[${COLORS.gold}] py-4 rounded-xl items-center mb-6`}
              onPress={() => {
                setDetailsModalVisible(false);
                onViewOrder(selectedOrder.orderId);
              }}
            >
              <Text style={tw`text-white font-bold text-lg`}>Track This Order</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );

  const renderOrderItems = (items: OrderItem[] | undefined, orderId: string, order: Order) => {
    if (loadingItems === orderId) {
      return (
        <View style={tw`py-4 items-center`}>
          <ActivityIndicator size="small" color={COLORS.gold} />
          <Text style={tw`text-[${COLORS.text.secondary}] text-xs mt-2`}>
            Loading items...
          </Text>
        </View>
      );
    }

    if (!items || items.length === 0) {
      return (
        <View style={tw`py-4 items-center`}>
          <Text style={tw`text-[${COLORS.text.light}] text-sm`}>
            No items found for this order
          </Text>
        </View>
      );
    }

    return (
      <View style={tw`mt-3 pt-3 border-t border-[${COLORS.border}]`}>
        <Text style={tw`text-[${COLORS.text.primary}] font-medium mb-2`}>
          Items ({items.length})
        </Text>
        {items.map((item, index) => (
          <View 
            key={item.id || index} 
            style={tw`mb-2 pb-2 ${index !== items.length - 1 ? 'border-b border-[${COLORS.border}]' : ''}`}
          >
            <View style={tw`flex-row justify-between items-center`}>
              <View style={tw`flex-1`}>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`w-6 h-6 bg-[${COLORS.surface}] rounded-full items-center justify-center mr-2`}>
                    <Text style={tw`text-xs`}>👕</Text>
                  </View>
                  <Text style={tw`text-[${COLORS.text.primary}] text-sm flex-1`} numberOfLines={1}>
                    {item.description}
                  </Text>
                </View>
                <View style={tw`flex-row justify-between mt-1 ml-8`}>
                  <Text style={tw`text-[${COLORS.text.light}] text-xs`}>
                    Qty: {item.quantity}
                  </Text>
                  <Text style={tw`text-[${COLORS.gold}] text-xs font-medium`}>
                    ₦{(item.total || item.price * item.quantity || 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}
        
        {/* View Full Details Button - Now properly implemented */}
        <TouchableOpacity
          style={tw`mt-3 py-3 bg-[${COLORS.gold}] rounded-lg flex-row items-center justify-center`}
          onPress={() => handleViewFullDetails(order)}
        >
          <Ionicons name="eye-outline" size={18} color="white" />
          <Text style={tw`text-white font-bold ml-2`}>
            View Full Details
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const isExpanded = expandedOrderId === item.orderId;
    
    return (
      <View style={tw`bg-white rounded-xl mb-3 border border-[${COLORS.border}] overflow-hidden`}>
        {/* Order Header - Always visible and clickable */}
        <TouchableOpacity
          style={tw`p-4`}
          onPress={() => handleOrderPress(item.orderId)}
          activeOpacity={0.7}
        >
          <View style={tw`flex-row justify-between items-center mb-2`}>
            <View style={tw`flex-row items-center flex-1`}>
              <View style={tw`w-10 h-10 bg-[${COLORS.surface}] rounded-full items-center justify-center mr-3`}>
                <Ionicons name="receipt-outline" size={20} color={COLORS.text.secondary} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-[${COLORS.text.primary}] font-medium`}>
                  Order #{item.orderId}
                </Text>
                <Text style={tw`text-[${COLORS.text.light}] text-xs`}>
                  {item.orderDate || 'Date not available'}
                </Text>
              </View>
            </View>
            <View style={tw`flex-row items-center`}>
              <View style={[
                tw`px-2 py-1 rounded-full mr-2`,
                { backgroundColor: getStatusColor(item.orderStatus) + '20' }
              ]}>
                <View style={tw`flex-row items-center`}>
                  <Ionicons 
                    name={getStatusIcon(item.orderStatus)} 
                    size={12} 
                    color={getStatusColor(item.orderStatus)} 
                  />
                  <Text style={[
                    tw`text-xs ml-1`,
                    { color: getStatusColor(item.orderStatus) }
                  ]}>
                    {item.orderStatus || 'Pending'}
                  </Text>
                </View>
              </View>
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={COLORS.gold} 
              />
            </View>
          </View>
          
          <View style={tw`flex-row justify-between mt-2 pt-2 border-t border-[${COLORS.border}]`}>
            <Text style={tw`text-[${COLORS.text.secondary}]`}>
              {item.itemCount || 0} items
            </Text>
            <Text style={tw`text-[${COLORS.gold}] font-bold`}>
              ₦{item.amount?.toLocaleString() || '0'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Expanded Content - Only shown when this order is expanded */}
        {isExpanded && (
          <View style={tw`px-4 pb-4 bg-[${COLORS.surface}]`}>
            {renderOrderItems(item.items, item.orderId, item)}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={tw`flex-1 items-center justify-center py-10`}>
      <Ionicons name="document-text-outline" size={64} color={COLORS.text.light} />
      <Text style={tw`text-[${COLORS.text.primary}] font-medium mt-2`}>
        No orders found
      </Text>
      <Text style={tw`text-[${COLORS.text.light}] text-center mt-1 px-8`}>
        Your order history will appear here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={tw`flex-1 bg-white`}>
        <View style={tw`bg-[${COLORS.gold}] p-4 flex-row items-center`}>
          <TouchableOpacity onPress={onBack} style={tw`mr-4`}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={tw`text-white text-xl font-bold flex-1`}>Order History</Text>
        </View>
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={tw`text-[${COLORS.text.secondary}] mt-2`}>Loading orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-white`}>
      <View style={tw`bg-[${COLORS.gold}] p-4 flex-row items-center`}>
        <TouchableOpacity onPress={onBack} style={tw`mr-4`}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={tw`text-white text-xl font-bold flex-1`}>Order History</Text>
        <Text style={tw`text-white font-medium`}>{filteredOrders.length} orders</Text>
      </View>

      {/* Filter Buttons */}
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

      {/* Order Details Modal */}
      {renderOrderDetailsModal()}
    </View>
  );
};

export default OrderHistory;