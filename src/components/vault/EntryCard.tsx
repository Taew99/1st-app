import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { PrivateEntry } from '../../types/database';
import { formatDate } from '../../utils/date';

interface EntryCardProps {
  entry: PrivateEntry;
  onPress: () => void;
}

export function EntryCard({ entry, onPress }: EntryCardProps) {
  const preview = entry.body.slice(0, 120);
  const isQuestion = entry.entry_type === 'question';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.topRow}>
        <View style={[styles.typeBadge, isQuestion && styles.typeBadgeQuestion]}>
          <Text style={[styles.typeText, isQuestion && styles.typeTextQuestion]}>
            {isQuestion ? '질문' : '자유'}
          </Text>
        </View>
        <Text style={styles.date}>{formatDate(entry.updated_at)}</Text>
      </View>
      {entry.title ? (
        <Text style={styles.title} numberOfLines={1}>{entry.title}</Text>
      ) : null}
      <Text style={styles.preview} numberOfLines={3}>
        {preview}{entry.body.length > 120 ? '…' : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    backgroundColor: '#111',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  typeBadgeQuestion: { backgroundColor: '#6366f1' },
  typeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  typeTextQuestion: { color: '#fff' },
  date: { fontSize: 11, color: '#bbb' },
  title: { fontSize: 15, fontWeight: '700', color: '#111' },
  preview: { fontSize: 13, color: '#666', lineHeight: 19 },
});
