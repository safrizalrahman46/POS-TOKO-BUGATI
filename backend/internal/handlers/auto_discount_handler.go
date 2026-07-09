package handlers

import (
	"net/http"
	"strconv"

	"pos-backend/internal/models"
	"pos-backend/internal/services"
	"pos-backend/pkg/utils"

	"github.com/gin-gonic/gin"
)

type AutoDiscountHandler struct {
	service *services.AutoDiscountService
}

func NewAutoDiscountHandler(service *services.AutoDiscountService) *AutoDiscountHandler {
	return &AutoDiscountHandler{service: service}
}

func (h *AutoDiscountHandler) Index(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	discounts, total, err := h.service.List(page, limit)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal mengambil data diskon otomatis")
		return
	}

	utils.SuccessPaginated(c, discounts, total, page, limit)
}

func (h *AutoDiscountHandler) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	discount, err := h.service.GetByID(uint(id))
	if err != nil {
		utils.Error(c, http.StatusNotFound, "Diskon tidak ditemukan")
		return
	}

	utils.Success(c, discount)
}

func (h *AutoDiscountHandler) Create(c *gin.Context) {
	var discount models.AutoDiscount
	if err := c.ShouldBindJSON(&discount); err != nil {
		utils.Error(c, http.StatusBadRequest, "Data tidak valid")
		return
	}

	if err := h.service.Create(&discount); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Created(c, discount)
}

func (h *AutoDiscountHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	var discount models.AutoDiscount
	if err := c.ShouldBindJSON(&discount); err != nil {
		utils.Error(c, http.StatusBadRequest, "Data tidak valid")
		return
	}

	discount.ID = uint(id)
	if err := h.service.Update(&discount); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, discount)
}

func (h *AutoDiscountHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	if err := h.service.Delete(uint(id)); err != nil {
		utils.Error(c, http.StatusNotFound, err.Error())
		return
	}

	utils.Success(c, gin.H{"message": "Diskon otomatis berhasil dihapus"})
}
