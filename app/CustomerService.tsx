import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { FontAwesome5, MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const COLORS = {
  primary: '#b7790f',
  primaryDark: '#E5A50A',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    light: '#9CA3AF',
  },
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
};

const CustomerService = () => {
  const [activeTab, setActiveTab] = useState('new'); // 'new', 'history'
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  
  // New ticket form
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [orderId, setOrderId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mobile, setMobile]= useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Categories
  const categories = [
    { id: 'general', label: 'General Inquiry', icon: 'help-circle' },
    { id: 'order', label: 'Order Issue', icon: 'shopping-bag' },
    { id: 'delivery', label: 'Delivery Problem', icon: 'truck' },
    { id: 'payment', label: 'Payment Issue', icon: 'credit-card' },
    { id: 'technical', label: 'Technical Support', icon: 'settings' },
    { id: 'feedback', label: 'Feedback', icon: 'message-circle' },
  ];

  const getConstant = async () =>{
     const phone = await AsyncStorage.getItem('mobile');
      const name = await AsyncStorage.getItem('name');
      const email = await AsyncStorage.getItem('email');
      setMobile(phone);
      setName(name);
      setEmail(email);
  };

  useEffect(() => {
    if(!mobile){
        getConstant();
    }
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const mobile = await AsyncStorage.getItem('mobile');
      const response = await fetch('https://hoog.ng/infiniteorder/api/CustomerService/getTickets.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTickets(data.tickets);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const submitTicket = async () => {
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }

    setSubmitting(true);
    try {
     

      const response = await fetch('https://hoog.ng/infiniteorder/api/CustomerService/createTicket.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile,
          name,
          email,
          subject,
          message,
          category,
          order_id: orderId || null
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('Success', 'Your support ticket has been created successfully. We will get back to you soon.');
        setSubject('');
        setMessage('');
        setCategory('general');
        setOrderId('');
        setActiveTab('history');
        fetchTickets();
      } else {
        Alert.alert('Error', data.message || 'Failed to create ticket');
      }
    } catch (error) {
      Alert.alert('Error', 'Network issue. Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim()) {
      Alert.alert('Error', 'Please enter your reply');
      return;
    }

    setSendingReply(true);
    console.log("Selected Ticket ID", selectedTicket.ticket_id);
    console.log("User Number ", mobile);
    try {
      const mobile = await AsyncStorage.getItem('mobile');
      const response = await fetch('https://hoog.ng/infiniteorder/api/CustomerService/replyTicket.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: selectedTicket.ticket_id,
          mobile,
          message: replyMessage
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('Success', 'Reply sent successfully');
        setReplyModalVisible(false);
        setReplyMessage('');
        fetchTickets();
      } else {
        Alert.alert('Error', data.message || 'Failed to send reply');
      }
    } catch (error) {
      Alert.alert('Error', 'Network issue. Please try again');
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return COLORS.success;
      case 'in_progress': return COLORS.warning;
      case 'resolved': return COLORS.info;
      case 'closed': return COLORS.text.light;
      default: return COLORS.text.secondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return 'clock';
      case 'in_progress': return 'refresh-cw';
      case 'resolved': return 'check-circle';
      case 'closed': return 'x-circle';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderTicketItem = ({ item }) => (
    <TouchableOpacity
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
      onPress={() => {
        setSelectedTicket(item);
        setReplyModalVisible(true);
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: COLORS.primary + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12
          }}>
            <MaterialIcons name="support-agent" size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.text.primary }} numberOfLines={1}>
              {item.subject}
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.text.secondary, marginTop: 2 }}>
              Ticket #{item.ticket_id} • {formatDate(item.created_at)}
            </Text>
          </View>
        </View>
        <View style={{
          backgroundColor: getStatusColor(item.status) + '20',
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 20,
          flexDirection: 'row',
          alignItems: 'center'
        }}>
          <Feather name={getStatusIcon(item.status)} size={12} color={getStatusColor(item.status)} />
          <Text style={{
            fontSize: 12,
            color: getStatusColor(item.status),
            marginLeft: 4,
            textTransform: 'capitalize'
          }}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 14, color: COLORS.text.secondary, marginBottom: 8 }} numberOfLines={2}>
        {item.last_message || item.message}
      </Text>

      {item.reply_count > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="chat" size={14} color={COLORS.primary} />
          <Text style={{ fontSize: 12, color: COLORS.primary, marginLeft: 4 }}>
            {item.reply_count} {item.reply_count === 1 ? 'reply' : 'replies'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={{
        backgroundColor: COLORS.primary,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 48 : 60,
        paddingBottom: 20
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>
            Customer Service
          </Text>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 16
      }}>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 12,
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'new' ? COLORS.primary : COLORS.border,
            alignItems: 'center'
          }}
          onPress={() => setActiveTab('new')}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: activeTab === 'new' ? COLORS.primary : COLORS.text.secondary
          }}>
            New Ticket
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 12,
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'history' ? COLORS.primary : COLORS.border,
            alignItems: 'center'
          }}
          onPress={() => setActiveTab('history')}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: activeTab === 'history' ? COLORS.primary : COLORS.text.secondary
          }}>
            My Tickets
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'new' ? (
        // New Ticket Form
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          >
            {/* Category Selection */}
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.text.primary, marginBottom: 12 }}>
              Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 20 }}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={{
                    alignItems: 'center',
                    marginRight: 16,
                    opacity: category === cat.id ? 1 : 0.5
                  }}
                  onPress={() => setCategory(cat.id)}
                >
                  <View style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: category === cat.id ? COLORS.primary : COLORS.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8
                  }}>
                    <Feather
                      name={cat.icon}
                      size={24}
                      color={category === cat.id ? 'white' : COLORS.text.secondary}
                    />
                  </View>
                  <Text style={{
                    fontSize: 11,
                    color: category === cat.id ? COLORS.primary : COLORS.text.secondary,
                    textAlign: 'center'
                  }}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Subject */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.text.secondary, marginBottom: 8 }}>
                Subject <Text style={{ color: COLORS.error }}>*</Text>
              </Text>
              <TextInput
                style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  padding: 16,
                  fontSize: 14,
                  color: COLORS.text.primary
                }}
                placeholder="Brief summary of your issue"
                placeholderTextColor={COLORS.text.light}
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            {/* Order ID (Optional) */}
            {category === 'order' && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, color: COLORS.text.secondary, marginBottom: 8 }}>
                  Order ID (Optional)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    padding: 16,
                    fontSize: 14,
                    color: COLORS.text.primary
                  }}
                  placeholder="Enter order ID if applicable"
                  placeholderTextColor={COLORS.text.light}
                  value={orderId}
                  onChangeText={setOrderId}
                />
              </View>
            )}

            {/* Message */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, color: COLORS.text.secondary, marginBottom: 8 }}>
                Message <Text style={{ color: COLORS.error }}>*</Text>
              </Text>
              <TextInput
                style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  padding: 16,
                  fontSize: 14,
                  color: COLORS.text.primary,
                  minHeight: 120,
                  textAlignVertical: 'top'
                }}
                placeholder="Describe your issue in detail"
                placeholderTextColor={COLORS.text.light}
                multiline
                numberOfLines={6}
                value={message}
                onChangeText={setMessage}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={{
                backgroundColor: COLORS.primary,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                marginBottom: 12
              }}
              onPress={submitTicket}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                  Submit Ticket
                </Text>
              )}
            </TouchableOpacity>

            <View style={{
              backgroundColor: COLORS.info + '10',
              padding: 16,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Feather name="info" size={20} color={COLORS.info} />
              <Text style={{ fontSize: 12, color: COLORS.text.secondary, marginLeft: 12, flex: 1 }}>
                We typically respond within 24 hours. For urgent issues, please call our support line.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        // Tickets History
        <FlatList
          data={tickets}
          renderItem={renderTicketItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
              <Feather name="inbox" size={48} color={COLORS.text.light} />
              <Text style={{ fontSize: 16, color: COLORS.text.secondary, marginTop: 16 }}>
                No tickets found
              </Text>
              <TouchableOpacity
                style={{ marginTop: 16 }}
                onPress={() => setActiveTab('new')}
              >
                <Text style={{ color: COLORS.primary, fontSize: 14 }}>
                  Create your first ticket
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Reply Modal */}
      <Modal visible={replyModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{
            flex: 1,
            marginTop: 100,
            backgroundColor: 'white',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            padding: 20
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text.primary }}>
                Ticket #{selectedTicket?.ticket_id}
              </Text>
              <TouchableOpacity onPress={() => setReplyModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text.light} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {/* Original Message */}
              <View style={{
                backgroundColor: COLORS.surface,
                padding: 16,
                borderRadius: 12,
                marginBottom: 16
              }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.text.primary, marginBottom: 4 }}>
                  {selectedTicket?.subject}
                </Text>
                <Text style={{ fontSize: 13, color: COLORS.text.secondary, marginBottom: 8 }}>
                  {selectedTicket?.message}
                </Text>
                <Text style={{ fontSize: 11, color: COLORS.text.light }}>
                  {selectedTicket?.created_at}
                </Text>
              </View>

             {/* Replies */}
{selectedTicket?.replies?.map((reply, index) => (
  <View
    key={index}
    style={{
      backgroundColor: reply.is_admin == 1 ? COLORS.primary + '10' : COLORS.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      alignSelf: reply.is_admin == 1 ? 'flex-start' : 'flex-end',
      width: '90%'
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <Feather
        name={reply.is_admin == 1 ? 'user-check' : 'user'}
        size={14}
        color={reply.is_admin == 1 ? COLORS.primary : COLORS.text.secondary}
      />
      <Text style={{
        fontSize: 12,
        fontWeight: 'bold',
        color: reply.is_admin == 1 ? COLORS.primary : COLORS.text.primary,
        marginLeft: 6
      }}>
        {reply.is_admin == 1 ? 'Support Team' : 'You'}
      </Text>
    </View>
    <Text style={{ fontSize: 13, color: COLORS.text.secondary, marginBottom: 8 }}>
      {reply.message}
    </Text>
    <Text style={{ fontSize: 10, color: COLORS.text.light, textAlign: 'right' }}>
      {reply.created_at}
    </Text>
  </View>
))}
            </ScrollView>

            {/* Reply Input */}
            {selectedTicket?.status !== 'closed' && (
              <View style={{ marginTop: 16 }}>
                <TextInput
                  style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    padding: 16,
                    fontSize: 14,
                    color: COLORS.text.primary,
                    minHeight: 80,
                    textAlignVertical: 'top',
                    marginBottom: 12
                  }}
                  placeholder="Type your reply..."
                  placeholderTextColor={COLORS.text.light}
                  multiline
                  value={replyMessage}
                  onChangeText={setReplyMessage}
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.primary,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center'
                  }}
                  onPress={sendReply}
                  disabled={sendingReply}
                >
                  {sendingReply ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                      Send Reply
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CustomerService;