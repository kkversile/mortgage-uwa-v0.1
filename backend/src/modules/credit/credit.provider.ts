export interface CreditProviderResult {
  score: number;
  utilizationPct: number;
  latePayments: number;
  tradelines: Array<{ creditorName: string; accountType: string; balance: number; creditLimit: number; monthlyPayment: number; latePayments: number }>;
}

export interface CreditProvider { check(input: { email: string; outstandingDebt: number }): Promise<CreditProviderResult>; }

export class MockCreditProvider implements CreditProvider {
  async check(input: { email: string; outstandingDebt: number }) {
    const scores: Record<string, number> = { 'michael.johnson@example.test': 762, 'emily.parker@example.test': 711, 'robert.davis@example.test': 612, 'casey.nguyen@example.test': 735, 'alex.morgan@example.test': 720 };
    const score = scores[input.email.toLowerCase()] ?? 720;
    const latePayments = score < 650 ? 5 : 0;
    const balance = Math.max(input.outstandingDebt, 12000);
    return { score, utilizationPct: score < 650 ? 67 : score < 720 ? 29 : 22, latePayments, tradelines: [
      { creditorName: 'Synthetic Auto Finance', accountType: 'INSTALLMENT', balance: Math.round(balance * .55), creditLimit: 0, monthlyPayment: 420, latePayments: score < 650 ? 1 : 0 },
      { creditorName: 'Synthetic Card Services', accountType: 'REVOLVING', balance: Math.round(balance * .45), creditLimit: 30000, monthlyPayment: 280, latePayments: score < 650 ? 4 : 0 },
    ] };
  }
}
