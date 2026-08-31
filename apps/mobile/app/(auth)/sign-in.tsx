import Ionicons from '@expo/vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { useRef, useState, type ReactNode, type Ref } from 'react'
import {
  ActivityIndicator,
  Animated as NativeAnimated,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type ImageSourcePropType,
  type TextInputProps,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Checkbox } from '@/components/checkbox'
import { InfiniteCarousel } from '@/components/infinite-carousel'
import { SufraBrand } from '@/components/sufra-brand'
import { SufraWelcomeButton } from '@/components/sufra-welcome-button'
import { colors } from '@/lib/colors'
import { isMockMode } from '@/lib/data-mode'
import { supabase } from '@/lib/supabase'
import { fontFamilyFor, shadow } from '@/lib/theme'
import { useAuth } from '@/providers/auth-provider'
import { useLocale } from '@/providers/locale-provider'

const welcomeFeast = require('../../assets/images/sufra-welcome-feast.png')
const welcomeBalcony = require('../../assets/images/carousel-old-tbilisi.jpg')
const welcomeMarket = require('../../assets/images/carousel-market.jpg')
const signInHero = require('../../assets/images/sufra-auth-signin.png')
const registerHero = require('../../assets/images/sufra-auth-register.png')

type AuthMode = 'welcome' | 'signIn' | 'signUp'
type Locale = 'ka' | 'en'

interface WelcomeSlide {
  id: string
  image: ImageSourcePropType
  title: Record<Locale, string>
}

const welcomeSlides: readonly WelcomeSlide[] = [
  {
    id: 'table',
    image: welcomeFeast,
    title: { ka: 'ქართული გემო', en: 'Georgian table' },
  },
  {
    id: 'balcony',
    image: welcomeBalcony,
    title: { ka: 'ძველი თბილისი', en: 'Old Tbilisi' },
  },
  {
    id: 'market',
    image: welcomeMarket,
    title: { ka: 'ახალი პროდუქტები', en: 'Fresh ingredients' },
  },
]

const copy = {
  ka: {
    welcomeTitle: 'გემრიელი კვირა\nიწყება აქ',
    signIn: 'შესვლა',
    signUp: 'რეგისტრაცია',
    signInIntro: 'შედი და დაგეგმე კვირა.',
    signUpIntro: 'შექმენი შენი ანგარიში.',
    name: 'სახელი და გვარი',
    namePlaceholder: 'შენი სახელი',
    email: 'ელფოსტა',
    password: 'პაროლი',
    confirmPassword: 'გაიმეორე პაროლი',
    remember: 'დამიმახსოვრე',
    forgot: 'პაროლი დაგავიწყდა?',
    acceptStart: 'ვეთანხმები ',
    terms: 'პირობებს',
    noAccount: 'არ გაქვს ანგარიში?',
    haveAccount: 'უკვე გაქვს ანგარიში?',
    requiredName: 'შეიყვანე სახელი და გვარი.',
    invalidCredentials: 'შეიყვანე ელფოსტა და მინიმუმ 8 სიმბოლოიანი პაროლი.',
    passwordsMismatch: 'პაროლები ერთმანეთს არ ემთხვევა.',
    termsRequired: 'რეგისტრაციისთვის დაეთანხმე პირობებს.',
    confirmation: 'შეამოწმე ელფოსტა ანგარიშის დასადასტურებლად.',
    resetSent: 'პაროლის აღდგენის ბმული გამოგზავნილია.',
    emailRequired: 'ჯერ შეიყვანე ელფოსტა.',
  },
  en: {
    welcomeTitle: 'A delicious week\nstarts here',
    signIn: 'Sign in',
    signUp: 'Create account',
    signInIntro: 'Sign in and plan your week.',
    signUpIntro: 'Create your Sufra account.',
    name: 'Full name',
    namePlaceholder: 'Your name',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    remember: 'Remember me',
    forgot: 'Forgot password?',
    acceptStart: 'I agree to the ',
    terms: 'terms',
    noAccount: 'New to Sufra?',
    haveAccount: 'Already have an account?',
    requiredName: 'Enter your full name.',
    invalidCredentials: 'Enter an email and a password with at least 8 characters.',
    passwordsMismatch: 'The passwords do not match.',
    termsRequired: 'Accept the terms to create an account.',
    confirmation: 'Check your email to confirm your account.',
    resetSent: 'A password reset link has been sent.',
    emailRequired: 'Enter your email first.',
  },
} as const

