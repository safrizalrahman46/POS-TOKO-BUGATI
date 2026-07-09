package services

import (
	"errors"
	"pos-backend/internal/models"
	"pos-backend/internal/repository"
)

type PromoService struct {
	promoRepo *repository.PromoRepository
}

func NewPromoService(promoRepo *repository.PromoRepository) *PromoService {
	return &PromoService{promoRepo: promoRepo}
}

func (s *PromoService) List(page, limit int) ([]models.Promo, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	return s.promoRepo.FindAll(page, limit)
}

func (s *PromoService) GetByID(id uint) (*models.Promo, error) {
	return s.promoRepo.FindByID(id)
}

func (s *PromoService) GetActive() ([]models.Promo, error) {
	return s.promoRepo.FindActive()
}

func (s *PromoService) Create(promo *models.Promo) error {
	if promo.Title == "" {
		return errors.New("judul promo harus diisi")
	}
	if promo.StartDate == "" || promo.EndDate == "" {
		return errors.New("tanggal promo harus diisi")
	}
	return s.promoRepo.Create(promo)
}

func (s *PromoService) Update(promo *models.Promo) error {
	if promo.ID == 0 {
		return errors.New("ID promo tidak valid")
	}
	if promo.Title == "" {
		return errors.New("judul promo harus diisi")
	}
	return s.promoRepo.Update(promo)
}

func (s *PromoService) UpdateImage(id uint, image string) error {
	return s.promoRepo.UpdateImage(id, image)
}

func (s *PromoService) Delete(id uint) error {
	_, err := s.promoRepo.FindByID(id)
	if err != nil {
		return errors.New("promo tidak ditemukan")
	}
	return s.promoRepo.Delete(id)
}
