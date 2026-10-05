// Fusion Engine — OA Risk Score Calculator
// Verbatim port of fusion-engine (1).js with full TypeScript exports

export type RiskTier = 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'High Risk — Immediate Referral';

export interface FusionOutput {
  tier: RiskTier;
  score: number | null;
  explanation: string;
  recommendedAction: string;
  confidenceNote: string | null;
}

export interface FusionEngineInput {
  redFlag: boolean;
  symptomScore: number;        // 0-100, inverted average of 5 KOOS subscale scores
  riskFactorScore: number;     // 0-100, from age/BMI/occupation/injury/duration
  motionScore: number | null;  // 0-100, from sit-to-stand test (null if skipped/failed)
  motionConfidence: number;    // 0-1, fraction of test frames with good landmark visibility
  symmetryDeltaDeg?: number;   // degrees difference between left/right peak knee extension
  imagingScore?: number | null;// 0-100 from X-ray KL grade, or null if no X-ray
}

export function runFusionEngine(input: FusionEngineInput): FusionOutput {
  const {
    redFlag,
    symptomScore,
    riskFactorScore,
    motionScore,
    motionConfidence,
    symmetryDeltaDeg,
    imagingScore
  } = input;

  const reasons: string[] = [];

  // STEP 1 — Red-flag override
  if (redFlag) {
    return {
      tier: 'High Risk — Immediate Referral',
      score: null,
      explanation: 'Flagged for immediate referral due to reported red-flag symptoms ' +
                    '(recent trauma, hot/swollen joint, or rapid symptom worsening), ' +
                    'consistent with clinical guidance that such features require clinical ' +
                    'evaluation regardless of routine screening score.',
      recommendedAction: 'Refer to PHC / Orthopaedic specialist immediately without physical mobility testing',
      confidenceNote: null
    };
  }

  // STEP 2 — Available modules
  const hasMotion = motionScore !== null && motionScore !== undefined;
  const hasImaging = imagingScore !== null && imagingScore !== undefined;

  // STEP 3 — Confidence-weight the motion score
  let adjustedMotionScore = motionScore ?? 50;
  let confidenceNote: string | null = null;
  if (hasMotion && motionConfidence < 0.7) {
    const blendFactor = motionConfidence;
    adjustedMotionScore = (motionScore ?? 50) * blendFactor + 50 * (1 - blendFactor);
    confidenceNote = `Motion score confidence was low (${Math.round(motionConfidence * 100)}%); ` +
                      `result adjusted toward neutral and re-screening is recommended.`;
  }

  // STEP 4 — Weighted combination
  let finalScore: number;
  if (hasMotion && hasImaging) {
    finalScore = 0.4 * symptomScore + 0.2 * riskFactorScore + 0.25 * adjustedMotionScore + 0.15 * (imagingScore ?? 0);
  } else if (hasMotion && !hasImaging) {
    finalScore = 0.45 * symptomScore + 0.2 * riskFactorScore + 0.35 * adjustedMotionScore;
  } else {
    finalScore = 0.7 * symptomScore + 0.3 * riskFactorScore;
    reasons.push('camera-based motion test unavailable — score based on symptoms and risk factors only');
  }

  // STEP 5 — Build explanation
  if (symptomScore >= 60) reasons.push(`high reported symptom severity (${Math.round(symptomScore)}/100)`);
  if (riskFactorScore >= 60) reasons.push(`elevated risk-factor profile (${Math.round(riskFactorScore)}/100)`);
  if (hasMotion && adjustedMotionScore >= 55) reasons.push(`reduced functional performance on sit-to-stand test (${Math.round(adjustedMotionScore)}/100)`);
  if (symmetryDeltaDeg && symmetryDeltaDeg > 12) reasons.push(`notable left/right joint asymmetry (${Math.round(symmetryDeltaDeg)}° difference)`);
  if (hasImaging && (imagingScore ?? 0) >= 55) reasons.push(`imaging-derived severity score elevated (${Math.round(imagingScore ?? 0)}/100)`);
  if (reasons.length === 0) reasons.push('all inputs within expected range');

  // STEP 6 — Map to tier
  let tier: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  if (finalScore >= 55) tier = 'High Risk';
  else if (finalScore >= 25) tier = 'Moderate Risk';
  else tier = 'Low Risk';

  const recommendedAction = {
    'High Risk': 'Refer to orthopaedic specialist promptly',
    'Moderate Risk': 'Refer to physiotherapy / re-screen in 3 months',
    'Low Risk': 'Self-management guidance / re-screen in 6-12 months'
  }[tier];

  return {
    tier,
    score: Math.round(finalScore),
    explanation: `Flagged ${tier} due to: ${reasons.join('; ')}.`,
    recommendedAction,
    confidenceNote
  };
}
