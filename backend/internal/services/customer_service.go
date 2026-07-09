package services

import (
	"errors"
	"pos-backend/internal/models"
	"pos-backend/internal/repository"
)

type CustomerService struct {
	repo *repository.CustomerRepository
}

func NewCustomerService(repo *repository.CustomerRepository) *CustomerService {
	return &CustomerService{repo: repo}
}

func (s *CustomerService) List(page, limit int, search string) ([]models.Customer, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return s.repo.FindAll(page, limit, search)
}

func (s *CustomerService) GetByID(id uint) (*models.Customer, error) {
	return s.repo.FindByID(id)
}

func (s *CustomerService) Search(query string) ([]models.Customer, error) {
	if query == "" {
		return nil, errors.New("kata kunci pencarian harus diisi")
	}
	return s.repo.Search(query)
}

func (s *CustomerService) Create(customer *models.Customer) error {
	if customer.Name == "" {
		return errors.New("nama pelanggan harus diisi")
	}
	return s.repo.Create(customer)
}

func (s *CustomerService) Update(id uint, input *models.Customer) (*models.Customer, error) {
	customer, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("pelanggan tidak ditemukan")
	}

	if input.Name != "" {
		customer.Name = input.Name
	}
	if input.Phone != "" {
		customer.Phone = input.Phone
	}
	if input.Email != "" {
		customer.Email = input.Email
	}
	if input.Address != "" {
		customer.Address = input.Address
	}
	if input.Notes != "" {
		customer.Notes = input.Notes
	}
	customer.IsActive = input.IsActive

	if err := s.repo.Update(customer); err != nil {
		return nil, err
	}
	return customer, nil
}

func (s *CustomerService) Delete(id uint) error {
	_, err := s.repo.FindByID(id)
	if err != nil {
		return errors.New("pelanggan tidak ditemukan")
	}
	return s.repo.Delete(id)
}
