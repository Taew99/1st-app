import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { usePrivateEntry, useDeleteEntry } from '@/hooks/usePrivateEntries';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/utils/date';

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: entry, isLoading } = usePrivateEntry(id ?? '');
  const deleteEntry = useDeleteEntry();

  function handleDelete() {
    Alert.alert('기록 삭제', '삭제하면 되돌릴 수 없습니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deleteEntry.mutateAsync(id!);
          router.back();
        },
      },
    ]);
  }

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!entry) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.errorText}>기록을 찾을 수 없습니다.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/vault/edit/[id]', params: { id } })}
            style={styles.actionBtn}
          >
            <Text style={styles.actionText}>수정</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
            <Text style={[styles.actionText, styles.deleteText]}>삭제</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.meta}>
          <View style={[styles.badge, entry.entry_type === 'question' && styles.badgeQuestion]}>
            <Text style={styles.badgeText}>{entry.entry_type === 'question' ? '질문' : '자유'}</Text>
          </View>
          <Text style={styles.date}>{formatDate(entry.updated_at)}</Text>
        </View>

        {entry.entry_type === 'question' && entry.question && (
          <View style={styles.questionBox}>
            <Text style={styles.questionLabel}>Q.</Text>
            <Text style={styles.questionText}>{entry.question.body}</Text>
          </View>
        )}

        {entry.title ? (
          <Text style={styles.title}>{entry.title}</Text>
        ) : null}

        <Text style={styles.body}>{entry.body}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 20, color: '#111' },
  headerActions: { flexDirection: 'row', gap: 16 },
  actionBtn: { padding: 4 },
  actionText: { fontSize: 14, color: '#555', fontWeight: '600' },
  deleteText: { color: '#ef4444' },
  content: { padding: 20, gap: 16 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: {
    backgroundColor: '#111',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeQuestion: { backgroundColor: '#6366f1' },
  badgeText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  date: { fontSize: 12, color: '#bbb' },
  questionBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#f5f5ff',
    padding: 14,
    borderRadius: 12,
  },
  questionLabel: { fontSize: 16, fontWeight: '800', color: '#6366f1' },
  questionText: { flex: 1, fontSize: 14, color: '#444', lineHeight: 21 },
  title: { fontSize: 20, fontWeight: '800', color: '#111', letterSpacing: -0.3 },
  body: { fontSize: 15, color: '#333', lineHeight: 24 },
  errorText: { padding: 20, fontSize: 15, color: '#888' },
});
