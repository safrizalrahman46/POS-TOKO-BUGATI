package models

import "time"

type Notification struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `gorm:"not null;size:200" json:"title"`
	Message     string    `gorm:"type:text" json:"message"`
	Type        string    `gorm:"not null;default:info;size:20" json:"type"`
	RecipientID *uint     `json:"recipient_id"`
	IsRead      bool      `gorm:"default:false" json:"is_read"`
	Link        string    `gorm:"size:255" json:"link"`
	CreatedAt   time.Time `json:"created_at"`
	Recipient   User      `gorm:"foreignKey:RecipientID" json:"recipient,omitempty"`
}
