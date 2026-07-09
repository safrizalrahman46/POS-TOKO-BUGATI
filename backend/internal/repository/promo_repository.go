package repository

import (
	"pos-backend/internal/models"

	"gorm.io/gorm"
)

type PromoRepository struct {
	db *gorm.DB
}

func NewPromoRepository(db *gorm.DB) *PromoRepository {
	return &PromoRepository{db: db}
}

func (r *PromoRepository) FindAll(page, limit int) ([]models.Promo, int64, error) {
	var promos []models.Promo
	var total int64
	r.db.Model(&models.Promo{}).Count(&total)
	offset := (page - 1) * limit
	err := r.db.Offset(offset).Limit(limit).Order("id ASC").Find(&promos).Error
	return promos, total, err
}

func (r *PromoRepository) FindByID(id uint) (*models.Promo, error) {
	var promo models.Promo
	err := r.db.First(&promo, id).Error
	if err != nil {
		return nil, err
	}
	return &promo, nil
}

func (r *PromoRepository) FindActive() ([]models.Promo, error) {
	var promos []models.Promo
	err := r.db.Where("is_active = ?", true).Find(&promos).Error
	return promos, err
}

func (r *PromoRepository) Create(promo *models.Promo) error {
	return r.db.Create(promo).Error
}

func (r *PromoRepository) Update(promo *models.Promo) error {
	return r.db.Save(promo).Error
}

func (r *PromoRepository) UpdateImage(id uint, image string) error {
	return r.db.Model(&models.Promo{}).Where("id = ?", id).Update("image", image).Error
}

func (r *PromoRepository) Delete(id uint) error {
	return r.db.Delete(&models.Promo{}, id).Error
}