interface AuthFieldProps extends TextInputProps {
  compact?: boolean
  icon: 'lock-closed-outline' | 'mail-outline' | 'person-outline'
  inputRef?: Ref<TextInput>
  label: string
  onToggleSecure?: () => void
}

function AuthField({
  compact = false,
  icon,
  inputRef,
  label,
  onBlur,
  onFocus,
  onToggleSecure,
  ...inputProps
}: AuthFieldProps) {
  const focus = useRef(new NativeAnimated.Value(0)).current

  function animateFocus(toValue: number) {
    NativeAnimated.timing(focus, { duration: 150, toValue, useNativeDriver: false }).start()
  }

  return (
    <View style={[styles.fieldGroup, compact && styles.fieldGroupCompact]}>
      <Text style={[styles.fieldLabel, compact && styles.fieldLabelCompact]}>{label}</Text>
      <NativeAnimated.View
        style={[
          styles.field,
          compact && styles.fieldCompact,
          {
            borderColor: focus.interpolate({
              inputRange: [0, 1],
              outputRange: [colors.lineStrong, colors.emerald],
            }),
          },
        ]}
      >
        <Ionicons color={colors.ink} name={icon} size={20} />
        <TextInput
          {...inputProps}
          onBlur={(event) => {
            animateFocus(0)
            onBlur?.(event)
          }}
          onFocus={(event) => {
            animateFocus(1)
            onFocus?.(event)
          }}
          placeholderTextColor="#909993"
          ref={inputRef}
          selectionColor={colors.emerald}
          style={styles.fieldInput}
        />
        {onToggleSecure ? (
          <Pressable
            accessibilityLabel={inputProps.secureTextEntry ? 'Show password' : 'Hide password'}
            accessibilityRole="button"
            hitSlop={10}
            onPress={onToggleSecure}
            style={styles.eyeButton}
          >
            <Ionicons
              color={colors.ink}
              name={inputProps.secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
              size={21}
            />
          </Pressable>
        ) : null}
      </NativeAnimated.View>
    </View>
  )
}

function LanguageControl({ locale, onPress }: { locale: Locale; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={locale === 'ka' ? 'Switch to English' : 'ქართულზე გადართვა'}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.languageControl, pressed && styles.pressed]}
    >
      <Text style={[styles.languageOption, locale === 'ka' && styles.languageOptionActive]}>
        ქარ
      </Text>
      <Text style={styles.languageDivider}>/</Text>
      <Text style={[styles.languageOption, locale === 'en' && styles.languageOptionActive]}>
        EN
      </Text>
    </Pressable>
  )
}

function AuthSubmitButton({
  busy,
  compact = false,
  label,
  onPress,
}: {
  busy: boolean
  compact?: boolean
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.submitButton,
        compact && styles.submitButtonCompact,
        pressed && styles.submitButtonPressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.submitButtonText}>{label}</Text>
      )}
    </Pressable>
  )
}

function SelectableRow({
  checked,
  children,
  label,
  onPress,
  compact = false,
}: {
  checked: boolean
  children: ReactNode
  compact?: boolean
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectableRow,
        compact && styles.selectableRowCompact,
        pressed && styles.pressed,
      ]}
    >
      <Checkbox checked={checked} checkedColor={colors.emeraldDark} size={25} />
      {children}
    </Pressable>
  )
}

