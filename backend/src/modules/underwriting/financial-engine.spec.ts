import { calculateDti, calculateLtv } from './financial-engine';

describe('financial engine', () => {
  it('calculates DTI and LTV as percentages', () => {
    expect(calculateDti(2900, 10000)).toBe(29);
    expect(calculateLtv(325000, 460000)).toBe(70.652);
  });
  it('uses a safe sentinel for zero denominators', () => {
    expect(calculateDti(100, 0)).toBe(999);
    expect(calculateLtv(100, 0)).toBe(999);
  });
  it('rejects negative financial inputs', () => {
    expect(() => calculateDti(-1, 100)).toThrow();
    expect(() => calculateLtv(100, -1)).toThrow();
  });
});
