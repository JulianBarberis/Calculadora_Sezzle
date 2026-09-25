package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync/atomic"
	"time"

	"github.com/shopspring/decimal"

	"github.com/julianbarberis/sezzle-calculator/internal/calculator"
	"github.com/julianbarberis/sezzle-calculator/internal/history"
)

// Server coordinates HTTP transport, the mathematical domain engine, and calculation history.
type Server struct {
	engine  calculator.Engine
	history history.Repository
	nextID  atomic.Uint64
}

// NewServer constructs an API Server instance.
func NewServer(engine calculator.Engine, history history.Repository) *Server {
	return &Server{
		engine:  engine,
		history: history,
	}
}

// Routes builds and returns the application's root HTTP handler with middleware attached.
func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/v1/health", HealthHandler)
	mux.HandleFunc("POST /api/v1/calculate", s.HandleCalculate)
	mux.HandleFunc("GET /api/v1/history", s.HandleHistory)

	return Chain(mux, PanicRecoveryMiddleware, CORSMiddleware)
}

// HandleCalculate processes incoming mathematical calculation requests.
func (s *Server) HandleCalculate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CalculateRequest
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, CodeMalformedJSON, "Malformed JSON request body")
		return
	}

	op := strings.ToLower(strings.TrimSpace(req.Operation))
	switch op {
	case "add", "subtract", "multiply", "divide", "power", "sqrt", "percentage":
		// Valid operation
	case "":
		WriteError(w, http.StatusBadRequest, CodeInvalidOperation, "Unsupported operation ''")
		return
	default:
		WriteError(w, http.StatusBadRequest, CodeInvalidOperation, fmt.Sprintf("Unsupported operation '%s'", req.Operation))
		return
	}

	// Parse operand A
	if isRawEmptyOrNull(req.A) {
		WriteError(w, http.StatusBadRequest, CodeMissingOperand, fmt.Sprintf("Operand 'a' is required for operation '%s'", req.Operation))
		return
	}
	decA, err := parseDecimalOperand(req.A)
	if err != nil {
		WriteError(w, http.StatusBadRequest, CodeInvalidOperand, "Operand 'a' is not a valid decimal number")
		return
	}

	// Check operand B requirements
	var (
		decB *decimal.Decimal
		bStr *string
	)

	isUnary := (op == "sqrt") || (op == "percentage" && isRawEmptyOrNull(req.B))

	if !isUnary {
		if isRawEmptyOrNull(req.B) {
			WriteError(w, http.StatusBadRequest, CodeMissingOperand, fmt.Sprintf("Operand 'b' is required for binary operation '%s'", req.Operation))
			return
		}
		val, err := parseDecimalOperand(req.B)
		if err != nil {
			WriteError(w, http.StatusBadRequest, CodeInvalidOperand, "Operand 'b' is not a valid decimal number")
			return
		}
		decB = &val
		strVal := val.String()
		bStr = &strVal
	}

	// Execute operation via calculation engine
	var (
		res  decimal.Decimal
		expr string
	)

	switch op {
	case "add":
		res = s.engine.Add(decA, *decB)
		expr = fmt.Sprintf("%s + %s = %s", decA.String(), decB.String(), res.String())

	case "subtract":
		res = s.engine.Subtract(decA, *decB)
		expr = fmt.Sprintf("%s - %s = %s", decA.String(), decB.String(), res.String())

	case "multiply":
		res = s.engine.Multiply(decA, *decB)
		expr = fmt.Sprintf("%s * %s = %s", decA.String(), decB.String(), res.String())

	case "divide":
		var divErr error
		res, divErr = s.engine.Divide(decA, *decB)
		if divErr != nil {
			if errors.Is(divErr, calculator.ErrDivisionByZero) {
				WriteError(w, http.StatusBadRequest, CodeDivisionByZero, "Cannot divide by zero. Please enter a non-zero divisor.")
				return
			}
			WriteError(w, http.StatusInternalServerError, CodeInternalError, "An unexpected internal error occurred.")
			return
		}
		expr = fmt.Sprintf("%s / %s = %s", decA.String(), decB.String(), res.String())

	case "power":
		if !decB.Equal(decB.Floor()) {
			WriteError(w, http.StatusBadRequest, CodeInvalidOperand, "Operand 'b' must be an integer exponent")
			return
		}
		exp := decB.IntPart()
		var powErr error
		res, powErr = s.engine.Power(decA, exp)
		if powErr != nil {
			if errors.Is(powErr, calculator.ErrDivisionByZero) {
				WriteError(w, http.StatusBadRequest, CodeDivisionByZero, "Cannot divide by zero. Please enter a non-zero divisor.")
				return
			}
			if errors.Is(powErr, calculator.ErrExponentOutOfBounds) {
				WriteError(w, http.StatusBadRequest, CodeExponentOutOfBounds, "Exponent out of range: must be between -1000 and 1000")
				return
			}
			WriteError(w, http.StatusInternalServerError, CodeInternalError, "An unexpected internal error occurred.")
			return
		}
		expr = fmt.Sprintf("%s ^ %s = %s", decA.String(), decB.String(), res.String())

	case "sqrt":
		var sqrtErr error
		res, sqrtErr = s.engine.Sqrt(decA)
		if sqrtErr != nil {
			if errors.Is(sqrtErr, calculator.ErrNegativeSquareRoot) {
				WriteError(w, http.StatusBadRequest, CodeNegativeSquareRoot, "Cannot calculate the square root of a negative number in real numbers.")
				return
			}
			WriteError(w, http.StatusInternalServerError, CodeInternalError, "An unexpected internal error occurred.")
			return
		}
		expr = fmt.Sprintf("sqrt(%s) = %s", decA.String(), res.String())

	case "percentage":
		if decB == nil {
			res = s.engine.Percentage(decA, nil)
			expr = fmt.Sprintf("%s%% = %s", decA.String(), res.String())
		} else {
			res = s.engine.Percentage(decA, decB)
			expr = fmt.Sprintf("%s%% of %s = %s", decB.String(), decA.String(), res.String())
		}
	}

	// Persist calculation with atomic monotonic ID
	id := s.nextID.Add(1)
	idStr := strconv.FormatUint(id, 10)
	now := time.Now().UTC()

	calc := history.Calculation{
		ID:         idStr,
		Operation:  op,
		A:          decA.String(),
		B:          bStr,
		Result:     res.String(),
		Expression: expr,
		Timestamp:  now,
	}

	if s.history != nil {
		s.history.Push(calc)
	}

	resp := CalculateResponse{
		ID:         idStr,
		Operation:  op,
		A:          decA.String(),
		B:          bStr,
		Result:     res.String(),
		Expression: expr,
		Timestamp:  now,
	}

	WriteJSON(w, http.StatusOK, resp)
}

