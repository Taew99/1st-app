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
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCreatePost } from '@/hooks/usePosts';
import { preparePostImages, uploadPostImages } from '@/lib/imageUpload';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import crypto from 'expo-crypto';

const MAX_BODY = 100;

export default function CreatePostScreen() {
  const { user } = useAuthStore();
  const createPost = useCreatePost();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    if (!imageUri) {
      Alert.alert('사진 필요', '사진을 선택해주세요.');
      return;
    }
    if (!user) return;

    setIsUploading(true);
    try {
      const postId = crypto.randomUUID();
      const { fullUri, thumbUri } = await preparePostImages(imageUri);
      const { imageUrl, thumbUrl } = await uploadPostImages(user.id, postId, fullUri, thumbUri);

      await createPost.mutateAsync({
        post_type: 'original',
        body: body.trim() || undefined,
        image_url: imageUrl,
        thumb_url: thumbUrl,
      });

      router.back();
    } catch (err: any) {
      Alert.alert('업로드 실패', err?.message ?? '다시 시도해주세요.');
    } finally {
      setIsUploading(false);
    }
  }

  const isLoading = isUploading || createPost.isPending;
  const remaining = MAX_BODY - body.length;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} disabled={isLoading}>
            <Text style={styles.cancelBtn}>취소</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>오늘의 게시물</Text>
          <Button
            label="게시"
            onPress={handleSubmit}
            isLoading={isLoading}
            disabled={!imageUri}
            style={styles.submitBtn}
            textStyle={styles.submitBtnText}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image picker */}
          <TouchableOpacity
            style={[styles.imagePicker, imageUri && styles.imagePickerFilled]}
            onPress={pickImage}
            disabled={isLoading}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderIcon}>📷</Text>
                <Text style={styles.imagePlaceholderText}>사진 선택 (필수)</Text>
                <Text style={styles.imagePlaceholderSub}>게시물에는 사진 1장이 필요합니다</Text>
              </View>
            )}
          </TouchableOpacity>

          {imageUri && (
            <TouchableOpacity style={styles.changeImageBtn} onPress={pickImage} disabled={isLoading}>
              <Text style={styles.changeImageText}>사진 변경</Text>
            </TouchableOpacity>
          )}

          {/* Body input */}
          <View style={styles.textSection}>
            <TextInput
              style={styles.textInput}
              placeholder="오늘 하루를 한 줄로 남겨보세요 (선택)"
              placeholderTextColor="#bbb"
              value={body}
              onChangeText={(t) => { if (t.length <= MAX_BODY) setBody(t); }}
              multiline
              maxLength={MAX_BODY}
            />
            <Text style={[styles.counter, remaining < 10 && styles.counterWarn]}>
              {remaining}
            </Text>
          </View>
        </ScrollView>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <LoadingSpinner />
            <Text style={styles.loadingText}>업로드 중...</Text>
          </View>
        )}
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
  body: { padding: 16, gap: 12 },
  imagePicker: {
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
    borderRadius: 14,
    overflow: 'hidden',
  },
  imagePickerFilled: { borderStyle: 'solid', borderColor: '#e0e0e0' },
  previewImage: { width: '100%', aspectRatio: 1, resizeMode: 'cover' },
  imagePlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imagePlaceholderIcon: { fontSize: 36 },
  imagePlaceholderText: { fontSize: 15, fontWeight: '600', color: '#555' },
  imagePlaceholderSub: { fontSize: 12, color: '#bbb' },
  changeImageBtn: { alignSelf: 'center' },
  changeImageText: { fontSize: 13, color: '#888', textDecorationLine: 'underline' },
  textSection: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  textInput: {
    fontSize: 15,
    color: '#222',
    lineHeight: 22,
    minHeight: 60,
  },
  counter: { alignSelf: 'flex-end', fontSize: 12, color: '#bbb' },
  counterWarn: { color: '#ef4444' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14, color: '#555' },
});
