import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import tw from "twrnc";

export default function HelpScreen() {
  const { messageId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!messageId) return;

    fetch(`https://hoog.ng/infiniteorder/api/Customers/readMessage.php?id=${messageId}`)
      .then(res => res.json())
      .then(data => {
        setMessage(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [messageId]);

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!message) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text>No message found.</Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 p-4`}>
      <Text style={tw`text-2xl font-bold mb-2`}>{message.title}</Text>
      <Text style={tw`text-gray-700`}>{message.body}</Text>
    </View>
  );
}
