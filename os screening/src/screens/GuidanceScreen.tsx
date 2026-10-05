import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/ui/AppHeader';
import { api } from '../api/client';

interface GuidanceCardItem {
  id: string;
  title: string;
  title_as?: string;
  category: 'exercise' | 'lifestyle' | 'diet' | 'ergonomics' | 'pain_relief';
  target_risk?: string;
  description: string;
  desc_as?: string;
  reps?: string;
  duration?: string;
  steps?: string[];
  steps_as?: string[];
  icon?: string;
  videoUrl?: string;
}

const FALLBACK_ITEMS: GuidanceCardItem[] = [
  {
    id: 'G1',
    title: 'Chair-Assisted Sit-to-Stand (Quadriceps Strengthening)',
    title_as: 'কুৰ্চি-সহায়ত উঠা-বহা (উৰুৰ পেশী শক্তিশালীকৰণ)',
    category: 'exercise',
    target_risk: '["Low Risk","Moderate Risk","High Risk"]',
    description: 'Builds vital leg power to decompress knee joints during daily rising and walking on hilly terrain.',
    desc_as: 'দৈনন্দিন উঠা-বহা আৰু পাহাৰীয়া বাটত খোজ কঢ়াৰ সময়ত হাঁটুৰ ওপৰত পৰা চাপ হ্ৰাস কৰে।',
    reps: '10–12 repetitions',
    duration: '2 sets daily',
    icon: 'chair',
    steps: [
      'Sit tall on a sturdy wooden chair with feet hip-width flat on the ground.',
      'Cross your arms across your chest or hold the chair armrests lightly.',
      'Lean slightly forward from the hips and stand up smoothly using your thigh power.',
      'Pause for 1 second at the top, then slowly lower yourself back down without dropping.',
    ],
    steps_as: [
      'এখন মজবুত কাঠৰ কুৰ্চিত ভৰি দুখন সমতলকৈ থৈ পোন হৈ বহক।',
      'হাত দুখন বুকুত আটাই লওক অথবা লাহেকৈ কুৰ্চিৰ হাতলত ধৰক।',
      'লাহেকৈ শৰীৰটো আগলৈ ভাঁজ কৰি উৰুৰ শক্তিত পোন হৈ থিয় হওক।',
      'ওপৰত ১ ছেকেণ্ড ৰওক আৰু ধপচকৈ নপৰাকৈ নিয়ন্ত্ৰিতভাৱে বহক।',
    ],
  },
  {
    id: 'G2',
    title: 'Straight-Leg Raises (Non-Weightbearing Isometric)',
    title_as: 'পোন ভৰিৰ উত্তোলন (শূন্য-চাপ আইছ’মেট্ৰিক ব্যায়াম)',
    category: 'exercise',
    target_risk: '["Low Risk","Moderate Risk","High Risk"]',
    description: 'Strengthens quadriceps without cartilage compression, ideal for acute knee pain or swollen joints.',
    desc_as: 'হাঁটুত কোনো ঘঁহনি নোহোৱাকৈ উৰু পেশী শক্তিশালী কৰে, বিষ আৰু ফুলাৰ বাবে অতি উপযোগী।',
    reps: '12–15 reps per leg',
    duration: '3 sets, twice daily',
    icon: 'accessibility_new',
    steps: [
      'Lie flat on your back on a firm mat with one knee bent and the other straight.',
      'Tighten the top thigh muscle of the straight leg and flex your foot toward your chin.',
      'Lift the straight leg up about 12 inches (to level of opposite bent knee).',
      'Hold for 5 seconds, then slowly lower down to rest.',
    ],
    steps_as: [
      'মজিয়াত বা পাটিত চিত হৈ শুই এখন ভৰি ভাঁজ কৰক আৰু আনখন পোন কৰি ৰাখক।',
      'পোন ভৰিৰ উৰুৰ পেশী টান কৰক আৰু ভৰিৰ আঙুলি নিজৰ পিনে টানি ৰাখক।',
      'ভৰিখন মজিয়াৰ পৰা প্ৰায় ১২ ইঞ্চি ওপৰলৈ উঠাওক।',
      '৫ ছেকেণ্ড ধৰি ৰাখক আৰু লাহেকৈ নমাই দিয়ক।',
    ],
  },
  {
    id: 'G3',
    title: 'Tea Garden Ergonomics & Plucking Posture',
    title_as: 'চাহ বাগিচাত শ্ৰমৰ সঠিক ভঙ্গিমা আৰু সাৱধানতা',
    category: 'ergonomics',
    target_risk: '["Moderate Risk","High Risk"]',
    description: 'Prevents acute knee torque and lumbar strain when carrying tea baskets across slopes.',
    desc_as: 'ঢালু মাটিত পাত তোলোতে আৰু ঝুড়ি কঢ়িয়াওতে হাঁটুৰ গাঁঠিৰ ক্ষতি ৰোধ কৰে।',
    reps: 'Continuous practice',
    duration: 'Every working hour',
    icon: 'agriculture',
    steps: [
      'Distribute basket weight evenly across both shoulders using wide padded straps.',
      'Avoid deep twisting or pivoting on a planted foot on steep tea garden slopes.',
      'Keep your knees slightly soft and unlocked when standing for prolonged plucking shifts.',
      'Take a 2-minute seated micro-break every 45 minutes of heavy harvesting.',
    ],
    steps_as: [
      'কান্ধৰ বহল গদিযুক্ত ফিটাৰে ঝুড়িৰ ওজন দুয়ো কান্ধত সমানে পেলাওক।',
      'ঢালু মাটিত ভৰি এটা থৈ হঠাৎ হাঁটু পকোৱা বা ঘূৰোৱাৰ পৰা বিৰত থাকক।',
      'দীৰ্ঘসময় পাত তোলোতে হাঁটু সম্পূৰ্ণ টানকৈ লক্ নকৰি সামান্য কোমল ৰাখক।',
      'প্ৰতি ৪৫ মিনিট কামৰ পিছত ২ মিনিট বহি পাতল জিৰণি লওক।',
    ],
  },
  {
    id: 'G4',
    title: 'Anti-Inflammatory North-East Traditional Diet',
    title_as: 'প্ৰদাহ-ৰোধী স্থানীয় খাদ্য আৰু পুষ্টি নিৰ্দেশনা',
    category: 'diet',
    target_risk: '["Low Risk","Moderate Risk","High Risk"]',
    description: 'Harnesses local wild greens, fish omega-3, and natural anti-inflammatory spices to protect cartilage.',
    desc_as: 'ঢেকীয়া শাক, সতেজ নদীৰ মাছ, আদা-হালধি আদি প্ৰাকৃতিকভাৱে বাতবিষ আৰু বিষ নিৰাময়ত সহায় কৰে।',
    reps: 'Daily meals',
    duration: 'Lifelong habit',
    icon: 'restaurant',
    steps: [
      'Dhekia saak (Fiddlehead fern) & Moringa: Rich in polyphenols and antioxidants.',
      'Local fresh river fish (Rohu, Borali, Katla): High in Omega-3 EPA/DHA to soothe synovial fluid inflammation.',
      'Raw Turmeric with Black Pepper: Natural curcuminoids reduce inflammatory joint cytokines.',
      'Hydration: Drink 2–2.5 litres of boiled water daily to maintain cartilage lubrication.',
    ],
    steps_as: [
      'ঢেকীয়া শাক, মৰিঙ্গা (চজিনা): প্ৰচুৰ পৰিমাণে ভিটামিন কে আৰু এণ্টিঅক্সিডেণ্ট থাকে।',
      'স্থানীয় নদীৰ সতেজ মাছ (ৰৌ, বৰালী, কাৎলা): অমেগা-৩ যুক্ত যিয়ে গাঁঠিৰ প্ৰদাহ কমায়।',
      'কেঁচা হালধি আৰু জালুকৰ গুড়ি: প্ৰাকৃতিকভাৱে বিষ নিৰাময়ত কাৰ্যকৰী।',
      'পানী সেৱন: দৈনিক ২–২.৫ লিটাৰ উতলাই ঠাণ্ডা কৰা বিশুদ্ধ পানী খাওক।',
    ],
  },
  {
    id: 'G5',
    title: 'Thermotherapy (Hot & Cold Treatment for Knee Flares)',
    title_as: 'গৰম আৰু ঠাণ্ডা সেকৰ জৰিয়তে বিষ নিয়ন্ত্ৰণ',
    category: 'pain_relief',
    target_risk: '["Moderate Risk","High Risk"]',
    description: 'Targeted temperature application to manage acute morning stiffness versus post-work swelling.',
    desc_as: 'ৰাতিপুৱাৰ টান অনুভৱ আৰু কামৰ পিছৰ ফুলা বিষ নিয়ন্ত্ৰণৰ বাবে সঠিক সেক পদ্ধতি।',
    reps: '15–20 minutes per session',
    duration: '2–3 times daily',
    icon: 'thermostat',
    steps: [
      'Morning Stiffness: Apply a warm damp towel for 15 minutes before getting out of bed to increase blood circulation.',
      'Acute Swelling / Heat after farm work: Apply an ice pack wrapped in cloth for 15 minutes to reduce inflammation.',
      'Never apply ice or boiling pads directly onto bare skin to avoid skin burns or frost injury.',
    ],
    steps_as: [
      'ৰাতিপুৱাৰ টান অনুভৱ: বিছনাৰ পৰা উঠাৰ আগতে ১৫ মিনিটৰ বাবে কুহুমীয়া গৰম সেক লওক।',
      'কামৰ পিছৰ ফুলা বিষ: কাপোৰেৰে মেৰিয়াই বৰফ বা ঠাণ্ডা পানীৰ সেক ১৫ মিনিট লওক।',
      'কেতিয়াও বৰফ বা তপত বস্তু পোনপটীয়াকৈ ছালত নিদিব।',
    ],
  },
  {
    id: 'G6',
    title: 'Padded Orthotic Footwear for Rural Walking',
    title_as: 'গাঁৱলীয়া পথত খোজ কঢ়াৰ বাবে উপযুক্ত পাদুকা',
    category: 'lifestyle',
    target_risk: '["Low Risk","Moderate Risk","High Risk"]',
    description: 'Minimizes ground reaction shock travelling up from hard rocky paths into knee joints.',
    desc_as: 'পকী আৰু শিলৰ বাটত খোজ কঢ়াৰ সময়ত হাঁটুৰ ওপৰত পৰা আঘাত হ্ৰাস কৰে।',
    reps: 'Whenever walking outdoors',
    duration: 'Daily',
    icon: 'footprint',
    steps: [
      'Avoid paper-thin flat rubber slippers (hawai chappals) on uneven unpaved roads.',
      'Choose footwear with at least 15mm soft EVA foam sole cushioning.',
      'Wear supportive straps around the heel to prevent ankle rolling and knee twisting.',
    ],
    steps_as: [
      'পাতল ৰবৰৰ চেণ্ডেল পিন্ধি টান আৰু অসমান মাটিত দীৰ্ঘ সময় খোজ নাকাঢ়িব।',
      'অন্ততঃ ১৫ মিমি ডাঠ কোমল গদি থকা জোতা বা চেণ্ডেল ব্যৱহাৰ কৰক।',
      'গোৰোহাত ফিটা থকা জোতাই ভৰি পিচল খোৱাৰ পৰা ৰক্ষা কৰে।',
    ],
  },
];

