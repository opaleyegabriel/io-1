// import React, { useState, useCallback, useEffect, useMemo } from 'react';
// import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, ScrollView, TextInput } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import tw from 'twrnc';
// import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
// import { router } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { LinearGradient } from 'expo-linear-gradient';
// import Animated, { FadeInDown } from 'react-native-reanimated';

// const API_URL = 'https://hoog.ng/infiniteorder/api/Customers/readCustomerTransactions.php';

// // Enhanced fetch function with error handling
// const fetchTransactions = async (mobile: string) => {
//   if (!mobile) return [];
  
//   try {
//     const response = await fetch(`${API_URL}?mobile=${mobile}`);
//     const data = await response.json();
    
//     if (data && Array.isArray(data.transactions)) {
//       return data.transactions.map(transaction => ({
//         id: transaction.id.toString(),
//         title: transaction.type,
//         description: transaction.description || 'No description',
//         date: new Date(transaction.created_at),
//         formattedDate: new Date(transaction.created_at).toLocaleDateString('en-NG', {
//           day: '2-digit',
//           month: 'short',
//           year: 'numeric',
//         }),
//         formattedTime: new Date(transaction.created_at).toLocaleTimeString('en-NG', {
//           hour: '2-digit',
//           minute: '2-digit',
//         }),
//         debit: parseFloat(transaction.debit) || 0,
//         credit: parseFloat(transaction.credit) || 0,
//         type: transaction.type,
//         status: 'Completed',
//         reference: transaction.reference || `TRX-${transaction.id}`,
//       }));
//     }
//     return [];
//   } catch (error) {
//     console.error('Error fetching transactions:', error);
//     return [];
//   }
// };

// const formatCurrency = (amount: number) => {
//   return new Intl.NumberFormat('en-NG', {
//     style: 'currency',
//     currency: 'NGN',
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   }).format(amount);
// };

// // Transaction Detail Modal Component
// const TransactionDetailModal = ({ visible, transaction, onClose }) => {
//   if (!transaction) return null;

//   const isCredit = transaction.credit > 0;
//   const amount = isCredit ? transaction.credit : transaction.debit;
//   const sign = isCredit ? '-' : '+';
//   const color = isCredit ? '#EF4444' : '#10B981';

//   return (
//     <Modal
//       visible={visible}
//       transparent={true}
//       animationType="slide"
//       onRequestClose={onClose}
//     >
//       <View style={tw`flex-1 justify-end bg-black/50`}>
//         <Animated.View 
//           entering={FadeInDown}
//           style={tw`bg-white rounded-t-3xl p-6`}
//         >
//           {/* Header */}
//           <View style={tw`flex-row justify-between items-center mb-6`}>
//             <Text style={tw`text-xl font-bold text-gray-800`}>Transaction Details</Text>
//             <TouchableOpacity onPress={onClose}>
//               <Ionicons name="close" size={24} color="#6B7280" />
//             </TouchableOpacity>
//           </View>

//           {/* Icon and Amount */}
//           <View style={tw`items-center mb-6`}>
//             <View style={[
//               tw`w-20 h-20 rounded-full items-center justify-center mb-3`,
//               { backgroundColor: color + '20' }
//             ]}>
//               <Ionicons 
//                 name={isCredit ? 'arrow-up' : 'arrow-down'} 
//                 size={32} 
//                 color={color} 
//               />
//             </View>
//             <Text style={[tw`text-3xl font-bold`, { color }]}>
//               {sign}{formatCurrency(amount)}
//             </Text>
//             <Text style={tw`text-base text-gray-500 mt-1`}>{transaction.title}</Text>
//           </View>

//           {/* Details Grid */}
//           <View style={tw`bg-gray-50 rounded-xl p-4 mb-4`}>
//             <DetailRow icon="info" label="Description" value={transaction.description} />
//             <DetailRow icon="calendar" label="Date" value={transaction.formattedDate} />
//             <DetailRow icon="time" label="Time" value={transaction.formattedTime} />
//             <DetailRow icon="hash" label="Reference" value={transaction.reference} />
//             <DetailRow icon="check-circle" label="Status" value={transaction.status} isStatus />
//           </View>

//           {/* Action Buttons */}
//           <View style={tw`flex-row gap-3`}>
//             <TouchableOpacity 
//               style={tw`flex-1 bg-blue-500 py-3 rounded-lg flex-row items-center justify-center`}
//               onPress={() => {
//                 // Share functionality
//                 onClose();
//               }}
//             >
//               <Ionicons name="share-outline" size={20} color="white" />
//               <Text style={tw`text-white font-semibold ml-2`}>Share</Text>
//             </TouchableOpacity>
//             <TouchableOpacity 
//               style={tw`flex-1 bg-gray-100 py-3 rounded-lg flex-row items-center justify-center`}
//               onPress={onClose}
//             >
//               <Text style={tw`text-gray-700 font-semibold`}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </Animated.View>
//       </View>
//     </Modal>
//   );
// };

// const DetailRow = ({ icon, label, value, isStatus }) => (
//   <View style={tw`flex-row items-center py-2`}>
//     <Ionicons name={icon} size={16} color="#6B7280" style={tw`w-8`} />
//     <Text style={tw`text-sm text-gray-500 flex-1`}>{label}</Text>
//     {isStatus ? (
//       <View style={tw`bg-green-100 px-2 py-1 rounded-full`}>
//         <Text style={tw`text-xs text-green-600 font-semibold`}>{value}</Text>
//       </View>
//     ) : (
//       <Text style={tw`text-sm text-gray-800 font-medium flex-1 text-right`}>{value}</Text>
//     )}
//   </View>
// );

