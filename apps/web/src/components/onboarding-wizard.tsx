'use client'

import {
  kitchenEquipmentCategory,
  mealMoodOptions,
  type Locale,
  type MealMoodSlug,
} from '@sufra/shared'
import { useState, type FormEvent } from 'react'
import { useFormStatus } from 'react-dom'

interface Choice {
  id: number
  slug: string
  label: string
}

export interface OnboardingInitialProfile {
  displayName: string
  city: string
  preferredStoreId: number
  householdSize: number
  budgetAmountGel: number
  mealMoodSlug: MealMoodSlug
  dailyCalorieTarget: number
  proteinTargetG: number | null
  carbohydrateTargetG: number | null
  fatTargetG: number | null
  fiberTargetG: number | null
  maxCookMinutes: number | null
  allergenIds: number[]
  dietaryPatternId: number
  applianceIds: number[]
}

const dietarySlugs = new Set(['omnivore', 'vegetarian', 'vegan', 'pescatarian'])

function BuildPlanButton({ locale, disabled }: { locale: Locale; disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button className="primary-button px-7" disabled={disabled || pending} type="submit">
      {pending
        ? locale === 'ka'
          ? 'შენი კვირა იგეგმება…'
          : 'Building your week…'
        : locale === 'ka'
          ? 'ჩემი კვირის გეგმის შექმნა →'
          : 'Build my weekly plan →'}
    </button>
  )
}

