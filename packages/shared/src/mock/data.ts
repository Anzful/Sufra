import { getWeekStartDate } from '../logic/week.ts'
import type { LocalizedText, MacroTotals } from '../domain/types.ts'
import type { ProfileInput } from '../schemas/profile.ts'
import type {
  MockChoice,
  MockGroceryItem,
  MockIngredientChoice,
  MockPantryEntry,
  MockPersistedState,
  MockPlannedMeal,
  MockRecipe,
  MockSufraSnapshot,
  MockWeeklyPlan,
} from './types.ts'

const text = (ka: string, en: string): LocalizedText => ({ ka, en })
const macros = (
  calories: number,
  proteinG: number,
  carbohydrateG: number,
  fatG: number,
  fiberG: number,
  sodiumMg: number,
): MacroTotals => ({ calories, proteinG, carbohydrateG, fatG, fiberG, sodiumMg })

function choices(rows: Array<[string, string, string]>): MockChoice[] {
  return rows.map(([slug, ka, en], index) => ({
    id: index + 1,
    slug,
    translations: [
      { locale: 'ka', name: ka },
      { locale: 'en', name: en },
    ],
  }))
}

export const mockStores = choices([
  ['carrefour', 'კარფური', 'Carrefour'],
  ['nikora', 'ნიკორა', 'Nikora'],
  ['ori-nabiji', 'ორი ნაბიჯი', 'Ori Nabiji'],
  ['spar', 'სპარი', 'SPAR'],
  ['goodwill', 'გუდვილი', 'Goodwill'],
  ['agrohub', 'აგროჰაბი', 'Agrohub'],
  ['fresco', 'ფრესკო', 'Fresco'],
  ['libre', 'ლიბრე', 'Libre'],
  ['magniti', 'მაგნიტი', 'Magniti'],
  ['daily', 'დეილი', 'Daily'],
  ['universami', 'უნივერსამი', 'Universami'],
  ['zgapari', 'ზღაპარი', 'Zgapari'],
  ['gvirila', 'გვირილა', 'Gvirila'],
  ['kalata', 'კალათა', 'Kalata'],
  ['ambari', 'ამბარი', 'Ambari'],
])

const storePriceMultipliers: Record<string, number> = {
  carrefour: 0.98,
  nikora: 1,
  'ori-nabiji': 0.96,
  spar: 1.02,
  goodwill: 1.07,
  agrohub: 1.08,
  fresco: 1.01,
  libre: 0.97,
  magniti: 0.95,
  daily: 1.03,
  universami: 1,
  zgapari: 0.98,
  gvirila: 0.99,
  kalata: 1.01,
  ambari: 1,
}

export const mockAppliances = choices([
  ['stovetop', 'ქურა', 'Stovetop'],
  ['oven', 'ღუმელი', 'Oven'],
  ['air-fryer', 'აეროგრილი', 'Air Fryer'],
  ['slow-cooker', 'ნელი მოსამზადებელი ქვაბი', 'Slow Cooker'],
  ['blender', 'ბლენდერი', 'Blender'],
  ['instant-pot', 'მულტიფუნქციური წნევის ქვაბი', 'Instant Pot'],
  ['microwave', 'მიკროტალღური ღუმელი', 'Microwave'],
  ['grill', 'გრილი', 'Grill'],
  ['food-processor', 'სამზარეულოს კომბაინი', 'Food Processor'],
  ['rice-cooker', 'ბრინჯის მოსამზადებელი', 'Rice Cooker'],
])

export const mockAllergens = choices([
  ['gluten', 'გლუტენის შემცველი მარცვლეული', 'Gluten-containing cereals'],
  ['crustaceans', 'კიბოსნაირები', 'Crustaceans'],
  ['eggs', 'კვერცხი', 'Eggs'],
  ['fish', 'თევზი', 'Fish'],
  ['peanuts', 'მიწის თხილი', 'Peanuts'],
  ['soy', 'სოია', 'Soy'],
  ['milk', 'რძე', 'Milk'],
  ['tree-nuts', 'კაკლოვანი პროდუქტები', 'Tree nuts'],
  ['celery', 'ნიახური', 'Celery'],
  ['mustard', 'მდოგვი', 'Mustard'],
  ['sesame', 'სეზამი', 'Sesame'],
  ['sulfites', 'გოგირდის დიოქსიდი და სულფიტები', 'Sulphites'],
])

export const mockDietaryPatterns = choices([
  ['omnivore', 'შერეული კვება', 'Omnivore'],
  ['vegetarian', 'ვეგეტარიანული', 'Vegetarian'],
  ['vegan', 'ვეგანური', 'Vegan'],
  ['pescatarian', 'პესკეტარიანული', 'Pescatarian'],
  ['mediterranean', 'ხმელთაშუაზღვის', 'Mediterranean'],
  ['low-carb', 'დაბალნახშირწყლოვანი', 'Low Carb'],
  ['keto', 'კეტო', 'Keto'],
  ['paleo', 'პალეო', 'Paleo'],
  ['gluten-free', 'უგლუტენო', 'Gluten Free'],
  ['dairy-free', 'რძის პროდუქტების გარეშე', 'Dairy Free'],
])

