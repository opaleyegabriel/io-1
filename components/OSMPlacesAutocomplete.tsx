import React, { useState, useRef } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { setDestination } from '@/store/ioSlices';
import tw from 'twrnc';

const OSMPlacesAutocomplete = ({ Origin, setDistance, setCost }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const debounceRef = useRef(null);
  const dispatch = useDispatch();

  const fetchSuggestions = async (text) => {
    if (text.length < 2) return setResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        text + ', Kwara State, Nigeria'
      )}&format=json&addressdetails=1&limit=10`;
      const res = await fetch(url);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('OSM Error:', err);
    }
  };

  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const toRad = (deg) => deg * (Math.PI / 180);
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const handleSelect = (item) => {
    const location = {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    };

    dispatch(
      setDestination({
        location,
        description: item.display_name,
      })
    );

    setQuery(item.display_name);
    setResults([]);

    if (Origin?.location && location) {
      const distanceInKm = haversine(
        Origin.location.lat,
        Origin.location.lng,
        location.lat,
        location.lng
      );

      let calculatedCost = 1500; // default flat rate for 0–5 km
      if (distanceInKm > 5) {
        const extraKm = Math.ceil(distanceInKm - 5);
        calculatedCost += extraKm * 300;
      }

      setDistance(distanceInKm.toFixed(2));
      setCost(calculatedCost);
    }
  };

  const handleChange = (text) => {
    setQuery(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 500);
  };

  return (
    <View style={tw`mt-2`}>
      <TextInput
        placeholder="Deliver To"
        value={query}
        onChangeText={handleChange}
        style={styles.textInput}
      />
      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.place_id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelect(item)}
              style={styles.listItem}
            >
              <Text numberOfLines={1}>{item.display_name}</Text>
            </TouchableOpacity>
          )}
          style={styles.dropdown}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  textInput: {
    fontSize: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  listItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  dropdown: {
    borderRadius: 10,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    maxHeight: 200,
  },
});

export default OSMPlacesAutocomplete;
