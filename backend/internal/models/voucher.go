package models

import "time"

type Voucher struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Code        string `gorm:"unique;not null;size:50" json:"code"`
	Type        string `gorm:"not null;size:10" json:"type"`
	Value       int64  `gorm:"not null" json:"value"`
	MinPurchase int64  `gorm:"default:0" json:"min_purchase"`
	MaxDiscount *int64 `gorm:"default:null" json:"max_discount"`
	ValidFrom   string `gorm:"not null;size:20" json:"valid_from"`
	ValidUntil  string `gorm:"not null;size:20" json:"valid_until"`
	UsageLimit  int    `gorm:"default:0" json:"usage_limit"`
	UsedCount   int    `gorm:"default:0" json:"used_count"`
	IsActive    bool   `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
