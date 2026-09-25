package api_test

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/shopspring/decimal"

	"github.com/julianbarberis/sezzle-calculator/internal/api"
	"github.com/julianbarberis/sezzle-calculator/internal/calculator"
	"github.com/julianbarberis/sezzle-calculator/internal/history"
)

func setupTestServer() (*api.Server, http.Handler) {
	calc := calculator.New()
	hist := history.New(history.DefaultCapacity)
	server := api.NewServer(calc, hist)
	return server, server.Routes()
}

func TestHealthEndpoint(t *testing.T) {
	_, handler := setupTestServer()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", rec.Code)
	}

	var resp api.HealthResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Status != "healthy" || resp.Service != "calculator-api" || resp.Version != "1.0.0" {
		t.Errorf("unexpected health payload: %+v", resp)
	}
}

func TestCalculateEndpoint_ValidOperations(t *testing.T) {
	_, handler := setupTestServer()

	tests := []struct {
		name               string
		body               string
		expectedStatus     int
		expectedResult     string
		expectedExpression string
	}{
		{
			name:               "Add: 0.1 + 0.2 = 0.3 without float drift",
			body:               `{"operation": "add", "a": "0.1", "b": "0.2"}`,
			expectedStatus:     http.StatusOK,
			expectedResult:     "0.3",
			expectedExpression: "0.1 + 0.2 = 0.3",
		},
		{
			name:               "Add: with numeric JSON literals",
			body:               `{"operation": "add", "a": 10, "b": 25}`,
			expectedStatus:     http.StatusOK,
			expectedResult:     "35",
			expectedExpression: "10 + 25 = 35",
		},
		{
			name:               "Subtract: 10 - 4 = 6",
			body:               `{"operation": "subtract", "a": "10", "b": "4"}`,
			expectedStatus:     http.StatusOK,
			expectedResult:     "6",
			expectedExpression: "10 - 4 = 6",
		},
		{
			name:               "Multiply: 0.1 * 0.2 = 0.02",
			body:               `{"operation": "multiply", "a": "0.1", "b": "0.2"}`,
			expectedStatus:     http.StatusOK,
			expectedResult:     "0.02",
			expectedExpression: "0.1 * 0.2 = 0.02",
		},
		{
			name:               "Divide: 10 / 2 = 5",
			body:               `{"operation": "divide", "a": "10", "b": "2"}`,
			expectedStatus:     http.StatusOK,
			expectedResult:     "5",
			expectedExpression: "10 / 2 = 5",
		},
		{
			name:               "Power: 2 ^ 3 = 8",
			body:               `{"operation": "power", "a": "2", "b": "3"}`,
			expectedStatus:     http.StatusOK,
			expectedResult:     "8",
			expectedExpression: "2 ^ 3 = 8",
		},
		{
			name:               "Power: 2 ^ -3 = 0.125",
			body:               `{"operation": "power", "a": "2", "b": "-3"}`,
			expectedStatus:     http.StatusOK,
			expectedResult:     "0.125",
			expectedExpression: "2 ^ -3 = 0.125",
		},
		{
			name:               "Power: 0 ^ 0 = 1 per FinTech specification",
			body:               `{"operation": "power", "a": "0", "b": "0"}`,
			expectedStatus:     http.StatusOK,
			expectedResult:     "1",
			expectedExpression: "0 ^ 0 = 1",
		},
		{
			name:               "Sqrt: sqrt(16) = 4",
			body:               `{"operation": "sqrt", "a": "16"}`,
			expectedStatus:     http.StatusOK,
			expectedResult:     "4",
			expectedExpression: "sqrt(16) = 4",
		},
		{
			name:               "Unary Percentage: 25% = 0.25",
			body:               `{"operation": "percentage", "a": "25"}`,
			expectedStatus:     http.StatusOK,
			expectedResult:     "0.25",
			expectedExpression: "25% = 0.25",
		},
		{
			name:               "Binary Percentage: 15% of 200 = 30",
			body:               `{"operation": "percentage", "a": "200", "b": "15"}`,
			expectedStatus:     http.StatusOK,
			expectedResult:     "30",
			expectedExpression: "15% of 200 = 30",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(tc.body))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			if rec.Code != tc.expectedStatus {
				t.Fatalf("expected status %d, got %d. Body: %s", tc.expectedStatus, rec.Code, rec.Body.String())
			}

			var resp api.CalculateResponse
			if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			if resp.Result != tc.expectedResult {
				t.Errorf("result = %s; want %s", resp.Result, tc.expectedResult)
			}
			if resp.Expression != tc.expectedExpression {
				t.Errorf("expression = %s; want %s", resp.Expression, tc.expectedExpression)
			}
			if resp.ID == "" {
				t.Errorf("expected non-empty calculation ID")
			}
		})
	}
}

