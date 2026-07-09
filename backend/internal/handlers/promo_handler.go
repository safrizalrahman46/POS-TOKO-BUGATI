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

type PromoHandler struct {
	service *services.PromoService
}

func NewPromoHandler(service *services.PromoService) *PromoHandler {
	return &PromoHandler{service: service}
}

func (h *PromoHandler) Index(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	promos, total, err := h.service.List(page, limit)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal mengambil data promo")
		return
	}

	utils.SuccessPaginated(c, promos, total, page, limit)
}

func (h *PromoHandler) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	promo, err := h.service.GetByID(uint(id))
	if err != nil {
		utils.Error(c, http.StatusNotFound, "Promo tidak ditemukan")
		return
	}

	utils.Success(c, promo)
}

func (h *PromoHandler) Active(c *gin.Context) {
	promos, err := h.service.GetActive()
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal mengambil data promo")
		return
	}

	utils.Success(c, promos)
}

func (h *PromoHandler) Create(c *gin.Context) {
	var promo models.Promo
	if err := c.ShouldBindJSON(&promo); err != nil {
		utils.Error(c, http.StatusBadRequest, "Data tidak valid")
		return
	}

	if err := h.service.Create(&promo); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Created(c, promo)
}

func (h *PromoHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	var promo models.Promo
	if err := c.ShouldBindJSON(&promo); err != nil {
		utils.Error(c, http.StatusBadRequest, "Data tidak valid")
		return
	}

	promo.ID = uint(id)
	if err := h.service.Update(&promo); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, promo)
}

func (h *PromoHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	if err := h.service.Delete(uint(id)); err != nil {
		utils.Error(c, http.StatusNotFound, err.Error())
		return
	}

	utils.Success(c, gin.H{"message": "Promo berhasil dihapus"})
}

func (h *PromoHandler) UploadImage(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	file, err := c.FormFile("image")
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "Gambar harus diupload")
		return
	}

	ext := filepath.Ext(file.Filename)
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		utils.Error(c, http.StatusBadRequest, "Format gambar harus jpg/jpeg/png/webp")
		return
	}

	if file.Size > 5<<20 {
		utils.Error(c, http.StatusBadRequest, "Ukuran gambar maksimal 5MB")
		return
	}

	uploadDir := "uploads/promos"
	os.MkdirAll(uploadDir, 0755)

	filename := fmt.Sprintf("%d-%d%s", id, time.Now().UnixMilli(), ext)
	filePath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, filePath); err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal menyimpan gambar")
		return
	}

	imageURL := "/uploads/promos/" + filename
	if err := h.service.UpdateImage(uint(id), imageURL); err != nil {
		utils.Error(c, http.StatusNotFound, err.Error())
		return
	}

	utils.Success(c, gin.H{"image": imageURL})
}

func (h *PromoHandler) DeleteImage(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	promo, err := h.service.GetByID(uint(id))
	if err != nil {
		utils.Error(c, http.StatusNotFound, "Promo tidak ditemukan")
		return
	}

	if promo.Image != "" {
		oldPath := "." + promo.Image
		os.Remove(oldPath)
	}

	h.service.UpdateImage(uint(id), "")
	utils.Success(c, gin.H{"message": "Gambar berhasil dihapus"})
}
