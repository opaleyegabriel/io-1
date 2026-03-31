import React, { useEffect, useRef, useState } from 'react';
import MapView, { Marker, Polyline } from 'react-native-maps';
import tw from 'twrnc';
import { useDispatch, useSelector } from 'react-redux';
import { selectDestination, selectOrigin, setTravelTimeInformation } from '@/store/ioSlices';

const MapContent = ({ updateRouteData }) => {
  const mapRef = useRef<MapView>(null);
  const origin = useSelector(selectOrigin);
  const destination = useSelector(selectDestination);
  const dispatch = useDispatch();
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(0);
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!origin?.location || !destination?.location || !mapRef.current) return;

    mapRef.current.fitToSuppliedMarkers(["origin", "destination"], {
      edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
      animated: true,
    });
  }, [origin, destination]);

  const decodePolyline = (polyline) => {
    let points = [];
    let index = 0, len = polyline.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  const getRouteFromOSRM = async () => {
    const originCoords = `${origin.location.lng},${origin.location.lat}`;
    const destinationCoords = `${destination.location.lng},${destination.location.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${originCoords};${destinationCoords}?overview=full&geometries=polyline&steps=false`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.code === 'Ok') {
        const geometry = data.routes[0].geometry;
        const decodedCoords = decodePolyline(geometry);

        const distanceKm = data.routes[0].distance / 1000;
        const durationMin = data.routes[0].duration / 60;

        dispatch(setTravelTimeInformation({
          distance: distanceKm.toFixed(2),
          duration: Math.round(durationMin),
        }));

        updateRouteData(distanceKm.toFixed(2), Math.round(durationMin));
        setRouteCoords(decodedCoords);
      }
    } catch (err) {
      console.warn('Failed to fetch OSRM route:', err);
    }
  };

  useEffect(() => {
    if (origin?.location && destination?.location) {
      getRouteFromOSRM();
    }
  }, [origin, destination]);

  return (
    <MapView
      ref={mapRef}
      style={tw`flex-1`}
      scrollEnabled
      zoomEnabled
      pitchEnabled
      rotateEnabled
      scrollDuringRotateOrZoomEnabled
      initialRegion={{
        latitude: origin?.location?.lat || 8.5,
        longitude: origin?.location?.lng || 4.5,
        latitudeDelta: 0.09,
        longitudeDelta: 0.09,
      }}
    >
      {routeCoords.length > 0 && (
        <Polyline
          coordinates={routeCoords}
          strokeWidth={4}
          strokeColor="black"
        />
      )}

      {origin?.location && (
        <Marker
          coordinate={{
            latitude: origin.location.lat,
            longitude: origin.location.lng,
          }}
          title="Origin"
          description={origin.description}
          identifier="origin"
        />
      )}

      {destination?.location && (
        <Marker
          coordinate={{
            latitude: destination.location.lat,
            longitude: destination.location.lng,
          }}
          title="Destination"
          description={destination.description}
          identifier="destination"
        />
      )}
    </MapView>
  );
};

export default MapContent;
