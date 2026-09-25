package api

import (
	"log"
	"net/http"
)

// CORSMiddleware attaches standard Cross-Origin Resource Sharing headers
// and resolves OPTIONS preflight requests immediately.
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// PanicRecoveryMiddleware catches any runtime panic during request execution
// and returns a standardized HTTP 500 JSON error envelope without crashing the server.
func PanicRecoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("[PANIC RECOVERED] %v", rec)
				WriteError(w, http.StatusInternalServerError, CodeInternalError, "An unexpected internal error occurred.")
			}
		}()

		next.ServeHTTP(w, r)
	})
}

// Chain applies a series of middleware functions to an http.Handler in order.
func Chain(handler http.Handler, middlewares ...func(http.Handler) http.Handler) http.Handler {
	for i := len(middlewares) - 1; i >= 0; i-- {
		handler = middlewares[i](handler)
	}
	return handler
}
