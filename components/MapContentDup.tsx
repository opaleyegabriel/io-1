
import React, { useEffect, useRef, useState } from 'react'
import MapViewDirections from 'react-native-maps-directions';
import MapView, { Marker } from 'react-native-maps';
import tw from 'twrnc';
import { useDispatch, useSelector } from 'react-redux';
import { selectDestination, selectOrigin, setTravelTimeInformation } from '@/store/ioSlices';
import { GOOGLE_MAPS_API_KEY } from '@/config';

const MapContent = ({ updateRouteData }) => {

    const mapRef=useRef<MapView>(null);
    const origin = useSelector(selectOrigin);
    const destination = useSelector(selectDestination);
    const dispatch = useDispatch();
    const [distance, setDistance] = useState(0);
    const [time, setTime] = useState(0);
 
    

    useEffect(() => {
      if (!origin?.location || !destination?.location || !mapRef.current) return;
      
      mapRef.current.fitToSuppliedMarkers(["origin", "destination"], {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }, [origin, destination]);




function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;  // Radius of the Earth in km
  const toRad = Math.PI / 180; // Conversion factor from degrees to radians

  // Convert degrees to radians
  const lat1Rad = lat1 * toRad;
  const lon1Rad = lon1 * toRad;
  const lat2Rad = lat2 * toRad;
  const lon2Rad = lon2 * toRad;

  // Differences in coordinates
  const deltaLat = lat2Rad - lat1Rad;
  const deltaLon = lon2Rad - lon1Rad;

  // Haversine formula
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance in kilometers
  const distance = R * c;

  return distance;  // Returns the distance in kilometers
}






useEffect(() => {
  if (!origin || !destination) return;  // Ensure both origin and destination are provided
  
  let originLat = origin?.location?.lat;
  let originLng = origin?.location.lng;

  let destinationLat =  destination?.location.lat;
  let destinationLng = destination?.location.lng;

  // Fetch travel time from OSRM API
  const getTravelTime = async () => {
    try {
      
      const data = ((haversine(originLat,originLng,destinationLat,destinationLng))/1.609);
      
      const speed =15;
      const datatime = ((data/speed) *60).toFixed(0);
       let distanceValue = data.toFixed(2);
     
        // Dispatch your data to Redux or any other state management tool
        dispatch(setTravelTimeInformation({ distance: distanceValue, duration: datatime }));

        // Update route data as per your logic
        updateRouteData(distanceValue, datatime);
     
    } catch (error) {
      //console.error("Error fetching travel time data", error);
    }
  };

  // Call the function to fetch travel time
  getTravelTime();

}, [origin, destination]); // Dependency array to trigger on change of origin or destination


    
  return (
    <MapView
    ref={mapRef}
    style={tw`flex-1`}
    scrollEnabled={true}
    zoomEnabled={true}
    pitchEnabled={true}
    rotateEnabled={true}
    scrollDuringRotateOrZoomEnabled={true}
     initialRegion={{
      latitude: origin?.location?.lat!,
      longitude: origin?.location?.lng!,
      latitudeDelta: 0.090,
      longitudeDelta: 0.090,
    }}
  >    
  
  {origin && destination && (
 
        <MapViewDirections 
        origin={{ latitude: origin?.location?.lat, longitude: origin?.location.lng }} 
        destination={{ latitude: destination?.location.lat, longitude: destination?.location.lng }}
        apikey={GOOGLE_MAPS_API_KEY}
        strokeWidth={3}
        strokeColor="black"
      />
    )}

    {origin?.location && (
    <Marker 
        coordinate={{
        latitude:origin?.location?.lat,
        longitude:origin?.location?.lng,
        }} 
        title="Origin"
        description={origin?.description}
        identifier='origin'
        />
      )}
      {destination?.location && (
    <Marker 
        coordinate={{
        latitude:destination?.location?.lat,
        longitude:destination?.location?.lng,
        }} 
        title="Destination"
        description={destination?.description}
        identifier='destination'
        />
      )}
  </MapView>
  );
};

export default MapContent
