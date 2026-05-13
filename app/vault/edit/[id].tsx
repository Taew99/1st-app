import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { usePrivateEntry, useUpdateEntry } from '@/hooks/usePrivateEntries';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const MIN_BODY = 200;

export default function EditEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: entry, isLoading } = usePrivateEntry(id ?? '');
  const updateEntry = useUpdateEntry();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (entry) {
      setTitle(entry.title ?? '');
      setBody(entry.body);
    }
  }, [entry]);

  const remaining = MIN_BODY - body.length;
  const isReady = body.length >= MIN_BODY;

  async function handleSave() {
    if (!isReady) {
      Alert.alert('내용 부족', `최소 ${MIN_BODY}자 이상 작성해주세요.`);
      return;
    }
    try {
      await updateEntry.mutateAsync({ id: id!, title: title.trim() || undefined, body: body.trim() });
      router.back();
    } catch (err: any) {
      Alert.alert('저장 실패', err?.message ?? '다시 시도해주세요.');
    }
  }

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} disabled={updateEntry.isPending}>
            <Text style={styles.cancelBtn}>취소</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>수정하기</Text>
          <Button
            label="저장"
            onPress={handleSave}
            isLoading={updateEntry.isPending}
            disabled={!isReady}
            style={styles.submitBtn}
            textStyle={styles.submitBtnText}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            style={styles.titleInput}
            placeholder="제목 (선택)"
            placeholderTextColor="#ccc"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <View style={styles.divider} />
          <TextInput
            style={styles.bodyInput}
            placeholder={`최소 ${MIN_BODY}자 이상`}
            placeholderTextColor="#ccc"
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.counter}>
            {remaining > 0 ? (
              <Text style={styles.counterText}>최소 {remaining}자 더 필요합니다</Text>
            ) : (
              <Text style={[styles.counterText, styles.counterOk]}>✓ {body.length}자</Text>
            )}
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
  content: { padding: 20, flexGrow: 1 },
  titleInput: { fontSize: 20, fontWeight: '700', color: '#111', paddingVertical: 8, minHeight: 44 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
  bodyInput: { fontSize: 15, color: '#333', lineHeight: 24, minHeight: 300 },
  counter: { marginTop: 16, alignItems: 'flex-end' },
  counterText: { fontSize: 12, color: '#bbb' },
  counterOk: { color: '#22c55e', fontWeight: '600' },
});