export default function GuidanceScreen() {
  const { language } = useApp();
  const isAssamese = language === 'অসমীয়া';

  const [items, setItems] = useState<GuidanceCardItem[]>(FALLBACK_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadGuidance() {
      try {
        const fetched = await api.getGuidance(selectedCategory === 'all' ? undefined : selectedCategory, searchQuery || undefined);
        if (fetched && fetched.length > 0) {
          // Merge API data with rich structured details
          const merged = fetched.map((f: any) => {
            const fallback = FALLBACK_ITEMS.find((fb) => fb.category === f.category) || FALLBACK_ITEMS[0];
            return {
              ...fallback,
              ...f,
            };
          });
          setItems(merged);
        } else {
          setItems(FALLBACK_ITEMS);
        }
      } catch {
        setItems(FALLBACK_ITEMS);
      }
    }
    loadGuidance();
  }, [selectedCategory, searchQuery]);

  const CATEGORIES = [
    { id: 'all', label: isAssamese ? 'সকলো' : 'All Topics', icon: 'grid_view' },
    { id: 'exercise', label: isAssamese ? 'ব্যায়াম' : 'Exercises', icon: 'fitness_center' },
    { id: 'ergonomics', label: isAssamese ? 'কৰ্মক্ষেত্ৰৰ ভঙ্গিমা' : 'Ergonomics', icon: 'agriculture' },
    { id: 'diet', label: isAssamese ? 'পুষ্টি আৰু খাদ্য' : 'Nutrition', icon: 'restaurant' },
    { id: 'pain_relief', label: isAssamese ? 'বিষ নিৰাময়' : 'Pain Relief', icon: 'thermostat' },
    { id: 'lifestyle', label: isAssamese ? 'জীৱনশৈলী' : 'Lifestyle', icon: 'self_improvement' },
  ];

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const query = searchQuery.toLowerCase();
    const title = (isAssamese && item.title_as ? item.title_as : item.title).toLowerCase();
    const desc = (isAssamese && item.desc_as ? item.desc_as : item.description).toLowerCase();
    const matchesSearch = !searchQuery || title.includes(query) || desc.includes(query);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="bg-surface text-on-surface font-sans flex flex-col min-h-screen">
      <AppHeader showBack title={isAssamese ? 'প্ৰতিৰোধমূলক নিৰ্দেশনা কেন্দ্ৰ' : 'Preventive Guidance Library'} />

      <main className="flex flex-col w-full pt-16 pb-28 px-margin space-y-space-md max-w-md mx-auto">
        
        {/* Search Input */}
        <div className="flex items-center bg-surface-container-high rounded-xl px-3.5 py-2.5 shadow-sm border border-outline-variant/30 mt-2">
          <span className="material-symbols-outlined text-primary mr-2 text-[20px]">search</span>
          <input
            type="text"
            placeholder={isAssamese ? 'ব্যায়াম, খাদ্য, বা নিৰ্দেশনা সন্ধান কৰক...' : 'Search exercises, nutrition, therapy...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent font-body-md text-body-md text-on-surface focus:outline-none placeholder:text-on-surface-variant font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-on-surface-variant p-1">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-margin px-margin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-2 rounded-xl text-label-sm font-bold shrink-0 transition-all flex items-center gap-1.5 min-h-[40px] ${
                selectedCategory === cat.id
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Clinical Disclaimer Banner */}
        <div className="bg-primary-fixed/40 border border-primary/20 rounded-xl p-3.5 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
            health_and_safety
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
            {isAssamese
              ? 'এই নিৰ্দেশনাসমূহ গাঁঠিৰ চাপ কমাবলৈ প্ৰমাণিত। তীব্ৰ বিষ হ’লে ব্যায়াম বন্ধ কৰি স্বাস্থ্যকৰ্মীৰ পৰামৰ্শ লওক।'
              : 'Evidence-based community guidance to offload knee joints. Discontinue any exercise that causes sharp acute pain and consult your PHC.'}
          </p>
        </div>

        {/* Guidance Items List */}
        <div className="flex flex-col space-y-space-md">
          {filteredItems.length === 0 ? (
            <div className="bg-surface-container-lowest p-8 rounded-2xl text-center flex flex-col items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-[48px] text-outline">search_off</span>
              <p className="font-label-lg text-label-lg font-bold text-on-surface">
                {isAssamese ? 'কোনো নিৰ্দেশনা পোৱা নগ’ল' : 'No results found'}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {isAssamese ? 'অন্য কিবা সন্ধান কৰক অথবা সকলো বিষয় বাছক।' : 'Try another search term or reset category filter.'}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isExpanded = expandedId === item.id;
              const title = isAssamese && item.title_as ? item.title_as : item.title;
              const desc = isAssamese && item.desc_as ? item.desc_as : item.description;
              const steps = isAssamese && item.steps_as ? item.steps_as : (item.steps || []);

              return (
                <article
                  key={item.id}
                  className="bg-surface-container-lowest rounded-2xl p-4 shadow-card-1 border border-outline-variant/30 flex flex-col gap-3 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0 text-primary shadow-xs">
                        <span className="material-symbols-outlined text-[24px]">
                          {item.icon || 'exercise'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary font-mono">
                          {item.category.replace('_', ' ')}
                        </span>
                        <h3 className="font-headline-md text-headline-md text-on-surface font-bold leading-tight">
                          {title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    {desc}
                  </p>

                  {/* Frequency & Dosage Pills */}
                  {(item.reps || item.duration) && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {item.reps && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">
                          <span className="material-symbols-outlined text-[14px] text-primary">repeat</span>
                          <span>{item.reps}</span>
                        </span>
                      )}
                      {item.duration && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">
                          <span className="material-symbols-outlined text-[14px] text-tertiary">schedule</span>
                          <span>{item.duration}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Expandable Step-by-Step Instructions */}
                  {isExpanded && steps.length > 0 && (
                    <div className="mt-2 pt-3 border-t border-outline-variant/40 space-y-2.5 animate-fadeIn">
                      <h4 className="font-label-md text-label-md font-bold text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-primary">format_list_numbered</span>
                        <span>{isAssamese ? 'ব্যায়াম কৰাৰ সঠিক নিয়ম:' : 'Step-by-Step Instructions:'}</span>
                      </h4>
                      <ol className="space-y-2 text-body-sm text-on-surface list-none">
                        {steps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 bg-surface-container-low p-2.5 rounded-xl">
                            <span className="w-5 h-5 rounded-full bg-primary text-on-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-snug">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Accordion Toggle CTA */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="w-full min-h-[44px] mt-1 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-bold flex items-center justify-center gap-1.5 transition-all"
                    type="button"
                  >
                    <span>
                      {isExpanded
                        ? (isAssamese ? 'বিৱৰণ লুকুৱাওক' : 'Hide Details')
                        : (isAssamese ? 'নিয়মাৱলী আৰু ধাপসমূহ চাওক' : 'View Full Guide & Steps')}
                    </span>
                    <span className="material-symbols-outlined text-[18px]">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </article>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
