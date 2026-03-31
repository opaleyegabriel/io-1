import { View, SafeAreaView, Platform, StatusBar, Dimensions } from 'react-native';
import React from 'react';
import tw from 'twrnc';

interface Props {
  children: React.ReactNode;
  className?: string;
}

const { width, height } = Dimensions.get('window'); // Get screen dimensions

const Container = ({ children, className }: Props) => {
  return (
    <SafeAreaView
      style={[
        tw`bg-white flex-1`,
        { marginTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0 }
      ]}
    >
      <View
        style={[
          tw`p-5`,
          { paddingHorizontal: width * 0.05, paddingVertical: height * 0.02 }, // Responsive padding
          className ? tw`${className}` : null
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
};

export default Container;
