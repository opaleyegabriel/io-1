// components/PolyLineFetcher.tsx
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface PolylineFetcherProps {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}

const PolylineFetcher = ({ originLat, originLng, destLat, destLng }: PolylineFetcherProps) => {
  const [coords, setCoords] = useState([]);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        if (data?.routes?.length > 0) {
          const routeCoords = data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => ({
            latitude: lat,
            longitude: lng,
          }));
          setCoords(routeCoords);
        }
      } catch (err) {
        console.error("Error fetching OSRM route:", err);
      }
    };

    fetchRoute();
  }, [originLat, originLng, destLat, destLng]);

  // Don't render anything on web
  if (Platform.OS === 'web') {
    return null;
  }

  // Only import and render Polyline on native platforms
  if (coords.length > 0) {
    const { Polyline } = require('react-native-maps');
    return (
      <Polyline
        coordinates={coords}
        strokeWidth={3}
        strokeColor="black"
      />
    );
  }

  return null;
};

export default PolylineFetcher;