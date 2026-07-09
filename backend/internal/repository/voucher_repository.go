package repository

import (
	"pos-backend/internal/models"

	"gorm.io/gorm"
)

type VoucherRepository struct {
	db *gorm.DB
}

func NewVoucherRepository(db *gorm.DB) *VoucherRepository {
	return &VoucherRepository{db: db}
}

func (r *VoucherRepository) FindAll(page, limit int) ([]models.Voucher, int64, error) {
	var vouchers []models.Voucher
	var total int64
	r.db.Model(&models.Voucher{}).Count(&total)
	offset := (page - 1) * limit
	err := r.db.Offset(offset).Limit(limit).Order("id ASC").Find(&vouchers).Error
	return vouchers, total, err
}

func (r *VoucherRepository) FindByID(id uint) (*models.Voucher, error) {
	var voucher models.Voucher
	err := r.db.First(&voucher, id).Error
	if err != nil {
		return nil, err
	}
	return &voucher, nil
}

func (r *VoucherRepository) FindByCode(code string) (*models.Voucher, error) {
	var voucher models.Voucher
	err := r.db.Where("code = ?", code).First(&voucher).Error
	if err != nil {
		return nil, err
	}
	return &voucher, nil
}

func (r *VoucherRepository) Create(voucher *models.Voucher) error {
	return r.db.Create(voucher).Error
}

func (r *VoucherRepository) Update(voucher *models.Voucher) error {
	return r.db.Save(voucher).Error
}

func (r *VoucherRepository) Delete(id uint) error {
	return r.db.Delete(&models.Voucher{}, id).Error
}

func (r *VoucherRepository) IncrementUsedCount(id uint) error {
	return r.db.Model(&models.Voucher{}).Where("id = ?", id).
		UpdateColumn("used_count", gorm.Expr("used_count + 1")).Error
}
