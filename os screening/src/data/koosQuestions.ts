// KOOS & WOMAC Questionnaire Instruments
// 42-Item KOOS instrument with embedded 24-Item WOMAC subscales
// Full English & Assamese bilingual text with verified clinical scoring formulas

export type KOOSResponse = 0 | 1 | 2 | 3 | 4;

export interface ResponseOption {
  value: KOOSResponse;
  label: string;
  label_as: string;
}

export const FREQUENCY_OPTIONS: ResponseOption[] = [
  { value: 4, label: 'Never', label_as: 'কেতিয়াও নহয়' },
  { value: 3, label: 'Rarely (Monthly)', label_as: 'কেতিয়াবা (মাহত এবাৰ)' },
  { value: 2, label: 'Sometimes (Weekly)', label_as: 'মাজে মাজে (সপ্তাহত কেইবাবাৰ)' },
  { value: 1, label: 'Often (Daily)', label_as: 'প্ৰায়ে (দৈনিক)' },
  { value: 0, label: 'Always (Constantly)', label_as: 'সদায় (অনবৰতে)' },
];

export const SEVERITY_OPTIONS: ResponseOption[] = [
  { value: 4, label: 'None', label_as: 'একেবাৰে নাই' },
  { value: 3, label: 'Mild', label_as: 'সামান্য' },
  { value: 2, label: 'Moderate', label_as: 'মধ্যমীয়া' },
  { value: 1, label: 'Severe', label_as: 'তীব্ৰ' },
  { value: 0, label: 'Extreme', label_as: 'অসহ্য / অত্যন্ত' },
];

export const DIFFICULTY_OPTIONS: ResponseOption[] = [
  { value: 4, label: 'None', label_as: 'কোনো অসুবিধা নাই' },
  { value: 3, label: 'Mild', label_as: 'সামান্য অসুবিধা' },
  { value: 2, label: 'Moderate', label_as: 'মধ্যমীয়া অসুবিধা' },
  { value: 1, label: 'Severe', label_as: 'অতি কষ্টকৰ' },
  { value: 0, label: 'Extreme / Unable', label_as: 'একেবাৰে নোৱাৰো' },
];

export interface QuestionnaireItem {
  id: string;
  subscale: 'symptoms' | 'pain' | 'adl' | 'sport' | 'qol';
  isWomac: boolean;
  womacCategory?: 'pain' | 'stiffness' | 'function';
  question: string;
  question_as: string;
  responseType: 'frequency' | 'severity' | 'difficulty';
}

