import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import RideBalance from '@/components/RideBalance'; // Keeping only RideBalance
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://hoog.ng/infiniteorder/api/Riders/readRiderTransaction.php';

// Function to fetch transactions from the API
const fetchTransactions = async (mobile: string) => {
  if (!mobile) {
    return;
  }
  try {
    const response = await fetch(`${API_URL}?mobile=${mobile}`);
    const data = await response.json();
    if (data && Array.isArray(data.transactions)) {
      return data.transactions.map(transaction => ({
        id: transaction.id.toString(),  // Ensure the id is a string
        title: transaction.type,        // 'type' from the API is used as title
        description: transaction.description,  // 'description' from the API
        date: new Date(transaction.created_at).toLocaleDateString(),  // 'created_at' from the API
        debit: transaction.debit || 0,  // Use debit if available
        credit: transaction.credit || 0,  // Use credit if available
        type: transaction.type,  // Keep 'RIDE' as the type
        status: 'Completed',  // Status is always 'Completed'
      }));
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

// Format the currency to NGN
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    currencyDisplay: 'symbol',
  }).format(amount);
};

const RiderTransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalIn, setTotalIn] = useState(0); // Total debit (In)
  const [totalOut, setTotalOut] = useState(0); // Total credit (Out)
  const [mobile, setMobile] = useState('');

  // Fetch user mobile from AsyncStorage
  useEffect(() => {
    const handleGotToken = async () => {
      const myMobile = await AsyncStorage.getItem('mobile');
      if (myMobile) {
        setMobile(myMobile);
      } else {
        alert('Your account name not found');
      }
    };

    handleGotToken();
  }, []);

  // Fetch transactions when the component mounts
  useEffect(() => {
    const getTransactions = async () => {
      setIsLoading(true);
      const fetchedTransactions = await fetchTransactions(mobile);
      setTransactions(fetchedTransactions.slice(0, 50));  // Set initial transactions (50 items)
      setIsLoading(false);
    };
    getTransactions();
  }, [mobile]);

  // Update totals (In and Out) whenever transactions change
  useEffect(() => {
    let debitTotal = 0;
    let creditTotal = 0;

    // Filter only "RIDE" transactions
    const filteredTransactions = transactions.filter(t => t.type === 'RIDE' || t.type === 'RIDE-Bonus');

    // If there are no filtered transactions, exit early
    if (filteredTransactions.length === 0) {
      return;
    }

    // Loop through each filtered transaction and sum debits and credits
    filteredTransactions.forEach(transaction => {
      const debitValue = parseFloat(transaction.debit) || 0; // Convert debit to number
      const creditValue = parseFloat(transaction.credit) || 0; // Convert credit to number

      // Add debit (In) for Ride type
      debitTotal += debitValue;
      creditTotal += creditValue;  // Add credit (Out) for Ride type
    });

    // Set the state with the calculated totals
    setTotalIn(debitTotal);  // For debit (In)
    setTotalOut(creditTotal);  // For credit (Out)

  }, [transactions]); // Recalculate whenever transactions change

  const GoBack = () => {
    router.replace("/RidersDashboard");
  };

  // Load more data when scrolling up
  const loadMoreData = useCallback(() => {
    if (isLoading) return;
    setIsLoading(true);
    setTimeout(() => {
      const nextTransactions = transactions.slice(transactions.length, transactions.length + 50);
      if (nextTransactions.length > 0) {
        setTransactions((prevTransactions) => [
          ...prevTransactions,
          ...nextTransactions,
        ]);
      }
      setIsLoading(false);
    }, 1500); // Simulate network request
  }, [isLoading, transactions]);

  const renderTransaction = ({ item }) => (
    <View style={tw`flex-row justify-between items-center bg-white p-4 mb-2 shadow-md rounded-lg`}>
      <View style={tw`flex-row`}>
        <View style={tw`mt-4 mr-1`}>
          <FontAwesome
            name={item.debit > 0 ? 'arrow-down' : 'arrow-up'}
            size={20}
            style={tw`text-yellow-600`}
          />
        </View>
        <View>
          <Text style={tw`text-lg font-semibold text-yellow-600`}>{item.title}</Text>
          <Text style={tw`text-sm text-gray-500`}>{item.description}</Text>
          <Text style={tw`text-xs text-gray-400`}>{item.date}</Text>
        </View>
      </View>
      <View style={tw`mt-2`}>
        <Text style={tw`font-semibold text-lg text-yellow-600`}>
          {item.debit > 0 ? '+' : '-'}{formatCurrency(item.debit > 0 ? item.debit : item.credit)}  {/* Show + for debit, - for credit */}
        </Text>
        <Text style={tw`text-sm text-gray-600`}>{item.status}</Text>
      </View>
    </View>
  );

  return (
    <View style={tw`flex-1 bg-gray-100 p-4`}>
      {/* Header */}
      <View style={tw`mb-4`}>
        <TouchableOpacity onPress={GoBack}>
          <Text style={tw`text-2xl mt-5 py-2 font-semibold mb-2 mr-2 pl-2`}>
            <FontAwesome name="arrow-left" size={20} color="black" />
            Back
          </Text>
        </TouchableOpacity>

        {/* Ride Balance */}
        <RideBalance balance={totalIn - totalOut} />

        {/* Month Selector */}
        <View style={tw`bg-white p-1 rounded-lg`}>
          <TouchableOpacity>
            <Text style={tw`text-gray-700 text-center`}>All Ride Transactions</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary of Transactions */}
      <View style={tw`flex-row justify-between mb-2`}>
        <View style={tw`bg-white p-4 rounded-lg flex-1 mr-2`}>
          <Text style={tw`text-sm text-gray-500`}>In (Debit)</Text>
          <Text style={tw`text-xl font-semibold`}>{formatCurrency(totalIn)}</Text>
        </View>
        <View style={tw`bg-white p-4 rounded-lg flex-1`}>
          <Text style={tw`text-sm text-gray-500`}>Out (Credit)</Text>
          <Text style={tw`text-xl font-semibold`}>{formatCurrency(totalOut)}</Text>
        </View>
      </View>

      {/* Transaction List */}
      <FlatList
        data={transactions.filter(t => t.type === 'RIDE' || t.type === 'RIDE-Bonus')}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isLoading ? <ActivityIndicator size="large" color="#D97706" /> : null}
      />
    </View>
  );
};

export default RiderTransactionHistory;
