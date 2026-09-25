package api

import (
	"encoding/json"
	"net/http"
	"time"
)

// Standard error codes defined in SPEC.md.
const (
	CodeMalformedJSON       = "MALFORMED_JSON"
	CodeInvalidOperand      = "INVALID_OPERAND"
	CodeMissingOperand      = "MISSING_OPERAND"
	CodeInvalidOperation    = "INVALID_OPERATION"
	CodeDivisionByZero      = "DIVISION_BY_ZERO"
	CodeNegativeSquareRoot  = "NEGATIVE_SQUARE_ROOT"
	CodeExponentOutOfBounds = "EXPONENT_OUT_OF_BOUNDS"
	CodeInternalError       = "INTERNAL_ERROR"
)

// ErrorResponse represents the standardized error envelope required by SPEC.md.
type ErrorResponse struct {
	Error  string `json:"error"`
	Code   string `json:"code"`
	Status int    `json:"status"`
}

// CalculateRequest models the incoming JSON request for calculation.
type CalculateRequest struct {
	Operation string          `json:"operation"`
	A         json.RawMessage `json:"a"`
	B         json.RawMessage `json:"b,omitempty"`
}

// CalculateResponse represents the successful calculation response required by SPEC.md.
type CalculateResponse struct {
	ID         string    `json:"id"`
	Operation  string    `json:"operation"`
	A          string    `json:"a"`
	B          *string   `json:"b"`
	Result     string    `json:"result"`
	Expression string    `json:"expression"`
	Timestamp  time.Time `json:"timestamp"`
}

// HistoryResponse models the JSON payload returned by GET /api/v1/history.
type HistoryResponse struct {
	Items []CalculateResponse `json:"items"`
	Total int                 `json:"total"`
}

// WriteJSON serializes payload as JSON and writes status code and headers.
func WriteJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

// WriteError writes a standardized ErrorResponse envelope.
func WriteError(w http.ResponseWriter, status int, code, message string) {
	resp := ErrorResponse{
		Error:  message,
		Code:   code,
		Status: status,
	}
	WriteJSON(w, status, resp)
}
