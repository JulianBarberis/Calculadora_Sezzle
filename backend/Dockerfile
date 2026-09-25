# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY go.mod ./
RUN go mod download

# Copy source code
COPY . .

# Compile static binary with optimizations
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/api ./cmd/api

# Production stage
FROM alpine:3.21

# Install curl for healthcheck probe
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /home/appuser

COPY --from=builder /bin/api /bin/api

USER appuser

EXPOSE 8080

CMD ["/bin/api"]
