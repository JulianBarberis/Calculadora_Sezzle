package api_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"
	"sync"
	"testing"

	"github.com/julianbarberis/sezzle-calculator/internal/api"
	"github.com/julianbarberis/sezzle-calculator/internal/calculator"
	"github.com/julianbarberis/sezzle-calculator/internal/history"
)

// TestAPI_ConcurrentRequests executes 60 parallel HTTP requests against the calculate
// and history endpoints to ensure atomic ID monotonicity, data consistency, and absence of race conditions.
func TestAPI_ConcurrentRequests(t *testing.T) {
	calc := calculator.New()
	hist := history.New(history.DefaultCapacity)
	server := api.NewServer(calc, hist)
	handler := server.Routes()

	const (
		numCalculateWorkers = 40
		numHistoryWorkers   = 20
		totalWorkers         = numCalculateWorkers + numHistoryWorkers
	)

	var wg sync.WaitGroup
	wg.Add(totalWorkers)

	startSignal := make(chan struct{})
	var idMu sync.Mutex
	collectedIDs := make(map[uint64]bool)

	// 40 workers submitting POST /api/v1/calculate
	for i := 0; i < numCalculateWorkers; i++ {
		go func(workerID int) {
			defer wg.Done()
			<-startSignal

			payload := fmt.Sprintf(`{"operation": "add", "a": "%d", "b": "10"}`, workerID)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(payload))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Errorf("worker %d got status %d, body: %s", workerID, rec.Code, rec.Body.String())
				return
			}

			var resp api.CalculateResponse
			if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
				t.Errorf("worker %d failed to decode: %v", workerID, err)
				return
			}

			idNum, err := strconv.ParseUint(resp.ID, 10, 64)
			if err != nil {
				t.Errorf("invalid ID returned: %s", resp.ID)
				return
			}

			idMu.Lock()
			if collectedIDs[idNum] {
				t.Errorf("duplicate ID observed: %d", idNum)
			}
			collectedIDs[idNum] = true
			idMu.Unlock()
		}(i)
	}

	// 20 workers querying GET /api/v1/history concurrently
	for i := 0; i < numHistoryWorkers; i++ {
		go func(workerID int) {
			defer wg.Done()
			<-startSignal

			req := httptest.NewRequest(http.MethodGet, "/api/v1/history", nil)
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Errorf("history worker %d got status %d", workerID, rec.Code)
				return
			}

			var histResp api.HistoryResponse
			if err := json.NewDecoder(rec.Body).Decode(&histResp); err != nil {
				t.Errorf("history worker %d failed to decode: %v", workerID, err)
				return
			}

			if histResp.Total > history.DefaultCapacity {
				t.Errorf("history worker %d observed total %d > capacity 20", workerID, histResp.Total)
			}
		}(i)
	}

	// Fire all 60 goroutines simultaneously
	close(startSignal)
	wg.Wait()

	idMu.Lock()
	defer idMu.Unlock()

	if len(collectedIDs) != numCalculateWorkers {
		t.Fatalf("expected exactly %d unique IDs, got %d", numCalculateWorkers, len(collectedIDs))
	}

	// Ensure IDs range monotonically from 1 to 40
	for id := uint64(1); id <= uint64(numCalculateWorkers); id++ {
		if !collectedIDs[id] {
			t.Errorf("missing expected monotonic ID %d", id)
		}
	}
}
