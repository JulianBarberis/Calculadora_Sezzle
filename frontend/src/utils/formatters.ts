/**
 * Mathematical formatting utilities for arbitrary-precision calculator displays.
 * Strictly adheres to SPEC.md Section 6.2:
 * "Semantic <output> element formatted with tabular-nums and dynamic font scaling
 *  supporting up to 16 visible digits before exponent notation."
 */

const MAX_VISIBLE_DIGITS = 16;

/**
 * Formats a numeric string for calculator display.
 * - Numbers with |x| >= 10^16 are formatted into scientific notation (e.g. 1e+16, 2.656139888758748e+95).
 * - Small non-zero numbers with |x| < 10^-6 are formatted into scientific notation (e.g. 1e-7, 1.23e-17).
 * - Numbers with fractional parts exceeding available visible digits are rounded to fit 16 visible digits.
 * - Preserves trailing decimal point (e.g. "123.") and typing states (e.g. "0.00").
 * - Operates entirely on string representations to prevent JavaScript float precision loss or overflow to Infinity.
 */
export function formatDisplayNumber(value: string, maxDigits: number = MAX_VISIBLE_DIGITS): string {
  if (!value) return '0';

  // Handle special non-numeric or in-progress typing states
  if (value === '-' || value === '-.' || value === '.' || value === '-0') {
    return value;
  }

  // If already contains exponent notation, normalize mantissa
  if (/[eE]/.test(value)) {
    const parts = value.split(/[eE]/);
    const mantissa = parts[0];
    const exp = parts[1];
    const formattedMantissa = formatDisplayNumber(mantissa, maxDigits);
    const expSign = exp.startsWith('+') || exp.startsWith('-') ? '' : '+';
    return `${formattedMantissa}e${expSign}${exp}`;
  }

  const isNegative = value.startsWith('-');
  const unsignedStr = isNegative ? value.slice(1) : value;

  const dotIndex = unsignedStr.indexOf('.');
  const hasDot = dotIndex !== -1;
  const rawIntPart = hasDot ? unsignedStr.slice(0, dotIndex) : unsignedStr;
  const rawDecPart = hasDot ? unsignedStr.slice(dotIndex + 1) : null;

  // Validate that int and dec parts are purely numeric
  if (!/^\d*$/.test(rawIntPart) || (rawDecPart !== null && !/^\d*$/.test(rawDecPart))) {
    return value; // Return as-is if unparseable / error message
  }

  // Preserve trailing decimal during active user input (e.g. "123.")
  if (hasDot && rawDecPart === '') {
    const formattedInt = formatDisplayNumber(rawIntPart, maxDigits);
    return `${isNegative ? '-' : ''}${formattedInt}.`;
  }

  const cleanInt = rawIntPart.replace(/^0+/, '') || '0';

  // CASE 1: Large numbers (|x| >= 10^16) -> Scientific notation
  if (cleanInt !== '0' && cleanInt.length > maxDigits) {
    const exponent = cleanInt.length - 1;
    const fullDigits = cleanInt + (rawDecPart || '');
    
    // Take maxDigits to round the last significant digit
    const sigDigits = fullDigits.slice(0, maxDigits);
    const nextDigit = fullDigits.length > maxDigits ? parseInt(fullDigits[maxDigits], 10) : 0;
    
    let roundedBigInt = BigInt(sigDigits);
    if (nextDigit >= 5) {
      roundedBigInt += 1n;
    }

    let roundedStr = roundedBigInt.toString();
    let finalExp = exponent;

    // Check if rounding caused an overflow in length (e.g. 999... -> 1000...)
    if (roundedStr.length > maxDigits) {
      finalExp += 1;
      roundedStr = roundedStr.slice(0, maxDigits);
    }

    const d0 = roundedStr[0];
    const dRest = roundedStr.slice(1).replace(/0+$/, '');
    const mantissa = dRest ? `${d0}.${dRest}` : d0;

    return `${isNegative ? '-' : ''}${mantissa}e+${finalExp}`;
  }

  // CASE 2: Very small numbers (|x| < 10^-6) -> Scientific notation
  if (cleanInt === '0' && rawDecPart !== null && rawDecPart.length > 0) {
    const firstNonZero = rawDecPart.search(/[^0]/);
    
    // Check if there are 6 or more leading zeros after the decimal point (e.g. 0.0000001 -> 1e-7)
    if (firstNonZero >= 6) {
      const exponent = -(firstNonZero + 1);
      const significantDigits = rawDecPart.slice(firstNonZero);
      
      const sig16 = significantDigits.slice(0, maxDigits);
      const nextDigit = significantDigits.length > maxDigits ? parseInt(significantDigits[maxDigits], 10) : 0;
      
      let roundedBigInt = BigInt(sig16);
      if (nextDigit >= 5) {
        roundedBigInt += 1n;
      }

      let roundedStr = roundedBigInt.toString();
      let finalExp = exponent;

      if (roundedStr.length > maxDigits) {
        finalExp += 1;
        roundedStr = roundedStr.slice(0, maxDigits);
      }

      const d0 = roundedStr[0];
      const dRest = roundedStr.slice(1).replace(/0+$/, '');
      const mantissa = dRest ? `${d0}.${dRest}` : d0;

      return `${isNegative ? '-' : ''}${mantissa}e${finalExp}`;
    }
  }

  // CASE 3: Decimal numbers with precision beyond 16 visible digits
  if (hasDot && rawDecPart !== null) {
    // If user is actively typing trailing zeros (e.g. "0.00"), preserve them
    const isPureTrailingZeros = /^0+$/.test(rawDecPart);
    const visibleIntLen = cleanInt === '0' ? 0 : cleanInt.length;
    const totalVisible = visibleIntLen + rawDecPart.length;

    if (totalVisible <= maxDigits || isPureTrailingZeros) {
      return value;
    }

    const availableDecimals = Math.max(0, maxDigits - visibleIntLen);
    if (availableDecimals === 0) {
      return `${isNegative ? '-' : ''}${cleanInt}`;
    }

    const truncatedDec = rawDecPart.slice(0, availableDecimals);
    const nextDigit = parseInt(rawDecPart[availableDecimals] || '0', 10);

    let roundedBigInt = BigInt(truncatedDec);
    if (nextDigit >= 5) {
      roundedBigInt += 1n;
    }

    let roundedDecStr = roundedBigInt.toString().padStart(availableDecimals, '0');
    // If rounding carried over
    if (roundedDecStr.length > availableDecimals) {
      const intPlusOne = (BigInt(cleanInt) + 1n).toString();
      return `${isNegative ? '-' : ''}${intPlusOne}`;
    }

    // Trim trailing zeros after rounding
    roundedDecStr = roundedDecStr.replace(/0+$/, '');
    if (!roundedDecStr) {
      return `${isNegative ? '-' : ''}${cleanInt}`;
    }

    return `${isNegative ? '-' : ''}${cleanInt}.${roundedDecStr}`;
  }

  // CASE 4: Standard numbers within 16 digits
  return value;
}

/**
 * Formats full mathematical expressions (e.g. "10 ^ 400 = 1000..."), replacing
 * excessively long numeric operands/results with their formatted scientific counterparts.
 */
export function formatExpression(expression: string): string {
  if (!expression) return '';

  return expression.replace(/([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, (match) => {
    return formatDisplayNumber(match);
  });
}
