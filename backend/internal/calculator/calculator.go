package calculator

import (
	"strings"

	"github.com/shopspring/decimal"
)

const (
	// DefaultPrecision is the target decimal precision for fractional division and roots.
	DefaultPrecision = 34

	// MaxIterations defines the maximum iteration count for Newton-Raphson approximation.
	MaxIterations = 100

	// MinExponent is the minimum allowed integer exponent for Power.
	MinExponent = -1000

	// MaxExponent is the maximum allowed integer exponent for Power.
	MaxExponent = 1000
)

var (
	zero    = decimal.Zero
	one     = decimal.NewFromInt(1)
	two     = decimal.NewFromInt(2)
	hundred = decimal.NewFromInt(100)
	half    = decimal.New(5, -1) // 0.5 without floating-point conversion
	epsilon = decimal.New(1, -32) // 10^-32 convergence threshold
)

func init() {
	// Set global division precision for shopspring/decimal to 34 decimal places
	decimal.DivisionPrecision = DefaultPrecision
}

// Engine defines the mathematical domain capabilities for arbitrary-precision calculation.
type Engine interface {
	Add(a, b decimal.Decimal) decimal.Decimal
	Subtract(a, b decimal.Decimal) decimal.Decimal
	Multiply(a, b decimal.Decimal) decimal.Decimal
	Divide(a, b decimal.Decimal) (decimal.Decimal, error)
	Power(a decimal.Decimal, b int64) (decimal.Decimal, error)
	Sqrt(a decimal.Decimal) (decimal.Decimal, error)
	Percentage(a decimal.Decimal, b *decimal.Decimal) decimal.Decimal
}

// Calculator implements the Engine interface using arbitrary-precision decimal arithmetic.
// It is strictly prohibited from importing math or casting to float32/float64.
type Calculator struct{}

// New creates a new Calculator domain engine instance.
func New() *Calculator {
	return &Calculator{}
}

// Add computes exact decimal addition a + b.
func (c *Calculator) Add(a, b decimal.Decimal) decimal.Decimal {
	return a.Add(b)
}

// Subtract computes exact decimal subtraction a - b.
func (c *Calculator) Subtract(a, b decimal.Decimal) decimal.Decimal {
	return a.Sub(b)
}

// Multiply computes exact decimal multiplication a * b.
func (c *Calculator) Multiply(a, b decimal.Decimal) decimal.Decimal {
	return a.Mul(b)
}

// Divide computes decimal division a / b with arbitrary precision.
// Returns ErrDivisionByZero if divisor b is zero.
func (c *Calculator) Divide(a, b decimal.Decimal) (decimal.Decimal, error) {
	if b.IsZero() {
		return zero, ErrDivisionByZero
	}
	return a.Div(b), nil
}

// Power computes integer exponentiation a^b for b in [-1000, 1000].
// Strictly respects 0^0 = 1, and negative exponents evaluate as 1 / a^|b|.
func (c *Calculator) Power(a decimal.Decimal, b int64) (decimal.Decimal, error) {
	if b < MinExponent || b > MaxExponent {
		return zero, ErrExponentOutOfBounds
	}

	// 0 raised to a negative power is division by zero
	if a.IsZero() {
		if b < 0 {
			return zero, ErrDivisionByZero
		}
		if b == 0 {
			return one, nil // 0^0 = 1 per specification
		}
		return zero, nil
	}

	if b == 0 {
		return one, nil
	}

	exp := b
	isNegative := false
	if exp < 0 {
		isNegative = true
		exp = -exp
	}

	// Binary exponentiation using pure decimal multiplication
	result := one
	base := a
	for exp > 0 {
		if exp%2 == 1 {
			result = result.Mul(base)
		}
		if exp > 1 {
			base = base.Mul(base)
		}
		exp /= 2
	}

	if isNegative {
		return one.Div(result), nil
	}

	return result, nil
}

// Sqrt computes the square root of a using pure decimal Newton-Raphson approximation:
// x_{n+1} = 0.5 * (x_n + a / x_n)
// Converges with dynamic scale supporting radicands up to 10^400 without floating-point conversion.
func (c *Calculator) Sqrt(a decimal.Decimal) (decimal.Decimal, error) {
	if a.IsNegative() {
		return zero, ErrNegativeSquareRoot
	}
	if a.IsZero() {
		return zero, nil
	}
	if a.Equal(one) {
		return one, nil
	}

	// Dynamic initial estimate x0 based on integer digit length
	x := c.initialSqrtGuess(a)

	for i := 0; i < MaxIterations; i++ {
		divTerm := a.Div(x)
		next := half.Mul(x.Add(divTerm))

		diff := next.Sub(x).Abs()
		if diff.LessThan(epsilon) {
			return exactRootOrSelf(next, a), nil
		}
		x = next
	}

	return exactRootOrSelf(x, a), nil
}

func exactRootOrSelf(val, target decimal.Decimal) decimal.Decimal {
	if val.Mul(val).Equal(target) {
		return val
	}
	f := val.Floor()
	if f.Mul(f).Equal(target) {
		return f
	}
	c := val.Ceil()
	if c.Mul(c).Equal(target) {
		return c
	}
	if target.Exponent() < 0 {
		maxScale := -target.Exponent()
		if maxScale > 34 {
			maxScale = 34
		}
		for s := int32(1); s <= maxScale; s++ {
			cand := val.Round(s)
			if cand.Mul(cand).Equal(target) {
				return cand
			}
		}
	}
	return val
}

// Percentage computes unary (a / 100) or binary ((a * b) / 100) percentage.
func (c *Calculator) Percentage(a decimal.Decimal, b *decimal.Decimal) decimal.Decimal {
	if b == nil {
		return a.Div(hundred)
	}
	return a.Mul(*b).Div(hundred)
}

// initialSqrtGuess computes a reliable initial estimate for Newton-Raphson without math.Log or float casting.
func (c *Calculator) initialSqrtGuess(a decimal.Decimal) decimal.Decimal {
	s := a.String()
	if idx := strings.IndexByte(s, '.'); idx != -1 {
		s = s[:idx]
	}
	s = strings.TrimLeft(s, "0")

	// If a < 1 (no integer part), initial guess of 1 converges cleanly
	if s == "" {
		return one
	}

	// For a >= 1, a radicand with N integer digits has a square root with roughly N/2 digits.
	digits := len(s)
	halfDigits := digits / 2
	if halfDigits == 0 {
		return one
	}

	return decimal.New(1, int32(halfDigits))
}
