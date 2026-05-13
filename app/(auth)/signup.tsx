import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const signupSchema = z.object({
  username: z
    .string()
    .min(2, '닉네임은 2자 이상이어야 합니다')
    .max(20, '닉네임은 20자 이하여야 합니다')
    .regex(/^[a-zA-Z0-9_가-힣]+$/, '닉네임은 영문, 숫자, 한글, _만 가능합니다'),
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
});

type SignupForm = z.infer<typeof signupSchema>;
type FormErrors = Partial<Record<keyof SignupForm, string>>;

export default function SignupScreen() {
  const [form, setForm] = useState<SignupForm>({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  function setField<K extends keyof SignupForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSignup() {
    const result = signupSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof SignupForm;
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          username: form.username.trim(),
          display_name: form.username.trim(),
        },
      },
    });
    setIsLoading(false);

    if (error) {
      Alert.alert('회원가입 실패', error.message);
      return;
    }

    Alert.alert(
      '가입 완료',
      '이메일 인증 링크를 확인해주세요.\n인증 후 로그인할 수 있습니다.',
      [{ text: '확인', onPress: () => router.replace('/(auth)/login') }],
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>✦ DailyShare</Text>
          <Text style={styles.subtitle}>새 계정 만들기</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="닉네임"
            value={form.username}
            onChangeText={(v) => setField('username', v)}
            error={errors.username}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="2~20자 (영문, 숫자, 한글, _)"
          />
          <Input
            label="이메일"
            value={form.email}
            onChangeText={(v) => setField('email', v)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="you@example.com"
          />
          <Input
            label="비밀번호"
            value={form.password}
            onChangeText={(v) => setField('password', v)}
            error={errors.password}
            secureTextEntry
            placeholder="6자 이상"
          />
          <Button
            label="회원가입"
            onPress={handleSignup}
            isLoading={isLoading}
            style={styles.btn}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>이미 계정이 있으신가요? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>로그인</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: { marginBottom: 40, alignItems: 'center' },
  logo: { fontSize: 28, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 8 },
  form: { gap: 16 },
  btn: { marginTop: 8 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: { fontSize: 14, color: '#888' },
  footerLink: { fontSize: 14, color: '#111', fontWeight: '700' },
});
