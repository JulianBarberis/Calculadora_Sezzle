package history_test

import (
	"fmt"
	"testing"
	"time"

	"github.com/julianbarberis/sezzle-calculator/internal/history"
)

func TestBuffer_BasicOperations(t *testing.T) {
	t.Run("Default capacity initialization when <= 0", func(t *testing.T) {
		buf := history.New(0)
		if buf == nil {
			t.Fatal("expected non-nil buffer")
		}
		if buf.Len() != 0 {
			t.Errorf("expected empty buffer, got length %d", buf.Len())
		}

		negativeBuf := history.New(-5)
		if negativeBuf == nil || negativeBuf.Len() != 0 {
			t.Fatal("expected valid empty buffer on negative capacity input")
		}
	})

	t.Run("Empty buffer returns empty slice", func(t *testing.T) {
		buf := history.New(history.DefaultCapacity)
		items := buf.GetAll()
		if len(items) != 0 {
			t.Fatalf("expected 0 items, got %d", len(items))
		}
		if buf.Len() != 0 {
			t.Errorf("expected Len() == 0, got %d", buf.Len())
		}
	})

	t.Run("Pushes unary and binary calculations preserving order", func(t *testing.T) {
		buf := history.New(5)
		bVal := "0.2"
		calc1 := history.Calculation{
			ID:         "1",
			Operation:  "add",
			A:          "0.1",
			B:          &bVal,
			Result:     "0.3",
			Expression: "0.1 + 0.2 = 0.3",
			Timestamp:  time.Now().UTC(),
		}
		calc2 := history.Calculation{
			ID:         "2",
			Operation:  "sqrt",
			A:          "16",
			B:          nil,
			Result:     "4",
			Expression: "sqrt(16) = 4",
			Timestamp:  time.Now().UTC().Add(time.Second),
		}

		buf.Push(calc1)
		buf.Push(calc2)

		if buf.Len() != 2 {
			t.Fatalf("expected length 2, got %d", buf.Len())
		}

		items := buf.GetAll()
		if len(items) != 2 {
			t.Fatalf("expected 2 items, got %d", len(items))
		}

		// Reverse chronological order: calc2 should be first, calc1 second
		if items[0].ID != "2" || items[0].Operation != "sqrt" {
			t.Errorf("expected first item to be ID 2 sqrt, got %v", items[0])
		}
		if items[1].ID != "1" || items[1].Operation != "add" {
			t.Errorf("expected second item to be ID 1 add, got %v", items[1])
		}
	})

	t.Run("FIFO eviction when capacity is exceeded", func(t *testing.T) {
		capacity := 5
		buf := history.New(capacity)

		// Push 10 items (IDs 1 through 10)
		for i := 1; i <= 10; i++ {
			buf.Push(history.Calculation{
				ID:         fmt.Sprintf("%d", i),
				Operation:  "add",
				A:          fmt.Sprintf("%d", i),
				Result:     fmt.Sprintf("%d", i*2),
				Expression: fmt.Sprintf("%d + %d = %d", i, i, i*2),
				Timestamp:  time.Now().UTC(),
			})
		}

		if buf.Len() != capacity {
			t.Fatalf("expected length capped at %d, got %d", capacity, buf.Len())
		}

		items := buf.GetAll()
		if len(items) != capacity {
			t.Fatalf("expected %d items, got %d", capacity, len(items))
		}

		// Oldest items (1..5) should have been evicted.
		// Retained items should be 6..10, in reverse order: 10, 9, 8, 7, 6.
		expectedIDs := []string{"10", "9", "8", "7", "6"}
		for i, expectedID := range expectedIDs {
			if items[i].ID != expectedID {
				t.Errorf("item at index %d has ID %s; want %s", i, items[i].ID, expectedID)
			}
		}
	})

	t.Run("Clear empties buffer completely", func(t *testing.T) {
		buf := history.New(3)
		buf.Push(history.Calculation{ID: "1", Operation: "add"})
		buf.Push(history.Calculation{ID: "2", Operation: "subtract"})

		if buf.Len() != 2 {
			t.Fatalf("expected length 2 before clear, got %d", buf.Len())
		}

		buf.Clear()

		if buf.Len() != 0 {
			t.Errorf("expected length 0 after clear, got %d", buf.Len())
		}
		items := buf.GetAll()
		if len(items) != 0 {
			t.Errorf("expected 0 items after clear, got %d", len(items))
		}
	})
}
