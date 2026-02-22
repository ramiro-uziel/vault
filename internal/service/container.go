package service

import (
	"ramiro-uziel/vault/internal/db"
	"ramiro-uziel/vault/internal/storage"
)

type Service struct {
	Projects ProjectService
}

func NewService(database *db.DB, storageAdapter storage.Storage) *Service {
	return &Service{
		Projects: NewProjectService(database, storageAdapter),
	}
}
