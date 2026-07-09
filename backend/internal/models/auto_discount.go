package models

import "time"

type AutoDiscount struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Name        string `gorm:"not null;size:100" json:"name"`
	Type        string `gorm:"not null;size:10" json:"type"`
	Value       int64  `gorm:"not null" json:"value"`
	MinPurchase int64  `gorm:"default:0" json:"min_purchase"`
	MinItems    int    `gorm:"default:0" json:"min_items"`
	IsActive    bool   `gorm:"default:true" json:"is_active"`
	ValidFrom   string `gorm:"not null;size:20" json:"valid_from"`
	ValidUntil  string `gorm:"not null;size:20" json:"valid_until"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