export const QUESTIONNAIRE_ITEMS: QuestionnaireItem[] = [
  // ─── SYMPTOMS (S1–S7) ────────────────────────────────────────────────────────
  {
    id: 'S1',
    subscale: 'symptoms',
    isWomac: false,
    question: 'Do you have swelling in your knee?',
    question_as: 'আপোনাৰ হাঁটু ফুলাৰ সমস্যা আছে নেকি?',
    responseType: 'frequency',
  },
  {
    id: 'S2',
    subscale: 'symptoms',
    isWomac: false,
    question: 'Do you feel grinding, clicking or noise when your knee moves?',
    question_as: 'হাঁটু লৰচৰ কৰোঁতে শব্দ (কট্-কট্ বা ঘঁহনি) অনুভৱ হয়নে?',
    responseType: 'frequency',
  },
  {
    id: 'S3',
    subscale: 'symptoms',
    isWomac: false,
    question: 'Does your knee catch or hang up when moving?',
    question_as: 'খোজ কঢ়াৰ সময়ত হাঁটু হঠাতে আৱদ্ধ বা থমকি ৰয় নেকি?',
    responseType: 'frequency',
  },
  {
    id: 'S4',
    subscale: 'symptoms',
    isWomac: false,
    question: 'How difficult is it to straighten your knee fully?',
    question_as: 'হাঁটুখন সম্পূৰ্ণ পোন কৰিবলৈ কিমান অসুবিধা হয়?',
    responseType: 'difficulty',
  },
  {
    id: 'S5',
    subscale: 'symptoms',
    isWomac: false,
    question: 'How difficult is it to bend your knee fully?',
    question_as: 'হাঁটুখন সম্পূৰ্ণ ভাঁজ কৰিবলৈ কিমান কষ্ট হয়?',
    responseType: 'difficulty',
  },
  {
    id: 'S6',
    subscale: 'symptoms',
    isWomac: true,
    womacCategory: 'stiffness',
    question: 'How severe is your knee stiffness after first waking in the morning? (WOMAC Stiffness 1)',
    question_as: 'ৰাতিপুৱা টোপনিৰ পৰা উঠাৰ পিছত হাঁটুৰ টান অনুভৱ (Stiffness) কিমান তীব্ৰ?',
    responseType: 'severity',
  },
  {
    id: 'S7',
    subscale: 'symptoms',
    isWomac: true,
    womacCategory: 'stiffness',
    question: 'How severe is your knee stiffness after sitting or resting later in the day? (WOMAC Stiffness 2)',
    question_as: 'দিনৰ ভাগত কিছু সময় বহি বা জিৰণি লোৱাৰ পিছত হাঁটুৰ টান কিমান তীব্ৰ হয়?',
    responseType: 'severity',
  },

  // ─── PAIN (P1–P9) ────────────────────────────────────────────────────────────
  {
    id: 'P1',
    subscale: 'pain',
    isWomac: false,
    question: 'How often do you experience knee pain?',
    question_as: 'আপোনাৰ কিমান ঘনকৈ হাঁটুৰ বিষ হয়?',
    responseType: 'frequency',
  },
  {
    id: 'P2',
    subscale: 'pain',
    isWomac: false,
    question: 'Pain when twisting or pivoting on your knee',
    question_as: 'হাঁটু পকোৱা বা ঘূৰোৱাৰ সময়ত হোৱা বিষৰ মাত্ৰা',
    responseType: 'severity',
  },
  {
    id: 'P3',
    subscale: 'pain',
    isWomac: false,
    question: 'Pain when straightening your knee fully',
    question_as: 'হাঁটু সম্পূৰ্ণ পোন কৰাৰ সময়ত বিষ',
    responseType: 'severity',
  },
  {
    id: 'P4',
    subscale: 'pain',
    isWomac: false,
    question: 'Pain when bending your knee fully',
    question_as: 'হাঁটু সম্পূৰ্ণ ভাঁজ কৰাৰ সময়ত বিষ',
    responseType: 'severity',
  },
  {
    id: 'P5',
    subscale: 'pain',
    isWomac: true,
    womacCategory: 'pain',
    question: 'Pain walking on a flat surface (WOMAC Pain 1)',
    question_as: 'সমান মাটিত খোজ কাঢ়োঁতে হোৱা বিষৰ মাত্ৰা (WOMAC Pain 1)',
    responseType: 'severity',
  },
  {
    id: 'P6',
    subscale: 'pain',
    isWomac: true,
    womacCategory: 'pain',
    question: 'Pain going up or down stairs / inclines (WOMAC Pain 2)',
    question_as: 'চিৰি বা পাহাৰীয়া ঢালু বাটত উঠা-নমা কৰোঁতে বিষ (WOMAC Pain 2)',
    responseType: 'severity',
  },
  {
    id: 'P7',
    subscale: 'pain',
    isWomac: true,
    womacCategory: 'pain',
    question: 'Pain at night while in bed / resting (WOMAC Pain 3)',
    question_as: 'ৰাতি শোৱাৰ সময়ত বা জিৰণি লওঁতে হাঁটুৰ বিষ (WOMAC Pain 3)',
    responseType: 'severity',
  },
  {
    id: 'P8',
    subscale: 'pain',
    isWomac: true,
    womacCategory: 'pain',
    question: 'Pain sitting or lying down (WOMAC Pain 4)',
    question_as: 'বহি থাকোঁতে বা শুই থাকোঁতে বিষ (WOMAC Pain 4)',
    responseType: 'severity',
  },
  {
    id: 'P9',
    subscale: 'pain',
    isWomac: true,
    womacCategory: 'pain',
    question: 'Pain standing upright for long shifts (WOMAC Pain 5)',
    question_as: 'দীৰ্ঘসময় পোন হৈ থিয় হৈ থাকোঁতে বিষ (WOMAC Pain 5)',
    responseType: 'severity',
  },

  // ─── ACTIVITIES OF DAILY LIVING / WOMAC FUNCTION (A1–A17) ───────────────────
  {
    id: 'A1',
    subscale: 'adl',
    isWomac: true,
    womacCategory: 'function',
    question: 'Descending stairs / going down slope (WOMAC Function 1)',
    question_as: 'চিৰি বা ঢালুৰে তললৈ নমা (WOMAC Function 1)',
    responseType: 'difficulty',
  },
  {
    id: 'A2',
    subscale: 'adl',
    isWomac: true,
    womacCategory: 'function',
    question: 'Ascending stairs / climbing hill (WOMAC Function 2)',
    question_as: 'চিৰি বা ওখ পাহাৰলৈ উঠা (WOMAC Function 2)',
    responseType: 'difficulty',
  },
  {
    id: 'A3',
    subscale: 'adl',
    isWomac: true,
    womacCategory: 'function',
    question: 'Rising from sitting on a chair/stool (WOMAC Function 3)',
    question_as: 'কুৰ্চি বা পীৰাৰ পৰা থিয় হোৱা (WOMAC Function 3)',
    responseType: 'difficulty',
  },
  {
    id: 'A4',
    subscale: 'adl',
    isWomac: true,
    womacCategory: 'function',
    question: 'Standing for continuous periods (WOMAC Function 4)',
    question_as: 'একেৰাহে থিয় হৈ থকা (WOMAC Function 4)',
    responseType: 'difficulty',
  },
  {
    id: 'A5',
    subscale: 'adl',
    isWomac: true,
    womacCategory: 'function',
    question: 'Bending to floor / picking up an object (WOMAC Function 5)',
    question_as: 'মাটিৰ পৰা বস্তু তুলিবলৈ তললৈ বেঁকা হোৱা (WOMAC Function 5)',
    responseType: 'difficulty',
  },
  {
    id: 'A6',
    subscale: 'adl',
    isWomac: true,
    womacCategory: 'function',
    question: 'Walking on flat village road (WOMAC Function 6)',
    question_as: 'সমান পথত খোজ কঢ়া (WOMAC Function 6)',
    responseType: 'difficulty',
  },
  {
    id: 'A7',
    subscale: 'adl',
    isWomac: true,
    womacCategory: 'function',
    question: 'Getting in/out of bus/auto/rickshaw (WOMAC Function 7)',
    question_as: 'বাছ, অটো বা গাড়ীত উঠা-নমা কৰা (WOMAC Function 7)',
    responseType: 'difficulty',
  },
  {
    id: 'A8',
    subscale: 'adl',
    isWomac: true,
    womacCategory: 'function',
    question: 'Going to market / village shop (WOMAC Function 8)',
    question_as: 'বজাৰ বা হাটলৈ যোৱা (WOMAC Function 8)',
    responseType: 'difficulty',
  },
  {
    id: 'A9',
    subscale: 'adl',
    isWomac: true,
    womacCategory: 'function',
    question: 'Putting on socks/stockings/shoes (WOMAC Function 9)',
    question_as: 'জোতা বা মোজা পিন্ধা (WOMAC Function 9)',
    responseType: 'difficulty',
  },
  {
    id: 'A10',
    subscale: 'adl',
    isWomac: true,
    womacCategory: 'function',
    question: 'Rising from bed in the morning (WOMAC Function 10)',
    question_as: 'ৰাতিপুৱা বিছনাৰ পৰা উঠা (WOMAC Function 10)',
    responseType: 'difficulty',
  },
  {
    id: 'A11',
    subscale: 'adl',
    isWomac: true,
    womacCategory: 'function',
    question: 'Taking off socks/shoes (WOMAC Function 11)',
    question_as: 'জোতা বা মোজা খোলা (WOMAC Function 11)',
    responseType: 'difficulty',
  },
  {
    id: 'A12',
    subscale: 'adl',
    isWomac: true,
    womacCategory: 'function',
    question: 'Lying in bed / turning over (WOMAC Function 12)',
    question_as: 'বিছনাত কাটি হোৱা বা বাগৰ সলোৱা (WOMAC Function 12)',
    responseType: 'difficulty',
  },
  {
    id: 'A13',
    subscale: 'adl',
    isWomac: true,
    womacCategory: 'function',
    question: 'Getting in/out of bath / pond (WOMAC Function 13)',
    question_as: 'গা ধোৱা বা পুখুৰী/নলকূপত বহা (WOMAC Function 13)',
    responseType: 'difficulty',
  },
  {
    id: 'A14',
    subscale: 'adl',
    isWomac: true,
    womacCategory: 'function',
    question: 'Sitting down on chair/bench (WOMAC Function 14)',
    question_as: 'কুৰ্চি বা বেঞ্চত বহা (WOMAC Function 14)',
    responseType: 'difficulty',
  },
  {
    id: 'A15',
    subscale: 'adl',
    isWomac: true,
    womacCategory: 'function',
    question: 'Getting on/off Indian or Western toilet (WOMAC Function 15)',
    question_as: 'শৌচাগাৰত বহা আৰু উঠা (WOMAC Function 15)',
    responseType: 'difficulty',
  },
  {
    id: 'A16',
    subscale: 'adl',
    isWomac: true,
    womacCategory: 'function',
    question: 'Heavy domestic duties: carrying water, field work, harvesting (WOMAC Function 16)',
    question_as: 'ভাৰী কাম: পানী কঢ়িওৱা, ধান কটা, বা চাহপাত তোলা (WOMAC Function 16)',
    responseType: 'difficulty',
  },
  {
    id: 'A17',
    subscale: 'adl',
    isWomac: true,
    womacCategory: 'function',
    question: 'Light domestic duties: cooking, sweeping, dusting (WOMAC Function 17)',
    question_as: 'পাতল কাম: ৰন্ধা-বঢ়া, ঝাড়ু দিয়া, বা চাফা কৰা (WOMAC Function 17)',
    responseType: 'difficulty',
  },

  // ─── SPORT & RECREATION (SP1–SP5) ────────────────────────────────────────────
  {
    id: 'SP1',
    subscale: 'sport',
    isWomac: false,
    question: 'Squatting down fully to the floor',
    question_as: 'মাটিত সম্পূৰ্ণ উবুৰি হৈ বহা (Squatting)',
    responseType: 'difficulty',
  },
  {
    id: 'SP2',
    subscale: 'sport',
    isWomac: false,
    question: 'Running or brisk jogging',
    question_as: 'দৌৰা বা খৰকৈ খোজ কঢ়া',
    responseType: 'difficulty',
  },
  {
    id: 'SP3',
    subscale: 'sport',
    isWomac: false,
    question: 'Jumping / stepping over ditches',
    question_as: 'জঁপিয়াই খাৱৈ বা নলা পাৰ হোৱা',
    responseType: 'difficulty',
  },
  {
    id: 'SP4',
    subscale: 'sport',
    isWomac: false,
    question: 'Twisting / pivoting sharply on knee',
    question_as: 'হঠাতে ঘূৰা বা পিছল খোৱা',
    responseType: 'difficulty',
  },
  {
    id: 'SP5',
    subscale: 'sport',
    isWomac: false,
    question: 'Kneeling on hard ground or floor',
    question_as: 'টান মাটিত আঁঠু কাঢ়ি বহা',
    responseType: 'difficulty',
  },

  // ─── QUALITY OF LIFE (Q1–Q4) ─────────────────────────────────────────────────
  {
    id: 'Q1',
    subscale: 'qol',
    isWomac: false,
    question: 'How often are you aware of your knee problem?',
    question_as: 'আপুনি কিমানবাৰ হাঁটুৰ বিষ বা সমস্যাৰ কথা অনুভৱ কৰে?',
    responseType: 'frequency',
  },
  {
    id: 'Q2',
    subscale: 'qol',
    isWomac: false,
    question: 'Have you modified lifestyle to avoid knee damage?',
    question_as: 'হাঁটুৰ ক্ষতিৰ পৰা ৰক্ষা পাবলৈ কাম-কাজ সলনি কৰিছে নেকি?',
    responseType: 'frequency',
  },
  {
    id: 'Q3',
    subscale: 'qol',
    isWomac: false,
    question: 'How troubled are you by lack of confidence in knee?',
    question_as: 'হাঁটুৰ দুৰ্বলতাৰ বাবে আত্মবিশ্বাসহীনতাত কিমান চিন্তিত?',
    responseType: 'severity',
  },
  {
    id: 'Q4',
    subscale: 'qol',
    isWomac: false,
    question: 'In general, how much overall difficulty with knee?',
    question_as: 'সামগ্ৰিকভাৱে হাঁটুৰ বাবে জীৱনত কিমান কষ্ট অনুভৱ হয়?',
    responseType: 'difficulty',
  },
];

