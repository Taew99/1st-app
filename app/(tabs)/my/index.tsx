import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Image,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { usePrivateEntries } from '@/hooks/usePrivateEntries';
import { useTodayPost } from '@/hooks/usePosts';

function MenuItem({
  icon,
  label,
  onPress,
  danger = false,
  right,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
  danger?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {right ?? <Text style={styles.menuArrow}>›</Text>}
    </TouchableOpacity>
  );
}

export default function MyScreen() {
  const { profile, reset } = useAuthStore();
  const { data: entries } = usePrivateEntries();
  const { data: todayPost } = useTodayPost();

  async function handleSignOut() {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          reset();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {(profile?.display_name ?? profile?.username ?? '?')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>{profile?.display_name ?? profile?.username}</Text>
            <Text style={styles.username}>@{profile?.username}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{entries?.length ?? 0}</Text>
            <Text style={styles.statLabel}>개인 기록</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{todayPost ? '완료' : '미작성'}</Text>
            <Text style={styles.statLabel}>오늘 게시물</Text>
          </View>
        </View>

        {/* Menu: 기록 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기록</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="🗄️"
              label="내 저장소"
              onPress={() => router.push('/(tabs)/vault')}
            />
            <MenuItem
              icon="❓"
              label="질문 카테고리 설정"
              onPress={() => router.push('/question/categories')}
            />
          </View>
        </View>

        {/* Menu: 계정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="🚪"
              label="로그아웃"
              onPress={handleSignOut}
              danger
              right={<View style={{ width: 16 }} />}
            />
          </View>
        </View>

        <Text style={styles.versionText}>DailyShare v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, gap: 24, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fafafa',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#e8e8e8' },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { fontSize: 24, color: '#fff', fontWeight: '700' },
  profileInfo: { flex: 1 },
  displayName: { fontSize: 18, fontWeight: '800', color: '#111' },
  username: { fontSize: 13, color: '#aaa', marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#111' },
  statLabel: { fontSize: 11, color: '#aaa', marginTop: 3 },
  statDivider: { width: 1, backgroundColor: '#eee' },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#bbb',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  menuGroup: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    gap: 12,
  },
  menuIcon: { fontSize: 18, width: 26 },
  menuLabel: { flex: 1, fontSize: 14, color: '#222' },
  menuLabelDanger: { color: '#ef4444' },
  menuArrow: { fontSize: 18, color: '#ddd' },
  versionText: { textAlign: 'center', fontSize: 11, color: '#ddd', marginTop: 8 },
});
