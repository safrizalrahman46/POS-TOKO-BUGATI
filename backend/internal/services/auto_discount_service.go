package services

import (
	"errors"
	"pos-backend/internal/models"
	"pos-backend/internal/repository"
)

type AutoDiscountService struct {
	autoDiscountRepo *repository.AutoDiscountRepository
}

func NewAutoDiscountService(autoDiscountRepo *repository.AutoDiscountRepository) *AutoDiscountService {
	return &AutoDiscountService{autoDiscountRepo: autoDiscountRepo}
}

func (s *AutoDiscountService) List(page, limit int) ([]models.AutoDiscount, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	return s.autoDiscountRepo.FindAll(page, limit)
}

func (s *AutoDiscountService) GetByID(id uint) (*models.AutoDiscount, error) {
	return s.autoDiscountRepo.FindByID(id)
}

func (s *AutoDiscountService) Create(discount *models.AutoDiscount) error {
	if discount.Name == "" {
		return errors.New("nama diskon harus diisi")
	}
	if discount.Type != "percent" && discount.Type != "fixed" {
		return errors.New("tipe diskon harus percent atau fixed")
	}
	if discount.Value <= 0 {
		return errors.New("nilai diskon harus lebih dari 0")
	}
	if discount.Type == "percent" && discount.Value > 100 {
		return errors.New("diskon persen tidak boleh lebih dari 100")
	}
	if discount.ValidFrom == "" || discount.ValidUntil == "" {
		return errors.New("masa berlaku diskon harus diisi")
	}
	return s.autoDiscountRepo.Create(discount)
}

func (s *AutoDiscountService) Update(discount *models.AutoDiscount) error {
	if discount.ID == 0 {
		return errors.New("ID diskon tidak valid")
	}
	if discount.Name == "" {
		return errors.New("nama diskon harus diisi")
	}
	if discount.Type != "percent" && discount.Type != "fixed" {
		return errors.New("tipe diskon harus percent atau fixed")
	}
	if discount.Value <= 0 {
		return errors.New("nilai diskon harus lebih dari 0")
	}
	return s.autoDiscountRepo.Update(discount)
}

func (s *AutoDiscountService) Delete(id uint) error {
	_, err := s.autoDiscountRepo.FindByID(id)
	if err != nil {
		return errors.New("diskon tidak ditemukan")
	}
	return s.autoDiscountRepo.Delete(id)
}
