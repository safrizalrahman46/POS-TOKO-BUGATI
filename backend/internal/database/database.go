package database

import (
	"fmt"
	"log"

	"pos-backend/internal/config"
	"pos-backend/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(cfg *config.Config) {
	var err error
	DB, err = gorm.Open(postgres.Open(cfg.DBDSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	fmt.Println("Database connected successfully")
}

func Migrate() {
	err := DB.AutoMigrate(
		&models.User{},
		&models.Category{},
		&models.Product{},
		&models.ProductVariant{},
		&models.Order{},
		&models.OrderItem{},
		&models.Voucher{},
		&models.AutoDiscount{},
		&models.Notification{},
		&models.Promo{},
		&models.StoreSetting{},
		&models.Customer{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}
	fmt.Println("Database migrated successfully")
}

func Seed() {
	var count int64
	DB.Model(&models.User{}).Count(&count)
	if count > 0 {
		return
	}

	users := []models.User{
		{Username: "superadmin", Password: "superadmin123", FullName: "Super Administrator", Role: "superadmin", IsActive: true},
		{Username: "admin", Password: "admin123", FullName: "Administrator", Role: "admin", IsActive: true},
		{Username: "kasir", Password: "kasir123", FullName: "Kasir", Role: "kasir", IsActive: true},
	}
	for _, u := range users {
		u.HashPassword()
		DB.Create(&u)
	}

	categories := []models.Category{
		{Name: "Makanan", Description: "Makanan ringan dan berat"},
		{Name: "Minuman", Description: "Minuman dingin dan panas"},
		{Name: "Snack", Description: "Camilan dan kudapan"},
	}
	for _, c := range categories {
		DB.Create(&c)
	}

	products := []models.Product{
		{CategoryID: 1, Barcode: "8991001001001", Name: "Indomie Goreng", Price: 3500, CostPrice: 2800, Stock: 100, MinStock: 10, IsActive: true},
		{CategoryID: 1, Barcode: "8991001001002", Name: "Indomie Kuah", Price: 3500, CostPrice: 2800, Stock: 80, MinStock: 10, IsActive: true},
		{CategoryID: 1, Barcode: "8991001001003", Name: "Nasi Goreng", Price: 15000, CostPrice: 10000, Stock: 50, MinStock: 5, IsActive: true},
		{CategoryID: 1, Barcode: "8991001001004", Name: "Mie Ayam", Price: 12000, CostPrice: 8000, Stock: 40, MinStock: 5, IsActive: true},
		{CategoryID: 2, Barcode: "8991001001005", Name: "Aqua 600ml", Price: 3000, CostPrice: 2000, Stock: 200, MinStock: 20, IsActive: true},
		{CategoryID: 2, Barcode: "8991001001006", Name: "Teh Botol", Price: 5000, CostPrice: 3500, Stock: 150, MinStock: 15, IsActive: true},
		{CategoryID: 2, Barcode: "8991001001007", Name: "Kopi Hitam", Price: 5000, CostPrice: 3000, Stock: 60, MinStock: 10, IsActive: true},
		{CategoryID: 2, Barcode: "8991001001008", Name: "Kopi Susu", Price: 8000, CostPrice: 5000, Stock: 70, MinStock: 10, IsActive: true},
		{CategoryID: 3, Barcode: "8991001001009", Name: "Chitato", Price: 10000, CostPrice: 7500, Stock: 90, MinStock: 10, IsActive: true},
		{CategoryID: 3, Barcode: "8991001001010", Name: "Tango Wafer", Price: 7500, CostPrice: 5500, Stock: 85, MinStock: 10, IsActive: true},
	}
	for _, p := range products {
		DB.Create(&p)
	}

	maxDiscount := int64(20000)
	vouchers := []models.Voucher{
		{Code: "DISKON10", Type: "percent", Value: 10, MinPurchase: 50000, MaxDiscount: &maxDiscount, ValidFrom: "2024-01-01", ValidUntil: "2026-12-31", UsageLimit: 1000, UsedCount: 0, IsActive: true},
		{Code: "POTONGAN5K", Type: "fixed", Value: 5000, MinPurchase: 25000, MaxDiscount: nil, ValidFrom: "2024-01-01", ValidUntil: "2026-12-31", UsageLimit: 500, UsedCount: 0, IsActive: true},
	}
	for _, v := range vouchers {
		DB.Create(&v)
	}

	autoDiscounts := []models.AutoDiscount{
		{Name: "Diskon Belanja Besar", Type: "percent", Value: 5, MinPurchase: 100000, MinItems: 3, IsActive: true, ValidFrom: "2024-01-01", ValidUntil: "2026-12-31"},
		{Name: "Diskon Banyak Item", Type: "fixed", Value: 5000, MinPurchase: 50000, MinItems: 5, IsActive: true, ValidFrom: "2024-01-01", ValidUntil: "2026-12-31"},
	}
	for _, a := range autoDiscounts {
		DB.Create(&a)
	}

	fmt.Println("Database seeded successfully")
}
