package calculator

import "errors"

var (
	// ErrDivisionByZero indicates division by zero, including 0 raised to a negative power.
	ErrDivisionByZero = errors.New("Cannot divide by zero. Please enter a non-zero divisor.")

	// ErrNegativeSquareRoot indicates an attempt to compute the square root of a negative real number.
	ErrNegativeSquareRoot = errors.New("Cannot calculate the square root of a negative number in real numbers.")

	// ErrExponentOutOfBounds indicates that an exponent exceeds the allowed range [-1000, 1000].
	ErrExponentOutOfBounds = errors.New("Exponent out of range: must be between -1000 and 1000")

	// ErrInvalidOperand indicates that a provided value cannot be parsed as a valid decimal number.
	ErrInvalidOperand = errors.New("Operand is not a valid decimal number")
)