// const AllTransactionHistory = () => {
//   const [selectedView, setSelectedView] = useState('als');
//   const [transactions, setTransactions] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [mobile, setMobile] = useState('');
//   const [selectedTransaction, setSelectedTransaction] = useState(null);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'
//   const [searchQuery, setSearchQuery] = useState('');

//   // Fetch user mobile
//   useEffect(() => {
//     const getMobile = async () => {
//       const myMobile = await AsyncStorage.getItem('mobile');
//       if (myMobile) {
//         setMobile(myMobile);
//       }
//     };
//     getMobile();
//   }, []);

//   // Fetch transactions
//   useEffect(() => {
//     if (mobile) {
//       loadTransactions();
//     }
//   }, [mobile]);

//   const loadTransactions = async (refresh = false) => {
//     if (refresh) setIsRefreshing(true);
//     else setIsLoading(true);

//     const fetchedTransactions = await fetchTransactions(mobile);
//     setTransactions(fetchedTransactions);
    
//     if (refresh) setIsRefreshing(false);
//     else setIsLoading(false);
//   };

//   // Filter transactions based on selected view, date, and search
//   const filteredTransactions = useMemo(() => {
//     let filtered = transactions.filter(t =>
//       selectedView === 'als'
//         ? (t.type === 'ALS' || t.type === 'ALS-Bonus')
//         : (t.type === 'RIDE' || t.type === 'RIDE-Bonus')
//     );

//     // Date filter
//     const now = new Date();
//     if (dateFilter === 'today') {
//       filtered = filtered.filter(t => t.date.toDateString() === now.toDateString());
//     } else if (dateFilter === 'week') {
//       const weekAgo = new Date(now.setDate(now.getDate() - 7));
//       filtered = filtered.filter(t => t.date >= weekAgo);
//     } else if (dateFilter === 'month') {
//       const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
//       filtered = filtered.filter(t => t.date >= monthAgo);
//     }

//     // Search filter
//     if (searchQuery) {
//       filtered = filtered.filter(t => 
//         t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         t.reference.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     return filtered;
//   }, [transactions, selectedView, dateFilter, searchQuery]);

//   // Calculate totals
//   const totals = useMemo(() => {
//     const debitTotal = filteredTransactions.reduce((sum, t) => sum + t.debit, 0);
//     const creditTotal = filteredTransactions.reduce((sum, t) => sum + t.credit, 0);
//     return { totalIn: debitTotal, totalOut: creditTotal };
//   }, [filteredTransactions]);

//   const handleTransactionPress = (transaction) => {
//     setSelectedTransaction(transaction);
//     setModalVisible(true);
//   };

//   const renderTransaction = ({ item, index }) => {
//     const isCredit = item.credit > 0;
//     const amount = isCredit ? item.credit : item.debit;
//     const sign = isCredit ? '-' : '+';
//     const color = isCredit ? '#EF4444' : '#10B981';
//     const bgColor = isCredit ? '#FEE2E2' : '#D1FAE5';

//     return (
//       <Animated.View 
//         entering={FadeInDown.delay(index * 100)}
//         style={tw`mb-3`}
//       >
//         <TouchableOpacity
//           activeOpacity={0.7}
//           onPress={() => handleTransactionPress(item)}
//         >
//           <LinearGradient
//             colors={['#FFFFFF', '#F9FAFB']}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 0 }}
//             style={tw`rounded-2xl shadow-sm border border-gray-100`}
//           >
//             <View style={tw`p-4`}>
//               {/* Top Row */}
//               <View style={tw`flex-row justify-between items-start mb-2`}>
//                 <View style={tw`flex-row items-center flex-1`}>
//                   <View style={[tw`w-10 h-10 rounded-full items-center justify-center mr-3`, { backgroundColor: bgColor }]}>
//                     <Ionicons 
//                       name={isCredit ? 'arrow-up' : 'arrow-down'} 
//                       size={20} 
//                       color={color} 
//                     />
//                   </View>
//                   <View style={tw`flex-1`}>
//                     <Text style={tw`text-base font-bold text-gray-800`}>{item.title}</Text>
//                     <Text style={tw`text-sm text-gray-500`} numberOfLines={1}>
//                       {item.description}
//                     </Text>
//                   </View>
//                 </View>
//                 <View style={tw`items-end`}>
//                   <Text style={[tw`text-lg font-bold`, { color }]}>
//                     {sign}{formatCurrency(amount)}
//                   </Text>
//                   <View style={tw`bg-green-100 px-2 py-0.5 rounded-full mt-1`}>
//                     <Text style={tw`text-xs text-green-600 font-medium`}>{item.status}</Text>
//                   </View>
//                 </View>
//               </View>

