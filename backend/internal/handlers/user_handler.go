package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"pos-backend/internal/models"
	"pos-backend/internal/services"
	"pos-backend/pkg/utils"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	service *services.UserService
}

func NewUserHandler(service *services.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")

	users, total, err := h.service.List(page, limit, search)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal mengambil data pengguna")
		return
	}

	utils.SuccessPaginated(c, users, total, page, limit)
}

func (h *UserHandler) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	user, err := h.service.GetByID(uint(id))
	if err != nil {
		utils.Error(c, http.StatusNotFound, err.Error())
		return
	}

	utils.Success(c, user)
}

type createUserInput struct {
	Username    string `json:"username" binding:"required"`
	Password    string `json:"password" binding:"required"`
	FullName    string `json:"full_name" binding:"required"`
	Role        string `json:"role" binding:"required"`
	Permissions string `json:"permissions"`
}

func (h *UserHandler) Create(c *gin.Context) {
	var input createUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Error(c, http.StatusBadRequest, "Data tidak valid")
		return
	}

	user := models.User{
		Username:    input.Username,
		Password:    input.Password,
		FullName:    input.FullName,
		Role:        input.Role,
		Permissions: input.Permissions,
	}

	if err := h.service.Create(&user); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	user.Password = ""
	utils.Created(c, user)
}

type updateUserInput struct {
	Username    string `json:"username"`
	Password    string `json:"password"`
	FullName    string `json:"full_name"`
	Role        string `json:"role"`
	IsActive    *bool  `json:"is_active"`
	Permissions string `json:"permissions"`
}

func (h *UserHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	var input updateUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Error(c, http.StatusBadRequest, "Data tidak valid")
		return
	}

	user := models.User{
		Password:    input.Password,
		FullName:    input.FullName,
		Role:        input.Role,
		Permissions: input.Permissions,
	}
	user.ID = uint(id)
	user.Username = input.Username
	if input.IsActive != nil {
		user.IsActive = *input.IsActive
	}

	if err := h.service.Update(&user); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, user)
}

func (h *UserHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	if err := h.service.Delete(uint(id)); err != nil {
		utils.Error(c, http.StatusNotFound, err.Error())
		return
	}

	utils.Success(c, gin.H{"message": "Pengguna berhasil dihapus"})
}

func (h *UserHandler) UploadPhoto(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	file, err := c.FormFile("photo")
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "File photo tidak ditemukan")
		return
	}

	ext := filepath.Ext(file.Filename)
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		utils.Error(c, http.StatusBadRequest, "Format file harus JPG, PNG, atau WEBP")
		return
	}

	uploadDir := "uploads/users"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal membuat direktori upload")
		return
	}

	filename := fmt.Sprintf("user_%d_%d%s", id, time.Now().Unix(), ext)
	filePath := filepath.Join(uploadDir, filename)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal menyimpan file")
		return
	}

	photoURL := "/uploads/users/" + filename
	if err := h.service.UpdatePhoto(uint(id), photoURL); err != nil {
		utils.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.Success(c, gin.H{"photo": photoURL})
}

func (h *UserHandler) ToggleActive(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	if err := h.service.ToggleActive(uint(id)); err != nil {
		utils.Error(c, http.StatusNotFound, err.Error())
		return
	}

	utils.Success(c, gin.H{"message": "Status pengguna berhasil diubah"})
}
