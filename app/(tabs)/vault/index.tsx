import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { usePrivateEntries } from '@/hooks/usePrivateEntries';
import { EntryCard } from '@/components/vault/EntryCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { PrivateEntry } from '@/types/database';

export default function VaultScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: entries, isLoading, refetch, isRefetching } = usePrivateEntries(searchQuery);

  function renderItem({ item }: { item: PrivateEntry }) {
    return (
      <EntryCard
        entry={item}
        onPress={() => router.push({ pathname: '/(tabs)/vault/[id]', params: { id: item.id } })}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>내 저장소</Text>
        <Text style={styles.subtitle}>개인 기록은 나만 볼 수 있습니다</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="기록 검색..."
          placeholderTextColor="#bbb"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🗄️</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? '검색 결과가 없습니다' : '아직 기록이 없습니다'}
              </Text>
              {!searchQuery && (
                <Text style={styles.emptySubText}>Write 탭에서 첫 번째 기록을 남겨보세요</Text>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: '#aaa', marginTop: 3 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: '#111' },
  clearBtn: { fontSize: 13, color: '#bbb', padding: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 4, gap: 10 },
  separator: { height: 0 },
  empty: { paddingTop: 60, alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#555' },
  emptySubText: { fontSize: 12, color: '#aaa' },
});
