package repository

import (
	"pos-backend/internal/models"

	"gorm.io/gorm"
)

type StoreSettingsRepository struct {
	db *gorm.DB
}

func NewStoreSettingsRepository(db *gorm.DB) *StoreSettingsRepository {
	return &StoreSettingsRepository{db: db}
}

func (r *StoreSettingsRepository) GetFirst() (*models.StoreSetting, error) {
	var setting models.StoreSetting
	err := r.db.First(&setting).Error
	if err != nil {
		return nil, err
	}
	return &setting, nil
}

func (r *StoreSettingsRepository) Create(setting *models.StoreSetting) error {
	return r.db.Create(setting).Error
}

func (r *StoreSettingsRepository) Update(setting *models.StoreSetting) error {
	return r.db.Save(setting).Error
}
