import { View, SafeAreaView, StatusBar } from 'react-native';
import React from 'react';
import Container from '@/components/container';
import AllOrderHistory from '../AllOrderHistory';
import tw from 'twrnc';

const COLORS = {
  background: '#FFFFFF',
};

const orderHistory = () => {
  return (
    <SafeAreaView style={tw`flex-1 bg-[${COLORS.background}]`}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <Container className='p-0 flex-1'>
        <AllOrderHistory />
      </Container>
    </SafeAreaView>
  );
};

export default orderHistory;