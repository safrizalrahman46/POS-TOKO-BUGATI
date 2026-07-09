package services

import (
	"pos-backend/internal/models"
	"pos-backend/internal/repository"
)

type NotificationService struct {
	notifRepo *repository.NotificationRepository
}

func NewNotificationService(notifRepo *repository.NotificationRepository) *NotificationService {
	return &NotificationService{notifRepo: notifRepo}
}

func (s *NotificationService) List(recipientID uint, limit int) ([]models.Notification, error) {
	if limit < 1 || limit > 100 {
		limit = 20
	}
	id := recipientID
	return s.notifRepo.FindAll(&id, limit)
}

func (s *NotificationService) Create(notif *models.Notification) error {
	return s.notifRepo.Create(notif)
}

func (s *NotificationService) MarkAsRead(id uint) error {
	return s.notifRepo.MarkAsRead(id)
}

func (s *NotificationService) MarkAllAsRead(recipientID uint) error {
	return s.notifRepo.MarkAllAsRead(recipientID)
}

func (s *NotificationService) GetUnreadCount(recipientID uint) int64 {
	return s.notifRepo.CountUnread(recipientID)
}
