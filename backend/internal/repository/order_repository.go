package repository

import (
	"pos-backend/internal/models"
	"time"

	"gorm.io/gorm"
)

type OrderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) *OrderRepository {
	return &OrderRepository{db: db}
}

func (r *OrderRepository) FindAll(page, limit int, status string, startDate, endDate string) ([]models.Order, int64, error) {
	var orders []models.Order
	var total int64
	query := r.db.Model(&models.Order{})

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if startDate != "" {
		query = query.Where("created_at >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("created_at <= ?", endDate)
	}

	query.Count(&total)
	offset := (page - 1) * limit
	err := query.Preload("Items").Preload("Cashier").Offset(offset).Limit(limit).Order("id DESC").Find(&orders).Error
	return orders, total, err
}

func (r *OrderRepository) FindByID(id uint) (*models.Order, error) {
	var order models.Order
	err := r.db.Preload("Items").Preload("Cashier").First(&order, id).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *OrderRepository) Create(order *models.Order) error {
	return r.db.Create(order).Error
}

func (r *OrderRepository) Update(order *models.Order) error {
	return r.db.Save(order).Error
}

func (r *OrderRepository) Delete(id uint) error {
	return r.db.Delete(&models.Order{}, id).Error
}

func (r *OrderRepository) FindByCashierID(cashierID, page, limit int) ([]models.Order, int64, error) {
	var orders []models.Order
	var total int64
	query := r.db.Model(&models.Order{}).Where("cashier_id = ?", cashierID)
	query.Count(&total)
	offset := (page - 1) * limit
	err := query.Preload("Items").Offset(offset).Limit(limit).Order("id DESC").Find(&orders).Error
	return orders, total, err
}

func (r *OrderRepository) GetTotalRevenue(startDate, endDate time.Time) (int64, error) {
	var total int64
	err := r.db.Model(&models.Order{}).
		Where("created_at BETWEEN ? AND ? AND status = ?", startDate, endDate, "paid").
		Select("COALESCE(SUM(grand_total), 0)").
		Scan(&total).Error
	return total, err
}

func (r *OrderRepository) GetTotalOrders(startDate, endDate time.Time) (int64, error) {
	var total int64
	err := r.db.Model(&models.Order{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Count(&total).Error
	return total, err
}

func (r *OrderRepository) GetTopProducts(limit int, startDate, endDate time.Time) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	err := r.db.Model(&models.OrderItem{}).
		Select("product_id, SUM(quantity) as total_qty, SUM(subtotal) as total_revenue").
		Joins("JOIN orders ON orders.id = order_items.order_id").
		Where("orders.created_at BETWEEN ? AND ?", startDate, endDate).
		Group("product_id").
		Order("total_qty DESC").
		Limit(limit).
		Find(&results).Error
	return results, err
}

func (r *OrderRepository) GetDailySales(days int) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	startDate := time.Now().AddDate(0, 0, -days)
	err := r.db.Model(&models.Order{}).
		Select("DATE(created_at) as date, COALESCE(SUM(grand_total), 0) as total, COUNT(*) as order_count").
		Where("created_at >= ? AND status = ?", startDate, "paid").
		Group("DATE(created_at)").
		Order("date ASC").
		Find(&results).Error
	return results, err
}
