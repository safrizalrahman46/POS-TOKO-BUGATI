package models

import "time"

type Promo struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Title       string `gorm:"not null;size:200" json:"title"`
	Description string `gorm:"size:500" json:"description"`
	Image       string `gorm:"size:255" json:"image"`
	Link        string `gorm:"size:255" json:"link"`
	StartDate   string `gorm:"not null;size:20" json:"start_date"`
	EndDate     string `gorm:"not null;size:20" json:"end_date"`
	IsActive    bool   `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