const recipes: MockRecipe[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    title: text('შვრიის ფაფა ბანანითა და ნიგვზით', 'Overnight oats with banana and walnuts'),
    description: text('წინასწარ მოსამზადებელი, ნოყიერი საუზმე.', 'A filling make-ahead breakfast.'),
    tips: text('მოამზადე წინა საღამოს.', 'Prepare it the night before.'),
    baseServings: 2,
    prepMinutes: 10,
    cookMinutes: 0,
    nutritionPerServing: macros(482, 18, 65, 18, 9, 130),
    applianceSlugs: [],
    ingredients: [
      { id: 'oats', name: text('შვრიის ფანტელი', 'Rolled oats'), quantity: 100, unit: 'g' },
      { id: 'milk', name: text('რძე', 'Milk'), quantity: 250, unit: 'ml' },
      { id: 'banana', name: text('ბანანი', 'Banana'), quantity: 2, unit: 'piece' },
      { id: 'walnut', name: text('ნიგოზი', 'Walnuts'), quantity: 25, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: text(
          'შვრია და რძე ქილაში აურიე.',
          'Stir the oats and milk together in a jar.',
        ),
        durationMinutes: 3,
      },
      {
        stepNumber: 2,
        instruction: text(
          'დააფარე და მაცივარში მთელი ღამით დატოვე.',
          'Cover and refrigerate overnight.',
        ),
      },
      {
        stepNumber: 3,
        instruction: text(
          'დილით ბანანი და ნიგოზი დაუმატე.',
          'Top with banana and walnuts in the morning.',
        ),
        durationMinutes: 2,
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    title: text('კვერცხი პომიდვრითა და ისპანახით', 'Tomato and spinach eggs'),
    description: text(
      'სწრაფი ტაფის საუზმე ბოსტნეულით.',
      'A quick vegetable-packed skillet breakfast.',
    ),
    tips: text('ისპანახი ბოლოს დაამატე.', 'Add the spinach at the end.'),
    baseServings: 2,
    prepMinutes: 8,
    cookMinutes: 12,
    nutritionPerServing: macros(438, 27, 24, 26, 6, 510),
    applianceSlugs: ['stovetop'],
    ingredients: [
      { id: 'egg', name: text('კვერცხი', 'Eggs'), quantity: 4, unit: 'piece' },
      { id: 'tomato', name: text('პომიდორი', 'Tomato'), quantity: 2, unit: 'piece' },
      { id: 'spinach', name: text('ისპანახი', 'Spinach'), quantity: 100, unit: 'g' },
      {
        id: 'bread',
        name: text('მთლიანი მარცვლის პური', 'Whole-wheat bread'),
        quantity: 4,
        unit: 'piece',
      },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: text(
          'პომიდორი დაჭერი და ტაფაზე 4 წუთი მოშუშე.',
          'Chop the tomatoes and soften in a pan for 4 minutes.',
        ),
        durationMinutes: 4,
      },
      {
        stepNumber: 2,
        instruction: text(
          'კვერცხი ჩაამატე და ნელ ცეცხლზე მოურიე.',
          'Add the eggs and stir over low heat.',
        ),
        durationMinutes: 5,
      },
      {
        stepNumber: 3,
        instruction: text(
          'ისპანახი შეურიე და პურთან ერთად მიირთვი.',
          'Fold in the spinach and serve with bread.',
        ),
        durationMinutes: 2,
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000008',
    title: text('მაწვნის ჯამი ხილით', 'Matsoni bowl with fruit'),
    description: text(
      'მსუბუქი ქართული მაწვნის საუზმე სეზონური ხილით.',
      'A light matsoni breakfast with seasonal fruit.',
    ),
    tips: text('ხილი მხოლოდ მირთმევის წინ დაჭერი.', 'Cut the fruit just before serving.'),
    baseServings: 2,
    prepMinutes: 8,
    cookMinutes: 0,
    nutritionPerServing: macros(426, 21, 54, 15, 7, 180),
    applianceSlugs: [],
    ingredients: [
      { id: 'matsoni', name: text('მაწონი', 'Matsoni'), quantity: 500, unit: 'g' },
      { id: 'apple', name: text('ვაშლი', 'Apple'), quantity: 2, unit: 'piece' },
      { id: 'oats', name: text('შვრიის ფანტელი', 'Rolled oats'), quantity: 60, unit: 'g' },
      { id: 'honey', name: text('თაფლი', 'Honey'), quantity: 2, unit: 'tsp', optional: true },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: text('მაწონი ორ ჯამში გადაანაწილე.', 'Divide the matsoni between two bowls.'),
      },
      {
        stepNumber: 2,
        instruction: text(
          'ვაშლი დაჭერი და შვრიასთან ერთად მოაყარე.',
          'Dice the apple and add it with the oats.',
        ),
        durationMinutes: 5,
      },
      {
        stepNumber: 3,
        instruction: text('სურვილისამებრ თაფლი მოასხი.', 'Drizzle with honey if desired.'),
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    title: text('ქათმისა და ბრინჯის ჯამი', 'Chicken rice bowl'),
    description: text(
      'ქათამი, ბრინჯი და ფერადი ბოსტნეული.',
      'Chicken, rice, and colourful vegetables.',
    ),
    tips: text('ბრინჯი მომზადებამდე კარგად გარეცხე.', 'Rinse the rice well before cooking.'),
    baseServings: 4,
    prepMinutes: 15,
    cookMinutes: 30,
    nutritionPerServing: macros(684, 48, 78, 20, 8, 590),
    applianceSlugs: ['stovetop'],
    ingredients: [
      { id: 'chicken', name: text('ქათმის ფილე', 'Chicken breast'), quantity: 600, unit: 'g' },
      { id: 'rice', name: text('თეთრი ბრინჯი', 'White rice'), quantity: 300, unit: 'g' },
      { id: 'pepper', name: text('ბულგარული წიწაკა', 'Bell pepper'), quantity: 2, unit: 'piece' },
      { id: 'carrot', name: text('სტაფილო', 'Carrot'), quantity: 2, unit: 'piece' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: text(
          'ბრინჯი გარეცხე და შეფუთვის ინსტრუქციით მოხარშე.',
          'Rinse and cook the rice according to the packet.',
        ),
        durationMinutes: 20,
      },
      {
        stepNumber: 2,
        instruction: text(
          'ქათამი კუბებად დაჭერი და კარგად შეწვი.',
          'Dice the chicken and cook until browned through.',
        ),
        durationMinutes: 12,
      },
      {
        stepNumber: 3,
        instruction: text(
          'ბოსტნეული 6 წუთი მოშუშე და ყველაფერი ჯამებში გაანაწილე.',
          'Sauté the vegetables for 6 minutes and divide everything into bowls.',
        ),
        durationMinutes: 6,
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    title: text('კლასიკური ლობიო', 'Classic Georgian lobio'),
    description: text(
      'წითელი ლობიო ხახვით, ნიორითა და ქინძით.',
      'Kidney beans with onion, garlic, and coriander.',
    ),
    tips: text('ხმელი ლობიო წინა ღამით დაალბე.', 'Soak dried beans overnight.'),
    baseServings: 4,
    prepMinutes: 15,
    cookMinutes: 75,
    nutritionPerServing: macros(628, 28, 92, 16, 24, 460),
    applianceSlugs: ['stovetop'],
    ingredients: [
      {
        id: 'beans',
        name: text('წითელი ლობიო', 'Kidney beans'),
        quantity: 400,
        unit: 'g',
        preparationNote: text('ღამით დამბალი', 'soaked overnight'),
      },
      { id: 'onion', name: text('ხახვი', 'Onion'), quantity: 2, unit: 'piece' },
      { id: 'garlic', name: text('ნიორი', 'Garlic'), quantity: 3, unit: 'piece' },
      { id: 'coriander', name: text('ქინძი', 'Coriander'), quantity: 1, unit: 'pack' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: text(
          'დამბალი ლობიო ახალ წყალში დარბილებამდე მოხარშე.',
          'Simmer the soaked beans in fresh water until tender.',
        ),
        durationMinutes: 60,
      },
      {
        stepNumber: 2,
        instruction: text(
          'ხახვი და ნიორი ცალკე მოშუშე.',
          'Soften the onion and garlic in a separate pan.',
        ),
        durationMinutes: 8,
      },
      {
        stepNumber: 3,
        instruction: text(
          'ლობიოს ნაწილი დაჭყლიტე, ყველაფერი აურიე და ქინძი დაამატე.',
          'Mash some beans, combine everything, and finish with coriander.',
        ),
        durationMinutes: 5,
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    title: text('წითელი ოსპის სუპი', 'Red lentil soup'),
    description: text(
      'ეკონომიური, მცენარეული და თბილი სადილი.',
      'An affordable, plant-based warming lunch.',
    ),
    tips: text('სისქე ცხელი წყლით დაარეგულირე.', 'Adjust the thickness with hot water.'),
    baseServings: 4,
    prepMinutes: 10,
    cookMinutes: 35,
    nutritionPerServing: macros(592, 30, 86, 14, 19, 510),
    applianceSlugs: ['stovetop'],
    ingredients: [
      { id: 'lentils', name: text('წითელი ოსპი', 'Red lentils'), quantity: 320, unit: 'g' },
      { id: 'onion', name: text('ხახვი', 'Onion'), quantity: 1, unit: 'piece' },
      { id: 'carrot', name: text('სტაფილო', 'Carrot'), quantity: 2, unit: 'piece' },
      { id: 'tomato', name: text('პომიდორი', 'Tomato'), quantity: 3, unit: 'piece' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: text(
          'ხახვი და სტაფილო 6 წუთი მოშუშე.',
          'Soften the onion and carrot for 6 minutes.',
        ),
        durationMinutes: 6,
      },
      {
        stepNumber: 2,
        instruction: text(
          'ოსპი, პომიდორი და წყალი დაამატე.',
          'Add the lentils, tomatoes, and water.',
        ),
      },
      {
        stepNumber: 3,
        instruction: text(
          '25 წუთი ხარშე, შემდეგ მსუბუქად დააბლენდერე.',
          'Simmer for 25 minutes, then blend briefly.',
        ),
        durationMinutes: 25,
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    title: text('ღუმელში შემწვარი კალმახი და კარტოფილი', 'Baked trout with potatoes'),
    description: text('ლიმონიანი კალმახი ხრაშუნა კარტოფილით.', 'Lemony trout with crisp potatoes.'),
    tips: text('კალმახი ზედმეტად არ გამოაცხო.', 'Avoid overcooking the trout.'),
    baseServings: 2,
    prepMinutes: 15,
    cookMinutes: 35,
    nutritionPerServing: macros(724, 49, 71, 27, 10, 620),
    applianceSlugs: ['oven'],
    ingredients: [
      { id: 'trout', name: text('კალმახი', 'Trout'), quantity: 500, unit: 'g' },
      { id: 'potato', name: text('კარტოფილი', 'Potatoes'), quantity: 600, unit: 'g' },
      { id: 'lemon', name: text('ლიმონი', 'Lemon'), quantity: 1, unit: 'piece' },
      { id: 'parsley', name: text('ოხრახუში', 'Parsley'), quantity: 1, unit: 'pack' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: text(
          'ღუმელი 200°C-ზე გააცხელე და კარტოფილი დაჭერი.',
          'Heat the oven to 200°C and cut the potatoes.',
        ),
        temperatureCelsius: 200,
      },
      {
        stepNumber: 2,
        instruction: text('კარტოფილი 20 წუთი გამოაცხე.', 'Roast the potatoes for 20 minutes.'),
        durationMinutes: 20,
        temperatureCelsius: 200,
      },
      {
        stepNumber: 3,
        instruction: text(
          'კალმახი, ლიმონი და ოხრახუში დაამატე და კიდევ 15 წუთი აცხვე.',
          'Add the trout, lemon, and parsley and bake for 15 more minutes.',
        ),
        durationMinutes: 15,
        temperatureCelsius: 200,
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000007',
    title: text('ქათამი და ბოსტნეული ერთ ლანგარზე', 'One-tray chicken and vegetables'),
    description: text(
      'მარტივი ოჯახური ვახშამი მინიმალური ჭურჭლით.',
      'An easy family dinner with minimal washing up.',
    ),
    tips: text('ბოსტნეული თანაბარ ზომად დაჭერი.', 'Cut the vegetables to an even size.'),
    baseServings: 4,
    prepMinutes: 15,
    cookMinutes: 40,
    nutritionPerServing: macros(681, 52, 58, 25, 11, 540),
    applianceSlugs: ['oven'],
    ingredients: [
      { id: 'chicken', name: text('ქათმის ფილე', 'Chicken breast'), quantity: 700, unit: 'g' },
      { id: 'potato', name: text('კარტოფილი', 'Potatoes'), quantity: 700, unit: 'g' },
      { id: 'pepper', name: text('ბულგარული წიწაკა', 'Bell pepper'), quantity: 2, unit: 'piece' },
      { id: 'onion', name: text('ხახვი', 'Onion'), quantity: 2, unit: 'piece' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: text('ღუმელი 210°C-ზე გააცხელე.', 'Heat the oven to 210°C.'),
        temperatureCelsius: 210,
      },
      {
        stepNumber: 2,
        instruction: text(
          'ყველაფერი თანაბარ ნაჭრებად დაჭერი, შეაზავე და ლანგარზე გაანაწილე.',
          'Cut everything evenly, season, and spread over a tray.',
        ),
        durationMinutes: 15,
      },
      {
        stepNumber: 3,
        instruction: text(
          'ქათმის სრულ მომზადებამდე 35–40 წუთი გამოაცხე.',
          'Roast for 35–40 minutes until the chicken is cooked through.',
        ),
        durationMinutes: 40,
        temperatureCelsius: 210,
      },
    ],
  },
]

export const mockRecipes: MockRecipe[] = recipes

export const defaultMockProfile: ProfileInput = {
  displayName: 'ნინო',
  locale: 'ka',
  timezone: 'Asia/Tbilisi',
  city: 'თბილისი',
  preferredStoreId: 2,
  householdSize: 2,
  budgetPeriod: 'weekly',
  budgetAmountGel: 180,
  dailyCalorieTarget: 2000,
  proteinTargetG: 120,
  carbohydrateTargetG: 220,
  fatTargetG: 70,
  fiberTargetG: 30,
  mealsPerDay: 3,
  maxCookMinutes: 60,
  includeLeftovers: true,
  allowBatchCooking: true,
  applianceIds: [1, 2, 3, 5],
  allergenIds: [],
  dietaryPatternIds: [1],
}

export function createDefaultMockPersistedState(): MockPersistedState {
  return {
    session: null,
    onboardingComplete: true,
    profile: { ...defaultMockProfile },
    planReady: true,
    planRevision: 0,
    checkedGroceryItemIds: ['grocery-onion'],
    pantryItems: [
      { id: 'pantry-potato', ingredientId: 'potato', quantityGrams: 200, expiresOn: null },
      { id: 'pantry-onion', ingredientId: 'onion', quantityGrams: 250, expiresOn: null },
      { id: 'pantry-carrot', ingredientId: 'carrot', quantityGrams: 100, expiresOn: null },
      { id: 'pantry-rice', ingredientId: 'rice', quantityGrams: 100, expiresOn: null },
      { id: 'pantry-lentils', ingredientId: 'lentils', quantityGrams: 120, expiresOn: null },
      { id: 'pantry-oats', ingredientId: 'oats', quantityGrams: 80, expiresOn: null },
      { id: 'pantry-walnut', ingredientId: 'walnut', quantityGrams: 40, expiresOn: null },
    ],
    mealRecipeOverrides: {},
  }
}

function averageNutrition(meals: MockPlannedMeal[]): MacroTotals {
  const sums = meals.reduce(
    (total, meal) => ({
      calories: total.calories + meal.nutrition.calories,
      proteinG: total.proteinG + meal.nutrition.proteinG,
      carbohydrateG: total.carbohydrateG + meal.nutrition.carbohydrateG,
      fatG: total.fatG + meal.nutrition.fatG,
      fiberG: total.fiberG + meal.nutrition.fiberG,
      sodiumMg: total.sodiumMg + meal.nutrition.sodiumMg,
    }),
    macros(0, 0, 0, 0, 0, 0),
  )
  return Object.fromEntries(
    Object.entries(sums).map(([key, value]) => [key, Math.round((value / 7) * 10) / 10]),
  ) as unknown as MacroTotals
}

const recipeIdsBySlot = {
  breakfast: [recipes[0]!.id, recipes[1]!.id, recipes[2]!.id],
  lunch: [recipes[3]!.id, recipes[4]!.id, recipes[5]!.id],
  dinner: [recipes[6]!.id, recipes[7]!.id, recipes[4]!.id, recipes[5]!.id],
} as const

function mealOverrideKey(dayIndex: number, mealSlot: string): string {
  return `${dayIndex}:${mealSlot}`
}

function buildPlan(state: MockPersistedState): MockWeeklyPlan {
  const revision = state.planRevision
  const schedules = [
    [0, 3, 7, 1, 4, 4, 2, 5, 6, 0, 3, 5, 1, 4, 4, 2, 5, 5, 0, 5, 5],
    [1, 5, 4, 2, 3, 5, 0, 4, 6, 1, 3, 7, 2, 5, 4, 0, 4, 5, 1, 5, 4],
  ]
  const schedule = schedules[Math.abs(revision) % schedules.length] ?? schedules[0]!
  const slots = ['breakfast', 'lunch', 'dinner'] as const
  const availableAppliances = new Set(
    mockAppliances
      .filter((appliance) => state.profile.applianceIds.includes(appliance.id))
      .map((appliance) => appliance.slug),
  )
  const meals = schedule.map((recipeIndex, index): MockPlannedMeal => {
    const mealSlot = slots[index % 3]!
    const dayIndex = Math.floor(index / 3)
    const defaultRecipe = recipes[recipeIndex]!
    const allowedIds = recipeIdsBySlot[mealSlot].filter((recipeId) => {
      const candidate = recipes.find((recipe) => recipe.id === recipeId)
      return candidate?.applianceSlugs.every((slug) => availableAppliances.has(slug)) ?? false
    })
    const overrideId = state.mealRecipeOverrides[mealOverrideKey(dayIndex, mealSlot)]
    const safeDefaultRecipe =
      (allowedIds.includes(defaultRecipe.id) ? defaultRecipe : undefined) ??
      recipes.find((candidate) => candidate.id === allowedIds[0]) ??
      recipes[0]!
    const recipe =
      recipes.find(
        (candidate) => candidate.id === overrideId && allowedIds.includes(candidate.id),
      ) ?? safeDefaultRecipe
    const resolvedRecipeIndex = recipes.findIndex((candidate) => candidate.id === recipe.id)
    return {
      id: `mock-meal-${revision}-${index + 1}`,
      dayIndex,
      mealSlot,
      slotPosition: (index % 3) + 1,
      servings: 2,
      recipeId: recipe.id,
      nutrition: recipe.nutritionPerServing,
      estimatedCostGel: Math.round((5.2 + resolvedRecipeIndex * 0.43) * 100) / 100,
      alternativeRecipeIds: allowedIds.filter((recipeId) => recipeId !== recipe.id),
    }
  })
  return {
    id: `20000000-0000-4000-8000-${String(revision + 1).padStart(12, '0')}`,
    weekStartDate: getWeekStartDate(),
    summary: text(
      'ნიკორას სავარაუდო ფასებზე აწყობილი პრაქტიკული კვირა: ქართული კერძები, ორი სწრაფი საუზმე და ნარჩენების გონივრული გამოყენება.',
      'A practical week based on estimated Nikora prices, balancing Georgian favourites, quick breakfasts, and planned leftovers.',
    ),
    estimatedCostGel: 0,
    averageDailyNutrition: averageNutrition(meals),
    meals,
    warnings: ['MOCK_DATA', 'UNVERIFIED_NUTRITION', 'ESTIMATED_STORE_PRICES'],
  }
}

interface MockIngredientDefinition extends MockIngredientChoice {
  aisle: LocalizedText
  recipeUnitGrams: number
  packageSizeGrams: number
  purchaseUnit: MockGroceryItem['purchaseUnit']
  purchaseQuantityPerPackage: number
  packagePriceGel: number
}

const produce = text('ხილი და ბოსტნეული', 'Fruit & Vegetables')
const dairy = text('რძის პროდუქტები და კვერცხი', 'Dairy & Eggs')
const grains = text('ბურღულეული და მაკარონი', 'Grains & Pasta')
const seasonings = text('მწვანილი და სანელებლები', 'Herbs & Seasonings')

const ingredientDefinitions: MockIngredientDefinition[] = [
  {
    id: 'oats',
    name: text('შვრიის ფანტელი', 'Rolled oats'),
    aisle: grains,
    recipeUnitGrams: 1,
    packageSizeGrams: 500,
    purchaseUnit: 'g',
    purchaseQuantityPerPackage: 500,
    packagePriceGel: 3.4,
  },
  {
    id: 'milk',
    name: text('რძე', 'Milk'),
    aisle: dairy,
    recipeUnitGrams: 1,
    packageSizeGrams: 1000,
    purchaseUnit: 'l',
    purchaseQuantityPerPackage: 1,
    packagePriceGel: 4.2,
  },
  {
    id: 'banana',
    name: text('ბანანი', 'Bananas'),
    aisle: produce,
    recipeUnitGrams: 120,
    packageSizeGrams: 1000,
    purchaseUnit: 'kg',
    purchaseQuantityPerPackage: 1,
    packagePriceGel: 4.2,
  },
  {
    id: 'walnut',
    name: text('ნიგოზი', 'Walnuts'),
    aisle: text('სასუსნავი', 'Snacks'),
    recipeUnitGrams: 1,
    packageSizeGrams: 250,
    purchaseUnit: 'g',
    purchaseQuantityPerPackage: 250,
    packagePriceGel: 8.5,
  },
  {
    id: 'egg',
    name: text('კვერცხი', 'Eggs'),
    aisle: dairy,
    recipeUnitGrams: 50,
    packageSizeGrams: 500,
    purchaseUnit: 'piece',
    purchaseQuantityPerPackage: 10,
    packagePriceGel: 6.4,
  },
  {
    id: 'tomato',
    name: text('პომიდორი', 'Tomatoes'),
    aisle: produce,
    recipeUnitGrams: 150,
    packageSizeGrams: 1000,
    purchaseUnit: 'kg',
    purchaseQuantityPerPackage: 1,
    packagePriceGel: 4.9,
  },
  {
    id: 'spinach',
    name: text('ისპანახი', 'Spinach'),
    aisle: produce,
    recipeUnitGrams: 1,
    packageSizeGrams: 100,
    purchaseUnit: 'pack',
    purchaseQuantityPerPackage: 1,
    packagePriceGel: 3.5,
  },
  {
    id: 'bread',
    name: text('მთლიანი მარცვლის პური', 'Whole-wheat bread'),
    aisle: text('პური და საცხობი', 'Bakery'),
    recipeUnitGrams: 35,
    packageSizeGrams: 500,
    purchaseUnit: 'pack',
    purchaseQuantityPerPackage: 1,
    packagePriceGel: 3.5,
  },
  {
    id: 'matsoni',
    name: text('მაწონი', 'Matsoni'),
    aisle: dairy,
    recipeUnitGrams: 1,
    packageSizeGrams: 400,
    purchaseUnit: 'pack',
    purchaseQuantityPerPackage: 1,
    packagePriceGel: 2.9,
  },
  {
    id: 'apple',
    name: text('ვაშლი', 'Apples'),
    aisle: produce,
    recipeUnitGrams: 180,
    packageSizeGrams: 1000,
    purchaseUnit: 'kg',
    purchaseQuantityPerPackage: 1,
    packagePriceGel: 4.2,
  },
  {
    id: 'honey',
    name: text('თაფლი', 'Honey'),
    aisle: seasonings,
    recipeUnitGrams: 7,
    packageSizeGrams: 250,
    purchaseUnit: 'g',
    purchaseQuantityPerPackage: 250,
    packagePriceGel: 8,
  },
  {
    id: 'chicken',
    name: text('ქათმის ფილე', 'Chicken breast'),
    aisle: text('ხორცი და ფრინველი', 'Meat & Poultry'),
    recipeUnitGrams: 1,
    packageSizeGrams: 1000,
    purchaseUnit: 'kg',
    purchaseQuantityPerPackage: 1,
    packagePriceGel: 15.9,
  },
  {
    id: 'rice',
    name: text('თეთრი ბრინჯი', 'White rice'),
    aisle: grains,
    recipeUnitGrams: 1,
    packageSizeGrams: 1000,
    purchaseUnit: 'kg',
    purchaseQuantityPerPackage: 1,
    packagePriceGel: 4.9,
  },
  {
    id: 'pepper',
    name: text('ბულგარული წიწაკა', 'Bell peppers'),
    aisle: produce,
    recipeUnitGrams: 150,
    packageSizeGrams: 150,
    purchaseUnit: 'piece',
    purchaseQuantityPerPackage: 1,
    packagePriceGel: 1.7,
  },
  {
    id: 'carrot',
    name: text('სტაფილო', 'Carrots'),
    aisle: produce,
    recipeUnitGrams: 100,
    packageSizeGrams: 1000,
    purchaseUnit: 'kg',
    purchaseQuantityPerPackage: 1,
    packagePriceGel: 2.6,
  },
  {
    id: 'beans',
    name: text('წითელი ლობიო', 'Kidney beans'),
    aisle: grains,
    recipeUnitGrams: 1,
    packageSizeGrams: 1000,
    purchaseUnit: 'kg',
    purchaseQuantityPerPackage: 1,
    packagePriceGel: 7.1,
  },
  {
    id: 'onion',
    name: text('ხახვი', 'Onions'),
    aisle: produce,
    recipeUnitGrams: 150,
    packageSizeGrams: 1000,
    purchaseUnit: 'kg',
    purchaseQuantityPerPackage: 1,
    packagePriceGel: 2.2,
  },
  {
    id: 'garlic',
    name: text('ნიორი', 'Garlic'),
    aisle: seasonings,
    recipeUnitGrams: 5,
    packageSizeGrams: 100,
    purchaseUnit: 'pack',
    purchaseQuantityPerPackage: 1,
    packagePriceGel: 2,
  },
  {
    id: 'coriander',
    name: text('ქინძი', 'Coriander'),
    aisle: seasonings,
    recipeUnitGrams: 50,
    packageSizeGrams: 50,
    purchaseUnit: 'pack',
    purchaseQuantityPerPackage: 1,
    packagePriceGel: 1.5,
  },
  {
    id: 'lentils',
    name: text('წითელი ოსპი', 'Red lentils'),
    aisle: grains,
    recipeUnitGrams: 1,
    packageSizeGrams: 1000,
    purchaseUnit: 'kg',
    purchaseQuantityPerPackage: 1,
    packagePriceGel: 6.7,
  },
  {
    id: 'trout',
    name: text('კალმახი', 'Trout'),
    aisle: text('თევზეული', 'Seafood'),
    recipeUnitGrams: 1,
    packageSizeGrams: 1000,
    purchaseUnit: 'kg',
    purchaseQuantityPerPackage: 1,
    packagePriceGel: 24.9,
  },
  {
    id: 'potato',
    name: text('კარტოფილი', 'Potatoes'),
    aisle: produce,
    recipeUnitGrams: 1,
    packageSizeGrams: 1000,
    purchaseUnit: 'kg',
    purchaseQuantityPerPackage: 1,
    packagePriceGel: 2.5,
  },
  {
    id: 'lemon',
    name: text('ლიმონი', 'Lemons'),
    aisle: produce,
    recipeUnitGrams: 100,
    packageSizeGrams: 100,
    purchaseUnit: 'piece',
    purchaseQuantityPerPackage: 1,
    packagePriceGel: 1.2,
  },
  {
    id: 'parsley',
    name: text('ოხრახუში', 'Parsley'),
    aisle: seasonings,
    recipeUnitGrams: 40,
    packageSizeGrams: 40,
    purchaseUnit: 'pack',
    purchaseQuantityPerPackage: 1,
    packagePriceGel: 1.2,
  },
]

export const mockIngredients: MockIngredientChoice[] = ingredientDefinitions.map(
  ({ id, name }) => ({
    id,
    name,
  }),
)

function buildGroceryItems(
  plan: MockWeeklyPlan,
  pantryItems: MockPantryEntry[],
  checkedIds: string[],
  storePriceMultiplier: number,
): MockGroceryItem[] {
  const requiredByIngredient = new Map<string, number>()
  for (const meal of plan.meals) {
    const recipe = recipes.find((candidate) => candidate.id === meal.recipeId)
    if (!recipe) continue
    const servingScale = meal.servings / recipe.baseServings
    for (const ingredient of recipe.ingredients) {
      const definition = ingredientDefinitions.find((candidate) => candidate.id === ingredient.id)
      if (!definition) continue
      const grams = ingredient.quantity * definition.recipeUnitGrams * servingScale
      requiredByIngredient.set(
        ingredient.id,
        (requiredByIngredient.get(ingredient.id) ?? 0) + grams,
      )
    }
  }

  const pantryByIngredient = new Map<string, number>()
  for (const item of pantryItems) {
    pantryByIngredient.set(
      item.ingredientId,
      (pantryByIngredient.get(item.ingredientId) ?? 0) + item.quantityGrams,
    )
  }
  const checked = new Set(checkedIds)

  return ingredientDefinitions.flatMap((definition) => {
    const required = Math.round((requiredByIngredient.get(definition.id) ?? 0) * 10) / 10
    if (required <= 0) return []
    const pantryDeduction = Math.min(required, pantryByIngredient.get(definition.id) ?? 0)
    const needed = Math.max(0, required - pantryDeduction)
    const packageCount = needed === 0 ? 0 : Math.ceil(needed / definition.packageSizeGrams)
    return [
      {
        id: `grocery-${definition.id}`,
        ingredientId: definition.id,
        name: definition.name,
        aisle: definition.aisle,
        purchaseQuantity: packageCount * definition.purchaseQuantityPerPackage,
        purchaseUnit: definition.purchaseUnit,
        requiredQuantityGrams: required,
        pantryDeductionGrams: Math.round(pantryDeduction * 10) / 10,
        estimatedCostGel:
          Math.round(packageCount * definition.packagePriceGel * storePriceMultiplier * 100) / 100,
        checked: checked.has(`grocery-${definition.id}`),
      },
    ]
  })
}

export function createMockSufraSnapshot(state: MockPersistedState): MockSufraSnapshot {
  const store = mockStores.find((item) => item.id === state.profile.preferredStoreId)
  const initialPlan = state.planReady ? buildPlan(state) : null
  const groceryItems = initialPlan
    ? buildGroceryItems(
        initialPlan,
        state.pantryItems,
        state.checkedGroceryItemIds,
        storePriceMultipliers[store?.slug ?? 'nikora'] ?? 1,
      )
    : []
  const estimatedTotalGel =
    Math.round(groceryItems.reduce((total, item) => total + item.estimatedCostGel, 0) * 100) / 100
  const plan = initialPlan ? { ...initialPlan, estimatedCostGel: estimatedTotalGel } : null
  return {
    session: state.session,
    onboardingComplete: state.onboardingComplete,
    profile: state.profile,
    stores: mockStores,
    appliances: mockAppliances,
    allergens: mockAllergens,
    dietaryPatterns: mockDietaryPatterns,
    ingredients: mockIngredients,
    pantryItems: state.pantryItems.flatMap((item) => {
      const ingredient = mockIngredients.find((candidate) => candidate.id === item.ingredientId)
      return ingredient ? [{ ...item, name: ingredient.name }] : []
    }),
    recipes,
    plan,
    groceryList: plan
      ? {
          id: '30000000-0000-4000-8000-000000000001',
          estimatedTotalGel,
          store: text(
            store?.translations.find((item) => item.locale === 'ka')?.name ?? 'ნიკორა',
            store?.translations.find((item) => item.locale === 'en')?.name ?? 'Nikora',
          ),
          items: groceryItems,
        }
      : null,
  }
}

export function mockSignIn(state: MockPersistedState, email: string): MockPersistedState {
  return {
    ...state,
    session: { user: { id: '00000000-0000-4000-8000-000000000001', email } },
    onboardingComplete: true,
    planReady: true,
  }
}

export function mockSignUp(state: MockPersistedState, email: string): MockPersistedState {
  return {
    ...state,
    session: { user: { id: '00000000-0000-4000-8000-000000000001', email } },
    onboardingComplete: false,
    planReady: false,
    checkedGroceryItemIds: [],
    pantryItems: [],
    mealRecipeOverrides: {},
  }
}

export function mockSaveProfile(
  state: MockPersistedState,
  profile: ProfileInput,
): MockPersistedState {
  return { ...state, profile, onboardingComplete: true }
}

export function mockGeneratePlan(state: MockPersistedState): MockPersistedState {
  return {
    ...state,
    planReady: true,
    planRevision: state.planRevision + 1,
    checkedGroceryItemIds: [],
    mealRecipeOverrides: {},
  }
}

export function mockToggleGrocery(state: MockPersistedState, itemId: string): MockPersistedState {
  const ids = new Set(state.checkedGroceryItemIds)
  if (ids.has(itemId)) ids.delete(itemId)
  else ids.add(itemId)
  return { ...state, checkedGroceryItemIds: [...ids] }
}

export function mockSetPantryItem(
  state: MockPersistedState,
  ingredientId: string,
  quantityGrams: number,
  expiresOn: string | null = null,
): MockPersistedState {
  if (!mockIngredients.some((ingredient) => ingredient.id === ingredientId)) {
    throw new Error('Mock ingredient was not found.')
  }
  if (!Number.isFinite(quantityGrams) || quantityGrams <= 0 || quantityGrams > 100_000) {
    throw new Error('Pantry quantity must be between 1 and 100000 grams.')
  }
  if (expiresOn !== null && !/^\d{4}-\d{2}-\d{2}$/.test(expiresOn)) {
    throw new Error('Pantry expiry date must use YYYY-MM-DD.')
  }
  const entry: MockPantryEntry = {
    id: `pantry-${ingredientId}`,
    ingredientId,
    quantityGrams: Math.round(quantityGrams * 10) / 10,
    expiresOn,
  }
  return {
    ...state,
    pantryItems: [...state.pantryItems.filter((item) => item.ingredientId !== ingredientId), entry],
    checkedGroceryItemIds: [],
  }
}

export function mockRemovePantryItem(
  state: MockPersistedState,
  pantryItemId: string,
): MockPersistedState {
  return {
    ...state,
    pantryItems: state.pantryItems.filter((item) => item.id !== pantryItemId),
    checkedGroceryItemIds: [],
  }
}

export function mockSwapMeal(
  state: MockPersistedState,
  mealId: string,
  recipeId: string,
): MockPersistedState {
  const meal = buildPlan(state).meals.find((candidate) => candidate.id === mealId)
  if (!meal || !meal.alternativeRecipeIds.includes(recipeId)) {
    throw new Error('That recipe is not an eligible replacement for this meal.')
  }
  return {
    ...state,
    mealRecipeOverrides: {
      ...state.mealRecipeOverrides,
      [mealOverrideKey(meal.dayIndex, meal.mealSlot)]: recipeId,
    },
    checkedGroceryItemIds: [],
  }
}