// ─── SCORING FORMULAS ──────────────────────────────────────────────────────────

export function scoreKOOSSubscale(
  responses: Record<string, KOOSResponse>,
  subscale: QuestionnaireItem['subscale']
): number {
  const items = QUESTIONNAIRE_ITEMS.filter((i) => i.subscale === subscale);
  const answered = items.filter((i) => responses[i.id] !== undefined);
  if (answered.length === 0) return 100;

  const mean = answered.reduce((sum, item) => sum + (responses[item.id] ?? 4), 0) / answered.length;
  // 100 = optimal joint function, 0 = severe impairment
  return Math.round((mean / 4) * 100);
}

export function scoreAllKOOS(responses: Record<string, KOOSResponse>) {
  return {
    symptoms: scoreKOOSSubscale(responses, 'symptoms'),
    pain: scoreKOOSSubscale(responses, 'pain'),
    adl: scoreKOOSSubscale(responses, 'adl'),
    sport: scoreKOOSSubscale(responses, 'sport'),
    qol: scoreKOOSSubscale(responses, 'qol'),
  };
}

export function scoreWOMAC(responses: Record<string, KOOSResponse>) {
  // WOMAC Pain: 5 items (P5–P9). Raw 0-20.
  const painItems = QUESTIONNAIRE_ITEMS.filter((i) => i.isWomac && i.womacCategory === 'pain');
  // Inverted: 0=no pain, 4=extreme pain for standard WOMAC
  const painScore = painItems.reduce((acc, it) => acc + (4 - (responses[it.id] ?? 4)), 0);

  // WOMAC Stiffness: 2 items (S6, S7). Raw 0-8.
  const stiffItems = QUESTIONNAIRE_ITEMS.filter((i) => i.isWomac && i.womacCategory === 'stiffness');
  const stiffScore = stiffItems.reduce((acc, it) => acc + (4 - (responses[it.id] ?? 4)), 0);

  // WOMAC Function: 17 items (A1–A17). Raw 0-68.
  const fnItems = QUESTIONNAIRE_ITEMS.filter((i) => i.isWomac && i.womacCategory === 'function');
  const fnScore = fnItems.reduce((acc, it) => acc + (4 - (responses[it.id] ?? 4)), 0);

  // Total WOMAC Score: 0 to 96, Normalized to 0–100 (100 = maximum severity)
  const rawTotal = painScore + stiffScore + fnScore;
  const normalizedTotal = Math.round((rawTotal / 96) * 100);

  return {
    pain: painScore,
    painMax: 20,
    stiffness: stiffScore,
    stiffnessMax: 8,
    function: fnScore,
    functionMax: 68,
    rawTotal,
    totalNormalized: normalizedTotal, // 0-100 where higher = worse OA
  };
}

