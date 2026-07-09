package models

import "time"

type ProductVariant struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ProductID uint      `gorm:"not null;index;constraint:OnDelete:CASCADE" json:"product_id"`
	Name      string    `gorm:"size:100;not null" json:"name"`
	Barcode   string    `gorm:"size:50;uniqueIndex" json:"barcode"`
	Price     int64     `gorm:"not null" json:"price"`
	Stock     int       `gorm:"not null;default:0" json:"stock"`
	MinStock  int       `gorm:"default:0" json:"min_stock"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Product   Product   `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}