//               {/* Bottom Row */}
//               <View style={tw`flex-row justify-between items-center mt-2 pt-2 border-t border-gray-100`}>
//                 <View style={tw`flex-row items-center`}>
//                   <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
//                   <Text style={tw`text-xs text-gray-400 ml-1`}>{item.formattedDate}</Text>
//                   <Text style={tw`text-xs text-gray-400 ml-2`}>{item.formattedTime}</Text>
//                 </View>
//                 <MaterialIcons name="chevron-right" size={20} color="#D1D5DB" />
//               </View>
//             </View>
//           </LinearGradient>
//         </TouchableOpacity>
//       </Animated.View>
//     );
//   };

//   const DateFilterButton = ({ title, value }) => (
//     <TouchableOpacity
//       style={[
//         tw`px-4 py-2 rounded-full`,
//         dateFilter === value ? tw`bg-yellow-500` : tw`bg-gray-100`
//       ]}
//       onPress={() => setDateFilter(value)}
//     >
//       <Text style={[
//         tw`text-sm font-medium`,
//         dateFilter === value ? tw`text-white` : tw`text-gray-600`
//       ]}>
//         {title}
//       </Text>
//     </TouchableOpacity>
//   );

//   return (
//     <SafeAreaView style={tw`flex-1 bg-gray-50`}>
//       {/* Header */}
//       <View style={tw`bg-white px-4 pb-2 shadow-sm`}>
//         <View style={tw`flex-row items-center py-3`}>
//           <TouchableOpacity onPress={() => router.back()} style={tw`mr-3`}>
//             <Ionicons name="arrow-back" size={24} color="#374151" />
//           </TouchableOpacity>
//           <Text style={tw`text-xl font-bold text-gray-800 flex-1`}>Transactions</Text>
//           <TouchableOpacity 
//             style={tw`w-10 h-10 bg-gray-100 rounded-full items-center justify-center`}
//             onPress={() => loadTransactions(true)}
//           >
//             <Ionicons name="refresh" size={20} color="#374151" />
//           </TouchableOpacity>
//         </View>

//         {/* Toggle Buttons */}
//         <View style={tw`flex-row bg-gray-100 rounded-full p-1 mb-4`}>
//           <TouchableOpacity
//             style={[
//               tw`flex-1 py-2 rounded-full`,
//               selectedView === 'als' ? tw`bg-white shadow-sm` : null
//             ]}
//             onPress={() => setSelectedView('als')}
//           >
//             <Text style={[
//               tw`text-center font-semibold`,
//               selectedView === 'als' ? tw`text-yellow-600` : tw`text-gray-500`
//             ]}>ALS</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[
//               tw`flex-1 py-2 rounded-full`,
//               selectedView === 'ride' ? tw`bg-white shadow-sm` : null
//             ]}
//             onPress={() => setSelectedView('ride')}
//           >
//             <Text style={[
//               tw`text-center font-semibold`,
//               selectedView === 'ride' ? tw`text-yellow-600` : tw`text-gray-500`
//             ]}>RIDE</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Balance Card */}
//         <LinearGradient
//           colors={['#F59E0B', '#D97706']}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={tw`rounded-2xl p-5 mb-4 shadow-lg`}
//         >
//           <Text style={tw`text-white/80 text-sm mb-1`}>Available Balance</Text>
//           <Text style={tw`text-white text-3xl font-bold mb-3`}>
//             {formatCurrency(totals.totalIn - totals.totalOut)}
//           </Text>
//           <View style={tw`flex-row justify-between`}>
//             <View>
//               <Text style={tw`text-white/60 text-xs`}>Total In</Text>
//               <Text style={tw`text-white font-semibold`}>{formatCurrency(totals.totalIn)}</Text>
//             </View>
//             <View>
//               <Text style={tw`text-white/60 text-xs`}>Total Out</Text>
//               <Text style={tw`text-white font-semibold`}>{formatCurrency(totals.totalOut)}</Text>
//             </View>
//           </View>
//         </LinearGradient>

//         {/* Search Bar */}
//         <View style={tw`bg-gray-100 rounded-xl px-4 py-2 mb-3 flex-row items-center`}>
//           <Ionicons name="search" size={20} color="#9CA3AF" />
//           <TextInput
//             style={tw`flex-1 ml-2 text-base`}
//             placeholder="Search transactions..."
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//             placeholderTextColor="#9CA3AF"
//           />
//           {searchQuery ? (
//             <TouchableOpacity onPress={() => setSearchQuery('')}>
//               <Ionicons name="close-circle" size={20} color="#9CA3AF" />
//             </TouchableOpacity>
//           ) : null}
//         </View>

//         {/* Date Filters */}
//         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-3`}>
//           <View style={tw`flex-row gap-2`}>
//             <DateFilterButton title="All" value="all" />
//             <DateFilterButton title="Today" value="today" />
//             <DateFilterButton title="This Week" value="week" />
//             <DateFilterButton title="This Month" value="month" />
//           </View>
//         </ScrollView>
//       </View>

