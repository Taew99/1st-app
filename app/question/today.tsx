import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { useTodayQuestion, useMarkQuestionAnswered } from '@/hooks/useQuestions';
import { useCreateEntry } from '@/hooks/usePrivateEntries';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const MIN_BODY = 200;

export default function TodayQuestionScreen() {
  const { user } = useAuthStore();
  const { data: assignment, isLoading } = useTodayQuestion();
  const createEntry = useCreateEntry();
  const markAnswered = useMarkQuestionAnswered();
  const [answer, setAnswer] = useState('');

  const remaining = MIN_BODY - answer.length;
  const isReady = answer.length >= MIN_BODY;

  async function handleSubmit() {
    if (!isReady) {
      Alert.alert('답변 부족', `최소 ${MIN_BODY}자 이상 작성해주세요. (현재 ${answer.length}자)`);
      return;
    }
    if (!assignment || !user) return;

    try {
      await createEntry.mutateAsync({
        user_id: user.id,
        entry_type: 'question',
        body: answer.trim(),
        question_id: assignment.question_id,
      });
      await markAnswered.mutateAsync(assignment.id);
      Alert.alert('저장 완료', '오늘의 답변이 저장되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
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
          <TouchableOpacity onPress={() => router.back()} disabled={createEntry.isPending}>
            <Text style={styles.cancelBtn}>취소</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>오늘의 질문</Text>
          <Button
            label="저장"
            onPress={handleSubmit}
            isLoading={createEntry.isPending || markAnswered.isPending}
            disabled={!isReady || !assignment || assignment.answered}
            style={styles.submitBtn}
            textStyle={styles.submitBtnText}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {!assignment ? (
            <View style={styles.noQuestion}>
              <Text style={styles.noQuestionIcon}>💭</Text>
              <Text style={styles.noQuestionTitle}>오늘의 질문이 없습니다</Text>
              <Text style={styles.noQuestionDesc}>
                질문 카테고리를 활성화하면{'\n'}매일 새로운 질문을 받을 수 있어요
              </Text>
              <TouchableOpacity
                style={styles.setCategoryBtn}
                onPress={() => { router.back(); router.push('/question/categories'); }}
              >
                <Text style={styles.setCategoryBtnText}>카테고리 설정하기</Text>
              </TouchableOpacity>
            </View>
          ) : assignment.answered ? (
            <View style={styles.answeredBanner}>
              <Text style={styles.answeredIcon}>✓</Text>
              <Text style={styles.answeredText}>오늘의 질문에 이미 답변했습니다!</Text>
              <Text style={styles.answeredSub}>Vault에서 답변을 확인할 수 있습니다.</Text>
            </View>
          ) : (
            <>
              <View style={styles.questionBox}>
                {assignment.question?.category && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {assignment.question.category.icon} {assignment.question.category.name}
                    </Text>
                  </View>
                )}
                <Text style={styles.questionText}>{assignment.question?.body}</Text>
              </View>

              <TextInput
                style={styles.answerInput}
                placeholder={`오늘의 질문에 답해보세요\n최소 ${MIN_BODY}자 이상`}
                placeholderTextColor="#ccc"
                value={answer}
                onChangeText={setAnswer}
                multiline
                textAlignVertical="top"
                autoFocus
              />

              <View style={styles.counter}>
                {remaining > 0 ? (
                  <Text style={styles.counterText}>최소 {remaining}자 더 필요합니다</Text>
                ) : (
                  <Text style={[styles.counterText, styles.counterOk]}>✓ {answer.length}자</Text>
                )}
              </View>
            </>
          )}
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
  content: { padding: 20, flexGrow: 1, gap: 16 },
  questionBox: {
    backgroundColor: '#f5f5ff',
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryBadgeText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  questionText: { fontSize: 16, fontWeight: '600', color: '#333', lineHeight: 24 },
  answerInput: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
    minHeight: 280,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
  },
  counter: { alignItems: 'flex-end' },
  counterText: { fontSize: 12, color: '#bbb' },
  counterOk: { color: '#22c55e', fontWeight: '600' },
  noQuestion: { alignItems: 'center', paddingTop: 60, gap: 12 },
  noQuestionIcon: { fontSize: 48 },
  noQuestionTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  noQuestionDesc: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 21 },
  setCategoryBtn: {
    marginTop: 8,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  setCategoryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  answeredBanner: { alignItems: 'center', paddingTop: 60, gap: 12 },
  answeredIcon: { fontSize: 40, color: '#22c55e' },
  answeredText: { fontSize: 17, fontWeight: '700', color: '#333' },
  answeredSub: { fontSize: 13, color: '#888' },
});
