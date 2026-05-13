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

const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
});

type LoginForm = z.infer<typeof loginSchema>;
type FormErrors = Partial<Record<keyof LoginForm, string>>;

export default function LoginScreen() {
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  function setField<K extends keyof LoginForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleLogin() {
    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof LoginForm;
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });
    setIsLoading(false);

    if (error) {
      Alert.alert('로그인 실패', error.message === 'Invalid login credentials'
        ? '이메일 또는 비밀번호가 올바르지 않습니다.'
        : error.message);
      return;
    }

    router.replace('/(tabs)/feed');
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
          <Text style={styles.subtitle}>짧게 공유하고, 깊게 저장하는 일상 기록</Text>
        </View>

        <View style={styles.form}>
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
            label="로그인"
            onPress={handleLogin}
            isLoading={isLoading}
            style={styles.btn}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>계정이 없으신가요? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>회원가입</Text>
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
    paddingTop: 100,
    paddingBottom: 40,
  },
  header: { marginBottom: 48, alignItems: 'center' },
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
