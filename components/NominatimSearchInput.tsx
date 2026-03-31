import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { setDestination } from '@/store/ioSlices';
import { Ionicons } from '@expo/vector-icons';

const inputBoxStyles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginTop: 10,
    flex: 0,
  },
  textInput: {
    fontSize: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#00000050',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  textInputContainer: {
    paddingBottom: 0,
  },
});

const NominatimSearchInput = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 2) {
        fetchSuggestions(query);
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const fetchSuggestions = async (text) => {
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
  text + ', Kwara State, Nigeria'
)}&format=json&addressdetails=1&limit=7`;

      const response = await fetch(url);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Nominatim error:', error);
      setResults([]);
    }
    setLoading(false);
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
  };

  return (
    <View style={inputBoxStyles.container}>
      <View style={{ position: 'relative' }}>
  <TextInput
    value={query}
    onChangeText={setQuery}
    placeholder="Where to?"
    style={[inputBoxStyles.textInput, { paddingRight: 35 }]}
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

      {loading && <ActivityIndicator size="small" color="#000" style={{ marginTop: 5 }} />}
      <FlatList
        data={results}
        keyExtractor={(item) => item.place_id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleSelect(item)} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <Text>{item.display_name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default NominatimSearchInput;
