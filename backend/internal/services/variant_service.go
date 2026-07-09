package services

import (
	"errors"
	"pos-backend/internal/models"
	"pos-backend/internal/repository"
)

type VariantService struct {
	variantRepo *repository.VariantRepository
	productRepo *repository.ProductRepository
}

func NewVariantService(variantRepo *repository.VariantRepository, productRepo *repository.ProductRepository) *VariantService {
	return &VariantService{variantRepo: variantRepo, productRepo: productRepo}
}

func (s *VariantService) List(productID uint) ([]models.ProductVariant, error) {
	return s.variantRepo.FindByProductID(productID)
}

func (s *VariantService) Create(productID uint, input struct {
	Name     string `json:"name" binding:"required"`
	Barcode  string `json:"barcode"`
	Price    int64  `json:"price" binding:"required"`
	Stock    int    `json:"stock"`
	MinStock int    `json:"min_stock"`
}) (*models.ProductVariant, error) {
	if input.Name == "" {
		return nil, errors.New("nama varian harus diisi")
	}
	if input.Price <= 0 {
		return nil, errors.New("harga varian harus lebih dari 0")
	}
	if input.Stock < 0 {
		input.Stock = 0
	}

	variant := &models.ProductVariant{
		ProductID: productID,
		Name:      input.Name,
		Barcode:   input.Barcode,
		Price:     input.Price,
		Stock:     input.Stock,
		MinStock:  input.MinStock,
		IsActive:  true,
	}

	if err := s.variantRepo.Create(variant); err != nil {
		return nil, err
	}

	s.syncProductHasVariants(productID)
	return variant, nil
}

func (s *VariantService) Update(variantID uint, input struct {
	Name     string `json:"name"`
	Barcode  string `json:"barcode"`
	Price    int64  `json:"price"`
	Stock    int    `json:"stock"`
	MinStock int    `json:"min_stock"`
	IsActive *bool  `json:"is_active"`
}) (*models.ProductVariant, error) {
	variant, err := s.variantRepo.FindByID(variantID)
	if err != nil {
		return nil, errors.New("varian tidak ditemukan")
	}

	if input.Name != "" {
		variant.Name = input.Name
	}
	if input.Barcode != "" {
		variant.Barcode = input.Barcode
	}
	if input.Price > 0 {
		variant.Price = input.Price
	}
	if input.Stock >= 0 {
		variant.Stock = input.Stock
	}
	if input.MinStock >= 0 {
		variant.MinStock = input.MinStock
	}
	if input.IsActive != nil {
		variant.IsActive = *input.IsActive
	}

	if err := s.variantRepo.Update(variant); err != nil {
		return nil, err
	}
	return variant, nil
}

func (s *VariantService) Delete(variantID uint) error {
	variant, err := s.variantRepo.FindByID(variantID)
	if err != nil {
		return errors.New("varian tidak ditemukan")
	}
	if err := s.variantRepo.Delete(variantID); err != nil {
		return err
	}
	s.syncProductHasVariants(variant.ProductID)
	return nil
}

func (s *VariantService) FindByBarcode(barcode string) (*models.ProductVariant, error) {
	return s.variantRepo.FindByBarcode(barcode)
}

func (s *VariantService) syncProductHasVariants(productID uint) {
	variants, _ := s.variantRepo.FindByProductID(productID)
	count := 0
	for _, v := range variants {
		if v.IsActive {
			count++
		}
	}
	s.productRepo.UpdateHasVariants(productID, count > 0)
}
