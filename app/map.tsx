import { View } from 'react-native';
import React, { useState } from 'react';
import Container from '@/components/container';
import tw from 'twrnc';
import MapContent from '@/components/MapContent';
import NavigateCard from '@/components/NavigateCard';
import { useLocalSearchParams } from 'expo-router';

const MapScreen = () => {
  const [nTime, setNTime] = useState(0);
  const [nDistance, setNDistance] = useState(0);
  const { fromRedirect } = useLocalSearchParams(); // get query param

  const updateRouteData = (time, distance) => {
    setNTime(time);
    setNDistance(distance);
  };

  const shouldShowMapContent = !fromRedirect || fromRedirect === 'false';

  return (
    <Container className='p-0 mr-2 pb-30'>
      <View style={tw`h-1/2`}>
        {shouldShowMapContent && (
          <MapContent updateRouteData={updateRouteData} />
        )}
      </View>

      <View style={tw`h-1/2`}>
        <NavigateCard nTime={nTime} nDistance={nDistance} />
      </View>
    </Container>
  );
};

export default MapScreen;
