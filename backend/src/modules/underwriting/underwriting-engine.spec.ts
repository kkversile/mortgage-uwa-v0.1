import { aggregateRecommendation, evaluateRule } from './underwriting-engine';

describe('underwriting engine', () => {
  it('approves a strong application', () => {
    const evals = [
      evaluateRule({ code: 'CREDIT_SCORE', value: 760, approveThreshold: 700, reviewThreshold: 650 }),
      evaluateRule({ code: 'DTI_RATIO', value: 29, approveThreshold: 36, reviewThreshold: 45 }),
      evaluateRule({ code: 'LTV_RATIO', value: 71, approveThreshold: 80, reviewThreshold: 90 }),
    ];
    expect(aggregateRecommendation(evals)).toBe('APPROVE');
  });
  it('sends higher DTI to manual review', () => {
    const evals = [
      evaluateRule({ code: 'CREDIT_SCORE', value: 711, approveThreshold: 700, reviewThreshold: 650 }),
      evaluateRule({ code: 'DTI_RATIO', value: 42.5, approveThreshold: 36, reviewThreshold: 45 }),
      evaluateRule({ code: 'LTV_RATIO', value: 77, approveThreshold: 80, reviewThreshold: 90 }),
    ];
    expect(aggregateRecommendation(evals)).toBe('MANUAL_REVIEW');
  });
  it('declines when any hard-decline rule fails', () => {
    expect(aggregateRecommendation([evaluateRule({ code: 'CREDIT_SCORE', value: 612, approveThreshold: 700, reviewThreshold: 650 })])).toBe('DECLINE');
  });

  it('honours the configured threshold boundaries', () => {
    expect(evaluateRule({ code: 'CREDIT_SCORE', value: 700, approveThreshold: 700, reviewThreshold: 650 }).outcome).toBe('PASS');
    expect(evaluateRule({ code: 'CREDIT_SCORE', value: 699, approveThreshold: 700, reviewThreshold: 650 }).outcome).toBe('REVIEW');
    expect(evaluateRule({ code: 'DTI_RATIO', value: 36, approveThreshold: 36, reviewThreshold: 45 }).outcome).toBe('PASS');
    expect(evaluateRule({ code: 'DTI_RATIO', value: 45.01, approveThreshold: 36, reviewThreshold: 45 }).outcome).toBe('DECLINE');
    expect(evaluateRule({ code: 'LTV_RATIO', value: 80.01, approveThreshold: 80, reviewThreshold: 90 }).outcome).toBe('REVIEW');
    expect(evaluateRule({ code: 'LTV_RATIO', value: 90.01, approveThreshold: 80, reviewThreshold: 90 }).outcome).toBe('DECLINE');
  });
});