//       {/* Transaction List */}
//       {isLoading && transactions.length === 0 ? (
//         <View style={tw`flex-1 justify-center items-center`}>
//           <ActivityIndicator size="large" color="#D97706" />
//           <Text style={tw`text-gray-500 mt-3`}>Loading transactions...</Text>
//         </View>
//       ) : (
//         <FlatList
//           data={filteredTransactions}
//           renderItem={renderTransaction}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={tw`px-4 py-3`}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={isRefreshing}
//               onRefresh={() => loadTransactions(true)}
//               colors={['#D97706']}
//               tintColor="#D97706"
//             />
//           }
//           ListEmptyComponent={
//             <View style={tw`py-10 items-center`}>
//               <Ionicons name="document-text-outline" size={60} color="#D1D5DB" />
//               <Text style={tw`text-gray-400 text-lg mt-3 font-medium`}>No transactions found</Text>
//               <Text style={tw`text-gray-400 text-sm text-center mt-1`}>
//                 {searchQuery ? 'Try adjusting your search' : 'Pull down to refresh'}
//               </Text>
//             </View>
//           }
//           ListFooterComponent={
//             isLoading && transactions.length > 0 ? (
//               <View style={tw`py-5`}>
//                 <ActivityIndicator size="small" color="#D97706" />
//               </View>
//             ) : null
//           }
//         />
//       )}

//       {/* Transaction Detail Modal */}
//       <TransactionDetailModal
//         visible={modalVisible}
//         transaction={selectedTransaction}
//         onClose={() => {
//           setModalVisible(false);
//           setSelectedTransaction(null);
//         }}
//       />
//     </SafeAreaView>
//   );
// };

// export default AllTransactionHistory;
// import React, { useState, useCallback, useEffect, useMemo } from 'react';
// import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, ScrollView, TextInput } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// import tw from 'twrnc';
// import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
// import { router } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { LinearGradient } from 'expo-linear-gradient';
// import Animated, { FadeInDown } from 'react-native-reanimated';

// const API_URL = 'https://hoog.ng/infiniteorder/api/Customers/readCustomerTransactions.php';

// // Enhanced fetch function with error handling
// const fetchTransactions = async (mobile: string) => {
//   if (!mobile) return [];
  
//   try {
//     const response = await fetch(`${API_URL}?mobile=${mobile}`);
//     const data = await response.json();
    
//     if (data && Array.isArray(data.transactions)) {
//       return data.transactions.map(transaction => ({
//         id: transaction.id.toString(),
//         title: transaction.type,
//         description: transaction.description || 'No description',
//         date: new Date(transaction.created_at),
//         formattedDate: new Date(transaction.created_at).toLocaleDateString('en-NG', {
//           day: '2-digit',
//           month: 'short',
//           year: 'numeric',
//         }),
//         formattedTime: new Date(transaction.created_at).toLocaleTimeString('en-NG', {
//           hour: '2-digit',
//           minute: '2-digit',
//         }),
//         debit: parseFloat(transaction.debit) || 0,
//         credit: parseFloat(transaction.credit) || 0,
//         type: transaction.type,
//         status: 'Completed',
//         reference: transaction.reference || `TRX-${transaction.id}`,
//       }));
//     }
//     return [];
//   } catch (error) {
//     console.error('Error fetching transactions:', error);
//     return [];
//   }
// };

// const formatCurrency = (amount: number) => {
//   return new Intl.NumberFormat('en-NG', {
//     style: 'currency',
//     currency: 'NGN',
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   }).format(amount);
// };

// // Transaction Detail Modal Component
// const TransactionDetailModal = ({ visible, transaction, onClose }) => {
//   if (!transaction) return null;

//   const isCredit = transaction.credit > 0;
//   const amount = isCredit ? transaction.credit : transaction.debit;
//   const sign = isCredit ? '-' : '+';
//   const color = isCredit ? '#EF4444' : '#10B981';

//   return (
//     <Modal
//       visible={visible}
//       transparent={true}
//       animationType="slide"
//       onRequestClose={onClose}
//     >
//       <View style={tw`flex-1 justify-end bg-black/50`}>
//         <Animated.View 
//           entering={FadeInDown}
//           style={tw`bg-white rounded-t-3xl p-6`}
//         >
//           {/* Header */}
//           <View style={tw`flex-row justify-between items-center mb-6`}>
//             <Text style={tw`text-xl font-bold text-gray-800`}>Transaction Details</Text>
//             <TouchableOpacity onPress={onClose}>
//               <Ionicons name="close" size={24} color="#6B7280" />
//             </TouchableOpacity>
//           </View>

//           {/* Icon and Amount */}
//           <View style={tw`items-center mb-6`}>
//             <View style={[
//               tw`w-20 h-20 rounded-full items-center justify-center mb-3`,
//               { backgroundColor: color + '20' }
//             ]}>
//               <Ionicons 
//                 name={isCredit ? 'arrow-up' : 'arrow-down'} 
//                 size={32} 
//                 color={color} 
//               />
//             </View>
//             <Text style={[tw`text-3xl font-bold`, { color }]}>
//               {sign}{formatCurrency(amount)}
//             </Text>
//             <Text style={tw`text-base text-gray-500 mt-1`}>{transaction.title}</Text>
//           </View>

//           {/* Details Grid */}
//           <View style={tw`bg-gray-50 rounded-xl p-4 mb-4`}>
//             <DetailRow icon="info" label="Description" value={transaction.description} />
//             <DetailRow icon="calendar" label="Date" value={transaction.formattedDate} />
//             <DetailRow icon="time" label="Time" value={transaction.formattedTime} />
//             <DetailRow icon="hash" label="Reference" value={transaction.reference} />
//             <DetailRow icon="check-circle" label="Status" value={transaction.status} isStatus />
//           </View>

