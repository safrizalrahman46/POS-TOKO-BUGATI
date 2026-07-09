package handlers

import (
	"net/http"

	"pos-backend/internal/models"
	"pos-backend/internal/services"
	"pos-backend/pkg/utils"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	service *services.AuthService
}

func NewAuthHandler(service *services.AuthService) *AuthHandler {
	return &AuthHandler{service: service}
}

type loginInput struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var input loginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Error(c, http.StatusBadRequest, "Username dan password harus diisi")
		return
	}

	result, err := h.service.Login(input.Username, input.Password)
	if err != nil {
		utils.Error(c, http.StatusUnauthorized, err.Error())
		return
	}

	utils.Success(c, result)
}

type registerInput struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	FullName string `json:"full_name" binding:"required"`
	Role     string `json:"role" binding:"required"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var input registerInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Error(c, http.StatusBadRequest, "Semua field harus diisi")
		return
	}

	user := &models.User{
		Username: input.Username,
		Password: input.Password,
		FullName: input.FullName,
		Role:     input.Role,
		IsActive: true,
	}

	if err := h.service.Register(user); err != nil {
		utils.Error(c, http.StatusConflict, err.Error())
		return
	}

	utils.Created(c, gin.H{"message": "Registrasi berhasil"})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get("user_id")

	user, err := h.service.GetProfile(userID.(uint))
	if err != nil {
		utils.Error(c, http.StatusNotFound, "User tidak ditemukan")
		return
	}

	user.PasswordHash = ""
	utils.Success(c, user)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	utils.Success(c, gin.H{"message": "Logout berhasil"})
}
