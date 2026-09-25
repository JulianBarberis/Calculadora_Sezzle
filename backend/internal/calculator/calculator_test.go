package calculator_test

import (
	"errors"
	"strings"
	"testing"

	"github.com/shopspring/decimal"

	"github.com/julianbarberis/sezzle-calculator/internal/calculator"
)

func TestCalculator_Add(t *testing.T) {
	calc := calculator.New()

	tests := []struct {
		name     string
		a        string
		b        string
		expected string
	}{
		{
			name:     "0.1 + 0.2 equals exactly 0.3 without IEEE 754 float drift",
			a:        "0.1",
			b:        "0.2",
			expected: "0.3",
		},
		{
			name:     "Addition with negative operand",
			a:        "100.5",
			b:        "-50.25",
			expected: "50.25",
		},
		{
			name:     "High precision addition",
			a:        "1.00000000000000000000000000000001",
			b:        "0.00000000000000000000000000000002",
			expected: "1.00000000000000000000000000000003",
		},
		{
			name:     "Zero identity",
			a:        "42.5",
			b:        "0",
			expected: "42.5",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			a := decimal.RequireFromString(tc.a)
			b := decimal.RequireFromString(tc.b)
			res := calc.Add(a, b)
			if res.String() != tc.expected {
				t.Errorf("Add(%s, %s) = %s; want %s", tc.a, tc.b, res.String(), tc.expected)
			}
		})
	}
}

func TestCalculator_Subtract(t *testing.T) {
	calc := calculator.New()

	tests := []struct {
		name     string
		a        string
		b        string
		expected string
	}{
		{
			name:     "0.3 - 0.2 equals exactly 0.1",
			a:        "0.3",
			b:        "0.2",
			expected: "0.1",
		},
		{
			name:     "High precision subtraction cancellation to integer 1",
			a:        "1.000000000000000000001",
			b:        "0.000000000000000000001",
			expected: "1",
		},
		{
			name:     "Resulting in negative",
			a:        "5",
			b:        "12",
			expected: "-7",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			a := decimal.RequireFromString(tc.a)
			b := decimal.RequireFromString(tc.b)
			res := calc.Subtract(a, b)
			if res.String() != tc.expected {
				t.Errorf("Subtract(%s, %s) = %s; want %s", tc.a, tc.b, res.String(), tc.expected)
			}
		})
	}
}

func TestCalculator_Multiply(t *testing.T) {
	calc := calculator.New()

	tests := []struct {
		name     string
		a        string
		b        string
		expected string
	}{
		{
			name:     "0.1 * 0.2 equals 0.02",
			a:        "0.1",
			b:        "0.2",
			expected: "0.02",
		},
		{
			name:     "Micro-decimal times large scale integer equals 1",
			a:        "0.00000005",
			b:        "20000000",
			expected: "1",
		},
		{
			name:     "Multiply by zero",
			a:        "999999999.999",
			b:        "0",
			expected: "0",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			a := decimal.RequireFromString(tc.a)
			b := decimal.RequireFromString(tc.b)
			res := calc.Multiply(a, b)
			if res.String() != tc.expected {
				t.Errorf("Multiply(%s, %s) = %s; want %s", tc.a, tc.b, res.String(), tc.expected)
			}
		})
	}
}

func TestCalculator_Divide(t *testing.T) {
	calc := calculator.New()

	tests := []struct {
		name          string
		a             string
		b             string
		expected      string
		expectedError error
	}{
		{
			name:     "Exact integer division 10 / 2 = 5",
			a:        "10",
			b:        "2",
			expected: "5",
		},
		{
			name:     "Exact fractional division 1 / 8 = 0.125",
			a:        "1",
			b:        "8",
			expected: "0.125",
		},
		{
			name:     "Repeating fractional division 1 / 3 maintains 34 scale precision",
			a:        "1",
			b:        "3",
			expected: "0." + strings.Repeat("3", 34),
		},
		{
			name:          "Division by zero returns ErrDivisionByZero",
			a:             "42",
			b:             "0",
			expectedError: calculator.ErrDivisionByZero,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			a := decimal.RequireFromString(tc.a)
			b := decimal.RequireFromString(tc.b)
			res, err := calc.Divide(a, b)

			if tc.expectedError != nil {
				if err == nil {
					t.Fatalf("expected error %v, got nil", tc.expectedError)
				}
				if !errors.Is(err, tc.expectedError) {
					t.Fatalf("expected error %v, got %v", tc.expectedError, err)
				}
				return
			}

			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if res.String() != tc.expected {
				t.Errorf("Divide(%s, %s) = %s; want %s", tc.a, tc.b, res.String(), tc.expected)
			}
		})
	}
}

