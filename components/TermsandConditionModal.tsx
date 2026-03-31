import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import tw from 'twrnc';

// Get screen height for full-screen overlay
const { height: screenHeight } = Dimensions.get('window');

const TermsandConditionModal = ({ visible, onClose }: any) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={[
          tw`flex-1 justify-center items-center bg-black bg-opacity-50`,
          { height: screenHeight },
        ]}
      >
        <View style={[tw`bg-white p-6 rounded-lg w-11/12`, { height: '80%' }]}>
          {/* Privacy Policy Content */}
          <ScrollView contentContainerStyle={tw`p-4`}>
            <Text style={tw`text-lg font-semibold text-center mb-4`}>Terms and Conditions</Text>
            {/* Insert your Privacy Policy text here */}
            <Text style={tw`text-base text-black`}>
              {/* You can place the entire Privacy Policy content here */}
              Terms and Condition
              Last updated: December 19, 2024
              {'\n'}
              
              Terms and Conditions for Bike Transportation and Automated Laundry Service
1. Introduction
Welcome to Infinite Order Ltd an integrated online bike transportation and automated laundry system. By using our services, including but not limited to booking a bike ride or utilizing our laundry services, you agree to abide by the following Terms and Conditions. These terms are designed to protect both our customers and service providers, ensuring a smooth, safe, and efficient experience.
2. User Registration and Account Creation
To use our services, customers must download our application from the Play Store or App Store and create an account. By registering, users agree to provide accurate and up-to-date information.
3. Payment Platform
We use Paystack and or other similar service provider for all payment transactions within the application. Customers will load funds into their account to pay for services. Please note that we bear the charges for funds loaded into the account by the customer.
4. Services Offered
Our platform offers two main services:
•	Bike Transportation Booking System: A fast, affordable, convenient, accessible, reliable, and efficient means of transport for passengers.
•	Automated Laundry Service: A simple and effective laundry service accessible via the app.
5. Bike Transportation Service Terms
1.	Fuel Exhaustion or Faults: If the bike runs out of fuel or experiences a fault during the trip, the rider must click the “Completed Trip” button on the app. This action will automatically calculate the transport cost up to that point.
2.	Rider's Mobile Phone: Riders must ensure their mobile phone is on at all times. Failure to do so may result in the forfeiture of the trip cost.
3.	Passenger's Phone: If the passenger’s phone goes off during the trip, the rider should click the “Completed Trip” button on the app.
4.	Passenger Return: If a passenger needs to return to the origin of the trip, the rider must click the “Completed Trip” button, and the passenger can rebook a ride from the new location.
5.	Safety Rules: Riders must comply with all safety regulations and transportation rules outlined in this document.
6. Passenger Restrictions
We strictly do not permit the following categories of passengers:
1.	Pregnant women
2.	Children under the age of 16
3.	Passengers carrying babies
4.	Intoxicated individuals
5.	More than one passenger per bike
If a passenger in any of these categories attempts to use our bike service, they will be charged for fuel and time wasted. Riders must refuse service to passengers who fall under these categories.
7. Rider Fines
 please do check for updated terms on our website www.infiniteorder.ng/terms
By using our services, you acknowledge that you have read, understood, and agree to these Terms and Conditions.              {/* Paste all your privacy policy content here */}
            </Text>
          </ScrollView>
          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            style={[tw`bg-yellow-600 py-2 px-4 rounded-lg mt-4`]}
          >
            <Text style={tw`text-white text-center font-semibold`}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default TermsandConditionModal;