//           {/* Action Buttons */}
//           <View style={tw`flex-row gap-3`}>
//             <TouchableOpacity 
//               style={tw`flex-1 bg-blue-500 py-3 rounded-lg flex-row items-center justify-center`}
//               onPress={() => {
//                 // Share functionality
//                 onClose();
//               }}
//             >
//               <Ionicons name="share-outline" size={20} color="white" />
//               <Text style={tw`text-white font-semibold ml-2`}>Share</Text>
//             </TouchableOpacity>
//             <TouchableOpacity 
//               style={tw`flex-1 bg-gray-100 py-3 rounded-lg flex-row items-center justify-center`}
//               onPress={onClose}
//             >
//               <Text style={tw`text-gray-700 font-semibold`}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </Animated.View>
//       </View>
//     </Modal>
//   );
// };

// const DetailRow = ({ icon, label, value, isStatus }) => (
//   <View style={tw`flex-row items-center py-2`}>
//     <Ionicons name={icon} size={16} color="#6B7280" style={tw`w-8`} />
//     <Text style={tw`text-sm text-gray-500 flex-1`}>{label}</Text>
//     {isStatus ? (
//       <View style={tw`bg-green-100 px-2 py-1 rounded-full`}>
//         <Text style={tw`text-xs text-green-600 font-semibold`}>{value}</Text>
//       </View>
//     ) : (
//       <Text style={tw`text-sm text-gray-800 font-medium flex-1 text-right`}>{value}</Text>
//     )}
//   </View>
// );

// const AllTransactionHistory = () => {
//   const [selectedView, setSelectedView] = useState('als');
//   const [transactions, setTransactions] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [mobile, setMobile] = useState('');
//   const [selectedTransaction, setSelectedTransaction] = useState(null);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'
//   const [searchQuery, setSearchQuery] = useState('');

//   // Fetch user mobile
//   useEffect(() => {
//     const getMobile = async () => {
//       const myMobile = await AsyncStorage.getItem('mobile');
//       if (myMobile) {
//         setMobile(myMobile);
//       }
//     };
//     getMobile();
//   }, []);

//   // Fetch transactions
//   useEffect(() => {
//     if (mobile) {
//       loadTransactions();
//     }
//   }, [mobile]);

//   const loadTransactions = async (refresh = false) => {
//     if (refresh) setIsRefreshing(true);
//     else setIsLoading(true);

//     const fetchedTransactions = await fetchTransactions(mobile);
//     setTransactions(fetchedTransactions);
    
//     if (refresh) setIsRefreshing(false);
//     else setIsLoading(false);
//   };

//   // Filter transactions based on selected view, date, and search
//   const filteredTransactions = useMemo(() => {
//     let filtered = transactions.filter(t =>
//       selectedView === 'als'
//         ? (t.type === 'ALS' || t.type === 'ALS-Bonus')
//         : (t.type === 'RIDE' || t.type === 'RIDE-Bonus' || t.type === 'FOOD' || t.type === 'OTHERS')
//     );

//     // Date filter
//     const now = new Date();
//     if (dateFilter === 'today') {
//       filtered = filtered.filter(t => t.date.toDateString() === now.toDateString());
//     } else if (dateFilter === 'week') {
//       const weekAgo = new Date(now.setDate(now.getDate() - 7));
//       filtered = filtered.filter(t => t.date >= weekAgo);
//     } else if (dateFilter === 'month') {
//       const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
//       filtered = filtered.filter(t => t.date >= monthAgo);
//     }

//     // Search filter
//     if (searchQuery) {
//       filtered = filtered.filter(t => 
//         t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         t.reference.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     return filtered;
//   }, [transactions, selectedView, dateFilter, searchQuery]);

//   // Calculate totals
//   const totals = useMemo(() => {
//     const debitTotal = filteredTransactions.reduce((sum, t) => sum + t.debit, 0);
//     const creditTotal = filteredTransactions.reduce((sum, t) => sum + t.credit, 0);
//     return { totalIn: debitTotal, totalOut: creditTotal };
//   }, [filteredTransactions]);

//   const handleTransactionPress = (transaction) => {
//     setSelectedTransaction(transaction);
//     setModalVisible(true);
//   };

//   const renderTransaction = ({ item, index }) => {
//     const isCredit = item.credit > 0;
//     const amount = isCredit ? item.credit : item.debit;
//     const sign = isCredit ? '-' : '+';
//     const color = isCredit ? '#EF4444' : '#10B981';
//     const bgColor = isCredit ? '#FEE2E2' : '#D1FAE5';

//     return (
//       <Animated.View 
//         entering={FadeInDown.delay(index * 100)}
//         style={tw`mb-3`}
//       >
//         <TouchableOpacity
//           activeOpacity={0.7}
//           onPress={() => handleTransactionPress(item)}
//         >
//           <LinearGradient
//             colors={['#FFFFFF', '#F9FAFB']}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 0 }}
//             style={tw`rounded-2xl shadow-sm border border-gray-100`}
//           >
//             <View style={tw`p-4`}>
//               {/* Top Row */}
//               <View style={tw`flex-row justify-between items-start mb-2`}>
//                 <View style={tw`flex-row items-center flex-1`}>
//                   <View style={[tw`w-10 h-10 rounded-full items-center justify-center mr-3`, { backgroundColor: bgColor }]}>
//                     <Ionicons 
//                       name={isCredit ? 'arrow-up' : 'arrow-down'} 
//                       size={20} 
//                       color={color} 
//                     />
//                   </View>
//                   <View style={tw`flex-1`}>
//                     <Text style={tw`text-base font-bold text-gray-800`}>{item.title}</Text>
//                     <Text style={tw`text-sm text-gray-500`} numberOfLines={1}>
//                       {item.description}
//                     </Text>
//                   </View>
//                 </View>
//                 <View style={tw`items-end`}>
//                   <Text style={[tw`text-lg font-bold`, { color }]}>
//                     {sign}{formatCurrency(amount)}
//                   </Text>
//                   <View style={tw`bg-green-100 px-2 py-0.5 rounded-full mt-1`}>
//                     <Text style={tw`text-xs text-green-600 font-medium`}>{item.status}</Text>
//                   </View>
//                 </View>
//               </View>