func TestCalculator_Power(t *testing.T) {
	calc := calculator.New()

	tests := []struct {
		name          string
		base          string
		exp           int64
		expected      string
		expectedError error
	}{
		{
			name:     "Positive exponent 2^3 = 8",
			base:     "2",
			exp:      3,
			expected: "8",
		},
		{
			name:     "Negative exponent reciprocal 2^-3 = 0.125",
			base:     "2",
			exp:      -3,
			expected: "0.125",
		},
		{
			name:     "Zero to power of zero evaluates to 1",
			base:     "0",
			exp:      0,
			expected: "1",
		},
		{
			name:     "Non-zero to power of zero evaluates to 1",
			base:     "999.888",
			exp:      0,
			expected: "1",
		},
		{
			name:     "Zero to positive power evaluates to 0",
			base:     "0",
			exp:      5,
			expected: "0",
		},
		{
			name:          "Zero to negative power triggers division by zero",
			base:          "0",
			exp:          -2,
			expectedError: calculator.ErrDivisionByZero,
		},
		{
			name:          "Exponent exceeding upper bound 1000",
			base:          "2",
			exp:           1001,
			expectedError: calculator.ErrExponentOutOfBounds,
		},
		{
			name:          "Exponent exceeding lower bound -1000",
			base:          "2",
			exp:           -1001,
			expectedError: calculator.ErrExponentOutOfBounds,
		},
		{
			name:     "Extreme scale 10^400 evaluates to 1 followed by 400 zeros",
			base:     "10",
			exp:      400,
			expected: "1" + strings.Repeat("0", 400),
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			base := decimal.RequireFromString(tc.base)
			res, err := calc.Power(base, tc.exp)

			if tc.expectedError != nil {
				if err == nil {
					t.Fatalf("expected error %v, got nil", tc.expectedError)
				}
				if !errors.Is(err, tc.expectedError) {
					t.Fatalf("expected error %v, got %v", tc.expectedError, err)
				}
				return
			}

			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if res.String() != tc.expected {
				t.Errorf("Power(%s, %d) = %s; want %s", tc.base, tc.exp, res.String(), tc.expected)
			}
		})
	}
}

func TestCalculator_Sqrt(t *testing.T) {
	calc := calculator.New()

	tests := []struct {
		name          string
		radicand      string
		expected      string
		expectedError error
		verifySquared bool
	}{
		{
			name:     "Square root of zero is 0",
			radicand: "0",
			expected: "0",
		},
		{
			name:     "Square root of one is 1",
			radicand: "1",
			expected: "1",
		},
		{
			name:     "Square root of perfect square 4 is 2",
			radicand: "4",
			expected: "2",
		},
		{
			name:     "Square root of perfect square 16 is 4",
			radicand: "16",
			expected: "4",
		},
		{
			name:     "Square root of decimal 0.04 is 0.2",
			radicand: "0.04",
			expected: "0.2",
		},
		{
			name:     "Square root of decimal 0.25 is 0.5",
			radicand: "0.25",
			expected: "0.5",
		},
		{
			name:     "Extreme scale sqrt(10^400) = 10^200",
			radicand: "1" + strings.Repeat("0", 400),
			expected: "1" + strings.Repeat("0", 200),
		},
		{
			name:          "Negative square root triggers ErrNegativeSquareRoot",
			radicand:      "-4",
			expectedError: calculator.ErrNegativeSquareRoot,
		},
		{
			name:          "Irrational sqrt(2) verified by squaring back to 2",
			radicand:      "2",
			verifySquared: true,
		},
		{
			name:          "Radicand with scale exceeding 34 places",
			radicand:      "0." + strings.Repeat("0", 35) + "4",
			verifySquared: true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			radicand := decimal.RequireFromString(tc.radicand)
			res, err := calc.Sqrt(radicand)

			if tc.expectedError != nil {
				if err == nil {
					t.Fatalf("expected error %v, got nil", tc.expectedError)
				}
				if !errors.Is(err, tc.expectedError) {
					t.Fatalf("expected error %v, got %v", tc.expectedError, err)
				}
				return
			}

			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if tc.verifySquared {
				squared := res.Mul(res)
				diff := squared.Sub(radicand).Abs()
				threshold := decimal.New(1, -30)
				if diff.GreaterThan(threshold) {
					t.Errorf("Sqrt(%s)^2 = %s; diff = %s exceeds threshold %s", tc.radicand, squared.String(), diff.String(), threshold.String())
				}
				return
			}

			if res.String() != tc.expected {
				t.Errorf("Sqrt(%s) = %s; want %s", tc.radicand, res.String(), tc.expected)
			}
		})
	}
}

func TestCalculator_Percentage(t *testing.T) {
	calc := calculator.New()

	t.Run("Unary percentage: 25% = 0.25", func(t *testing.T) {
		a := decimal.RequireFromString("25")
		res := calc.Percentage(a, nil)
		if res.String() != "0.25" {
			t.Errorf("Percentage(25, nil) = %s; want 0.25", res.String())
		}
	})

	t.Run("Binary percentage: 15% of 200 = 30", func(t *testing.T) {
		a := decimal.RequireFromString("200")
		b := decimal.RequireFromString("15")
		res := calc.Percentage(a, &b)
		if res.String() != "30" {
			t.Errorf("Percentage(200, 15) = %s; want 30", res.String())
		}
	})
}
