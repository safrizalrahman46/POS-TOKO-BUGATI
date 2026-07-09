package services

import (
	"errors"
	"pos-backend/internal/models"
	"pos-backend/internal/repository"
)

type CategoryService struct {
	categoryRepo *repository.CategoryRepository
}

func NewCategoryService(categoryRepo *repository.CategoryRepository) *CategoryService {
	return &CategoryService{categoryRepo: categoryRepo}
}

func (s *CategoryService) List(page, limit int, search string) ([]models.Category, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	return s.categoryRepo.FindAll(page, limit, search)
}

func (s *CategoryService) GetByID(id uint) (*models.Category, error) {
	return s.categoryRepo.FindByID(id)
}

func (s *CategoryService) Create(category *models.Category) error {
	if category.Name == "" {
		return errors.New("nama kategori harus diisi")
	}
	return s.categoryRepo.Create(category)
}

func (s *CategoryService) Update(category *models.Category) error {
	if category.ID == 0 {
		return errors.New("ID kategori tidak valid")
	}
	if category.Name == "" {
		return errors.New("nama kategori harus diisi")
	}
	return s.categoryRepo.Update(category)
}

func (s *CategoryService) Delete(id uint) error {
	_, err := s.categoryRepo.FindByID(id)
	if err != nil {
		return errors.New("kategori tidak ditemukan")
	}
	return s.categoryRepo.Delete(id)
}