//               {/* Bottom Row */}
//               <View style={tw`flex-row justify-between items-center mt-2 pt-2 border-t border-gray-100`}>
//                 <View style={tw`flex-row items-center`}>
//                   <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
//                   <Text style={tw`text-xs text-gray-400 ml-1`}>{item.formattedDate}</Text>
//                   <Text style={tw`text-xs text-gray-400 ml-2`}>{item.formattedTime}</Text>
//                 </View>
//                 <MaterialIcons name="chevron-right" size={20} color="#D1D5DB" />
//               </View>
//             </View>
//           </LinearGradient>
//         </TouchableOpacity>
//       </Animated.View>
//     );
//   };

//   const DateFilterButton = ({ title, value }) => (
//     <TouchableOpacity
//       style={[
//         tw`px-4 py-2 rounded-full`,
//         dateFilter === value ? tw`bg-yellow-500` : tw`bg-gray-100`
//       ]}
//       onPress={() => setDateFilter(value)}
//     >
//       <Text style={[
//         tw`text-sm font-medium`,
//         dateFilter === value ? tw`text-white` : tw`text-gray-600`
//       ]}>
//         {title}
//       </Text>
//     </TouchableOpacity>
//   );

//   return (
//     <SafeAreaView style={tw`flex-1 bg-gray-50`}>
//       {/* Header */}
//       <View style={tw`bg-white px-4 pb-2 shadow-sm`}>
//         <View style={tw`flex-row items-center py-3`}>
//           <TouchableOpacity onPress={() => router.back()} style={tw`mr-3`}>
//             <Ionicons name="arrow-back" size={24} color="#374151" />
//           </TouchableOpacity>
//           <Text style={tw`text-xl font-bold text-gray-800 flex-1`}>Transactions</Text>
//           <TouchableOpacity 
//             style={tw`w-10 h-10 bg-gray-100 rounded-full items-center justify-center`}
//             onPress={() => loadTransactions(true)}
//           >
//             <Ionicons name="refresh" size={20} color="#374151" />
//           </TouchableOpacity>
//         </View>

//         {/* Toggle Buttons */}
//         <View style={tw`flex-row bg-gray-100 rounded-full p-1 mb-4`}>
//           <TouchableOpacity
//             style={[
//               tw`flex-1 py-2 rounded-full`,
//               selectedView === 'als' ? tw`bg-white shadow-sm` : null
//             ]}
//             onPress={() => setSelectedView('als')}
//           >
//             <Text style={[
//               tw`text-center font-semibold`,
//               selectedView === 'als' ? tw`text-yellow-600` : tw`text-gray-500`
//             ]}>ALS</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[
//               tw`flex-1 py-2 rounded-full`,
//               selectedView === 'ride' ? tw`bg-white shadow-sm` : null
//             ]}
//             onPress={() => setSelectedView('ride')}
//           >
//             <Text style={[
//               tw`text-center font-semibold`,
//               selectedView === 'ride' ? tw`text-yellow-600` : tw`text-gray-500`
//             ]}>OTHERS</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Balance Card */}
//         <LinearGradient
//           colors={['#F59E0B', '#D97706']}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={tw`rounded-2xl p-5 mb-4 shadow-lg`}
//         >
//           <Text style={tw`text-white/80 text-sm mb-1`}>Available Balance</Text>
//           <Text style={tw`text-white text-3xl font-bold mb-3`}>
//             {formatCurrency(totals.totalIn - totals.totalOut)}
//           </Text>
//           <View style={tw`flex-row justify-between`}>
//             <View>
//               <Text style={tw`text-white/60 text-xs`}>Total In</Text>
//               <Text style={tw`text-white font-semibold`}>{formatCurrency(totals.totalIn)}</Text>
//             </View>
//             <View>
//               <Text style={tw`text-white/60 text-xs`}>Total Out</Text>
//               <Text style={tw`text-white font-semibold`}>{formatCurrency(totals.totalOut)}</Text>
//             </View>
//           </View>
//         </LinearGradient>

//         {/* Search Bar */}
//         <View style={tw`bg-gray-100 rounded-xl px-4 py-2 mb-3 flex-row items-center`}>
//           <Ionicons name="search" size={20} color="#9CA3AF" />
//           <TextInput
//             style={tw`flex-1 ml-2 text-base`}
//             placeholder="Search transactions..."
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//             placeholderTextColor="#9CA3AF"
//           />
//           {searchQuery ? (
//             <TouchableOpacity onPress={() => setSearchQuery('')}>
//               <Ionicons name="close-circle" size={20} color="#9CA3AF" />
//             </TouchableOpacity>
//           ) : null}
//         </View>

