package history_test

import (
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/julianbarberis/sezzle-calculator/internal/history"
)

// TestBuffer_AdversarialConcurrency launches 60 parallel goroutines (30 writers, 30 readers)
// to verify thread-safety, absence of data races, and bounded capacity under high concurrent load.
func TestBuffer_AdversarialConcurrency(t *testing.T) {
	const (
		numWriters = 30
		numReaders = 30
		iterations = 100
		capacity   = 20
	)

	buf := history.New(capacity)
	var wg sync.WaitGroup
	wg.Add(numWriters + numReaders)

	startSignal := make(chan struct{})

	// 30 Writer goroutines
	for w := 0; w < numWriters; w++ {
		go func(writerID int) {
			defer wg.Done()
			<-startSignal

			for i := 0; i < iterations; i++ {
				calc := history.Calculation{
					ID:         fmt.Sprintf("w%d-%d", writerID, i),
					Operation:  "add",
					A:          fmt.Sprintf("%d", i),
					Result:     fmt.Sprintf("%d", i*2),
					Expression: fmt.Sprintf("%d + %d = %d", i, i, i*2),
					Timestamp:  time.Now().UTC(),
				}
				buf.Push(calc)
			}
		}(w)
	}

	// 30 Reader goroutines
	for r := 0; r < numReaders; r++ {
		go func(readerID int) {
			defer wg.Done()
			<-startSignal

			for i := 0; i < iterations; i++ {
				items := buf.GetAll()
				if len(items) > capacity {
					t.Errorf("reader %d observed buffer size %d exceeding capacity %d", readerID, len(items), capacity)
				}
				length := buf.Len()
				if length > capacity {
					t.Errorf("reader %d observed Len() %d exceeding capacity %d", readerID, length, capacity)
				}
			}
		}(r)
	}

	// Release all 60 goroutines simultaneously
	close(startSignal)
	wg.Wait()

	finalItems := buf.GetAll()
	if len(finalItems) != capacity {
		t.Fatalf("expected final items count to equal capacity %d, got %d", capacity, len(finalItems))
	}
	if buf.Len() != capacity {
		t.Fatalf("expected final Len() to equal capacity %d, got %d", capacity, buf.Len())
	}
}
