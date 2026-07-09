package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Username     string         `gorm:"unique;not null;size:50" json:"username"`
	Password     string         `gorm:"-" json:"password,omitempty"`
	PasswordHash string         `gorm:"not null" json:"-"`
	FullName     string         `gorm:"size:100" json:"full_name"`
	Role         string         `gorm:"not null;default:kasir;size:20" json:"role"`
	Permissions  string         `gorm:"size:500" json:"permissions"`
	Photo        string         `gorm:"size:255" json:"photo"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

var DefaultPermissions = map[string][]string{
	"superadmin": {"dashboard", "products", "categories", "vouchers", "auto_discounts", "reports", "users", "promos", "pos", "mirror", "customers", "settings"},
	"admin":      {"dashboard", "products", "categories", "vouchers", "auto_discounts", "reports", "promos", "pos", "mirror", "customers", "settings"},
	"kasir":      {"pos", "mirror"},
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.Password != "" {
		return u.HashPassword()
	}
	return nil
}

func (u *User) HashPassword() error {
	bytes, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.PasswordHash = string(bytes)
	return nil
}

func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}
