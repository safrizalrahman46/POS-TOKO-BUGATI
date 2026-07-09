package services

import (
	"errors"
	"fmt"
	"pos-backend/internal/database"
	"pos-backend/internal/models"
	"pos-backend/internal/repository"
	"pos-backend/internal/websocket"
	"time"

	"gorm.io/gorm"
)

type OrderService struct {
	orderRepo        *repository.OrderRepository
	productRepo      *repository.ProductRepository
	voucherRepo      *repository.VoucherRepository
	autoDiscountRepo *repository.AutoDiscountRepository
	notifRepo        *repository.NotificationRepository
	storeSettingsRepo *repository.StoreSettingsRepository
	hub              *websocket.Hub
}

func NewOrderService(
	orderRepo *repository.OrderRepository,
	productRepo *repository.ProductRepository,
	voucherRepo *repository.VoucherRepository,
	autoDiscountRepo *repository.AutoDiscountRepository,
	notifRepo *repository.NotificationRepository,
	storeSettingsRepo *repository.StoreSettingsRepository,
	hub *websocket.Hub,
) *OrderService {
	return &OrderService{
		orderRepo:         orderRepo,
		productRepo:       productRepo,
		voucherRepo:       voucherRepo,
		autoDiscountRepo:  autoDiscountRepo,
		notifRepo:         notifRepo,
		storeSettingsRepo: storeSettingsRepo,
		hub:               hub,
	}
}

type CreateOrderInput struct {
	Items         []OrderItemInput `json:"items" binding:"required"`
	VoucherCode   string           `json:"voucher_code"`
	CustomerName  string           `json:"customer_name"`
	PaymentMethod string           `json:"payment_method" binding:"required"`
	PaymentAmount int64            `json:"payment_amount" binding:"required"`
}

type OrderItemInput struct {
	ProductID uint `json:"product_id" binding:"required"`
	Quantity  int  `json:"quantity" binding:"required"`
}

