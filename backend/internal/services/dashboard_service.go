package services

import (
	"pos-backend/internal/database"
	"pos-backend/internal/models"
	"pos-backend/internal/repository"
	"time"
)

type DashboardService struct {
	orderRepo   *repository.OrderRepository
	productRepo *repository.ProductRepository
}

func NewDashboardService(orderRepo *repository.OrderRepository, productRepo *repository.ProductRepository) *DashboardService {
	return &DashboardService{orderRepo: orderRepo, productRepo: productRepo}
}

func (s *DashboardService) GetStats() map[string]interface{} {
	today := time.Now().Format("2006-01-02")
	stats := make(map[string]interface{})

	var todayRevenue int64
	database.DB.Model(&models.Order{}).
		Where("DATE(created_at) = ? AND status = ?", today, "paid").
		Select("COALESCE(SUM(grand_total), 0)").Scan(&todayRevenue)
	stats["today_revenue"] = todayRevenue

	var todayOrders int64
	database.DB.Model(&models.Order{}).
		Where("DATE(created_at) = ?", today).Count(&todayOrders)
	stats["today_orders"] = todayOrders

	var totalProducts int64
	database.DB.Model(&models.Product{}).Count(&totalProducts)
	stats["total_products"] = totalProducts

	var lowStockProducts int64
	database.DB.Model(&models.Product{}).
		Where("stock <= min_stock AND is_active = ?", true).Count(&lowStockProducts)
	stats["low_stock_products"] = lowStockProducts

	var todayTransactions int64
	database.DB.Model(&models.Order{}).
		Where("DATE(created_at) = ? AND status = ?", today, "paid").Count(&todayTransactions)
	stats["today_transactions"] = todayTransactions

	return stats
}

type DailySalesItem struct {
	Date       string `json:"date"`
	Total      int64  `json:"total"`
	OrderCount int64  `json:"order_count"`
}

func (s *DashboardService) GetDailySales(days int) ([]DailySalesItem, error) {
	if days < 1 {
		days = 7
	}
	startDate := time.Now().AddDate(0, 0, -days+1)

	var results []DailySalesItem
	err := database.DB.Model(&models.Order{}).
		Select("DATE(created_at) as date, COALESCE(SUM(grand_total), 0) as total, COUNT(*) as order_count").
		Where("created_at >= ? AND status = ?", startDate.Format("2006-01-02"), "paid").
		Group("DATE(created_at)").
		Order("date ASC").
		Find(&results).Error
	return results, err
}

type TopProductItem struct {
	ProductID    uint   `json:"product_id"`
	ProductName  string `json:"product_name"`
	TotalQty     int64  `json:"total_qty"`
	TotalRevenue int64  `json:"total_revenue"`
}

func (s *DashboardService) GetTopProducts(limit int) ([]TopProductItem, error) {
	if limit < 1 {
		limit = 5
	}

	var results []TopProductItem
	err := database.DB.Model(&models.OrderItem{}).
		Select("product_id, product_name, SUM(quantity) as total_qty, SUM(subtotal) as total_revenue").
		Joins("JOIN orders ON orders.id = order_items.order_id").
		Where("orders.status = ?", "paid").
		Group("product_id, product_name").
		Order("total_qty DESC").
		Limit(limit).
		Find(&results).Error
	return results, err
}

func (s *DashboardService) GetRecentOrders(limit int) ([]models.Order, error) {
	if limit < 1 {
		limit = 5
	}

	var orders []models.Order
	err := database.DB.Preload("Items").Preload("Cashier").
		Order("id DESC").Limit(limit).Find(&orders).Error
	return orders, err
}
