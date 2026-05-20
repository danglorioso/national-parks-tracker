import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createPost } from '@/lib/api';

export default function CreateScreen() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [caption, setCaption] = useState('');
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });
    if (!result.canceled) setImages(prev => [...prev, ...result.assets].slice(0, 10));
  };

  const removeImage = (uri: string) => setImages(prev => prev.filter(i => i.uri !== uri));

  const onPost = async () => {
    if (!caption.trim() && images.length === 0) {
      Alert.alert('Add a caption or photo to post.');
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      // TODO: upload images via UploadThing before posting
      // For now, post caption only
      await createPost(token!, { caption: caption.trim() || undefined });
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      setCaption('');
      setImages([]);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <Text className="text-lg font-bold text-gray-900">New Post</Text>
        <TouchableOpacity
          onPress={onPost}
          disabled={loading}
          className="bg-brand-600 px-5 py-2 rounded-full"
        >
          {loading
            ? <ActivityIndicator color="white" size="small" />
            : <Text className="text-white font-semibold text-sm">Share</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <TextInput
          className="text-base text-gray-800 min-h-28 leading-6"
          placeholder="Share your adventure…"
          value={caption}
          onChangeText={setCaption}
          multiline
          autoFocus
          textAlignVertical="top"
        />

        {images.length > 0 && (
          <ScrollView horizontal className="mt-4 -mx-4 px-4" showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {images.map(img => (
                <View key={img.uri} className="relative">
                  <Image
                    source={{ uri: img.uri }}
                    style={{ width: 120, height: 120, borderRadius: 12 }}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    className="absolute top-1 right-1 bg-black/50 rounded-full w-6 h-6 items-center justify-center"
                    onPress={() => removeImage(img.uri)}
                  >
                    <Ionicons name="close" size={14} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        <TouchableOpacity
          className="flex-row items-center gap-2 mt-6 py-4 border-t border-gray-100"
          onPress={pickImages}
        >
          <Ionicons name="image-outline" size={22} color="#16a34a" />
          <Text className="text-brand-600 font-medium">Add Photos</Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-2 py-4 border-t border-gray-100 opacity-40">
          <Ionicons name="location-outline" size={22} color="#374151" />
          <Text className="text-gray-600 font-medium">Tag a Park</Text>
          <Text className="text-xs text-gray-400 ml-1">(coming soon)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
