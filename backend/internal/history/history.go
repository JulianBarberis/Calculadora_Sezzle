package history

import (
	"sync"
	"time"
)

// DefaultCapacity defines the maximum number of items retained in the circular ring buffer.
const DefaultCapacity = 20

// Calculation represents a completed mathematical calculation record according to SPEC.md.
type Calculation struct {
	ID         string    `json:"id"`
	Operation  string    `json:"operation"`
	A          string    `json:"a"`
	B          *string   `json:"b,omitempty"`
	Result     string    `json:"result"`
	Expression string    `json:"expression"`
	Timestamp  time.Time `json:"timestamp"`
}

// Repository defines the contract for storing and querying calculation history.
type Repository interface {
	Push(calc Calculation)
	GetAll() []Calculation
	Clear()
	Len() int
}

// Buffer implements Repository as a thread-safe circular ring buffer with fixed capacity.
// It uses sync.RWMutex to serialize writes while permitting concurrent readers.
// Memory allocation is bounded to O(1) with zero slice reallocations after initialization.
type Buffer struct {
	mu       sync.RWMutex
	capacity int
	items    []Calculation
	start    int // points to the oldest item
	size     int // current number of items (<= capacity)
}

// New creates a new circular ring buffer with the specified capacity (defaults to 20 if <= 0).
func New(capacity int) *Buffer {
	if capacity <= 0 {
		capacity = DefaultCapacity
	}
	return &Buffer{
		capacity: capacity,
		items:    make([]Calculation, capacity),
	}
}

// Push adds a calculation to the buffer in a thread-safe manner.
// If the buffer is full, the oldest item is evicted via FIFO overwrite.
func (b *Buffer) Push(calc Calculation) {
	b.mu.Lock()
	defer b.mu.Unlock()

	if b.size < b.capacity {
		idx := (b.start + b.size) % b.capacity
		b.items[idx] = calc
		b.size++
	} else {
		b.items[b.start] = calc
		b.start = (b.start + 1) % b.capacity
	}
}

// GetAll returns all stored calculations in reverse chronological order (newest first).
func (b *Buffer) GetAll() []Calculation {
	b.mu.RLock()
	defer b.mu.RUnlock()

	result := make([]Calculation, b.size)
	for i := 0; i < b.size; i++ {
		idx := (b.start + b.size - 1 - i) % b.capacity
		result[i] = b.items[idx]
	}
	return result
}

// Clear resets the buffer in a thread-safe manner.
func (b *Buffer) Clear() {
	b.mu.Lock()
	defer b.mu.Unlock()

	b.items = make([]Calculation, b.capacity)
	b.start = 0
	b.size = 0
}

// Len returns the current number of items stored in the buffer.
func (b *Buffer) Len() int {
	b.mu.RLock()
	defer b.mu.RUnlock()

	return b.size
}
