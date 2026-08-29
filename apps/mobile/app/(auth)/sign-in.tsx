import { translate } from '@sufra/shared'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'

import { Card, Field, Label, PrimaryButton, Screen, Title } from '@/components/ui'
import { colors } from '@/lib/colors'
import { supabase } from '@/lib/supabase'
import { useLocale } from '@/providers/locale-provider'

export default function SignInScreen() {
  const { locale, setLocale } = useLocale()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(signUp: boolean) {
    if (!email.trim() || password.length < 8) {
      setMessage(
        locale === 'ka'
          ? 'შეიყვანე ელფოსტა და მინიმუმ 8-ნიშნა პაროლი.'
          : 'Enter an email and an 8-character password.',
      )
      return
    }
    setPending(true)
    setMessage('')
    const result = signUp
      ? await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { locale }, emailRedirectTo: 'sufra://auth/callback' },
        })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setPending(false)
    if (result.error) {
      setMessage(locale === 'ka' ? 'ავტორიზაცია ვერ მოხერხდა.' : 'Authentication failed.')
    } else if (signUp && !result.data.session) {
      setMessage(
        locale === 'ka'
          ? 'შეამოწმე ელფოსტა ანგარიშის დასადასტურებლად.'
          : 'Check your email to confirm the account.',
      )
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brandMark}>
            <Text style={styles.brandLetter}>ს</Text>
          </View>
          <Text style={styles.brand}>სუფრა · Sufra</Text>
          <Text style={styles.eyebrow}>
            {locale === 'ka' ? 'შენი კვირა აქ იწყება' : 'YOUR WEEK STARTS HERE'}
          </Text>
          <Title>
            {locale === 'ka'
              ? 'სუფრასთან ყველასთვის არის ადგილი.'
              : 'There is always room at the table.'}
          </Title>
          <Card style={styles.card}>
            <Label>{translate(locale, 'email')}</Label>
            <Field
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              value={email}
            />
            <View style={styles.gap} />
            <Label>{translate(locale, 'password')}</Label>
            <Field
              autoComplete="password"
              onChangeText={setPassword}
              secureTextEntry
              value={password}
            />
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <View style={styles.gapLarge} />
            <PrimaryButton
              disabled={pending}
              onPress={() => submit(false)}
              title={translate(locale, 'signIn')}
            />
            <Text onPress={() => submit(true)} style={styles.secondary}>
              {translate(locale, 'signUp')}
            </Text>
          </Card>
          <Text onPress={() => setLocale(locale === 'ka' ? 'en' : 'ka')} style={styles.language}>
            {locale === 'ka' ? 'English' : 'ქართული'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 22, paddingVertical: 54 },
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.wine,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  brandLetter: { color: 'white', fontFamily: 'Georgia', fontSize: 28, fontWeight: '800' },
  brand: {
    color: colors.ink,
    fontFamily: 'Georgia',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  eyebrow: {
    color: colors.wine,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
    marginTop: 32,
  },
  card: { marginTop: 28 },
  gap: { height: 15 },
  gapLarge: { height: 22 },
  message: { color: colors.danger, fontSize: 13, lineHeight: 19, marginTop: 14 },
  secondary: {
    color: colors.wine,
    fontSize: 15,
    fontWeight: '800',
    padding: 16,
    textAlign: 'center',
  },
  language: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 24,
    padding: 8,
    textAlign: 'center',
  },
})
