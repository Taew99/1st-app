import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { usePost, useCreatePost, useTodayPost } from '@/hooks/usePosts';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const MAX_BODY = 100;

export default function QuotePostScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { data: originalPost, isLoading: isLoadingPost } = usePost(postId ?? '');
  const { data: todayPost } = useTodayPost();
  const createPost = useCreatePost();

  const [body, setBody] = useState('');

  const hasPostedToday = !!todayPost;
  const remaining = MAX_BODY - body.length;

  async function handleSubmit() {
    if (hasPostedToday) {
      Alert.alert('작성 불가', '오늘은 이미 게시물을 작성했습니다.');
      return;
    }
    if (!body.trim()) {
      Alert.alert('내용 입력', '인용에 대한 생각을 입력해주세요.');
      return;
    }

    try {
      await createPost.mutateAsync({
        post_type: 'quote',
        body: body.trim(),
        quoted_post_id: postId,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('실패', err?.message ?? '다시 시도해주세요.');
    }
  }

  if (isLoadingPost) return <LoadingSpinner fullScreen />;
  if (!originalPost) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>게시물을 찾을 수 없습니다.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} disabled={createPost.isPending}>
            <Text style={styles.cancelBtn}>취소</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>인용하기</Text>
          <Button
            label="게시"
            onPress={handleSubmit}
            isLoading={createPost.isPending}
            disabled={!body.trim() || hasPostedToday}
            style={styles.submitBtn}
            textStyle={styles.submitBtnText}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {hasPostedToday && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>오늘은 이미 게시물을 작성했습니다. 내일 다시 인용할 수 있습니다.</Text>
            </View>
          )}

          {/* My thought */}
          <View style={styles.myThoughtSection}>
            <Text style={styles.sectionLabel}>내 생각 추가하기</Text>
            <TextInput
              style={styles.textInput}
              placeholder="이 게시물에 대한 생각을 100자 이내로 남겨보세요..."
              placeholderTextColor="#bbb"
              value={body}
              onChangeText={(t) => { if (t.length <= MAX_BODY) setBody(t); }}
              multiline
              maxLength={MAX_BODY}
              editable={!hasPostedToday}
            />
            <Text style={[styles.counter, remaining < 10 && styles.counterWarn]}>
              {remaining}
            </Text>
          </View>

          {/* Original post preview */}
          <View style={styles.originalSection}>
            <Text style={styles.sectionLabel}>원본 게시물</Text>
            <View style={styles.originalCard}>
              <View style={styles.originalHeader}>
                {originalPost.profile?.avatar_url ? (
                  <Image
                    source={{ uri: originalPost.profile.avatar_url }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder} />
                )}
                <Text style={styles.originalUsername}>
                  @{originalPost.profile?.username}
                </Text>
              </View>
              {originalPost.thumb_url && (
                <Image
                  source={{ uri: originalPost.thumb_url }}
                  style={styles.originalThumb}
                />
              )}
              {originalPost.body ? (
                <Text style={styles.originalBody}>{originalPost.body}</Text>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cancelBtn: { fontSize: 15, color: '#888' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  submitBtn: { height: 36, paddingHorizontal: 16, borderRadius: 8 },
  submitBtnText: { fontSize: 14 },
  body: { padding: 16, gap: 20 },
  warningBanner: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 10,
  },
  warningText: { fontSize: 13, color: '#856404' },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#aaa',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  myThoughtSection: { gap: 4 },
  textInput: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#222',
    lineHeight: 22,
    minHeight: 100,
  },
  counter: { alignSelf: 'flex-end', fontSize: 12, color: '#bbb' },
  counterWarn: { color: '#ef4444' },
  originalSection: {},
  originalCard: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    backgroundColor: '#fafafa',
  },
  originalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e8e8e8' },
  avatarPlaceholder: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e8e8e8' },
  originalUsername: { fontSize: 13, fontWeight: '600', color: '#555' },
  originalThumb: { width: '100%', height: 160, borderRadius: 10, resizeMode: 'cover' },
  originalBody: { fontSize: 14, color: '#444', lineHeight: 20 },
  errorText: { padding: 20, fontSize: 15, color: '#888' },
});
