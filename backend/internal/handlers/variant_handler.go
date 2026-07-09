package handlers

import (
	"net/http"
	"strconv"

	"pos-backend/internal/services"
	"pos-backend/pkg/utils"

	"github.com/gin-gonic/gin"
)

type VariantHandler struct {
	service *services.VariantService
}

func NewVariantHandler(service *services.VariantService) *VariantHandler {
	return &VariantHandler{service: service}
}

func (h *VariantHandler) Index(c *gin.Context) {
	productID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID produk tidak valid")
		return
	}

	variants, err := h.service.List(uint(productID))
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal mengambil data varian")
		return
	}

	utils.Success(c, variants)
}

func (h *VariantHandler) Create(c *gin.Context) {
	productID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID produk tidak valid")
		return
	}

	var input struct {
		Name     string `json:"name" binding:"required"`
		Barcode  string `json:"barcode"`
		Price    int64  `json:"price" binding:"required"`
		Stock    int    `json:"stock"`
		MinStock int    `json:"min_stock"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Error(c, http.StatusBadRequest, "Data varian tidak valid")
		return
	}

	variant, err := h.service.Create(uint(productID), input)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Created(c, variant)
}

func (h *VariantHandler) Update(c *gin.Context) {
	variantID, err := strconv.ParseUint(c.Param("variantId"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID varian tidak valid")
		return
	}

	var input struct {
		Name     string `json:"name"`
		Barcode  string `json:"barcode"`
		Price    int64  `json:"price"`
		Stock    int    `json:"stock"`
		MinStock int    `json:"min_stock"`
		IsActive *bool  `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Error(c, http.StatusBadRequest, "Data varian tidak valid")
		return
	}

	variant, err := h.service.Update(uint(variantID), input)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, variant)
}

func (h *VariantHandler) Delete(c *gin.Context) {
	variantID, err := strconv.ParseUint(c.Param("variantId"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID varian tidak valid")
		return
	}

	if err := h.service.Delete(uint(variantID)); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, gin.H{"message": "Varian berhasil dihapus"})
}

func (h *VariantHandler) FindByBarcode(c *gin.Context) {
	barcode := c.Query("barcode")
	if barcode == "" {
		utils.Error(c, http.StatusBadRequest, "Barcode harus diisi")
		return
	}

	variant, err := h.service.FindByBarcode(barcode)
	if err != nil {
		utils.Error(c, http.StatusNotFound, "Varian tidak ditemukan")
		return
	}

	utils.Success(c, variant)
}
