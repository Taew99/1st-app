import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useTodayPost } from '@/hooks/usePosts';

interface ActionCardProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  disabled?: boolean;
  badge?: string;
}

function ActionCard({ icon, title, description, onPress, disabled, badge }: ActionCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, disabled && styles.cardDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.cardIcon}>
        <Text style={styles.cardIconText}>{icon}</Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, disabled && styles.cardTitleDisabled]}>{title}</Text>
          {badge && <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>}
        </View>
        <Text style={[styles.cardDesc, disabled && styles.cardDescDisabled]}>{description}</Text>
      </View>
      {!disabled && <Text style={styles.arrow}>›</Text>}
    </TouchableOpacity>
  );
}

export default function WriteScreen() {
  const { data: todayPost } = useTodayPost();
  const hasPostedToday = !!todayPost;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>기록하기</Text>
        <Text style={styles.subtitle}>오늘 무엇을 남기시겠어요?</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>공개</Text>
        <ActionCard
          icon="📸"
          title="오늘의 공개 게시물"
          description={hasPostedToday ? '오늘 이미 게시물을 작성했습니다' : '사진 1장과 100자 이내 글을 공유해요'}
          onPress={() => router.push('/post/create')}
          disabled={hasPostedToday}
          badge={hasPostedToday ? '완료' : undefined}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>개인</Text>
        <ActionCard
          icon="📝"
          title="자유 기록"
          description="200자 이상의 생각을 자유롭게 저장해요"
          onPress={() => router.push('/vault/create')}
        />
        <ActionCard
          icon="❓"
          title="오늘의 질문"
          description="매일 새로운 질문에 답변을 남겨요"
          onPress={() => router.push('/question/today')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#aaa', marginTop: 4 },
  section: { paddingTop: 20, paddingHorizontal: 16, gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#bbb',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardDisabled: { opacity: 0.5 },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardIconText: { fontSize: 22 },
  cardContent: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  cardTitleDisabled: { color: '#aaa' },
  cardDesc: { fontSize: 12, color: '#888', marginTop: 3, lineHeight: 17 },
  cardDescDisabled: { color: '#bbb' },
  arrow: { fontSize: 20, color: '#ccc' },
  badge: { backgroundColor: '#111', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
});
