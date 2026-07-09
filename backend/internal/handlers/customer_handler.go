package handlers

import (
	"net/http"
	"strconv"

	"pos-backend/internal/models"
	"pos-backend/internal/services"
	"pos-backend/pkg/utils"

	"github.com/gin-gonic/gin"
)

type CustomerHandler struct {
	service *services.CustomerService
}

func NewCustomerHandler(service *services.CustomerService) *CustomerHandler {
	return &CustomerHandler{service: service}
}

func (h *CustomerHandler) Index(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	search := c.Query("search")

	customers, total, err := h.service.List(page, limit, search)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal mengambil data pelanggan")
		return
	}

	utils.SuccessPaginated(c, customers, total, page, limit)
}

func (h *CustomerHandler) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	customer, err := h.service.GetByID(uint(id))
	if err != nil {
		utils.Error(c, http.StatusNotFound, "Pelanggan tidak ditemukan")
		return
	}

	utils.Success(c, customer)
}

func (h *CustomerHandler) Search(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		utils.Error(c, http.StatusBadRequest, "Kata kunci pencarian harus diisi")
		return
	}

	customers, err := h.service.Search(query)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.Success(c, customers)
}

type createCustomerInput struct {
	Name    string `json:"name" binding:"required"`
	Phone   string `json:"phone"`
	Email   string `json:"email"`
	Address string `json:"address"`
	Notes   string `json:"notes"`
}

func (h *CustomerHandler) Create(c *gin.Context) {
	var input createCustomerInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Error(c, http.StatusBadRequest, "Data tidak valid")
		return
	}

	customer := models.Customer{
		Name:    input.Name,
		Phone:   input.Phone,
		Email:   input.Email,
		Address: input.Address,
		Notes:   input.Notes,
		IsActive: true,
	}

	if err := h.service.Create(&customer); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Created(c, customer)
}

type updateCustomerInput struct {
	Name     string `json:"name"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
	Address  string `json:"address"`
	Notes    string `json:"notes"`
	IsActive *bool  `json:"is_active"`
}

func (h *CustomerHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	var input updateCustomerInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Error(c, http.StatusBadRequest, "Data tidak valid")
		return
	}

	customer := models.Customer{
		Name:    input.Name,
		Phone:   input.Phone,
		Email:   input.Email,
		Address: input.Address,
		Notes:   input.Notes,
	}
	if input.IsActive != nil {
		customer.IsActive = *input.IsActive
	}

	result, err := h.service.Update(uint(id), &customer)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, result)
}

func (h *CustomerHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	if err := h.service.Delete(uint(id)); err != nil {
		utils.Error(c, http.StatusNotFound, err.Error())
		return
	}

	utils.Success(c, gin.H{"message": "Pelanggan berhasil dihapus"})
}
