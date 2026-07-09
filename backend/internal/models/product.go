package models

import "time"

type Product struct {
	ID          uint             `gorm:"primaryKey" json:"id"`
	CategoryID  uint             `gorm:"not null" json:"category_id"`
	Barcode     string           `gorm:"unique;size:50" json:"barcode"`
	Name        string           `gorm:"not null;size:200" json:"name"`
	Price       int64            `gorm:"not null" json:"price"`
	CostPrice   int64            `gorm:"default:0" json:"cost_price"`
	Stock       int              `gorm:"not null;default:0" json:"stock"`
	MinStock    int              `gorm:"default:0" json:"min_stock"`
	Image       string           `gorm:"size:255" json:"image"`
	IsActive    bool             `gorm:"default:true" json:"is_active"`
	HasVariants bool             `gorm:"default:false" json:"has_variants"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
	Category    Category         `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Variants    []ProductVariant `gorm:"foreignKey:ProductID" json:"variants,omitempty"`
}
