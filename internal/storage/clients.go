package storage

import (
	"fmt"
	"time"
)

type Client struct {
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (ps *PostgresStore) CreateClient(name, description string) error {
	_, err := ps.DB.Exec(`
		INSERT INTO clients (name, description, created_at, updated_at)
		VALUES ($1, $2, $3, $4)
	`, name, description, time.Now(), time.Now())
	return err
}

func (ps *PostgresStore) UpdateClient(name, description string) error {
	result, err := ps.DB.Exec(`
		UPDATE clients
		SET description = $1, updated_at = $2
		WHERE name = $3
	`, description, time.Now(), name)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("client not found")
	}
	return nil
}

func (ps *PostgresStore) DeleteClient(name string) error {
	result, err := ps.DB.Exec(`
		DELETE FROM clients
		WHERE name = $1
	`, name)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("client not found")
	}
	return nil
}

func (ps *PostgresStore) ListClients() ([]Client, error) {
	rows, err := ps.DB.Query(`
		SELECT name, description, created_at, updated_at
		FROM clients
		ORDER BY name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Client
	for rows.Next() {
		var c Client
		err := rows.Scan(&c.Name, &c.Description, &c.CreatedAt, &c.UpdatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, nil
}

func (ps *PostgresStore) GetClient(name string) (*Client, error) {
	var c Client
	err := ps.DB.QueryRow(`
		SELECT name, description, created_at, updated_at
		FROM clients
		WHERE name = $1
	`, name).Scan(&c.Name, &c.Description, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

