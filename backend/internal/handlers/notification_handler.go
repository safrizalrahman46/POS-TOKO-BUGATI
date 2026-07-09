package handlers

import (
	"net/http"
	"strconv"

	"pos-backend/internal/services"
	"pos-backend/pkg/utils"

	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	service *services.NotificationService
}

func NewNotificationHandler(service *services.NotificationService) *NotificationHandler {
	return &NotificationHandler{service: service}
}

func (h *NotificationHandler) Index(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	userID, _ := c.Get("user_id")
	notifications, err := h.service.List(userID.(uint), limit)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal mengambil notifikasi")
		return
	}

	unreadCount := h.service.GetUnreadCount(userID.(uint))

	utils.Success(c, gin.H{
		"notifications": notifications,
		"unread_count":  unreadCount,
	})
}

func (h *NotificationHandler) MarkRead(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	if err := h.service.MarkAsRead(uint(id)); err != nil {
		utils.Error(c, http.StatusNotFound, "Notifikasi tidak ditemukan")
		return
	}

	utils.Success(c, gin.H{"message": "Notifikasi ditandai sudah dibaca"})
}

func (h *NotificationHandler) MarkAllRead(c *gin.Context) {
	userID, _ := c.Get("user_id")

	if err := h.service.MarkAllAsRead(userID.(uint)); err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal menandai semua notifikasi")
		return
	}

	utils.Success(c, gin.H{"message": "Semua notifikasi ditandai sudah dibaca"})
}
