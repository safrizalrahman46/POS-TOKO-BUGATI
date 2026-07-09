package services

import (
	"errors"
	"pos-backend/internal/models"
	"pos-backend/internal/repository"
	"time"
)

type VoucherService struct {
	voucherRepo *repository.VoucherRepository
}

func NewVoucherService(voucherRepo *repository.VoucherRepository) *VoucherService {
	return &VoucherService{voucherRepo: voucherRepo}
}

func (s *VoucherService) List(page, limit int) ([]models.Voucher, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	return s.voucherRepo.FindAll(page, limit)
}

func (s *VoucherService) GetByID(id uint) (*models.Voucher, error) {
	return s.voucherRepo.FindByID(id)
}

func (s *VoucherService) Create(voucher *models.Voucher) error {
	if voucher.Code == "" {
		return errors.New("kode voucher harus diisi")
	}
	if voucher.Type != "percent" && voucher.Type != "fixed" {
		return errors.New("tipe voucher harus percent atau fixed")
	}
	if voucher.Value <= 0 {
		return errors.New("nilai voucher harus lebih dari 0")
	}
	if voucher.Type == "percent" && voucher.Value > 100 {
		return errors.New("diskon persen tidak boleh lebih dari 100")
	}
	if voucher.ValidFrom == "" || voucher.ValidUntil == "" {
		return errors.New("masa berlaku voucher harus diisi")
	}
	return s.voucherRepo.Create(voucher)
}

func (s *VoucherService) Update(voucher *models.Voucher) error {
	if voucher.ID == 0 {
		return errors.New("ID voucher tidak valid")
	}
	if voucher.Code == "" {
		return errors.New("kode voucher harus diisi")
	}
	if voucher.Type != "percent" && voucher.Type != "fixed" {
		return errors.New("tipe voucher harus percent atau fixed")
	}
	if voucher.Value <= 0 {
		return errors.New("nilai voucher harus lebih dari 0")
	}
	return s.voucherRepo.Update(voucher)
}

func (s *VoucherService) Delete(id uint) error {
	_, err := s.voucherRepo.FindByID(id)
	if err != nil {
		return errors.New("voucher tidak ditemukan")
	}
	return s.voucherRepo.Delete(id)
}

func (s *VoucherService) Validate(code string, subtotal int64) (int64, error) {
	if code == "" {
		return 0, errors.New("kode voucher harus diisi")
	}
	if subtotal <= 0 {
		return 0, errors.New("subtotal harus lebih dari 0")
	}

	voucher, err := s.voucherRepo.FindByCode(code)
	if err != nil {
		return 0, errors.New("voucher tidak ditemukan")
	}
	if !voucher.IsActive {
		return 0, errors.New("voucher tidak aktif")
	}
	if voucher.UsageLimit > 0 && voucher.UsedCount >= voucher.UsageLimit {
		return 0, errors.New("voucher sudah habis digunakan")
	}
	now := time.Now().Format("2006-01-02")
	if now < voucher.ValidFrom || now > voucher.ValidUntil {
		return 0, errors.New("voucher sudah tidak berlaku")
	}
	if subtotal < voucher.MinPurchase {
		return 0, errors.New("total belanja belum mencapai minimum")
	}

	var discount int64
	if voucher.Type == "percent" {
		discount = subtotal * voucher.Value / 100
		if voucher.MaxDiscount != nil && discount > *voucher.MaxDiscount {
			discount = *voucher.MaxDiscount
		}
	} else {
		discount = voucher.Value
	}
	return discount, nil
}
