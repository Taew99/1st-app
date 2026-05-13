import React, { useCallback, useState } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useFeed } from '@/hooks/usePosts';
import { PostCard } from '@/components/feed/PostCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import type { PublicPost } from '@/types/database';

export default function FeedScreen() {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching,
  } = useFeed();

  const posts = data?.pages.flatMap((p) => p.data) ?? [];

  function handleQuote(post: PublicPost) {
    router.push({ pathname: '/post/quote', params: { postId: post.id } });
  }

  function handleReport(postId: string) {
    Alert.alert('신고하기', '이 게시물을 신고하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '신고',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('post_reports').insert({ post_id: postId, reason: null });
          Alert.alert('신고 완료', '신고가 접수되었습니다.');
        },
      },
    ]);
  }

  function handleBlock(userId: string) {
    Alert.alert('사용자 차단', '이 사용자를 차단하시겠습니까?\n차단한 사용자의 게시물은 더 이상 보이지 않습니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '차단',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('user_blocks').insert({ blocked_id: userId });
          refetch();
        },
      },
    ]);
  }

  const renderItem = useCallback(({ item }: { item: PublicPost }) => (
    <PostCard
      post={item}
      onQuote={handleQuote}
      onReport={handleReport}
      onBlock={handleBlock}
    />
  ), []);

  const keyExtractor = useCallback((item: PublicPost) => item.id, []);

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>✦ DailyShare</Text>
      </View>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#111" />
        }
        onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={isFetchingNextPage ? <LoadingSpinner /> : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✦</Text>
            <Text style={styles.emptyText}>아직 게시물이 없습니다.</Text>
            <Text style={styles.emptySubText}>첫 번째 게시물을 작성해보세요!</Text>
          </View>
        }
        contentContainerStyle={posts.length === 0 ? styles.emptyFlex : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logo: { fontSize: 20, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  emptyFlex: { flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#333' },
  emptySubText: { fontSize: 13, color: '#aaa', marginTop: 6 },
});
