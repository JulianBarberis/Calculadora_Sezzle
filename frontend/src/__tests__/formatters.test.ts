import { describe, it, expect } from 'vitest';
import { formatDisplayNumber, formatExpression } from '../utils/formatters';

describe('formatDisplayNumber Utility', () => {
  describe('Standard numbers within 16 digits', () => {
    it('preserves single digits and small integers', () => {
      expect(formatDisplayNumber('0')).toBe('0');
      expect(formatDisplayNumber('7')).toBe('7');
      expect(formatDisplayNumber('42')).toBe('42');
      expect(formatDisplayNumber('9999999999999999')).toBe('9999999999999999');
    });

    it('preserves negative small integers', () => {
      expect(formatDisplayNumber('-5')).toBe('-5');
      expect(formatDisplayNumber('-42')).toBe('-42');
    });

    it('preserves decimal numbers within 16 visible digits', () => {
      expect(formatDisplayNumber('12.5')).toBe('12.5');
      expect(formatDisplayNumber('0.3')).toBe('0.3');
      expect(formatDisplayNumber('123.456789')).toBe('123.456789');
    });

    it('preserves active user typing states', () => {
      expect(formatDisplayNumber('0.')).toBe('0.');
      expect(formatDisplayNumber('123.')).toBe('123.');
      expect(formatDisplayNumber('0.0')).toBe('0.0');
      expect(formatDisplayNumber('0.00')).toBe('0.00');
      expect(formatDisplayNumber('-')).toBe('-');
      expect(formatDisplayNumber('-0')).toBe('-0');
    });
  });

  describe('Large numbers (magnitude >= 10^16)', () => {
    it('formats 17-digit integers into scientific notation', () => {
      expect(formatDisplayNumber('10000000000000000')).toBe('1e+16');
      expect(formatDisplayNumber('10000000000000000000')).toBe('1e+19');
    });

    it('formats 401-digit numbers like 10^400', () => {
      const huge10To400 = '1' + '0'.repeat(400);
      expect(formatDisplayNumber(huge10To400)).toBe('1e+400');
    });

    it('formats negative large numbers', () => {
      const negativeHuge = '-1' + '0'.repeat(400);
      expect(formatDisplayNumber(negativeHuge)).toBe('-1e+400');
    });

    it('rounds and formats 9^100 (96 digits) cleanly', () => {
      // 9^100 is 96 digits starting with 2656139888758747...
      const nineTo100 = '265613988875874769338781322035779626829233452653394495974574961739092490901302182994384699044001';
      expect(nineTo100.length).toBe(96);
      expect(formatDisplayNumber(nineTo100)).toBe('2.656139888758748e+95');
    });

    it('handles rounding carry-over (e.g. 99999999999999999...)', () => {
      const ninetyNineHuge = '9'.repeat(32);
      expect(formatDisplayNumber(ninetyNineHuge)).toBe('1e+32');
    });
  });

  describe('Small numbers (magnitude < 10^-6)', () => {
    it('converts small decimals to negative exponent notation', () => {
      expect(formatDisplayNumber('0.0000001')).toBe('1e-7');
      expect(formatDisplayNumber('0.0000000000000000123')).toBe('1.23e-17');
    });

    it('converts negative small decimals', () => {
      expect(formatDisplayNumber('-0.0000001')).toBe('-1e-7');
    });
  });

  describe('High-precision division decimals', () => {
    it('rounds 34-decimal division results to 16 visible digits', () => {
      // 1/3 division from shopspring/decimal
      const oneThird = '0.3333333333333333333333333333333333';
      const formatted = formatDisplayNumber(oneThird);
      expect(formatted).toBe('0.3333333333333333');
      expect(formatted.length).toBe(18); // "0." + 16 digits
    });
  });

  describe('formatExpression Utility', () => {
    it('preserves simple expressions', () => {
      expect(formatExpression('0.1 + 0.2 = 0.3')).toBe('0.1 + 0.2 = 0.3');
      expect(formatExpression('5 + 3 = 8')).toBe('5 + 3 = 8');
      expect(formatExpression('sqrt(16) = 4')).toBe('sqrt(16) = 4');
    });

    it('formats large numbers inside complex expressions', () => {
      const hugeExpr = `10 ^ 400 = 1${'0'.repeat(400)}`;
      expect(formatExpression(hugeExpr)).toBe('10 ^ 400 = 1e+400');
    });
  });
});
