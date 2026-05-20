import { useRef } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, Region, PROVIDER_DEFAULT } from 'react-native-maps';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getParks, getVisits } from '@/lib/api';
import type { Park } from '@parkquest/types';

const US_REGION: Region = {
  latitude: 39.5,
  longitude: -98.35,
  latitudeDelta: 35,
  longitudeDelta: 55,
};

function markerColor(status: string) {
  if (status === 'visited') return '#16a34a';
  if (status === 'bucket_list') return '#f59e0b';
  return '#6b7280';
}

export default function MapScreen() {
  const { getToken } = useAuth();
  const mapRef = useRef<MapView>(null);

  const { data: parks, isLoading: parksLoading } = useQuery({
    queryKey: ['parks'],
    queryFn: async () => { const t = await getToken(); return getParks(t); },
    staleTime: Infinity,
  });

  const { data: visits } = useQuery({
    queryKey: ['visits'],
    queryFn: async () => { const t = await getToken(); return getVisits(t!); },
  });

  const visitMap = new Map(visits?.map(v => [v.park_code, v]));

  const markers = (parks ?? []).filter(p => p.latitude && p.longitude);

  if (parksLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        initialRegion={US_REGION}
        showsUserLocation
        showsMyLocationButton
      >
        {markers.map(park => {
          const visit = visitMap.get(park.park_code);
          const status = visit?.is_bucket_list ? 'bucket_list' : visit ? 'visited' : 'unvisited';
          return (
            <Marker
              key={park.park_code}
              coordinate={{
                latitude: parseFloat(park.latitude!),
                longitude: parseFloat(park.longitude!),
              }}
              title={park.name}
              description={park.states}
              pinColor={markerColor(status)}
            />
          );
        })}
      </MapView>

      {/* Legend */}
      <View className="absolute bottom-8 left-4 right-4 bg-white/90 rounded-2xl p-3 flex-row justify-around">
        {[
          { color: '#16a34a', label: 'Visited' },
          { color: '#f59e0b', label: 'Bucket List' },
          { color: '#6b7280', label: 'Unvisited' },
        ].map(({ color, label }) => (
          <View key={label} className="flex-row items-center gap-1.5">
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
            <Text className="text-xs text-gray-700">{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
