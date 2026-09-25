package api_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/julianbarberis/sezzle-calculator/internal/api"
)

func TestHealthHandler(t *testing.T) {
	tests := []struct {
		name           string
		method         string
		expectedStatus int
		expectJSON     bool
	}{
		{
			name:           "Valid GET request returns 200 OK with health status",
			method:         http.MethodGet,
			expectedStatus: http.StatusOK,
			expectJSON:     true,
		},
		{
			name:           "Non-GET request returns 405 Method Not Allowed",
			method:         http.MethodPost,
			expectedStatus: http.StatusMethodNotAllowed,
			expectJSON:     false,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, "/api/v1/health", nil)
			rr := httptest.NewRecorder()

			api.HealthHandler(rr, req)

			if rr.Code != tc.expectedStatus {
				t.Fatalf("expected status %d, got %d", tc.expectedStatus, rr.Code)
			}

			if tc.expectJSON {
				contentType := rr.Header().Get("Content-Type")
				if contentType != "application/json" {
					t.Errorf("expected Content-Type application/json, got %q", contentType)
				}

				var resp api.HealthResponse
				if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
					t.Fatalf("failed to decode JSON response: %v", err)
				}

				if resp.Status != "healthy" {
					t.Errorf("expected status 'healthy', got %q", resp.Status)
				}
				if resp.Service != "calculator-api" {
					t.Errorf("expected service 'calculator-api', got %q", resp.Service)
				}
				if resp.Version != "1.0.0" {
					t.Errorf("expected version '1.0.0', got %q", resp.Version)
				}
				if resp.Timestamp == "" {
					t.Error("expected non-empty timestamp")
				}
			}
		})
	}
}
