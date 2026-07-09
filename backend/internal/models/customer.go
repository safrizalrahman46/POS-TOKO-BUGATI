package models

import "time"

type Customer struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	Name             string    `gorm:"size:200;not null" json:"name"`
	Phone            string    `gorm:"size:30" json:"phone"`
	Email            string    `gorm:"size:100" json:"email"`
	Address          string    `gorm:"size:500" json:"address"`
	Poin             int64     `gorm:"default:0" json:"poin"`
	TotalTransactions int64    `gorm:"default:0" json:"total_transactions"`
	TotalSpent       int64     `gorm:"default:0" json:"total_spent"`
	Notes            string    `gorm:"size:1000" json:"notes"`
	IsActive         bool      `gorm:"default:true" json:"is_active"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}
