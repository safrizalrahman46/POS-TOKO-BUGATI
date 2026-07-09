package models

import "time"

type OrderItem struct {
	ID            uint   `gorm:"primaryKey" json:"id"`
	OrderID       uint   `gorm:"not null;index" json:"order_id"`
	ProductID     uint   `gorm:"not null" json:"product_id"`
	VariantID     *uint  `gorm:"index" json:"variant_id"`
	VariantName   string `gorm:"size:100" json:"variant_name"`
	ProductName   string `gorm:"not null;size:200" json:"product_name"`
	Quantity      int    `gorm:"not null" json:"quantity"`
	Price         int64  `gorm:"not null" json:"price"`
	DiscountType  string `gorm:"size:10" json:"discount_type"`
	DiscountValue int64  `gorm:"default:0" json:"discount_value"`
	Subtotal      int64  `gorm:"not null" json:"subtotal"`
	CreatedAt     time.Time `json:"created_at"`
}