// HandleHistory retrieves stored calculations in reverse chronological order.
func (s *Server) HandleHistory(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var items []CalculateResponse
	if s.history != nil {
		historyItems := s.history.GetAll()
		items = make([]CalculateResponse, len(historyItems))
		for i, h := range historyItems {
			items[i] = CalculateResponse{
				ID:         h.ID,
				Operation:  h.Operation,
				A:          h.A,
				B:          h.B,
				Result:     h.Result,
				Expression: h.Expression,
				Timestamp:  h.Timestamp,
			}
		}
	} else {
		items = make([]CalculateResponse, 0)
	}

	WriteJSON(w, http.StatusOK, HistoryResponse{
		Items: items,
		Total: len(items),
	})
}

// Helper functions for operand extraction
func isRawEmptyOrNull(raw json.RawMessage) bool {
	if len(raw) == 0 {
		return true
	}
	s := strings.TrimSpace(string(raw))
	return s == "" || s == "null"
}

func parseDecimalOperand(raw json.RawMessage) (decimal.Decimal, error) {
	s := strings.TrimSpace(string(raw))
	// Unquote if wrapped in JSON string quotes
	if strings.HasPrefix(s, `"`) && strings.HasSuffix(s, `"`) && len(s) >= 2 {
		unquoted, err := strconv.Unquote(s)
		if err == nil {
			s = unquoted
		} else {
			s = strings.Trim(s, `"`)
		}
	}

	return decimal.NewFromString(s)
}
