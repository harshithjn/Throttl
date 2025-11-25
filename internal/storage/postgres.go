package storage

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

type PostgresStore struct {
	DB *sql.DB
}

func NewPostgresStore() (*PostgresStore, error) {
	connStr := "postgres://throttl:throttl@host.docker.internal:5432/throttl?sslmode=disable"

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("cannot connect to Postgres: %w", err)
	}

	return &PostgresStore{DB: db}, nil
}

func (ps *PostgresStore) Close() {
	ps.DB.Close()
}
