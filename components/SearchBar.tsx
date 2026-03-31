import { View, Text, Alert, TouchableOpacity, ActivityIndicator, TextInput, FlatList, StyleSheet } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';
import { useDispatch } from 'react-redux';
import { setDestination, setOrigin } from '@/store/ioSlices';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';

const SearchBar = () => {
  const [applock, setApplock] = useState(false);
  const [appLockMessage, setAppLockMessage] = useState('');
  const [lockStatus, setLockStatus] = useState('');
  const [currentLocationDescription, setCurrentLocationDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const getAppMessage = () => {
    fetch(`https://hoog.ng/infiniteorder/api/Settings/readAppLock.php`)
      .then((res) => res.json())
      .then((result) => {
        if (Array.isArray(result) && result.length > 0) {
          setAppLockMessage(result[0].lockmessage);
          setLockStatus(result[0].applock);
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

      const reverseGeocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
      const response = await fetch(reverseGeocodeUrl);
      const data = await response.json();

      if (data && data.display_name) {
        const formattedAddress = data.display_name;
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
//      Alert.alert('Error', 'Unable to fetch your current location. Please try manually.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dispatch(setOrigin(null));
    getAppMessage();
    const intervalId = setInterval(() => getAppMessage(), 10000);
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
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>{appLockMessage}</Text>
      )}

      <View style={tw`flex-row pt-2`}>
        <Text style={[tw`pt-5 pb-0 text-xl`, { fontFamily: 'KalamB', fontSize: 30, fontWeight: 'bold' }]}>Select </Text>
        <Text style={[tw`pt-3 text-xl`, { fontFamily: 'SacR', fontSize: 25 }]}>Where from :-</Text>
      </View>

      <OSMPlacesAutocomplete
        applock={applock}
        inputBoxStyles={inputBoxStyles}
        handleLockState={handleLockState}
        onPlaceSelected={({ location, description }) => {
          dispatch(setOrigin({ location, description }));
          dispatch(setDestination(null));
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
            <Text style={[{ fontFamily: 'NunitoB', fontSize: 16, padding: 2, margin: 2 }]}> {currentLocationDescription || ' Click here to Use your Current Location'} </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const OSMPlacesAutocomplete = ({ onPlaceSelected, applock, inputBoxStyles, handleLockState }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const debounceRef = useRef(null);

  const fetchSuggestions = async (text) => {
    if (text.length < 2) return setResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
  text + ', Kwara State, Nigeria'
)}&format=json&addressdetails=1&limit=7`;
      const res = await fetch(url);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('OSM Error:', err);
    }
  };

  const handleChange = (text) => {
    setQuery(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 500);
  };

  const handleSelect = (item) => {
    if (applock) return handleLockState();
    const location = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
    onPlaceSelected({ location, description: item.display_name });
    setQuery(item.display_name);
    setResults([]);
  };

  return (
    <View style={{ zIndex: 10 }}>
      <View style={{ position: 'relative' }}>
  <TextInput
    placeholder="Where From?"
    value={query}
    onChangeText={handleChange}
    editable={!applock}
    style={[styles.textInput, inputBoxStyles.textInput, { paddingRight: 35 }]}
  />
  {query.length > 0 && (
    <TouchableOpacity
      onPress={() => {
        setQuery('');
        setResults([]);
      }}
      style={{
        position: 'absolute',
        right: 10,
        top: 10,
        zIndex: 20,
      }}
    >
      <Ionicons name="close-circle" size={20} color="gray" />
    </TouchableOpacity>
  )}
</View>

      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.place_id.toString()}
          style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#ccc', maxHeight: 300, borderRadius: 10, marginTop: 2 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSelect(item)} style={{ padding: 10 }}>
              <Text numberOfLines={1}>{item.display_name}</Text>
            </TouchableOpacity>
          )}
        />
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
    fontSize: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#00000050',
    borderRadius: 50,
    padding: 4,
    marginTop: 2,
    marginLeft: 1,
    marginRight: 1,
    fontFamily: 'NunitoR',
  },
  textInputContainer: {
    paddingBottom: 0,
  },
});

const styles = StyleSheet.create({
  textInput: {
    padding: 10,
    fontSize: 15,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 50,
  },
});

export default SearchBar;