//         {/* Date Filters */}
//         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-3`}>
//           <View style={tw`flex-row gap-2`}>
//             <DateFilterButton title="All" value="all" />
//             <DateFilterButton title="Today" value="today" />
//             <DateFilterButton title="This Week" value="week" />
//             <DateFilterButton title="This Month" value="month" />
//           </View>
//         </ScrollView>
//       </View>

//       {/* Transaction List */}
//       {isLoading && transactions.length === 0 ? (
//         <View style={tw`flex-1 justify-center items-center`}>
//           <ActivityIndicator size="large" color="#D97706" />
//           <Text style={tw`text-gray-500 mt-3`}>Loading transactions...</Text>
//         </View>
//       ) : (
//         <FlatList
//           data={filteredTransactions}
//           renderItem={renderTransaction}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={tw`px-4 py-3`}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={isRefreshing}
//               onRefresh={() => loadTransactions(true)}
//               colors={['#D97706']}
//               tintColor="#D97706"
//             />
//           }
//           ListEmptyComponent={
//             <View style={tw`py-10 items-center`}>
//               <Ionicons name="document-text-outline" size={60} color="#D1D5DB" />
//               <Text style={tw`text-gray-400 text-lg mt-3 font-medium`}>No transactions found</Text>
//               <Text style={tw`text-gray-400 text-sm text-center mt-1`}>
//                 {searchQuery ? 'Try adjusting your search' : 'Pull down to refresh'}
//               </Text>
//             </View>
//           }
//           ListFooterComponent={
//             isLoading && transactions.length > 0 ? (
//               <View style={tw`py-5`}>
//                 <ActivityIndicator size="small" color="#D97706" />
//               </View>
//             ) : null
//           }
//         />
//       )}

//       {/* Transaction Detail Modal */}
//       <TransactionDetailModal
//         visible={modalVisible}
//         transaction={selectedTransaction}
//         onClose={() => {
//           setModalVisible(false);
//           setSelectedTransaction(null);
//         }}
//       />
//     </SafeAreaView>
//   );
// };

// export default AllTransactionHistory;import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl, 
  Modal, 
  ScrollView, 
  TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

// THE REPLACEMENT: No more Reanimated or Moti crashes
import * as Animatable from 'react-native-animatable';

const API_URL = 'https://hoog.ng/infiniteorder/api/Customers/readCustomerTransactions.php';

