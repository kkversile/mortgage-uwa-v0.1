export type Outcome = 'PASS' | 'REVIEW' | 'DECLINE';
export type Recommendation = 'APPROVE' | 'MANUAL_REVIEW' | 'DECLINE';
export interface RuleInput { code: 'CREDIT_SCORE' | 'DTI_RATIO' | 'LTV_RATIO'; value: number; approveThreshold: number; reviewThreshold: number; }
export interface Evaluation { ruleCode: string; inputValue: number; outcome: Outcome; explanation: string; }

export function evaluateRule(rule: RuleInput): Evaluation {
  if (rule.code === 'CREDIT_SCORE') {
    if (rule.value >= rule.approveThreshold) return { ruleCode: rule.code, inputValue: rule.value, outcome: 'PASS', explanation: `Credit score ${rule.value} meets approve threshold >= ${rule.approveThreshold}.` };
    if (rule.value >= rule.reviewThreshold) return { ruleCode: rule.code, inputValue: rule.value, outcome: 'REVIEW', explanation: `Credit score ${rule.value} is within manual-review range ${rule.reviewThreshold}-${rule.approveThreshold - 1}.` };
    return { ruleCode: rule.code, inputValue: rule.value, outcome: 'DECLINE', explanation: `Credit score ${rule.value} is below demonstration decline threshold ${rule.reviewThreshold}.` };
  }
  if (rule.value <= rule.approveThreshold) return { ruleCode: rule.code, inputValue: rule.value, outcome: 'PASS', explanation: `${rule.code} ${rule.value.toFixed(2)}% is within approve threshold <= ${rule.approveThreshold}%.` };
  if (rule.value <= rule.reviewThreshold) return { ruleCode: rule.code, inputValue: rule.value, outcome: 'REVIEW', explanation: `${rule.code} ${rule.value.toFixed(2)}% requires manual review above ${rule.approveThreshold}% and <= ${rule.reviewThreshold}%.` };
  return { ruleCode: rule.code, inputValue: rule.value, outcome: 'DECLINE', explanation: `${rule.code} ${rule.value.toFixed(2)}% exceeds demonstration decline threshold ${rule.reviewThreshold}%.` };
}

export function aggregateRecommendation(evals: Evaluation[]): Recommendation {
  if (evals.some(e => e.outcome === 'DECLINE')) return 'DECLINE';
  if (evals.some(e => e.outcome === 'REVIEW')) return 'MANUAL_REVIEW';
  return 'APPROVE';
}
