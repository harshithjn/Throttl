FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o server ./cmd/server

FROM alpine
RUN apk --no-cache add wget
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
