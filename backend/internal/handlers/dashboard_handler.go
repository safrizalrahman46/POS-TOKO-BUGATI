package handlers

import (
	"net/http"
	"strconv"

	"pos-backend/internal/services"
	"pos-backend/pkg/utils"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	dashboardSvc *services.DashboardService
	reportSvc    *services.ReportService
}

func NewDashboardHandler(dashboardSvc *services.DashboardService, reportSvc *services.ReportService) *DashboardHandler {
	return &DashboardHandler{
		dashboardSvc: dashboardSvc,
		reportSvc:    reportSvc,
	}
}

func (h *DashboardHandler) Stats(c *gin.Context) {
	stats := h.dashboardSvc.GetStats()

	dailySales, _ := h.dashboardSvc.GetDailySales(7)
	topProducts, _ := h.dashboardSvc.GetTopProducts(5)
	recentOrders, _ := h.dashboardSvc.GetRecentOrders(5)

	utils.Success(c, gin.H{
		"stats":         stats,
		"daily_sales":   dailySales,
		"top_products":  topProducts,
		"recent_orders": recentOrders,
	})
}

func (h *DashboardHandler) Reports(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	paymentMethod := c.Query("payment_method")
	cashierID := c.Query("cashier_id")

	report, err := h.reportSvc.GetReport(startDate, endDate, paymentMethod, cashierID)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal mengambil laporan")
		return
	}

	utils.Success(c, report)
}

func (h *DashboardHandler) ExportExcel(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	paymentMethod := c.Query("payment_method")
	cashierID := c.Query("cashier_id")

	data, err := h.reportSvc.ExportExcel(startDate, endDate, paymentMethod, cashierID)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal export Excel")
		return
	}

	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", "attachment; filename=laporan-penjualan.xlsx")
	c.Header("Content-Length", strconv.Itoa(len(data)))
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", data)
}

func (h *DashboardHandler) ExportPDF(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	paymentMethod := c.Query("payment_method")
	cashierID := c.Query("cashier_id")

	data, err := h.reportSvc.ExportPDF(startDate, endDate, paymentMethod, cashierID)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal export PDF")
		return
	}

	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", "attachment; filename=laporan-penjualan.pdf")
	c.Header("Content-Length", strconv.Itoa(len(data)))
	c.Data(http.StatusOK, "application/pdf", data)
}
