import type { Locale } from '../schemas/common.ts'

export const messages = {
  ka: {
    brandTagline: 'კვების გეგმა, რომელიც შენს ბიუჯეტს ერგება',
    signIn: 'შესვლა',
    signUp: 'რეგისტრაცია',
    signOut: 'გასვლა',
    email: 'ელფოსტა',
    password: 'პაროლი',
    dashboard: 'მთავარი',
    weeklyPlan: 'კვირის გეგმა',
    groceryList: 'საყიდლების სია',
    settings: 'პარამეტრები',
    onboarding: 'მოვარგოთ სუფრა შენს ცხოვრებას',
    generatePlan: 'კვირის გეგმის შექმნა',
    noPlan: 'ამ კვირისთვის გეგმა ჯერ არ გაქვს.',
    estimated: 'სავარაუდო',
    budget: 'ბიუჯეტი',
    calories: 'კალორია',
  },
  en: {
    brandTagline: 'A meal plan that fits your budget',
    signIn: 'Sign in',
    signUp: 'Create account',
    signOut: 'Sign out',
    email: 'Email',
    password: 'Password',
    dashboard: 'Home',
    weeklyPlan: 'Weekly plan',
    groceryList: 'Grocery list',
    settings: 'Settings',
    onboarding: 'Let’s make Sufra fit your life',
    generatePlan: 'Generate weekly plan',
    noPlan: 'You do not have a plan for this week yet.',
    estimated: 'Estimated',
    budget: 'Budget',
    calories: 'Calories',
  },
} as const

export type MessageKey = keyof (typeof messages)['en']

export function translate(locale: Locale, key: MessageKey): string {
  return messages[locale][key] ?? messages.en[key]
}
