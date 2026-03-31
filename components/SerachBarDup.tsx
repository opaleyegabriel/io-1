import { View, Text, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import { GOOGLE_MAPS_API_KEY } from '@/config';
import { StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { setDestination, setOrigin } from '@/store/ioSlices';
import tw from 'twrnc';

const SearchBar = () => {
  const [applock, setApplock] = useState(false);
  const [appLockMessage, setAppLockMessage] = useState('');
  const [lockStatus, setLockStatus] = useState('');
  const [currentLocationDescription, setCurrentLocationDescription] = useState('');
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const getAppMessage = () => {
    fetch(`https://hoog.ng/infiniteorder/api/Settings/readAppLock.php`)
      .then((res) => res.json())
      .then((result) => {
        if (Array.isArray(result) && result.length > 0) {
          setAppLockMessage(result[0].lockmessage);
          setLockStatus(result[0].applock);
        } else {
          console.warn('Unexpected result structure from app lock API:', result);
        }
      })
      .catch((error) => {
        console.log('Error fetching app lock:', error);
      });
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }

      setLoading(true);

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;

      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(geocodeUrl);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const formattedAddress = data.results[0].formatted_address;
        setCurrentLocationDescription(formattedAddress);

        dispatch(setOrigin({
          location: { lat: latitude, lng: longitude },
          description: formattedAddress,
        }));

        dispatch(setDestination(null));
      } else {
        Alert.alert('Error', 'Could not retrieve address from current location.');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Unable to fetch your current location. Please try manually.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dispatch(setOrigin(null));
    getAppMessage();

    const intervalId = setInterval(() => {
      getAppMessage();
    }, 10000); // Every 10s

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setApplock(lockStatus === 'YES');
  }, [lockStatus]);

  const handleLockState = () => {
    if (applock) {
      Alert.alert('App Locked', 'The app is currently locked, please try again later.');
    }
  };

  return (
    <View>
      {applock && (
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>
          {appLockMessage}
        </Text>
      )}

      <View style={tw`flex-row pt-2`}>
        <Text style={[tw`pt-5 pb-0 text-xl`, { fontFamily: 'KalamB', fontSize: 30, fontWeight: 'bold' }]}>Select </Text>
        <Text style={[tw`pt-3 text-xl`, { fontFamily: 'SacR', fontSize: 25 }]}>Where from :-</Text>
      </View>

      <GooglePlacesAutocomplete
        styles={inputBoxStyles}
        placeholder="Where From?"
        debounce={500}
        fetchDetails={true}
        minLength={2}
        enablePoweredByContainer={false}
        query={{
          key: GOOGLE_MAPS_API_KEY,
          language: 'en',
          location: '8.4922,4.5428',
          radius: 50000,
          componentRestrictions: { country: 'NG' },
          types: ['geocode'],
          strictbounds: true,
        }}
        onPress={(data, details = null) => {
          if (!applock) {
            dispatch(setOrigin({
              location: details?.geometry?.location,
              description: data?.description,
            }));
            dispatch(setDestination(null));
          } else {
            handleLockState();
          }
        }}
        textInputProps={{
          editable: !applock,
        }}
      />

      <View>
        <Text style={[tw`text-xl ml-3`, { fontFamily: 'NunitoB' }]}>OR</Text>
      </View>

      {!applock && (
        <TouchableOpacity
          style={inputBoxStyles.container2}
          onPress={getCurrentLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" style={tw`bg-yellow-600`} />
          ) : (
            <Text style={[{ fontFamily: 'NunitoB', fontSize: 16, padding: 2, margin: 2 }]}>
              {currentLocationDescription || ' Click here to Use your Current Location'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const inputBoxStyles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginTop: 10,
    flex: 0,
  },
  container2: {
    backgroundColor: 'white',
    marginTop: 10,
    flex: 0,
    borderRadius: 20,
  },
  textInput: {
    fontSize: 15,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#00000050',
    borderRadius: 50,
    padding: 2,
    marginTop: 2,
    marginLeft: 1,
    marginRight: 1,
    fontFamily: 'NunitoR',
  },
  textInputContainer: {
    paddingBottom: 0,
  },
});

export default SearchBar;