func (s *OrderService) CreateOrder(input CreateOrderInput, cashierID uint) (*models.Order, error) {
	if len(input.Items) == 0 {
		return nil, errors.New("item tidak boleh kosong")
	}
	if input.PaymentAmount <= 0 {
		return nil, errors.New("jumlah pembayaran harus lebih dari 0")
	}
	if input.PaymentMethod != "cash" && input.PaymentMethod != "debit" && input.PaymentMethod != "qris" {
		return nil, errors.New("metode pembayaran tidak valid")
	}

	tx := database.DB.Begin()
	if tx.Error != nil {
		return nil, errors.New("gagal memulai transaksi")
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var orderItems []models.OrderItem
	var subtotal int64 = 0
	var totalItemDiscount int64 = 0

	for _, item := range input.Items {
		var product models.Product
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&product, item.ProductID).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("produk dengan ID %d tidak ditemukan", item.ProductID)
		}
		if !product.IsActive {
			tx.Rollback()
			return nil, fmt.Errorf("produk %s tidak aktif", product.Name)
		}
		if product.Stock < item.Quantity {
			tx.Rollback()
			return nil, fmt.Errorf("stok %s tidak mencukupi (tersedia: %d, diminta: %d)", product.Name, product.Stock, item.Quantity)
		}

		lineTotal := product.Price * int64(item.Quantity)
		subtotal += lineTotal

		orderItems = append(orderItems, models.OrderItem{
			ProductID:   product.ID,
			ProductName: product.Name,
			Quantity:    item.Quantity,
			Price:       product.Price,
			Subtotal:    lineTotal,
		})
	}

	autoDiscounts, _ := s.autoDiscountRepo.FindApplicable(subtotal, int64(len(input.Items)))
	bestDiscount := int64(0)
	bestDiscountType := ""
	bestDiscountValue := int64(0)
	for _, ad := range autoDiscounts {
		var disc int64
		if ad.Type == "percent" {
			disc = subtotal * ad.Value / 100
		} else {
			disc = ad.Value
		}
		if disc > bestDiscount {
			bestDiscount = disc
			bestDiscountType = ad.Type
			bestDiscountValue = ad.Value
		}
	}
	totalItemDiscount = bestDiscount

	cartSubtotal := subtotal - totalItemDiscount

	var voucherDiscount int64 = 0
	if input.VoucherCode != "" {
		voucher, err := s.voucherRepo.FindByCode(input.VoucherCode)
		if err != nil {
			tx.Rollback()
			return nil, errors.New("voucher tidak ditemukan")
		}
		if !voucher.IsActive {
			tx.Rollback()
			return nil, errors.New("voucher tidak aktif")
		}
		if voucher.UsageLimit > 0 && voucher.UsedCount >= voucher.UsageLimit {
			tx.Rollback()
			return nil, errors.New("voucher sudah habis digunakan")
		}
		now := time.Now().Format("2006-01-02")
		if now < voucher.ValidFrom || now > voucher.ValidUntil {
			tx.Rollback()
			return nil, errors.New("voucher sudah tidak berlaku")
		}
		if cartSubtotal < voucher.MinPurchase {
			tx.Rollback()
			return nil, fmt.Errorf("minimum belanja Rp %d untuk voucher ini", voucher.MinPurchase)
		}
		if voucher.Type == "percent" {
			voucherDiscount = cartSubtotal * voucher.Value / 100
			if voucher.MaxDiscount != nil && voucherDiscount > *voucher.MaxDiscount {
				voucherDiscount = *voucher.MaxDiscount
			}
		} else {
			voucherDiscount = voucher.Value
		}
	}

	taxRate := 11.0
	if settings, err := s.storeSettingsRepo.GetFirst(); err == nil && settings.TaxRate > 0 {
		taxRate = settings.TaxRate
	}
	taxable := cartSubtotal - voucherDiscount
	if taxable < 0 {
		taxable = 0
	}
	taxTotal := int64(float64(taxable) * taxRate / 100.0)

	grandTotal := taxable + taxTotal

	if input.PaymentAmount < grandTotal {
		tx.Rollback()
		return nil, fmt.Errorf("pembayaran kurang Rp %d", grandTotal-input.PaymentAmount)
	}
	changeAmount := input.PaymentAmount - grandTotal

	now := time.Now()
	invoiceNumber := fmt.Sprintf("INV-%s-%04d", now.Format("20060102"), s.getOrderSequence(now))

	order := models.Order{
		InvoiceNumber:    invoiceNumber,
		CashierID:        cashierID,
		CustomerName:     input.CustomerName,
		Status:           "paid",
		Subtotal:         subtotal,
		DiscountTotal:    totalItemDiscount,
		VoucherCode:      input.VoucherCode,
		VoucherDiscount:  voucherDiscount,
		TaxTotal:         taxTotal,
		GrandTotal:       grandTotal,
		PaymentMethod:    input.PaymentMethod,
		PaymentAmount:    input.PaymentAmount,
		ChangeAmount:     changeAmount,
	}

	if err := tx.Create(&order).Error; err != nil {
		tx.Rollback()
		return nil, errors.New("gagal menyimpan order")
	}

	for i := range orderItems {
		orderItems[i].OrderID = order.ID
		orderItems[i].DiscountType = bestDiscountType
		orderItems[i].DiscountValue = bestDiscountValue
		for _, inputItem := range input.Items {
			if inputItem.ProductID == orderItems[i].ProductID {
				orderItems[i].Subtotal = orderItems[i].Price * int64(inputItem.Quantity)
				orderItems[i].Quantity = inputItem.Quantity
				break
			}
		}
	}

	if err := tx.Create(&orderItems).Error; err != nil {
		tx.Rollback()
		return nil, errors.New("gagal menyimpan item order")
	}

	for _, item := range orderItems {
		if err := tx.Model(&models.Product{}).Where("id = ?", item.ProductID).
			UpdateColumn("stock", gorm.Expr("stock - ?", item.Quantity)).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("gagal update stok produk %s", item.ProductName)
		}
	}

	if input.VoucherCode != "" {
		if err := tx.Model(&models.Voucher{}).Where("code = ?", input.VoucherCode).
			UpdateColumn("used_count", gorm.Expr("used_count + 1")).Error; err != nil {
			tx.Rollback()
			return nil, errors.New("gagal update voucher")
		}
	}

	for _, item := range orderItems {
		var product models.Product
		tx.First(&product, item.ProductID)
		if product.Stock <= product.MinStock {
			notif := models.Notification{
				Title:   "Stok Menipis",
				Message: fmt.Sprintf("Stok %s tersisa %d (minimal: %d)", product.Name, product.Stock, product.MinStock),
				Type:    "warning",
				Link:    fmt.Sprintf("/admin/products/%d", product.ID),
			}
			tx.Create(&notif)
		}
	}

	if err := tx.Commit().Error; err != nil {
		return nil, errors.New("gagal commit transaksi")
	}

	order.Items = orderItems

	s.broadcastOrderCreated(order)
	for _, item := range orderItems {
		s.broadcastStockUpdate(item.ProductID, item.Quantity)
	}

	return &order, nil
}

