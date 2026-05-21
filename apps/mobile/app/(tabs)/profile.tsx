import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getOwnProfile, getVisits, getBadges } from '@/lib/api';

export default function ProfileScreen() {
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => { const t = await getToken(); return getOwnProfile(t!); },
  });

  const { data: visits } = useQuery({
    queryKey: ['visits'],
    queryFn: async () => { const t = await getToken(); return getVisits(t!); },
  });

  const { data: badgesData } = useQuery({
    queryKey: ['badges'],
    queryFn: async () => { const t = await getToken(); return getBadges(t!); },
  });

  const visitList = Array.isArray(visits) ? visits : [];
  const parksVisited = visitList.filter(v => !v.is_bucket_list).length;
  const bucketList = visitList.filter(v => v.is_bucket_list).length;
  const earnedBadges = Array.isArray(badgesData?.badges) ? badgesData.badges.filter(b => b.earned) : [];
  const avatarUri = profile?.avatar_url ?? user?.imageUrl;
  const displayName = profile?.display_name ?? user?.fullName ?? profile?.username ?? 'You';

  if (profileLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <Text className="text-lg font-bold text-gray-900">Profile</Text>
        <TouchableOpacity onPress={() => signOut().then(() => router.replace('/(auth)/sign-in'))}>
          <Ionicons name="log-out-outline" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {/* Avatar + name */}
        <View className="items-center pt-8 pb-6 px-6">
          <View className="w-24 h-24 rounded-full bg-brand-100 items-center justify-center mb-4 overflow-hidden">
            {avatarUri
              ? <Image source={{ uri: avatarUri }} style={{ width: 96, height: 96 }} contentFit="cover" />
              : <Text className="text-brand-700 font-bold text-3xl">{displayName[0]?.toUpperCase()}</Text>}
          </View>
          <Text className="text-xl font-bold text-gray-900">{displayName}</Text>
          {profile?.username && (
            <Text className="text-gray-400 text-sm mt-0.5">@{profile.username}</Text>
          )}
          {profile?.bio && (
            <Text className="text-gray-600 text-sm text-center mt-2 leading-5">{profile.bio}</Text>
          )}
        </View>

        {/* Stats */}
        <View className="flex-row border-t border-b border-gray-100 mx-0">
          {[
            { label: 'Visited', value: parksVisited },
            { label: 'Bucket List', value: bucketList },
            { label: 'Badges', value: earnedBadges.length },
          ].map(({ label, value }) => (
            <View key={label} className="flex-1 items-center py-4">
              <Text className="text-2xl font-bold text-gray-900">{value}</Text>
              <Text className="text-xs text-gray-400 mt-0.5">{label}</Text>
            </View>
          ))}
        </View>

        {/* Recent badges */}
        {earnedBadges.length > 0 && (
          <View className="px-4 pt-5">
            <Text className="text-base font-semibold text-gray-900 mb-3">Badges</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3">
                {earnedBadges.map(badge => (
                  <View key={badge.id} className="items-center w-20">
                    <View className="w-14 h-14 rounded-full bg-brand-50 items-center justify-center mb-1">
                      <Text className="text-2xl">{badge.emoji}</Text>
                    </View>
                    <Text className="text-xs text-gray-600 text-center" numberOfLines={2}>{badge.name}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Recent visits */}
        {visitList.filter(v => !v.is_bucket_list).length > 0 && (
          <View className="px-4 pt-5 pb-8">
            <Text className="text-base font-semibold text-gray-900 mb-3">Recent Parks</Text>
            <View className="gap-2">
              {visitList
                .filter(v => !v.is_bucket_list)
                .slice(0, 5)
                .map(v => (
                  <View key={v.park_code} className="flex-row items-center gap-3 py-2">
                    <View className="w-8 h-8 rounded-full bg-brand-100 items-center justify-center">
                      <Text className="text-sm">🌲</Text>
                    </View>
                    <Text className="text-sm text-gray-800 font-medium">{v.park_code}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
