package repository

import (
	"pos-backend/internal/models"

	"gorm.io/gorm"
)

type ProductRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) *ProductRepository {
	return &ProductRepository{db: db}
}

func (r *ProductRepository) FindAll(page, limit int, search string, categoryID *uint) ([]models.Product, int64, error) {
	var products []models.Product
	var total int64
	query := r.db.Model(&models.Product{})

	if search != "" {
		query = query.Where("name LIKE ? OR barcode LIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if categoryID != nil {
		query = query.Where("category_id = ?", *categoryID)
	}

	query.Count(&total)
	offset := (page - 1) * limit
	err := query.Preload("Category").Offset(offset).Limit(limit).Order("id ASC").Find(&products).Error
	return products, total, err
}

func (r *ProductRepository) FindByID(id uint) (*models.Product, error) {
	var product models.Product
	err := r.db.Preload("Category").First(&product, id).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *ProductRepository) Create(product *models.Product) error {
	return r.db.Create(product).Error
}

func (r *ProductRepository) Update(product *models.Product) error {
	return r.db.Save(product).Error
}

func (r *ProductRepository) Delete(id uint) error {
	return r.db.Delete(&models.Product{}, id).Error
}

func (r *ProductRepository) Search(query string) ([]models.Product, error) {
	var products []models.Product
	err := r.db.Preload("Category").
		Where("name LIKE ? OR barcode LIKE ?", "%"+query+"%", "%"+query+"%").
		Limit(20).
		Find(&products).Error
	return products, err
}

func (r *ProductRepository) FindByBarcode(barcode string) (*models.Product, error) {
	var product models.Product
	err := r.db.Where("barcode = ?", barcode).First(&product).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *ProductRepository) UpdateImage(id uint, image string) error {
	return r.db.Model(&models.Product{}).Where("id = ?", id).UpdateColumn("image", image).Error
}

func (r *ProductRepository) UpdateStock(id uint, quantity int) error {
	return r.db.Model(&models.Product{}).Where("id = ?", id).
		UpdateColumn("stock", gorm.Expr("stock + ?", quantity)).Error
}

func (r *ProductRepository) UpdateHasVariants(id uint, hasVariants bool) error {
	return r.db.Model(&models.Product{}).Where("id = ?", id).
		UpdateColumn("has_variants", hasVariants).Error
}

func (r *ProductRepository) FindVariantByBarcode(barcode string) (*models.ProductVariant, error) {
	var v models.ProductVariant
	err := r.db.Where("barcode = ?", barcode).First(&v).Error
	if err != nil {
		return nil, err
	}
	return &v, nil
}
