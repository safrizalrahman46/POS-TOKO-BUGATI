package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"pos-backend/internal/models"
	"pos-backend/internal/services"
	"pos-backend/pkg/utils"

	"github.com/gin-gonic/gin"
)

type StoreSettingsHandler struct {
	service *services.StoreSettingsService
}

func NewStoreSettingsHandler(service *services.StoreSettingsService) *StoreSettingsHandler {
	return &StoreSettingsHandler{service: service}
}

func (h *StoreSettingsHandler) Get(c *gin.Context) {
	setting, err := h.service.Get()
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal mengambil pengaturan toko")
		return
	}
	utils.Success(c, setting)
}

type updateStoreSettingsInput struct {
	StoreName           string  `json:"store_name"`
	StoreAddress        string  `json:"store_address"`
	StorePhone          string  `json:"store_phone"`
	StoreEmail          string  `json:"store_email"`
	StoreWebsite        string  `json:"store_website"`
	ReceiptHeader       string  `json:"receipt_header"`
	ReceiptFooter       string  `json:"receipt_footer"`
	ReceiptShowLogo     *bool   `json:"receipt_show_logo"`
	ReceiptShowCustomer *bool   `json:"receipt_show_customer"`
	ReceiptSize         string  `json:"receipt_size"`
	ReceiptFooterType   string  `json:"receipt_footer_type"`
	ReceiptFooterImage  string  `json:"receipt_footer_image"`
	TaxLabel            string  `json:"tax_label"`
	TaxRate             float64 `json:"tax_rate"`
	Currency            string  `json:"currency"`
}

func (h *StoreSettingsHandler) Update(c *gin.Context) {
	var input updateStoreSettingsInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Error(c, http.StatusBadRequest, "Data tidak valid")
		return
	}

	storeSetting := &models.StoreSetting{
		StoreName:     input.StoreName,
		StoreAddress:  input.StoreAddress,
		StorePhone:    input.StorePhone,
		StoreEmail:    input.StoreEmail,
		StoreWebsite:  input.StoreWebsite,
		ReceiptHeader: input.ReceiptHeader,
		ReceiptFooter: input.ReceiptFooter,
		ReceiptSize:   input.ReceiptSize,
		ReceiptFooterType:   input.ReceiptFooterType,
		ReceiptFooterImage:  input.ReceiptFooterImage,
		TaxLabel:      input.TaxLabel,
		TaxRate:       input.TaxRate,
		Currency:      input.Currency,
	}
	if input.ReceiptShowLogo != nil {
		storeSetting.ReceiptShowLogo = *input.ReceiptShowLogo
	}
	if input.ReceiptShowCustomer != nil {
		storeSetting.ReceiptShowCustomer = *input.ReceiptShowCustomer
	}

	result, err := h.service.Update(storeSetting)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, result)
}

func (h *StoreSettingsHandler) UploadLogo(c *gin.Context) {
	file, err := c.FormFile("logo")
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "File logo harus diunggah")
		return
	}

	ext := filepath.Ext(file.Filename)
	if ext != ".png" && ext != ".jpg" && ext != ".jpeg" && ext != ".webp" {
		utils.Error(c, http.StatusBadRequest, "Format file harus PNG, JPG, atau WebP")
		return
	}

	uploadDir := "uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal membuat direktori upload")
		return
	}

	filename := "logo" + ext
	filePath := filepath.Join(uploadDir, filename)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal menyimpan file")
		return
	}

	if _, err := h.service.UpdateLogo("/uploads/" + filename); err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal memperbarui logo")
		return
	}

	utils.Success(c, gin.H{"logo": "/uploads/" + filename})
}

func (h *StoreSettingsHandler) UploadFooterImage(c *gin.Context) {
	file, err := c.FormFile("footer_image")
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "File gambar footer harus diunggah")
		return
	}

	ext := filepath.Ext(file.Filename)
	if ext != ".png" && ext != ".jpg" && ext != ".jpeg" && ext != ".webp" {
		utils.Error(c, http.StatusBadRequest, "Format file harus PNG, JPG, atau WebP")
		return
	}

	uploadDir := "uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal membuat direktori upload")
		return
	}

	filename := "footer" + ext
	filePath := filepath.Join(uploadDir, filename)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal menyimpan file")
		return
	}

	if _, err := h.service.UpdateFooterImage("/uploads/" + filename); err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal memperbarui gambar footer")
		return
	}

	utils.Success(c, gin.H{"footer_image": "/uploads/" + filename})
}
