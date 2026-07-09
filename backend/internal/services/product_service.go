package services

import (
	"errors"
	"pos-backend/internal/models"
	"pos-backend/internal/repository"
)

type ProductService struct {
	productRepo *repository.ProductRepository
}

func NewProductService(productRepo *repository.ProductRepository) *ProductService {
	return &ProductService{productRepo: productRepo}
}

func (s *ProductService) List(page, limit int, search string, categoryID *uint) ([]models.Product, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	return s.productRepo.FindAll(page, limit, search, categoryID)
}

func (s *ProductService) GetByID(id uint) (*models.Product, error) {
	return s.productRepo.FindByID(id)
}

func (s *ProductService) Create(product *models.Product) error {
	if product.Name == "" {
		return errors.New("nama produk harus diisi")
	}
	if product.Price <= 0 {
		return errors.New("harga harus lebih dari 0")
	}
	return s.productRepo.Create(product)
}

func (s *ProductService) Update(product *models.Product) error {
	if product.ID == 0 {
		return errors.New("ID produk tidak valid")
	}
	if product.Name == "" {
		return errors.New("nama produk harus diisi")
	}
	if product.Price <= 0 {
		return errors.New("harga harus lebih dari 0")
	}
	return s.productRepo.Update(product)
}

func (s *ProductService) Delete(id uint) error {
	_, err := s.productRepo.FindByID(id)
	if err != nil {
		return errors.New("produk tidak ditemukan")
	}
	return s.productRepo.Delete(id)
}

func (s *ProductService) Search(query string) ([]models.Product, error) {
	if query == "" {
		return nil, errors.New("kata kunci pencarian harus diisi")
	}
	return s.productRepo.Search(query)
}

func (s *ProductService) FindByBarcode(barcode string) (*models.Product, error) {
	if barcode == "" {
		return nil, errors.New("barcode harus diisi")
	}
	return s.productRepo.FindByBarcode(barcode)
}

func (s *ProductService) UpdateImage(id uint, image string) error {
	return s.productRepo.UpdateImage(id, image)
}

func (s *ProductService) UpdateStock(id uint, quantity int) error {
	if quantity == 0 {
		return errors.New("jumlah perubahan stok tidak valid")
	}
	return s.productRepo.UpdateStock(id, quantity)
}
