package handlers

import (
	"net/http"
	"strconv"

	"pos-backend/internal/models"
	"pos-backend/internal/services"
	"pos-backend/pkg/utils"

	"github.com/gin-gonic/gin"
)

type VoucherHandler struct {
	service *services.VoucherService
}

func NewVoucherHandler(service *services.VoucherService) *VoucherHandler {
	return &VoucherHandler{service: service}
}

func (h *VoucherHandler) Index(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	vouchers, total, err := h.service.List(page, limit)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal mengambil data voucher")
		return
	}

	utils.SuccessPaginated(c, vouchers, total, page, limit)
}

func (h *VoucherHandler) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	voucher, err := h.service.GetByID(uint(id))
	if err != nil {
		utils.Error(c, http.StatusNotFound, "Voucher tidak ditemukan")
		return
	}

	utils.Success(c, voucher)
}

func (h *VoucherHandler) Create(c *gin.Context) {
	var voucher models.Voucher
	if err := c.ShouldBindJSON(&voucher); err != nil {
		utils.Error(c, http.StatusBadRequest, "Data tidak valid")
		return
	}

	if err := h.service.Create(&voucher); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Created(c, voucher)
}

func (h *VoucherHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	var voucher models.Voucher
	if err := c.ShouldBindJSON(&voucher); err != nil {
		utils.Error(c, http.StatusBadRequest, "Data tidak valid")
		return
	}

	voucher.ID = uint(id)
	if err := h.service.Update(&voucher); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, voucher)
}

func (h *VoucherHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	if err := h.service.Delete(uint(id)); err != nil {
		utils.Error(c, http.StatusNotFound, err.Error())
		return
	}

	utils.Success(c, gin.H{"message": "Voucher berhasil dihapus"})
}

type validateInput struct {
	Code    string `json:"code" binding:"required"`
	Subtotal int64 `json:"subtotal" binding:"required"`
}

func (h *VoucherHandler) Validate(c *gin.Context) {
	var input validateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Error(c, http.StatusBadRequest, "Kode voucher dan subtotal harus diisi")
		return
	}

	discount, err := h.service.Validate(input.Code, input.Subtotal)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, gin.H{
		"code":     input.Code,
		"discount": discount,
	})
}
