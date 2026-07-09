package models

import "time"

type StoreSetting struct {
	ID                  uint      `gorm:"primaryKey" json:"id"`
	StoreName           string    `gorm:"size:200;not null;default:'TOKO BUGATI'" json:"store_name"`
	StoreAddress        string    `gorm:"size:500" json:"store_address"`
	StorePhone          string    `gorm:"size:50" json:"store_phone"`
	StoreEmail          string    `gorm:"size:100" json:"store_email"`
	StoreWebsite        string    `gorm:"size:200" json:"store_website"`
	ReceiptHeader       string    `gorm:"size:500" json:"receipt_header"`
	ReceiptFooter       string    `gorm:"size:500" json:"receipt_footer"`
	ReceiptShowLogo     bool      `gorm:"default:true" json:"receipt_show_logo"`
	ReceiptShowCustomer bool      `gorm:"default:true" json:"receipt_show_customer"`
	ReceiptSize         string    `gorm:"size:10;default:'80mm'" json:"receipt_size"`
	ReceiptFooterType   string    `gorm:"size:10;default:'text'" json:"receipt_footer_type"`
	ReceiptFooterImage  string    `gorm:"size:500" json:"receipt_footer_image"`
	Logo                string    `gorm:"size:500" json:"logo"`
	TaxLabel            string    `gorm:"size:50;default:'PPN 11%'" json:"tax_label"`
	TaxRate             float64   `gorm:"default:11" json:"tax_rate"`
	Currency            string    `gorm:"size:10;default:'Rp'" json:"currency"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}
