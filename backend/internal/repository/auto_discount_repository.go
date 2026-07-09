package repository

import (
	"pos-backend/internal/models"
	"time"

	"gorm.io/gorm"
)

type AutoDiscountRepository struct {
	db *gorm.DB
}

func NewAutoDiscountRepository(db *gorm.DB) *AutoDiscountRepository {
	return &AutoDiscountRepository{db: db}
}

func (r *AutoDiscountRepository) FindAll(page, limit int) ([]models.AutoDiscount, int64, error) {
	var discounts []models.AutoDiscount
	var total int64
	r.db.Model(&models.AutoDiscount{}).Count(&total)
	offset := (page - 1) * limit
	err := r.db.Offset(offset).Limit(limit).Order("id ASC").Find(&discounts).Error
	return discounts, total, err
}

func (r *AutoDiscountRepository) FindByID(id uint) (*models.AutoDiscount, error) {
	var discount models.AutoDiscount
	err := r.db.First(&discount, id).Error
	if err != nil {
		return nil, err
	}
	return &discount, nil
}

func (r *AutoDiscountRepository) Create(discount *models.AutoDiscount) error {
	return r.db.Create(discount).Error
}

func (r *AutoDiscountRepository) Update(discount *models.AutoDiscount) error {
	return r.db.Save(discount).Error
}

func (r *AutoDiscountRepository) Delete(id uint) error {
	return r.db.Delete(&models.AutoDiscount{}, id).Error
}

func (r *AutoDiscountRepository) FindApplicable(subtotal, itemCount int64) ([]models.AutoDiscount, error) {
	var discounts []models.AutoDiscount
	now := time.Now().Format("2006-01-02")
	err := r.db.Where("is_active = ?", true).
		Where("min_purchase <= ?", subtotal).
		Where("min_items <= ?", itemCount).
		Where("valid_from <= ?", now).
		Where("valid_until >= ?", now).
		Find(&discounts).Error
	return discounts, err
}
