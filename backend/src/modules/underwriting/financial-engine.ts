export function calculateDti(monthlyDebt: number, grossMonthlyIncome: number): number {
  if (!Number.isFinite(monthlyDebt) || monthlyDebt < 0) throw new Error('Monthly debt must be a non-negative number');
  if (!Number.isFinite(grossMonthlyIncome) || grossMonthlyIncome < 0) throw new Error('Gross monthly income must be a non-negative number');
  return grossMonthlyIncome === 0 ? 999 : round((monthlyDebt / grossMonthlyIncome) * 100);
}

export function calculateLtv(loanAmount: number, propertyValue: number): number {
  if (!Number.isFinite(loanAmount) || loanAmount < 0) throw new Error('Loan amount must be a non-negative number');
  if (!Number.isFinite(propertyValue) || propertyValue < 0) throw new Error('Property value must be a non-negative number');
  return propertyValue === 0 ? 999 : round((loanAmount / propertyValue) * 100);
}

function round(value: number) { return Math.round((value + Number.EPSILON) * 1000) / 1000; }
