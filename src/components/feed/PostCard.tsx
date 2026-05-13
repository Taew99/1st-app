import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import type { PublicPost } from '../../types/database';
import { formatRelative } from '../../utils/date';
import { useAuthStore } from '../../stores/authStore';
import { useDeletePost } from '../../hooks/usePosts';

interface PostCardProps {
  post: PublicPost;
  onQuote?: (post: PublicPost) => void;
  onReport?: (postId: string) => void;
  onBlock?: (userId: string) => void;
}

function Avatar({ uri, size = 36 }: { uri?: string | null; size?: number }) {
  return uri ? (
    <Image source={{ uri }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />
  ) : (
    <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]} />
  );
}

function QuotedPostSnippet({ post }: { post: PublicPost }) {
  return (
    <View style={styles.quotedContainer}>
      <View style={styles.quotedHeader}>
        <Avatar uri={post.profile?.avatar_url} size={20} />
        <Text style={styles.quotedUsername}>@{post.profile?.username}</Text>
      </View>
      {post.thumb_url && (
        <Image source={{ uri: post.thumb_url }} style={styles.quotedThumb} />
      )}
      {post.body ? <Text style={styles.quotedBody} numberOfLines={2}>{post.body}</Text> : null}
    </View>
  );
}

export function PostCard({ post, onQuote, onReport, onBlock }: PostCardProps) {
  const { user } = useAuthStore();
  const isOwner = user?.id === post.user_id;
  const deletePost = useDeletePost();
  const [imageAspect, setImageAspect] = useState(1);

  function showMenu() {
    if (Platform.OS === 'ios') {
      const options = isOwner
        ? ['삭제', '취소']
        : ['인용하기', '신고하기', '차단하기', '취소'];
      const destructiveIndex = isOwner ? 0 : 1;
      const cancelIndex = isOwner ? 1 : 3;

      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: destructiveIndex, cancelButtonIndex: cancelIndex },
        (idx) => {
          if (isOwner) {
            if (idx === 0) confirmDelete();
          } else {
            if (idx === 0) onQuote?.(post);
            if (idx === 1) onReport?.(post.id);
            if (idx === 2) onBlock?.(post.user_id);
          }
        },
      );
    } else {
      if (isOwner) {
        Alert.alert('게시물 관리', '', [
          { text: '삭제', style: 'destructive', onPress: confirmDelete },
          { text: '취소', style: 'cancel' },
        ]);
      } else {
        Alert.alert('', '', [
          { text: '인용하기', onPress: () => onQuote?.(post) },
          { text: '신고하기', style: 'destructive', onPress: () => onReport?.(post.id) },
          { text: '차단하기', style: 'destructive', onPress: () => onBlock?.(post.user_id) },
          { text: '취소', style: 'cancel' },
        ]);
      }
    }
  }

  function confirmDelete() {
    Alert.alert('게시물 삭제', '삭제하면 되돌릴 수 없습니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => deletePost.mutate(post.id),
      },
    ]);
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.userRow} onPress={() => {}}>
          <Avatar uri={post.profile?.avatar_url} />
          <View style={styles.userInfo}>
            <Text style={styles.displayName}>{post.profile?.display_name ?? post.profile?.username}</Text>
            <Text style={styles.username}>@{post.profile?.username} · {formatRelative(post.created_at)}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBtn} onPress={showMenu} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.menuDots}>···</Text>
        </TouchableOpacity>
      </View>

      {/* Quoted post reference */}
      {post.post_type === 'quote' && post.quoted_post && (
        <QuotedPostSnippet post={post.quoted_post as PublicPost} />
      )}

      {/* Body */}
      {post.body ? <Text style={styles.body}>{post.body}</Text> : null}

      {/* Image (original posts) */}
      {post.image_url && (
        <Image
          source={{ uri: post.image_url }}
          style={[styles.image, { aspectRatio: imageAspect }]}
          resizeMode="cover"
          onLoad={(e) => {
            const { width, height } = e.nativeEvent.source;
            if (height > 0) setImageAspect(width / height);
          }}
        />
      )}

      {/* Quote action for others */}
      {!isOwner && post.post_type === 'original' && (
        <TouchableOpacity
          style={styles.quoteBtn}
          onPress={() => onQuote?.(post)}
        >
          <Text style={styles.quoteBtnText}>↩ 인용하기</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { backgroundColor: '#e8e8e8' },
  avatarPlaceholder: { backgroundColor: '#e8e8e8' },
  userInfo: { marginLeft: 10, flex: 1 },
  displayName: { fontSize: 14, fontWeight: '700', color: '#111' },
  username: { fontSize: 12, color: '#aaa', marginTop: 1 },
  menuBtn: { paddingLeft: 8 },
  menuDots: { fontSize: 18, color: '#ccc', letterSpacing: 1 },
  quotedContainer: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fafafa',
    gap: 6,
  },
  quotedHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  quotedUsername: { fontSize: 12, color: '#888', fontWeight: '600' },
  quotedThumb: { width: '100%', height: 100, borderRadius: 6, resizeMode: 'cover' },
  quotedBody: { fontSize: 13, color: '#555', lineHeight: 18 },
  body: {
    fontSize: 15,
    color: '#222',
    lineHeight: 22,
    marginBottom: 10,
  },
  image: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  quoteBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  quoteBtnText: { fontSize: 13, color: '#888' },
});
