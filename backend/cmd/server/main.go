package main

import (
	"fmt"
	"log"
	"pos-backend/internal/config"
	"pos-backend/internal/database"
	"pos-backend/internal/handlers"
	"pos-backend/internal/repository"
	"pos-backend/internal/routes"
	"pos-backend/internal/services"
	"pos-backend/internal/websocket"
	"pos-backend/internal/middleware"
	"pos-backend/pkg/jwt"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	database.Connect(cfg)
	database.Migrate()
	database.Seed()

	jwtSvc := jwt.NewJWTService(cfg.JWTSecret, cfg.JWTExpiry())

	hub := websocket.NewHub()
	go hub.Run()

	userRepo := repository.NewUserRepository(database.DB)
	categoryRepo := repository.NewCategoryRepository(database.DB)
	productRepo := repository.NewProductRepository(database.DB)
	orderRepo := repository.NewOrderRepository(database.DB)
	voucherRepo := repository.NewVoucherRepository(database.DB)
	autoDiscountRepo := repository.NewAutoDiscountRepository(database.DB)
	notifRepo := repository.NewNotificationRepository(database.DB)
	promoRepo := repository.NewPromoRepository(database.DB)
	storeSettingsRepo := repository.NewStoreSettingsRepository(database.DB)
	customerRepo := repository.NewCustomerRepository(database.DB)
	variantRepo := repository.NewVariantRepository(database.DB)

	authService := services.NewAuthService(userRepo, jwtSvc)
	productService := services.NewProductService(productRepo)
	categoryService := services.NewCategoryService(categoryRepo)
	variantService := services.NewVariantService(variantRepo, productRepo)
	orderService := services.NewOrderService(orderRepo, productRepo, voucherRepo, autoDiscountRepo, notifRepo, storeSettingsRepo, hub)
	voucherService := services.NewVoucherService(voucherRepo)
	autoDiscountService := services.NewAutoDiscountService(autoDiscountRepo)
	dashboardService := services.NewDashboardService(orderRepo, productRepo)
	reportService := services.NewReportService(orderRepo)
	notifService := services.NewNotificationService(notifRepo)

	promoService := services.NewPromoService(promoRepo)
	storeSettingsService := services.NewStoreSettingsService(storeSettingsRepo)
	customerService := services.NewCustomerService(customerRepo)

	userService := services.NewUserService(userRepo)
	authHandler := handlers.NewAuthHandler(authService)
	categoryHandler := handlers.NewCategoryHandler(categoryService)
	productHandler := handlers.NewProductHandler(productService)
	variantHandler := handlers.NewVariantHandler(variantService)
	orderHandler := handlers.NewOrderHandler(orderService)
	voucherHandler := handlers.NewVoucherHandler(voucherService)
	autoDiscountHandler := handlers.NewAutoDiscountHandler(autoDiscountService)
	dashboardHandler := handlers.NewDashboardHandler(dashboardService, reportService)
	notifHandler := handlers.NewNotificationHandler(notifService)
	userHandler := handlers.NewUserHandler(userService)
	promoHandler := handlers.NewPromoHandler(promoService)
	storeSettingsHandler := handlers.NewStoreSettingsHandler(storeSettingsService)
	customerHandler := handlers.NewCustomerHandler(customerService)

	r := gin.Default()
	r.Use(middleware.CORSMiddleware(cfg.CORSOrigins))

	routes.Setup(r, jwtSvc, hub,
		authHandler, categoryHandler, productHandler, variantHandler, orderHandler,
		voucherHandler, autoDiscountHandler, dashboardHandler, notifHandler,
		userHandler, promoHandler, storeSettingsHandler, customerHandler,
	)

	addr := fmt.Sprintf(":%s", cfg.AppPort)
	log.Printf("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
