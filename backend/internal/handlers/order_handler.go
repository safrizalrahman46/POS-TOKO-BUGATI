package handlers

import (
	"net/http"
	"strconv"

	"pos-backend/internal/services"
	"pos-backend/pkg/utils"

	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	service *services.OrderService
}

func NewOrderHandler(service *services.OrderService) *OrderHandler {
	return &OrderHandler{service: service}
}

func (h *OrderHandler) Index(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	status := c.Query("status")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	orders, total, err := h.service.List(page, limit, status, startDate, endDate)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal mengambil data order")
		return
	}

	utils.SuccessPaginated(c, orders, total, page, limit)
}

func (h *OrderHandler) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	order, err := h.service.GetByID(uint(id))
	if err != nil {
		utils.Error(c, http.StatusNotFound, "Order tidak ditemukan")
		return
	}

	utils.Success(c, order)
}

func (h *OrderHandler) Create(c *gin.Context) {
	var input services.CreateOrderInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Error(c, http.StatusBadRequest, "Data order tidak valid")
		return
	}

	cashierID, _ := c.Get("user_id")
	order, err := h.service.CreateOrder(input, cashierID.(uint))
	if err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Created(c, order)
}

func (h *OrderHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	var input struct {
		Status        string `json:"status"`
		CustomerName  string `json:"customer_name"`
		PaymentMethod string `json:"payment_method"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Error(c, http.StatusBadRequest, "Data order tidak valid")
		return
	}

	if err := h.service.UpdateOrder(uint(id), input.Status, input.CustomerName, input.PaymentMethod); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	order, _ := h.service.GetByID(uint(id))
	utils.Success(c, order)
}

func (h *OrderHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	if err := h.service.DeleteOrder(uint(id)); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, gin.H{"message": "Order berhasil dihapus"})
}

func (h *OrderHandler) History(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	cashierIDStr := c.DefaultQuery("cashier_id", "0")
	cashierID, _ := strconv.ParseUint(cashierIDStr, 10, 32)

	orders, total, err := h.service.History(page, limit, startDate, endDate, uint(cashierID))
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal mengambil riwayat order")
		return
	}

	utils.SuccessPaginated(c, orders, total, page, limit)
}

func (h *OrderHandler) Cancel(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	if err := h.service.CancelOrder(uint(id)); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, gin.H{"message": "Order berhasil dibatalkan"})
}
