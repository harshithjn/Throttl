package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/harshithjn/Throttl/internal/middleware"
	"github.com/harshithjn/Throttl/internal/storage"
)

type CreateClientRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func ListClientsHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get authenticated client info from context
		authClientID, _ := r.Context().Value(middleware.ClientIDKey).(string)
		isAdmin, _ := r.Context().Value(middleware.IsAdminKey).(bool)

		var clients []storage.Client
		var err error

		if !isAdmin {
			// Non-admin: Only return the authenticated client's profile
			client, errGet := store.GetClient(authClientID)
			if errGet != nil {
				log.Printf("Failed to get client %s info: %v", authClientID, errGet)
				http.Error(w, "could not retrieve client info", http.StatusInternalServerError)
				return
			}
			clients = []storage.Client{*client}
		} else {
			// Admin: return all clients
			clients, err = store.ListClients()
			if err != nil {
				log.Printf("Failed to list clients: %v", err)
				http.Error(w, "could not list clients", http.StatusInternalServerError)
				return
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"clients": clients,
			"count":   len(clients),
		})
	}
}

func CreateClientHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req CreateClientRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid JSON", http.StatusBadRequest)
			return
		}

		if req.Name == "" {
			http.Error(w, "name is required", http.StatusBadRequest)
			return
		}

		err := store.CreateClient(req.Name, req.Description)
		if err != nil {
			log.Printf("Failed to create client: %v", err)
			http.Error(w, "could not create client", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status": "success",
			"name":   req.Name,
		})
	}
}

func UpdateClientHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost && r.Method != http.MethodPut {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req CreateClientRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid JSON", http.StatusBadRequest)
			return
		}

		if req.Name == "" {
			http.Error(w, "name is required", http.StatusBadRequest)
			return
		}

		err := store.UpdateClient(req.Name, req.Description)
		if err != nil {
			log.Printf("Failed to update client: %v", err)
			http.Error(w, "could not update client", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status": "success",
			"name":   req.Name,
		})
	}
}

func DeleteClientHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		name := r.URL.Query().Get("name")
		if name == "" {
			http.Error(w, "name parameter is required", http.StatusBadRequest)
			return
		}

		err := store.DeleteClient(name)
		if err != nil {
			log.Printf("Failed to delete client: %v", err)
			http.Error(w, "could not delete client", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "success",
			"deleted": name,
		})
	}
}

func GetGlobalStatsHandler(redisClient *storage.RedisClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		pipe := redisClient.Client.Pipeline()
		totalCmd := pipe.Get(ctx, "throttl:stats:total_requests")
		allowedCmd := pipe.Get(ctx, "throttl:stats:allowed_requests")
		blockedCmd := pipe.Get(ctx, "throttl:stats:blocked_requests")
		latencyCmd := pipe.Get(ctx, "throttl:stats:total_latency_ms")

		_, _ = pipe.Exec(ctx)

		totalRequests, _ := totalCmd.Int64()
		allowedRequests, _ := allowedCmd.Int64()
		blockedRequests, _ := blockedCmd.Int64()
		totalLatencyMs, _ := latencyCmd.Float64()

		avgLatency := 0.0
		if totalRequests > 0 {
			avgLatency = totalLatencyMs / float64(totalRequests)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"total_requests":   totalRequests,
			"allowed_requests": allowedRequests,
			"blocked_requests": blockedRequests,
			"avg_latency_ms":   avgLatency,
		})
	}
}

type RegisterRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type RegisterResponse struct {
	Status      string `json:"status"`
	ClientName  string `json:"client_name"`
	APIKey      string `json:"api_key"`
	Description string `json:"description,omitempty"`
}

func RegisterHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req RegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid JSON", http.StatusBadRequest)
			return
		}

		if req.Name == "" {
			http.Error(w, "name is required", http.StatusBadRequest)
			return
		}

		// Insert client slug
		err := store.CreateClient(req.Name, req.Description)
		if err != nil {
			log.Printf("Failed to create client in register: %v", err)
			http.Error(w, "client name already taken", http.StatusConflict)
			return
		}

		// Generate dynamic first Client API Key
		key, err := store.CreateAPIKey(req.Name, "Default API Key", storage.APIKeyTypeClient)
		if err != nil {
			log.Printf("Failed to create default API key inside register: %v", err)
			_ = store.DeleteClient(req.Name)
			http.Error(w, "failed to generate API key", http.StatusInternalServerError)
			return
		}

		// Insert a default '*' rate limit rule so they can test immediately
		err = store.UpsertRateLimitConfig(storage.RateLimitConfigInput{
			ClientID:   req.Name,
			Route:      "*",
			Algorithm:  storage.AlgorithmTokenBucket,
			Limit:      100,
			RefillRate: 1,
			Capacity:   10,
			WindowSize: 60,
		})
		if err != nil {
			log.Printf("Warning: failed to insert default rate limit rule for registered client: %v", err)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(RegisterResponse{
			Status:      "success",
			ClientName:  req.Name,
			APIKey:      key,
			Description: req.Description,
		})
	}
}
