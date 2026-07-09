package repository

import (
	"pos-backend/internal/models"

	"gorm.io/gorm"
)

type NotificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) *NotificationRepository {
	return &NotificationRepository{db: db}
}

func (r *NotificationRepository) FindAll(recipientID *uint, limit int) ([]models.Notification, error) {
	var notifications []models.Notification
	query := r.db.Order("created_at DESC")
	if recipientID != nil {
		query = query.Where("recipient_id = ?", *recipientID)
	}
	if limit > 0 {
		query = query.Limit(limit)
	}
	err := query.Find(&notifications).Error
	return notifications, err
}

func (r *NotificationRepository) Create(notification *models.Notification) error {
	return r.db.Create(notification).Error
}

func (r *NotificationRepository) MarkAsRead(id uint) error {
	return r.db.Model(&models.Notification{}).Where("id = ?", id).
		Update("is_read", true).Error
}

func (r *NotificationRepository) MarkAllAsRead(recipientID uint) error {
	return r.db.Model(&models.Notification{}).
		Where("recipient_id = ? AND is_read = ?", recipientID, false).
		Update("is_read", true).Error
}

func (r *NotificationRepository) CountUnread(recipientID uint) int64 {
	var count int64
	r.db.Model(&models.Notification{}).
		Where("recipient_id = ? AND is_read = ?", recipientID, false).
		Count(&count)
	return count
}
