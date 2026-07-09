package models

import "time"

type Order struct {
	ID             uint        `gorm:"primaryKey" json:"id"`
	InvoiceNumber  string      `gorm:"unique;not null;size:30" json:"invoice_number"`
	CashierID      uint        `gorm:"not null" json:"cashier_id"`
	CustomerName   string      `gorm:"size:100" json:"customer_name"`
	Status         string      `gorm:"not null;default:pending;size:20" json:"status"`
	Subtotal       int64       `gorm:"not null" json:"subtotal"`
	DiscountTotal  int64       `gorm:"default:0" json:"discount_total"`
	VoucherCode    string      `gorm:"size:50" json:"voucher_code"`
	VoucherDiscount int64      `gorm:"default:0" json:"voucher_discount"`
	TaxTotal       int64       `gorm:"default:0" json:"tax_total"`
	GrandTotal     int64       `gorm:"not null" json:"grand_total"`
	PaymentMethod  string      `gorm:"size:20" json:"payment_method"`
	PaymentAmount  int64       `gorm:"default:0" json:"payment_amount"`
	ChangeAmount   int64       `gorm:"default:0" json:"change_amount"`
	CreatedAt      time.Time   `json:"created_at"`
	UpdatedAt      time.Time   `json:"updated_at"`
	Cashier        User        `gorm:"foreignKey:CashierID" json:"cashier,omitempty"`
	Items          []OrderItem `gorm:"foreignKey:OrderID" json:"items,omitempty"`
}