const fetchTransactions = async (mobile: string) => {
  if (!mobile) return [];
  try {
    const response = await fetch(`${API_URL}?mobile=${mobile}`);
    const data = await response.json();
    if (data && Array.isArray(data.transactions)) {
      return data.transactions.map(transaction => ({
        id: transaction.id.toString(),
        title: transaction.type,
        description: transaction.description || 'No description',
        date: new Date(transaction.created_at),
        formattedDate: new Date(transaction.created_at).toLocaleDateString('en-NG', {
          day: '2-digit', month: 'short', year: 'numeric',
        }),
        formattedTime: new Date(transaction.created_at).toLocaleTimeString('en-NG', {
          hour: '2-digit', minute: '2-digit',
        }),
        debit: parseFloat(transaction.debit) || 0,
        credit: parseFloat(transaction.credit) || 0,
        type: transaction.type,
        status: 'Completed',
        reference: transaction.reference || `TRX-${transaction.id}`,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount);
};

const DetailRow = ({ icon, label, value, isStatus }: any) => (
  <View style={tw`flex-row items-center py-2`}>
    <Ionicons name={icon} size={16} color="#6B7280" style={tw`w-8`} />
    <Text style={tw`text-sm text-gray-500 flex-1`}>{label}</Text>
    {isStatus ? (
      <View style={tw`bg-green-100 px-2 py-1 rounded-full`}>
        <Text style={tw`text-xs text-green-600 font-semibold`}>{value}</Text>
      </View>
    ) : (
      <Text style={tw`text-sm text-gray-800 font-medium flex-1 text-right`}>{value}</Text>
    )}
  </View>
);

const TransactionDetailModal = ({ visible, transaction, onClose }: any) => {
  if (!transaction) return null;
  const isCredit = transaction.credit > 0;
  const color = isCredit ? '#EF4444' : '#10B981';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={tw`flex-1 justify-end bg-black/50`}>
        {/* ANIMATABLE VIEW REPLACEMENT */}
        <Animatable.View 
          animation="fadeInUp"
          duration={400}
          style={tw`bg-white rounded-t-3xl p-6`}
        >
          <View style={tw`flex-row justify-between items-center mb-6`}>
            <Text style={tw`text-xl font-bold text-gray-800`}>Transaction Details</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
          </View>
          <View style={tw`items-center mb-6`}>
            <View style={[tw`w-20 h-20 rounded-full items-center justify-center mb-3`, { backgroundColor: color + '20' }]}>
              <Ionicons name={isCredit ? 'arrow-up' : 'arrow-down'} size={32} color={color} />
            </View>
            <Text style={[tw`text-3xl font-bold`, { color }]}>{isCredit ? '-' : '+'}{formatCurrency(isCredit ? transaction.credit : transaction.debit)}</Text>
            <Text style={tw`text-base text-gray-500 mt-1`}>{transaction.title}</Text>
          </View>
          <View style={tw`bg-gray-50 rounded-xl p-4 mb-4`}>
            <DetailRow icon="information-circle-outline" label="Description" value={transaction.description} />
            <DetailRow icon="calendar-outline" label="Date" value={transaction.formattedDate} />
            <DetailRow icon="time-outline" label="Time" value={transaction.formattedTime} />
            <DetailRow icon="finger-print-outline" label="Reference" value={transaction.reference} />
            <DetailRow icon="checkmark-circle-outline" label="Status" value={transaction.status} isStatus />
          </View>
          <TouchableOpacity style={tw`bg-gray-100 py-4 rounded-xl items-center mb-4`} onPress={onClose}>
            <Text style={tw`text-gray-700 font-bold`}>Close</Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </Modal>
  );
};

const AllTransactionHistory = () => {
  const [selectedView, setSelectedView] = useState('als');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobile, setMobile] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    (async () => {
      const myMobile = await AsyncStorage.getItem('mobile');
      if (myMobile) setMobile(myMobile);
    })();
  }, []);

  useEffect(() => { if (mobile) loadTransactions(); }, [mobile]);

  const loadTransactions = async (refresh = false) => {
    refresh ? setIsRefreshing(true) : setIsLoading(true);
    const fetched = await fetchTransactions(mobile);
    setTransactions(fetched);
    refresh ? setIsRefreshing(false) : setIsLoading(false);
  };

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(t =>
      selectedView === 'als' ? (t.type === 'ALS' || t.type === 'ALS-Bonus') : (t.type !== 'ALS' && t.type !== 'ALS-Bonus')
    );
    if (searchQuery) {
      filtered = filtered.filter(t => t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered;
  }, [transactions, selectedView, searchQuery]);

  const totals = useMemo(() => {
    const totalIn = filteredTransactions.reduce((sum, t) => sum + t.debit, 0);
    const totalOut = filteredTransactions.reduce((sum, t) => sum + t.credit, 0);
    return { totalIn, totalOut };
  }, [filteredTransactions]);

  const renderTransaction = ({ item, index }: any) => {
    const isCredit = item.credit > 0;
    const color = isCredit ? '#EF4444' : '#10B981';
    return (
      <Animatable.View 
        animation="fadeInUp" 
        delay={index * 30} 
        duration={500}
        useNativeDriver
        style={tw`mb-3`}
      >
        <TouchableOpacity 
          style={tw`bg-white p-4 rounded-2xl border border-gray-100 shadow-sm`} 
          onPress={() => { setSelectedTransaction(item); setModalVisible(true); }}
        >
          <View style={tw`flex-row justify-between items-center`}>
            <View style={tw`flex-row items-center flex-1`}>
              <View style={[tw`w-10 h-10 rounded-full items-center justify-center mr-3`, { backgroundColor: color + '15' }]}>
                <Ionicons name={isCredit ? 'arrow-up' : 'arrow-down'} size={20} color={color} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-base font-bold text-gray-800`}>{item.title}</Text>
                <Text style={tw`text-xs text-gray-400`}>{item.formattedDate} • {item.formattedTime}</Text>
              </View>
            </View>
            <Text style={[tw`text-lg font-bold`, { color }]}>
              {isCredit ? '-' : '+'}{formatCurrency(isCredit ? item.credit : item.debit)}
            </Text>
          </View>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <View style={tw`bg-white px-4 pb-4 shadow-sm`}>
        <View style={tw`flex-row items-center py-4`}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#374151" /></TouchableOpacity>
          <Text style={tw`text-xl font-bold ml-4 text-gray-800`}>Transactions</Text>
        </View>

        <View style={tw`flex-row bg-gray-100 rounded-full p-1 mb-4`}>
          {['als', 'others'].map(view => (
            <TouchableOpacity key={view} style={[tw`flex-1 py-2 rounded-full`, selectedView === view && tw`bg-white shadow-sm` ]} onPress={() => setSelectedView(view)}>
              <Text style={[tw`text-center font-bold`, selectedView === view ? tw`text-yellow-600` : tw`text-gray-400`]}>{view.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <LinearGradient colors={['#F59E0B', '#D97706']} style={tw`rounded-2xl p-6 shadow-lg`}>
          <Text style={tw`text-white/80 text-sm`}>Net Balance</Text>
          <Text style={tw`text-white text-3xl font-bold mb-4`}>{formatCurrency(totals.totalIn - totals.totalOut)}</Text>
          <View style={tw`flex-row justify-between border-t border-white/20 pt-4`}>
            <View><Text style={tw`text-white/60 text-xs`}>Total In</Text><Text style={tw`text-white font-bold`}>{formatCurrency(totals.totalIn)}</Text></View>
            <View><Text style={tw`text-white/60 text-xs text-right`}>Total Out</Text><Text style={tw`text-white font-bold text-right`}>{formatCurrency(totals.totalOut)}</Text></View>
          </View>
        </LinearGradient>
      </View>

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={item => item.id}
        contentContainerStyle={tw`p-4`}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadTransactions(true)} />}
      />

      <TransactionDetailModal visible={modalVisible} transaction={selectedTransaction} onClose={() => setModalVisible(false)} />
    </SafeAreaView>
  );
};

export default AllTransactionHistory;