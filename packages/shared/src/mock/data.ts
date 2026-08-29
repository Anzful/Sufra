import { getWeekStartDate } from '../logic/week.ts'
import type { LocalizedText, MacroTotals } from '../domain/types.ts'
import type { ProfileInput } from '../schemas/profile.ts'
import type {
  MockChoice,
  MockGroceryItem,
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
    checkedGroceryItemIds: ['grocery-04'],
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

function buildPlan(revision: number): MockWeeklyPlan {
  const schedules = [
    [0, 3, 6, 1, 4, 7, 2, 5, 6, 0, 3, 7, 1, 5, 6, 2, 4, 7, 0, 3, 6],
    [1, 5, 7, 2, 3, 6, 0, 4, 7, 1, 3, 6, 2, 5, 7, 0, 4, 6, 1, 3, 7],
  ]
  const schedule = schedules[Math.abs(revision) % schedules.length] ?? schedules[0]!
  const slots = ['breakfast', 'lunch', 'dinner'] as const
  const meals = schedule.map((recipeIndex, index): MockPlannedMeal => {
    const recipe = recipes[recipeIndex]!
    return {
      id: `mock-meal-${revision}-${index + 1}`,
      dayIndex: Math.floor(index / 3),
      mealSlot: slots[index % 3]!,
      slotPosition: (index % 3) + 1,
      servings: 2,
      recipeId: recipe.id,
      nutrition: recipe.nutritionPerServing,
      estimatedCostGel: Math.round((5.2 + recipeIndex * 0.43) * 100) / 100,
    }
  })
  return {
    id: `20000000-0000-4000-8000-${String(revision + 1).padStart(12, '0')}`,
    weekStartDate: getWeekStartDate(),
    summary: text(
      'ნიკორას სავარაუდო ფასებზე აწყობილი პრაქტიკული კვირა: ქართული კერძები, ორი სწრაფი საუზმე და ნარჩენების გონივრული გამოყენება.',
      'A practical week based on estimated Nikora prices, balancing Georgian favourites, quick breakfasts, and planned leftovers.',
    ),
    estimatedCostGel: revision % 2 === 0 ? 174.65 : 171.2,
    averageDailyNutrition: averageNutrition(meals),
    meals,
    warnings: ['MOCK_DATA', 'UNVERIFIED_NUTRITION', 'ESTIMATED_STORE_PRICES'],
  }
}

const groceryBase: Omit<MockGroceryItem, 'checked'>[] = [
  {
    id: 'grocery-01',
    name: text('ქათმის ფილე', 'Chicken breast'),
    aisle: text('ხორცი და ფრინველი', 'Meat & Poultry'),
    purchaseQuantity: 2,
    purchaseUnit: 'kg',
    requiredQuantityGrams: 1900,
    pantryDeductionGrams: 0,
    estimatedCostGel: 31.8,
  },
  {
    id: 'grocery-02',
    name: text('კალმახი', 'Trout'),
    aisle: text('თევზეული', 'Seafood'),
    purchaseQuantity: 1,
    purchaseUnit: 'kg',
    requiredQuantityGrams: 1000,
    pantryDeductionGrams: 0,
    estimatedCostGel: 24.9,
  },
  {
    id: 'grocery-03',
    name: text('კარტოფილი', 'Potatoes'),
    aisle: text('ხილი და ბოსტნეული', 'Fruit & Vegetables'),
    purchaseQuantity: 3,
    purchaseUnit: 'kg',
    requiredQuantityGrams: 2800,
    pantryDeductionGrams: 200,
    estimatedCostGel: 7.5,
  },
  {
    id: 'grocery-04',
    name: text('ხახვი', 'Onions'),
    aisle: text('ხილი და ბოსტნეული', 'Fruit & Vegetables'),
    purchaseQuantity: 2,
    purchaseUnit: 'kg',
    requiredQuantityGrams: 1800,
    pantryDeductionGrams: 250,
    estimatedCostGel: 4.4,
  },
  {
    id: 'grocery-05',
    name: text('პომიდორი', 'Tomatoes'),
    aisle: text('ხილი და ბოსტნეული', 'Fruit & Vegetables'),
    purchaseQuantity: 2,
    purchaseUnit: 'kg',
    requiredQuantityGrams: 1700,
    pantryDeductionGrams: 0,
    estimatedCostGel: 9.8,
  },
  {
    id: 'grocery-06',
    name: text('სტაფილო', 'Carrots'),
    aisle: text('ხილი და ბოსტნეული', 'Fruit & Vegetables'),
    purchaseQuantity: 1,
    purchaseUnit: 'kg',
    requiredQuantityGrams: 900,
    pantryDeductionGrams: 100,
    estimatedCostGel: 2.6,
  },
  {
    id: 'grocery-07',
    name: text('ბულგარული წიწაკა', 'Bell peppers'),
    aisle: text('ხილი და ბოსტნეული', 'Fruit & Vegetables'),
    purchaseQuantity: 6,
    purchaseUnit: 'piece',
    requiredQuantityGrams: 750,
    pantryDeductionGrams: 0,
    estimatedCostGel: 10.2,
  },
  {
    id: 'grocery-08',
    name: text('ბანანი', 'Bananas'),
    aisle: text('ხილი და ბოსტნეული', 'Fruit & Vegetables'),
    purchaseQuantity: 1.5,
    purchaseUnit: 'kg',
    requiredQuantityGrams: 1400,
    pantryDeductionGrams: 0,
    estimatedCostGel: 6.3,
  },
  {
    id: 'grocery-09',
    name: text('ვაშლი', 'Apples'),
    aisle: text('ხილი და ბოსტნეული', 'Fruit & Vegetables'),
    purchaseQuantity: 1,
    purchaseUnit: 'kg',
    requiredQuantityGrams: 900,
    pantryDeductionGrams: 0,
    estimatedCostGel: 4.2,
  },
  {
    id: 'grocery-10',
    name: text('რძე', 'Milk'),
    aisle: text('რძის პროდუქტები და კვერცხი', 'Dairy & Eggs'),
    purchaseQuantity: 2,
    purchaseUnit: 'l',
    requiredQuantityGrams: 2000,
    pantryDeductionGrams: 0,
    estimatedCostGel: 8.4,
  },
  {
    id: 'grocery-11',
    name: text('მაწონი', 'Matsoni'),
    aisle: text('რძის პროდუქტები და კვერცხი', 'Dairy & Eggs'),
    purchaseQuantity: 4,
    purchaseUnit: 'pack',
    requiredQuantityGrams: 1600,
    pantryDeductionGrams: 0,
    estimatedCostGel: 11.6,
  },
  {
    id: 'grocery-12',
    name: text('კვერცხი', 'Eggs'),
    aisle: text('რძის პროდუქტები და კვერცხი', 'Dairy & Eggs'),
    purchaseQuantity: 20,
    purchaseUnit: 'piece',
    requiredQuantityGrams: 1000,
    pantryDeductionGrams: 0,
    estimatedCostGel: 12.8,
  },
  {
    id: 'grocery-13',
    name: text('თეთრი ბრინჯი', 'White rice'),
    aisle: text('ბურღულეული და მაკარონი', 'Grains & Pasta'),
    purchaseQuantity: 1,
    purchaseUnit: 'kg',
    requiredQuantityGrams: 900,
    pantryDeductionGrams: 100,
    estimatedCostGel: 4.9,
  },
  {
    id: 'grocery-14',
    name: text('წითელი ლობიო', 'Kidney beans'),
    aisle: text('ბურღულეული და მაკარონი', 'Grains & Pasta'),
    purchaseQuantity: 1,
    purchaseUnit: 'kg',
    requiredQuantityGrams: 800,
    pantryDeductionGrams: 0,
    estimatedCostGel: 7.1,
  },
  {
    id: 'grocery-15',
    name: text('წითელი ოსპი', 'Red lentils'),
    aisle: text('ბურღულეული და მაკარონი', 'Grains & Pasta'),
    purchaseQuantity: 1,
    purchaseUnit: 'kg',
    requiredQuantityGrams: 640,
    pantryDeductionGrams: 120,
    estimatedCostGel: 6.7,
  },
  {
    id: 'grocery-16',
    name: text('შვრიის ფანტელი', 'Rolled oats'),
    aisle: text('ბურღულეული და მაკარონი', 'Grains & Pasta'),
    purchaseQuantity: 1,
    purchaseUnit: 'kg',
    requiredQuantityGrams: 620,
    pantryDeductionGrams: 80,
    estimatedCostGel: 5.2,
  },
  {
    id: 'grocery-17',
    name: text('ნიგოზი', 'Walnuts'),
    aisle: text('სასუსნავი', 'Snacks'),
    purchaseQuantity: 250,
    purchaseUnit: 'g',
    requiredQuantityGrams: 210,
    pantryDeductionGrams: 40,
    estimatedCostGel: 8.5,
  },
  {
    id: 'grocery-18',
    name: text('მწვანილი და სანელებლები', 'Herbs and seasonings'),
    aisle: text('სანელებლები', 'Seasonings'),
    purchaseQuantity: 4,
    purchaseUnit: 'pack',
    requiredQuantityGrams: 250,
    pantryDeductionGrams: 0,
    estimatedCostGel: 8.05,
  },
]

export function createMockSufraSnapshot(state: MockPersistedState): MockSufraSnapshot {
  const plan = state.planReady ? buildPlan(state.planRevision) : null
  const checked = new Set(state.checkedGroceryItemIds)
  const store = mockStores.find((item) => item.id === state.profile.preferredStoreId)
  return {
    session: state.session,
    onboardingComplete: state.onboardingComplete,
    profile: state.profile,
    stores: mockStores,
    appliances: mockAppliances,
    allergens: mockAllergens,
    dietaryPatterns: mockDietaryPatterns,
    recipes,
    plan,
    groceryList: plan
      ? {
          id: '30000000-0000-4000-8000-000000000001',
          estimatedTotalGel: plan.estimatedCostGel,
          store: text(
            store?.translations.find((item) => item.locale === 'ka')?.name ?? 'ნიკორა',
            store?.translations.find((item) => item.locale === 'en')?.name ?? 'Nikora',
          ),
          items: groceryBase.map((item) => ({ ...item, checked: checked.has(item.id) })),
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
  }
}

export function mockToggleGrocery(state: MockPersistedState, itemId: string): MockPersistedState {
  const ids = new Set(state.checkedGroceryItemIds)
  if (ids.has(itemId)) ids.delete(itemId)
  else ids.add(itemId)
  return { ...state, checkedGroceryItemIds: [...ids] }
}