func TestCalculateEndpoint_Errors(t *testing.T) {
	_, handler := setupTestServer()

	tests := []struct {
		name           string
		method         string
		body           string
		expectedStatus int
		expectedCode   string
	}{
		{
			name:           "Method Not Allowed on GET /calculate",
			method:         http.MethodGet,
			body:           "",
			expectedStatus: http.StatusMethodNotAllowed,
			expectedCode:   "",
		},
		{
			name:           "Malformed JSON request body",
			method:         http.MethodPost,
			body:           `{not valid json`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   api.CodeMalformedJSON,
		},
		{
			name:           "Unsupported operation",
			method:         http.MethodPost,
			body:           `{"operation": "modulo", "a": "10", "b": "2"}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   api.CodeInvalidOperation,
		},
		{
			name:           "Empty operation",
			method:         http.MethodPost,
			body:           `{"operation": "", "a": "10", "b": "2"}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   api.CodeInvalidOperation,
		},
		{
			name:           "Missing operand A",
			method:         http.MethodPost,
			body:           `{"operation": "add", "b": "2"}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   api.CodeMissingOperand,
		},
		{
			name:           "Invalid operand A",
			method:         http.MethodPost,
			body:           `{"operation": "add", "a": "not_a_number", "b": "2"}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   api.CodeInvalidOperand,
		},
		{
			name:           "Missing operand B for binary operation",
			method:         http.MethodPost,
			body:           `{"operation": "divide", "a": "10"}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   api.CodeMissingOperand,
		},
		{
			name:           "Invalid operand B for binary operation",
			method:         http.MethodPost,
			body:           `{"operation": "add", "a": "10", "b": "invalid"}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   api.CodeInvalidOperand,
		},
		{
			name:           "Division by zero",
			method:         http.MethodPost,
			body:           `{"operation": "divide", "a": "10", "b": "0"}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   api.CodeDivisionByZero,
		},
		{
			name:           "Power: non-integer exponent",
			method:         http.MethodPost,
			body:           `{"operation": "power", "a": "2", "b": "2.5"}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   api.CodeInvalidOperand,
		},
		{
			name:           "Power: zero base with negative exponent triggers division by zero",
			method:         http.MethodPost,
			body:           `{"operation": "power", "a": "0", "b": "-2"}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   api.CodeDivisionByZero,
		},
		{
			name:           "Power: exponent out of bounds (> 1000)",
			method:         http.MethodPost,
			body:           `{"operation": "power", "a": "2", "b": "1001"}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   api.CodeExponentOutOfBounds,
		},
		{
			name:           "Negative square root",
			method:         http.MethodPost,
			body:           `{"operation": "sqrt", "a": "-4"}`,
			expectedStatus: http.StatusBadRequest,
			expectedCode:   api.CodeNegativeSquareRoot,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, "/api/v1/calculate", bytes.NewBufferString(tc.body))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			if rec.Code != tc.expectedStatus {
				t.Fatalf("expected status %d, got %d. Body: %s", tc.expectedStatus, rec.Code, rec.Body.String())
			}

			if tc.expectedCode != "" {
				var errResp api.ErrorResponse
				if err := json.NewDecoder(rec.Body).Decode(&errResp); err != nil {
					t.Fatalf("failed to decode error response: %v", err)
				}
				if errResp.Code != tc.expectedCode {
					t.Errorf("error code = %s; want %s", errResp.Code, tc.expectedCode)
				}
				if errResp.Status != tc.expectedStatus {
					t.Errorf("error status = %d; want %d", errResp.Status, tc.expectedStatus)
				}
			}
		})
	}
}

func TestHistoryEndpoint(t *testing.T) {
	_, handler := setupTestServer()

	t.Run("Initially empty history", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/history", nil)
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}

		var resp api.HistoryResponse
		if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode history: %v", err)
		}
		if resp.Total != 0 || len(resp.Items) != 0 {
			t.Errorf("expected 0 items, got total=%d items=%d", resp.Total, len(resp.Items))
		}
	})

	t.Run("History records calculations in reverse chronological order", func(t *testing.T) {
		// Post calculation 1
		req1 := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(`{"operation": "add", "a": "1", "b": "2"}`))
		rec1 := httptest.NewRecorder()
		handler.ServeHTTP(rec1, req1)
		if rec1.Code != http.StatusOK {
			t.Fatalf("failed calc 1: %d", rec1.Code)
		}

		// Post calculation 2
		req2 := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(`{"operation": "multiply", "a": "3", "b": "4"}`))
		rec2 := httptest.NewRecorder()
		handler.ServeHTTP(rec2, req2)
		if rec2.Code != http.StatusOK {
			t.Fatalf("failed calc 2: %d", rec2.Code)
		}

		// Query history
		reqH := httptest.NewRequest(http.MethodGet, "/api/v1/history", nil)
		recH := httptest.NewRecorder()
		handler.ServeHTTP(recH, reqH)

		var histResp api.HistoryResponse
		if err := json.NewDecoder(recH.Body).Decode(&histResp); err != nil {
			t.Fatalf("failed to decode history response: %v", err)
		}

		if histResp.Total != 2 || len(histResp.Items) != 2 {
			t.Fatalf("expected 2 items, got total=%d items=%d", histResp.Total, len(histResp.Items))
		}

		// Newest first: Multiply should be items[0], Add should be items[1]
		if histResp.Items[0].Operation != "multiply" || histResp.Items[0].Result != "12" {
			t.Errorf("expected item[0] to be multiply (12), got %+v", histResp.Items[0])
		}
		if histResp.Items[1].Operation != "add" || histResp.Items[1].Result != "3" {
			t.Errorf("expected item[1] to be add (3), got %+v", histResp.Items[1])
		}
	})

	t.Run("Method Not Allowed on POST /api/v1/history", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/history", nil)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusMethodNotAllowed {
			t.Errorf("expected 405 Method Not Allowed, got %d", rec.Code)
		}
	})

	t.Run("Server with nil history repository returns empty items safely", func(t *testing.T) {
		server := api.NewServer(calculator.New(), nil)
		req := httptest.NewRequest(http.MethodGet, "/api/v1/history", nil)
		rec := httptest.NewRecorder()
		server.HandleHistory(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		var resp api.HistoryResponse
		if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode: %v", err)
		}
		if resp.Total != 0 || len(resp.Items) != 0 {
			t.Errorf("expected empty items, got %d", resp.Total)
		}
	})
}

