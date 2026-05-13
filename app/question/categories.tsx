import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import {
  useQuestionCategories,
  useUserQuestionSettings,
  useUpsertQuestionSetting,
} from '@/hooks/useQuestions';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { QuestionCategory, UserQuestionSetting } from '@/types/database';

export default function CategoriesScreen() {
  const { data: categories, isLoading: loadingCats } = useQuestionCategories();
  const { data: settings, isLoading: loadingSettings } = useUserQuestionSettings();
  const upsert = useUpsertQuestionSetting();

  const settingsMap = React.useMemo(() => {
    const m: Record<string, UserQuestionSetting> = {};
    settings?.forEach((s) => { m[s.category_id] = s; });
    return m;
  }, [settings]);

  function handleToggle(category: QuestionCategory, enabled: boolean) {
    upsert.mutate({
      category_id: category.id,
      is_enabled: enabled,
      start_date: settingsMap[category.id]?.start_date,
      end_date: settingsMap[category.id]?.end_date,
      notify_time: settingsMap[category.id]?.notify_time,
    }, {
      onError: () => Alert.alert('오류', '설정 변경에 실패했습니다.'),
    });
  }

  if (loadingCats || loadingSettings) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>질문 카테고리</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.desc}>
          활성화된 카테고리 중 하나를 선택해 매일 하나의 질문을 드려요.
        </Text>

        {categories?.map((cat) => {
          const setting = settingsMap[cat.id];
          const isEnabled = setting?.is_enabled ?? false;

          return (
            <View key={cat.id} style={[styles.card, isEnabled && styles.cardEnabled]}>
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardIcon}>{cat.icon}</Text>
                  <View>
                    <Text style={styles.cardName}>{cat.name}</Text>
                    {cat.description && (
                      <Text style={styles.cardDesc}>{cat.description}</Text>
                    )}
                  </View>
                </View>
                <Switch
                  value={isEnabled}
                  onValueChange={(v) => handleToggle(cat, v)}
                  trackColor={{ false: '#e0e0e0', true: '#6366f1' }}
                  thumbColor="#fff"
                  ios_backgroundColor="#e0e0e0"
                />
              </View>

              {isEnabled && (
                <View style={styles.scheduleRow}>
                  <Text style={styles.scheduleLabel}>알림 시간</Text>
                  <TouchableOpacity
                    style={styles.scheduleBtn}
                    onPress={() => {
                      // Simplified: show time options
                      const times = ['08:00', '09:00', '12:00', '18:00', '21:00', '없음'];
                      Alert.alert(
                        '알림 시간 선택',
                        '',
                        times.map((t) => ({
                          text: t === '없음' ? '알림 없음' : t,
                          onPress: () => {
                            upsert.mutate({
                              category_id: cat.id,
                              is_enabled: true,
                              notify_time: t === '없음' ? null : `${t}:00`,
                            });
                          },
                        })),
                      );
                    }}
                  >
                    <Text style={styles.scheduleBtnText}>
                      {setting?.notify_time
                        ? setting.notify_time.slice(0, 5)
                        : '설정 안 함'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
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
  backText: { fontSize: 20, color: '#111' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  headerRight: { width: 24 },
  content: { padding: 16, gap: 12 },
  desc: {
    fontSize: 13,
    color: '#888',
    lineHeight: 19,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#fafafa',
    gap: 12,
  },
  cardEnabled: { borderColor: '#6366f1', backgroundColor: '#faf9ff' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardIcon: { fontSize: 28 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111' },
  cardDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scheduleLabel: { fontSize: 13, color: '#888' },
  scheduleBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scheduleBtnText: { fontSize: 12, color: '#fff', fontWeight: '600' },
});
