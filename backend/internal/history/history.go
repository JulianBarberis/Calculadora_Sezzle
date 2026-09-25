package history

// Repository defines the in-memory circular ring buffer interface for calculation history.
// Phase 2 will implement this using sync.RWMutex and a fixed capacity of 20 entries.
type Repository interface {
	// Push and GetAll will be implemented in Phase 2.
}