func TestMiddlewares(t *testing.T) {
	_, handler := setupTestServer()

	t.Run("CORS headers present on API responses", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		if rec.Header().Get("Access-Control-Allow-Origin") != "*" {
			t.Errorf("expected Access-Control-Allow-Origin: *")
		}
	})

	t.Run("OPTIONS preflight returns 204 No Content with CORS headers", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodOptions, "/api/v1/calculate", nil)
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected 204 No Content for OPTIONS, got %d", rec.Code)
		}
		if rec.Header().Get("Access-Control-Allow-Origin") != "*" {
			t.Errorf("expected Access-Control-Allow-Origin: *")
		}
	})

	t.Run("PanicRecovery catches panic and converts to HTTP 500 error envelope", func(t *testing.T) {
		panickingHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			panic("simulated fatal panic")
		})

		recovered := api.PanicRecoveryMiddleware(panickingHandler)
		req := httptest.NewRequest(http.MethodGet, "/panic", nil)
		rec := httptest.NewRecorder()

		recovered.ServeHTTP(rec, req)

		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500 Internal Server Error, got %d", rec.Code)
		}

		var errResp api.ErrorResponse
		if err := json.NewDecoder(rec.Body).Decode(&errResp); err != nil {
			t.Fatalf("failed to decode error response: %v", err)
		}
		if errResp.Code != api.CodeInternalError {
			t.Errorf("expected code %s, got %s", api.CodeInternalError, errResp.Code)
		}
	})
}

func TestDirectHandlerMethods(t *testing.T) {
	server, _ := setupTestServer()

	t.Run("HandleCalculate directly rejects non-POST", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/calculate", nil)
		rec := httptest.NewRecorder()
		server.HandleCalculate(rec, req)

		if rec.Code != http.StatusMethodNotAllowed {
			t.Errorf("expected 405 Method Not Allowed, got %d", rec.Code)
		}
	})

	t.Run("HandleHistory directly rejects non-GET", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/history", nil)
		rec := httptest.NewRecorder()
		server.HandleHistory(rec, req)

		if rec.Code != http.StatusMethodNotAllowed {
			t.Errorf("expected 405 Method Not Allowed, got %d", rec.Code)
		}
	})
}

type mockFailingEngine struct {
	calculator.Engine
}

func (m *mockFailingEngine) Divide(a, b decimal.Decimal) (decimal.Decimal, error) {
	return decimal.Zero, errors.New("simulated divide engine failure")
}

func (m *mockFailingEngine) Power(a decimal.Decimal, b int64) (decimal.Decimal, error) {
	return decimal.Zero, errors.New("simulated power engine failure")
}

func (m *mockFailingEngine) Sqrt(a decimal.Decimal) (decimal.Decimal, error) {
	return decimal.Zero, errors.New("simulated sqrt engine failure")
}

func TestEngineUnexpectedError(t *testing.T) {
	mockServer := api.NewServer(&mockFailingEngine{Engine: calculator.New()}, history.New(5))
	handler := mockServer.Routes()

	tests := []struct {
		name string
		body string
	}{
		{
			name: "Divide unexpected error",
			body: `{"operation": "divide", "a": "10", "b": "2"}`,
		},
		{
			name: "Power unexpected error",
			body: `{"operation": "power", "a": "2", "b": "3"}`,
		},
		{
			name: "Sqrt unexpected error",
			body: `{"operation": "sqrt", "a": "16"}`,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(tc.body))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			if rec.Code != http.StatusInternalServerError {
				t.Fatalf("expected 500, got %d", rec.Code)
			}

			var errResp api.ErrorResponse
			if err := json.NewDecoder(rec.Body).Decode(&errResp); err != nil {
				t.Fatalf("failed to decode: %v", err)
			}
			if errResp.Code != api.CodeInternalError {
				t.Errorf("expected %s, got %s", api.CodeInternalError, errResp.Code)
			}
		})
	}
}