function ChoiceCard({
  title,
  description,
  selected,
  onClick,
}: {
  title: string
  description?: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      aria-pressed={selected}
      className={`rounded-2xl border px-4 py-4 text-left transition ${
        selected
          ? 'border-[var(--wine)] bg-[var(--wine)] text-white shadow-sm'
          : 'border-[var(--line)] bg-white/60 hover:border-[var(--wine)]'
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="block text-sm font-black">{title}</span>
      {description ? (
        <span
          className={`mt-1 block text-xs leading-5 ${selected ? 'text-white/75' : 'text-[var(--muted)]'}`}
        >
          {description}
        </span>
      ) : null}
    </button>
  )
}

export function OnboardingWizard({
  locale,
  initial,
  stores,
  appliances,
  dietaryPatterns,
  action,
}: {
  locale: Locale
  initial: OnboardingInitialProfile
  stores: Choice[]
  appliances: Choice[]
  dietaryPatterns: Choice[]
  action: (formData: FormData) => Promise<void>
}) {
  const [step, setStep] = useState(0)
  const [preferredStoreId, setPreferredStoreId] = useState(initial.preferredStoreId)
  const [householdSize, setHouseholdSize] = useState(initial.householdSize)
  const [budget, setBudget] = useState(String(initial.budgetAmountGel))
  const [mealMoodSlug, setMealMoodSlug] = useState<MealMoodSlug>(initial.mealMoodSlug)
  const [dietaryPatternId, setDietaryPatternId] = useState(initial.dietaryPatternId)
  const [applianceIds, setApplianceIds] = useState(initial.applianceIds)
  const [message, setMessage] = useState('')

  const copy =
    locale === 'ka'
      ? {
          questions: [
            ['აირჩიე მაღაზია', 'რომელი ქართული სუპერმარკეტის ფასებით დავგეგმოთ?'],
            [
              'რამდენი ადამიანისთვის ამზადებ?',
              'ყველა კერძისა და საყიდლების რაოდენობას ამას მოვარგებთ.',
            ],
            ['რა არის შენი კვირის ბიუჯეტი?', 'მიუთითე ზედა ზღვარი ლარში მთელი კვირისთვის.'],
            ['რის ხასიათზე ხარ?', 'ეს არჩევანი განსაზღვრავს კვირის გემოსა და სტილს.'],
            [
              'გაქვს კვების განსაკუთრებული რეჟიმი?',
              'ერთი ვარიანტი აირჩიე. უსაფრთხოება ყოველთვის პრიორიტეტია.',
            ],
            [
              'რა მოსამზადებელი ტექნიკა და ინვენტარი გაქვს სახლში?',
              'მონიშნე ყველაფერი, რითაც კერძის მომზადება ან პროდუქტების დამუშავება შეგიძლია.',
            ],
          ],
          back: 'უკან',
          next: 'შემდეგი',
          people: 'ადამიანი',
          budgetSuffix: '₾ კვირაში',
          chooseOne: 'გთხოვ, აირჩიე ერთი ვარიანტი.',
          chooseAppliance: 'აირჩიე მინიმუმ ერთი ტექნიკა ან ინვენტარი.',
          cookingEquipment: 'მოსამზადებელი ტექნიკა',
          preparationEquipment: 'პროდუქტების დასამუშავებელი ინვენტარი',
          none: 'არაფერი',
        }
      : {
          questions: [
            ['Choose your shop', 'Which Georgian supermarket should we use for price estimates?'],
            [
              'How many are you cooking for?',
              'We will scale every recipe and grocery quantity to this number.',
            ],
            ["What's your weekly budget?", 'Set the spending ceiling for the whole week in GEL.'],
            ['What are you in the mood for?', 'This shapes the flavour and style of your week.'],
            ['Any dietary needs?', 'Choose one option. Food safety comes first.'],
            [
              'What cooking and prep equipment do you have at home?',
              'Select everything you can use to cook meals or prepare ingredients.',
            ],
          ],
          back: 'Back',
          next: 'Next',
          people: 'people',
          budgetSuffix: 'GEL per week',
          chooseOne: 'Please choose one option.',
          chooseAppliance: 'Choose at least one piece of kitchen equipment.',
          cookingEquipment: 'Cooking equipment',
          preparationEquipment: 'Preparation equipment',
          none: 'None',
        }

  const allowedDietaryPatterns = dietaryPatterns.filter((choice) => dietarySlugs.has(choice.slug))
  const equipmentGroups = [
    {
      key: 'cooking',
      title: copy.cookingEquipment,
      items: appliances.filter((item) => kitchenEquipmentCategory(item.slug) === 'cooking'),
    },
    {
      key: 'preparation',
      title: copy.preparationEquipment,
      items: appliances.filter((item) => kitchenEquipmentCategory(item.slug) === 'preparation'),
    },
  ]
  const validStep =
    (step === 0 && preferredStoreId > 0) ||
    (step === 1 && householdSize >= 1 && householdSize <= 20) ||
    (step === 2 && Number(budget) > 0) ||
    (step === 3 && Boolean(mealMoodSlug)) ||
    (step === 4 && dietaryPatternId > 0) ||
    (step === 5 && applianceIds.length > 0)

  function next() {
    if (!validStep) {
      setMessage(step === 5 ? copy.chooseAppliance : copy.chooseOne)
      return
    }
    setMessage('')
    setStep((current) => Math.min(current + 1, 5))
  }

  function toggleAppliance(id: number) {
    setApplianceIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    )
    setMessage('')
  }

  function validateSubmission(event: FormEvent<HTMLFormElement>) {
    if (applianceIds.length === 0) {
      event.preventDefault()
      setMessage(copy.chooseAppliance)
    }
  }

  const [title, description] = copy.questions[step]!
  const maxCookMinutes = mealMoodSlug === 'speedy-meals' ? 30 : 120

  return (
    <form action={action} className="mt-8" onSubmit={validateSubmission}>
      <input name="locale" type="hidden" value={locale} />
      <input name="displayName" type="hidden" value={initial.displayName} />
      <input name="city" type="hidden" value={initial.city} />
      <input name="preferredStoreId" type="hidden" value={preferredStoreId} />
      <input name="householdSize" type="hidden" value={householdSize} />
      <input name="budgetPeriod" type="hidden" value="weekly" />
      <input name="budgetAmountGel" type="hidden" value={budget} />
      <input name="mealMoodSlug" type="hidden" value={mealMoodSlug} />
      <input name="dailyCalorieTarget" type="hidden" value={initial.dailyCalorieTarget} />
      <input name="proteinTargetG" type="hidden" value={initial.proteinTargetG ?? ''} />
      <input name="carbohydrateTargetG" type="hidden" value={initial.carbohydrateTargetG ?? ''} />
      <input name="fatTargetG" type="hidden" value={initial.fatTargetG ?? ''} />
      <input name="fiberTargetG" type="hidden" value={initial.fiberTargetG ?? ''} />
      <input name="mealsPerDay" type="hidden" value="3" />
      <input name="maxCookMinutes" type="hidden" value={maxCookMinutes} />
      <input name="includeLeftovers" type="hidden" value="true" />
      <input name="allowBatchCooking" type="hidden" value="true" />
      <input name="dietaryPatternIds" type="hidden" value={dietaryPatternId} />
      {initial.allergenIds.map((id) => (
        <input key={`allergen-${id}`} name="allergenIds" type="hidden" value={id} />
      ))}
      {applianceIds.map((id) => (
        <input key={`appliance-${id}`} name="applianceIds" type="hidden" value={id} />
      ))}

      <div className="mb-5 flex gap-2" aria-label={locale === 'ka' ? 'პროგრესი' : 'Progress'}>
        {copy.questions.map((_, index) => (
          <span
            aria-hidden="true"
            className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-[var(--wine)]' : 'bg-[var(--line)]'}`}
            key={index}
          />
        ))}
      </div>

      <section className="surface min-h-[430px] rounded-3xl p-6 sm:p-8">
        <p className="text-xs font-black tracking-[0.2em] text-[var(--wine)] uppercase">
          {step + 1} / 6
        </p>
        <h2 className="display-face mt-3 text-3xl sm:text-4xl">{title}</h2>
        <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">{description}</p>

        <div className="mt-7">
          {step === 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stores.map((store) => (
                <ChoiceCard
                  key={store.id}
                  onClick={() => {
                    setPreferredStoreId(store.id)
                    setMessage('')
                  }}
                  selected={preferredStoreId === store.id}
                  title={store.label}
                />
              ))}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="flex max-w-sm items-center gap-4 rounded-3xl border border-[var(--line)] bg-white/60 p-4">
              <button
                aria-label={locale === 'ka' ? 'შემცირება' : 'Decrease'}
                className="h-12 w-12 rounded-full border border-[var(--line)] text-2xl font-black"
                onClick={() => setHouseholdSize((value) => Math.max(1, value - 1))}
                type="button"
              >
                −
              </button>
              <label className="flex-1 text-center text-sm font-bold">
                <input
                  className="field mb-2 text-center text-2xl font-black"
                  max={20}
                  min={1}
                  onChange={(event) => setHouseholdSize(Number(event.target.value))}
                  type="number"
                  value={householdSize}
                />
                {copy.people}
              </label>
              <button
                aria-label={locale === 'ka' ? 'გაზრდა' : 'Increase'}
                className="h-12 w-12 rounded-full border border-[var(--line)] text-2xl font-black"
                onClick={() => setHouseholdSize((value) => Math.min(20, value + 1))}
                type="button"
              >
                +
              </button>
            </div>
          ) : null}

          {step === 2 ? (
            <label className="block max-w-sm text-sm font-bold">
              <span className="relative block">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-xl font-black text-[var(--wine)]">
                  ₾
                </span>
                <input
                  className="field py-4 pl-10 text-2xl font-black"
                  min="1"
                  onChange={(event) => setBudget(event.target.value)}
                  step="0.01"
                  type="number"
                  value={budget}
                />
              </span>
              <span className="mt-2 block text-[var(--muted)]">{copy.budgetSuffix}</span>
            </label>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mealMoodOptions.map((option) => (
                <ChoiceCard
                  description={option.description[locale]}
                  key={option.slug}
                  onClick={() => {
                    setMealMoodSlug(option.slug)
                    setMessage('')
                  }}
                  selected={mealMoodSlug === option.slug}
                  title={option.title[locale]}
                />
              ))}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {allowedDietaryPatterns.map((diet) => (
                <ChoiceCard
                  key={diet.id}
                  onClick={() => {
                    setDietaryPatternId(diet.id)
                    setMessage('')
                  }}
                  selected={dietaryPatternId === diet.id}
                  title={diet.slug === 'omnivore' ? copy.none : diet.label}
                />
              ))}
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-7">
              {equipmentGroups.map((group) => (
                <section key={group.key}>
                  <h3 className="mb-3 text-xs font-black tracking-[0.16em] text-[var(--muted)] uppercase">
                    {group.title}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((item) => (
                      <ChoiceCard
                        key={item.id}
                        onClick={() => toggleAppliance(item.id)}
                        selected={applianceIds.includes(item.id)}
                        title={item.label}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : null}
        </div>

        {message ? (
          <p className="mt-5 text-sm font-bold text-red-700" role="alert">
            {message}
          </p>
        ) : null}
      </section>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-black disabled:opacity-30"
          disabled={step === 0}
          onClick={() => {
            setMessage('')
            setStep((current) => Math.max(0, current - 1))
          }}
          type="button"
        >
          ← {copy.back}
        </button>
        {step < 5 ? (
          <button
            className="primary-button px-7"
            disabled={!validStep}
            onClick={next}
            type="button"
          >
            {copy.next} →
          </button>
        ) : (
          <BuildPlanButton disabled={!validStep} locale={locale} />
        )}
      </div>
    </form>
  )
}