export default function SignInScreen() {
  const { locale, setLocale } = useLocale()
  const { signIn, signUp } = useAuth()
  const insets = useSafeAreaInsets()
  const { height: screenHeight } = useWindowDimensions()
  const [mode, setMode] = useState<AuthMode>('welcome')
  const [activeSlide, setActiveSlide] = useState(0)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState(isMockMode() ? 'demo@sufra.ge' : '')
  const [password, setPassword] = useState(isMockMode() ? 'sufra-demo' : '')
  const [confirmPassword, setConfirmPassword] = useState(isMockMode() ? 'sufra-demo' : '')
  const [remember, setRemember] = useState(true)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const emailRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)
  const confirmPasswordRef = useRef<TextInput>(null)
  const creatingAccount = mode === 'signUp'
  const strings = copy[locale]
  const carouselHeight = Math.min(Math.max(screenHeight * 0.39, 300), 360)

  function changeMode(nextMode: AuthMode) {
    setMessage('')
    setMode(nextMode)
  }

  function switchLocale() {
    void setLocale(locale === 'ka' ? 'en' : 'ka')
  }

  async function submit() {
    if (creatingAccount && !displayName.trim()) {
      setMessage(strings.requiredName)
      return
    }
    if (!email.trim() || password.length < 8) {
      setMessage(strings.invalidCredentials)
      return
    }
    if (creatingAccount && password !== confirmPassword) {
      setMessage(strings.passwordsMismatch)
      return
    }
    if (creatingAccount && !acceptedTerms) {
      setMessage(strings.termsRequired)
      return
    }

    setPending(true)
    setMessage('')
    const error = creatingAccount
      ? await signUp(email.trim(), password, locale, displayName.trim())
      : await signIn(email.trim(), password)
    setPending(false)

    if (error) setMessage(error)
    else if (creatingAccount && !isMockMode()) setMessage(strings.confirmation)
  }

  async function resetPassword() {
    if (!email.trim()) {
      setMessage(strings.emailRequired)
      emailRef.current?.focus()
      return
    }
    if (isMockMode()) {
      setMessage(strings.resetSent)
      return
    }

    setPending(true)
    const result = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'sufra://auth/callback',
    })
    setPending(false)
    setMessage(result.error?.message ?? strings.resetSent)
  }

  if (mode === 'welcome') {
    return (
      <View style={styles.welcomeRoot}>
        <StatusBar style="dark" />
        <View
          style={[
            styles.welcomeContent,
            { paddingBottom: Math.max(insets.bottom, 18), paddingTop: insets.top + 14 },
          ]}
        >
          <View style={styles.welcomeHeader}>
            <SufraBrand size="compact" />
            <LanguageControl locale={locale} onPress={switchLocale} />
          </View>

          <View style={styles.carouselSection}>
            <InfiniteCarousel
              autoPlaySpeed={23}
              data={welcomeSlides}
              height={carouselHeight}
              itemWidthRatio={0.7}
              keyExtractor={(item) => item.id}
              onIndexChange={setActiveSlide}
              rotateDeg={1.4}
              renderItem={({ item }) => (
                <ImageBackground
                  imageStyle={styles.carouselImage}
                  resizeMode="cover"
                  source={item.image}
                  style={[styles.carouselCard, shadow(2)]}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(1,24,17,0.05)', 'rgba(1,24,17,0.72)']}
                    locations={[0.44, 0.67, 1]}
                    style={styles.carouselShade}
                  >
                    <Text style={styles.carouselCaption}>{item.title[locale]}</Text>
                  </LinearGradient>
                </ImageBackground>
              )}
            />
            <View accessibilityRole="tablist" style={styles.pagination}>
              {welcomeSlides.map((slide, index) => (
                <View
                  accessibilityLabel={`${index + 1} of ${welcomeSlides.length}`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: index === activeSlide }}
                  key={slide.id}
                  style={[styles.dot, index === activeSlide && styles.dotActive]}
                />
              ))}
            </View>
          </View>

          <View style={styles.welcomeFooter}>
            <Text style={styles.welcomeTitle}>{strings.welcomeTitle}</Text>
            <View style={styles.welcomeActions}>
              <SufraWelcomeButton label={strings.signIn} onPress={() => changeMode('signIn')} />
              <SufraWelcomeButton
                label={strings.signUp}
                onPress={() => changeMode('signUp')}
                variant="accent"
              />
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.authRoot}
    >
      <StatusBar style="light" />
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.authScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          imageStyle={styles.authHeroImage}
          resizeMode="cover"
          source={creatingAccount ? registerHero : signInHero}
          style={[styles.authHero, creatingAccount ? styles.registerHero : styles.signInHero]}
        >
          <LinearGradient
            colors={['rgba(1,17,12,0.08)', 'rgba(1,24,17,0.25)', 'rgba(1,22,15,0.57)']}
            locations={[0, 0.56, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.authMasthead, { paddingTop: insets.top + 10 }]}>
            <Pressable
              accessibilityLabel={locale === 'ka' ? 'უკან' : 'Back'}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => changeMode('welcome')}
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            >
              <Ionicons color={colors.white} name="arrow-back" size={24} />
            </Pressable>
            <SufraBrand inverted />
            <View style={styles.mastheadBalance} />
          </View>
        </ImageBackground>

        <View
          style={[
            styles.formSheet,
            creatingAccount ? styles.registerSheet : styles.signInSheet,
            { paddingBottom: Math.max(insets.bottom + 18, 32) },
          ]}
        >
          <Text style={[styles.authTitle, creatingAccount && styles.registerTitle]}>
            {creatingAccount ? strings.signUp : strings.signIn}
          </Text>
          <Text style={[styles.authIntro, creatingAccount && styles.registerIntro]}>
            {creatingAccount ? strings.signUpIntro : strings.signInIntro}
          </Text>

          <View style={[styles.formFields, creatingAccount && styles.registerFormFields]}>
            {creatingAccount ? (
              <AuthField
                autoCapitalize="words"
                autoComplete="name"
                compact
                icon="person-outline"
                label={strings.name}
                onChangeText={setDisplayName}
                onSubmitEditing={() => emailRef.current?.focus()}
                placeholder={strings.namePlaceholder}
                returnKeyType="next"
                value={displayName}
              />
            ) : null}

            <AuthField
              autoCapitalize="none"
              autoComplete="email"
              compact={creatingAccount}
              icon="mail-outline"
              inputMode="email"
              inputRef={emailRef}
              label={strings.email}
              onChangeText={setEmail}
              onSubmitEditing={() => passwordRef.current?.focus()}
              placeholder="name@example.com"
              returnKeyType="next"
              value={email}
            />

            <AuthField
              autoCapitalize="none"
              autoComplete={creatingAccount ? 'new-password' : 'current-password'}
              compact={creatingAccount}
              icon="lock-closed-outline"
              inputRef={passwordRef}
              label={strings.password}
              onChangeText={setPassword}
              onSubmitEditing={() => {
                if (creatingAccount) confirmPasswordRef.current?.focus()
                else void submit()
              }}
              onToggleSecure={() => setShowPassword((current) => !current)}
              placeholder="••••••••"
              returnKeyType={creatingAccount ? 'next' : 'done'}
              secureTextEntry={!showPassword}
              value={password}
            />

            {creatingAccount ? (
              <AuthField
                autoCapitalize="none"
                autoComplete="new-password"
                compact
                icon="lock-closed-outline"
                inputRef={confirmPasswordRef}
                label={strings.confirmPassword}
                onChangeText={setConfirmPassword}
                onSubmitEditing={() => void submit()}
                onToggleSecure={() => setShowConfirmPassword((current) => !current)}
                placeholder="••••••••"
                returnKeyType="done"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
              />
            ) : null}
          </View>

          {creatingAccount ? (
            <SelectableRow
              checked={acceptedTerms}
              label={strings.terms}
              onPress={() => setAcceptedTerms((current) => !current)}
            >
              <Text style={styles.selectableText}>
                {strings.acceptStart}
                <Text style={styles.inlineLink}>{strings.terms}</Text>
              </Text>
            </SelectableRow>
          ) : (
            <View style={styles.rememberRow}>
              <SelectableRow
                checked={remember}
                compact
                label={strings.remember}
                onPress={() => setRemember((current) => !current)}
              >
                <Text style={styles.selectableText}>{strings.remember}</Text>
              </SelectableRow>
              <Pressable
                accessibilityRole="button"
                disabled={pending}
                hitSlop={6}
                onPress={() => void resetPassword()}
              >
                <Text style={styles.forgotLink}>{strings.forgot}</Text>
              </Pressable>
            </View>
          )}

          {message ? (
            <View accessibilityLiveRegion="polite" style={styles.messageBox}>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          ) : null}

          <AuthSubmitButton
            busy={pending}
            compact={creatingAccount}
            label={creatingAccount ? strings.signUp : strings.signIn}
            onPress={() => void submit()}
          />

          <View style={[styles.alternateRow, creatingAccount && styles.registerAlternateRow]}>
            <Text style={styles.alternateText}>
              {creatingAccount ? strings.haveAccount : strings.noAccount}{' '}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => changeMode(creatingAccount ? 'signIn' : 'signUp')}
            >
              <Text style={styles.alternateLink}>
                {creatingAccount ? strings.signIn : strings.signUp}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  welcomeRoot: { backgroundColor: '#fcfdfb', flex: 1 },
  welcomeContent: { flex: 1 },
  welcomeHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  languageControl: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: colors.lineStrong,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: 34,
    paddingHorizontal: 9,
  },
  languageOption: {
    color: colors.muted,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 13,
  },
  languageOptionActive: { color: colors.ink, fontFamily: fontFamilyFor('sans', 600) },
  languageDivider: { color: colors.mutedLight, fontSize: 13, marginHorizontal: 6 },
  carouselSection: { marginTop: 27 },
  carouselCard: {
    backgroundColor: colors.paperDeep,
    borderRadius: 25,
    height: '100%',
    overflow: 'hidden',
  },
  carouselImage: { borderRadius: 25 },
  carouselShade: { flex: 1, justifyContent: 'flex-end', padding: 22 },
  carouselCaption: {
    color: colors.white,
    fontFamily: fontFamilyFor('serif', 500),
    fontSize: 18,
    lineHeight: 25,
  },
  pagination: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 13,
    height: 18,
    justifyContent: 'center',
    marginTop: 15,
  },
  dot: { backgroundColor: '#9dcbba', borderRadius: 5, height: 9, width: 9 },
  dotActive: { backgroundColor: colors.lime, width: 20 },
  welcomeFooter: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 12,
    paddingHorizontal: 24,
  },
  welcomeTitle: {
    color: colors.emeraldBlack,
    fontFamily: fontFamilyFor('serif', 500),
    fontSize: 32,
    letterSpacing: -0.7,
    lineHeight: 42,
    marginBottom: 24,
  },
  welcomeActions: { gap: 13 },
  pressed: { opacity: 0.72 },
  authRoot: { backgroundColor: colors.emeraldBlack, flex: 1 },
  authScrollContent: { backgroundColor: colors.surface, flexGrow: 1 },
  authHero: { backgroundColor: colors.emeraldBlack, width: '100%' },
  signInHero: { height: 320 },
  registerHero: { height: 255 },
  authHeroImage: { width: '100%' },
  authMasthead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(4,34,25,0.36)',
    borderColor: 'rgba(255,255,255,0.75)',
    borderRadius: 23,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  backButtonPressed: { backgroundColor: 'rgba(255,255,255,0.18)' },
  mastheadBalance: { height: 46, width: 46 },
  formSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 29,
    borderTopRightRadius: 29,
    marginTop: -30,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  signInSheet: { minHeight: 570 },
  registerSheet: { minHeight: 710, paddingTop: 25 },
  authTitle: {
    color: colors.emeraldBlack,
    fontFamily: fontFamilyFor('serif', 500),
    fontSize: 32,
    letterSpacing: -0.6,
    lineHeight: 42,
  },
  authIntro: {
    color: colors.muted,
    fontFamily: fontFamilyFor('sans', 400),
    fontSize: 14,
    lineHeight: 21,
    marginTop: 3,
  },
  registerTitle: { fontSize: 29, lineHeight: 37 },
  registerIntro: { fontSize: 13, lineHeight: 18, marginTop: 1 },
  formFields: { gap: 17, marginTop: 25 },
  registerFormFields: { gap: 10, marginTop: 14 },
  fieldGroup: { gap: 7 },
  fieldGroupCompact: { gap: 5 },
  fieldLabel: {
    color: colors.ink,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 13,
    lineHeight: 18,
  },
  fieldLabelCompact: { fontSize: 12, lineHeight: 15 },
  field: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    height: 55,
    paddingHorizontal: 14,
  },
  fieldCompact: { height: 48 },
  fieldInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fontFamilyFor('sans', 400),
    fontSize: 15,
    height: '100%',
    marginLeft: 13,
    paddingVertical: 0,
  },
  eyeButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  rememberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  selectableRow: { alignItems: 'center', flexDirection: 'row', gap: 10, marginTop: 20 },
  selectableRowCompact: { marginTop: 0 },
  selectableText: {
    color: colors.inkSoft,
    fontFamily: fontFamilyFor('sans', 400),
    fontSize: 13,
    lineHeight: 18,
  },
  inlineLink: { color: colors.emeraldDark, textDecorationLine: 'underline' },
  forgotLink: {
    color: colors.emeraldDark,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  messageBox: {
    backgroundColor: colors.mintSoft,
    borderRadius: 10,
    marginTop: 16,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  messageText: {
    color: colors.emeraldDark,
    fontFamily: fontFamilyFor('sans', 400),
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.emeraldDark,
    borderRadius: 28,
    height: 57,
    justifyContent: 'center',
    marginTop: 24,
  },
  submitButtonPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  submitButtonCompact: { height: 52, marginTop: 14 },
  submitButtonText: {
    color: colors.white,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 16,
  },
  alternateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 29,
  },
  alternateText: {
    color: colors.muted,
    fontFamily: fontFamilyFor('sans', 400),
    fontSize: 13,
  },
  alternateLink: {
    color: colors.emeraldDark,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 13,
  },
  registerAlternateRow: { marginTop: 14 },
})