// ─── RISK FACTOR & RED FLAG INTERFACES ────────────────────────────────────────

export interface RiskFactorAnswers {
  age?: number;
  bmiCategory?: 'normal' | 'overweight' | 'obese';
  occupation?: 'sedentary' | 'moderate' | 'heavy';
  priorInjury?: boolean;
  familyHistory?: boolean;
  symptomDurationMonths?: number;
}

export const RED_FLAG_QUESTIONS = [
  {
    id: 'RF1',
    text: 'Recent acute trauma / fall on knee within last 48 hours with inability to bear weight',
    text_as: 'যোৱা ৪৮ ঘণ্টাত হাঁটুৰ ওপৰত হঠাৎ আঘাত/পৰি যোৱা আৰু ভৰি পেলাব নোৱাৰা অৱস্থা',
  },
  {
    id: 'RF2',
    text: 'Hot, red, erythematous, acutely swollen joint with systemic fever / chills',
    text_as: 'হাঁটু অত্যাধিক তপত, ৰঙা পৰি ফুলি উঠা আৰু লগতে জ্বৰ-কঁপনি থকা',
  },
  {
    id: 'RF3',
    text: 'Rapid unexplained progressive worsening of joint pain with significant night sweating / weight loss',
    text_as: 'অতি দ্ৰুতগতিত বিষ বৃদ্ধি আৰু অস্বাভাৱিক ওজন হ্ৰাস বা ৰাতি ঘাম ওলোৱা',
  },
];