func (s *OrderService) getOrderSequence(date time.Time) int {
	var count int64
	database.DB.Model(&models.Order{}).Where("DATE(created_at) = ?", date.Format("2006-01-02")).Count(&count)
	return int(count) + 1
}

func (s *OrderService) broadcastOrderCreated(order models.Order) {
	if s.hub != nil {
		s.hub.BroadcastOrder(websocket.OrderMessage{
			Type:          "order_created",
			OrderID:       order.ID,
			InvoiceNumber: order.InvoiceNumber,
			GrandTotal:    order.GrandTotal,
			Status:        order.Status,
			PaymentMethod: order.PaymentMethod,
		})
	}
}

func (s *OrderService) broadcastStockUpdate(productID uint, quantity int) {
	if s.hub != nil {
		s.hub.BroadcastStock(websocket.StockMessage{
			Type:      "stock_update",
			ProductID: productID,
			Quantity:  quantity,
		})
	}
}

func (s *OrderService) List(page, limit int, status, startDate, endDate string) ([]models.Order, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	return s.orderRepo.FindAll(page, limit, status, startDate, endDate)
}

func (s *OrderService) GetByID(id uint) (*models.Order, error) {
	return s.orderRepo.FindByID(id)
}

func (s *OrderService) UpdateOrder(id uint, status, customerName, paymentMethod string) error {
	order, err := s.orderRepo.FindByID(id)
	if err != nil {
		return errors.New("order tidak ditemukan")
	}
	if status != "" {
		order.Status = status
	}
	if customerName != "" {
		order.CustomerName = customerName
	}
	if paymentMethod != "" {
		order.PaymentMethod = paymentMethod
	}
	return s.orderRepo.Update(order)
}

func (s *OrderService) DeleteOrder(id uint) error {
	order, err := s.orderRepo.FindByID(id)
	if err != nil {
		return errors.New("order tidak ditemukan")
	}
	if order.Status == "paid" {
		return errors.New("tidak dapat menghapus order yang sudah dibayar")
	}
	return s.orderRepo.Delete(id)
}

func (s *OrderService) CancelOrder(id uint) error {
	order, err := s.orderRepo.FindByID(id)
	if err != nil {
		return errors.New("order tidak ditemukan")
	}
	if order.Status == "cancelled" {
		return errors.New("order sudah dibatalkan")
	}

	tx := database.DB.Begin()
	if tx.Error != nil {
		return errors.New("gagal memulai transaksi")
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for _, item := range order.Items {
		if err := tx.Model(&models.Product{}).Where("id = ?", item.ProductID).
			UpdateColumn("stock", gorm.Expr("stock + ?", item.Quantity)).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("gagal mengembalikan stok %s", item.ProductName)
		}
	}

	order.Status = "cancelled"
	if err := tx.Save(&order).Error; err != nil {
		tx.Rollback()
		return errors.New("gagal membatalkan order")
	}

	if err := tx.Commit().Error; err != nil {
		return errors.New("gagal menyelesaikan pembatalan")
	}
	return nil
}

func (s *OrderService) History(page, limit int, startDate, endDate string, cashierID uint) ([]models.Order, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	var orders []models.Order
	var total int64
	query := database.DB.Model(&models.Order{}).Where("cashier_id = ?", cashierID)

	if startDate != "" {
		query = query.Where("created_at >= ?", startDate+" 00:00:00")
	}
	if endDate != "" {
		query = query.Where("created_at <= ?", endDate+" 23:59:59")
	}

	query.Count(&total)
	offset := (page - 1) * limit
	err := query.Preload("Items").Preload("Cashier").Offset(offset).Limit(limit).Order("id DESC").Find(&orders).Error
	return orders, total, err
}

func (s *OrderService) GetDailySales(days int) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	startDate := time.Now().AddDate(0, 0, -days+1)
	err := database.DB.Model(&models.Order{}).
		Select("DATE(created_at) as date, COALESCE(SUM(grand_total), 0) as total, COUNT(*) as order_count").
		Where("created_at >= ? AND status = ?", startDate.Format("2006-01-02"), "paid").
		Group("DATE(created_at)").
		Order("date ASC").
		Find(&results).Error
	return results, err
}
