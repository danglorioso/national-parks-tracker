import { useCallback, useState } from 'react';
import { FlatList, View, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { useInfiniteQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PostCard } from '@/components/PostCard';
import { getFeed, likePost, unlikePost } from '@/lib/api';
import type { EnrichedPost } from '@parkquest/types';

export default function FeedScreen() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching } =
    useInfiniteQuery({
      queryKey: ['feed'],
      queryFn: async ({ pageParam = 0 }) => {
        const token = await getToken();
        return getFeed(token!, pageParam as number);
      },
      getNextPageParam: (lastPage, pages) =>
        lastPage.length === 20 ? pages.length * 20 : undefined,
      initialPageParam: 0,
    });

  const posts = data?.pages.flat() ?? [];

  const likeMutation = useMutation({
    mutationFn: async ({ postId, liked }: { postId: number; liked: boolean }) => {
      const token = await getToken();
      return liked ? unlikePost(token!, postId) : likePost(token!, postId);
    },
    onMutate: async ({ postId, liked }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      queryClient.setQueryData(['feed'], (old: typeof data) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(page =>
            page.map(p =>
              p.id === postId
                ? { ...p, liked_by_me: !liked, like_count: liked ? p.like_count - 1 : p.like_count + 1 }
                : p
            )
          ),
        };
      });
    },
  });

  const renderPost = useCallback(({ item }: { item: EnrichedPost }) => (
    <PostCard
      post={item}
      onLike={() => likeMutation.mutate({ postId: item.id, liked: item.liked_by_me })}
      onComment={() => {}}
    />
  ), [likeMutation]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-brand-700">ParkQuest</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => String(item.id)}
        renderItem={renderPost}
        contentContainerStyle={posts.length === 0 ? { flex: 1 } : undefined}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" />}
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator className="py-4" color="#16a34a" /> : null}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center gap-3 pb-20">
            <Text className="text-5xl">🏕️</Text>
            <Text className="text-gray-500 text-center text-base">
              No posts yet.{'\n'}Follow adventurers to see their journeys.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
