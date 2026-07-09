package routes

import (
	"pos-backend/internal/handlers"
	"pos-backend/internal/middleware"
	"pos-backend/internal/websocket"
	"pos-backend/pkg/jwt"

	"github.com/gin-gonic/gin"
)

func Setup(
	r *gin.Engine,
	jwtSvc *jwt.JWTService,
	hub *websocket.Hub,
	authH *handlers.AuthHandler,
	categoryH *handlers.CategoryHandler,
	productH *handlers.ProductHandler,
	variantH *handlers.VariantHandler,
	orderH *handlers.OrderHandler,
	voucherH *handlers.VoucherHandler,
	autoDiscountH *handlers.AutoDiscountHandler,
	dashboardH *handlers.DashboardHandler,
	notifH *handlers.NotificationHandler,
	userH *handlers.UserHandler,
	promoH *handlers.PromoHandler,
	storeSettingsH *handlers.StoreSettingsHandler,
	customerH *handlers.CustomerHandler,
) {
	r.Static("/uploads", "./uploads")

	r.POST("/api/auth/login", authH.Login)

	r.GET("/ws/stock", func(c *gin.Context) { websocket.HandleStockWS(hub, c.Writer, c.Request) })
	r.GET("/ws/order", func(c *gin.Context) { websocket.HandleOrderWS(hub, c.Writer, c.Request) })
	r.GET("/ws/cart", func(c *gin.Context) { websocket.HandleCartWS(hub, c.Writer, c.Request) })

	r.GET("/api/promos/active", promoH.Active)

	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware(jwtSvc))
	{
		api.GET("/auth/me", authH.Me)
		api.POST("/auth/logout", authH.Logout)

		api.GET("/categories", categoryH.Index)
		api.POST("/categories", categoryH.Create)
		api.GET("/categories/:id", categoryH.Show)
		api.PUT("/categories/:id", categoryH.Update)
		api.DELETE("/categories/:id", categoryH.Delete)

		api.GET("/products", productH.Index)
		api.POST("/products", productH.Create)
		api.GET("/products/barcode", productH.FindByBarcode)
		api.GET("/products/search", productH.Search)
		api.GET("/products/:id", productH.Show)
		api.PUT("/products/:id", productH.Update)
		api.DELETE("/products/:id", productH.Delete)
		api.PATCH("/products/:id/stock", productH.UpdateStock)
		api.POST("/products/:id/upload", productH.UploadImage)
		api.DELETE("/products/:id/image", productH.DeleteImage)
		api.GET("/products/:id/variants", variantH.Index)
		api.POST("/products/:id/variants", variantH.Create)
		api.PUT("/products/:id/variants/:variantId", variantH.Update)
		api.DELETE("/products/:id/variants/:variantId", variantH.Delete)

		api.GET("/variants/barcode", variantH.FindByBarcode)

		api.GET("/orders", orderH.Index)
		api.POST("/orders", orderH.Create)
		api.GET("/orders/history", orderH.History)
		api.GET("/orders/:id", orderH.Show)
		api.PUT("/orders/:id", orderH.Update)
		api.DELETE("/orders/:id", orderH.Delete)
		api.PATCH("/orders/:id/cancel", orderH.Cancel)

		api.GET("/vouchers", voucherH.Index)
		api.POST("/vouchers", voucherH.Create)
		api.POST("/vouchers/validate", voucherH.Validate)
		api.GET("/vouchers/:id", voucherH.Show)
		api.PUT("/vouchers/:id", voucherH.Update)
		api.DELETE("/vouchers/:id", voucherH.Delete)

		api.GET("/auto-discounts", autoDiscountH.Index)
		api.POST("/auto-discounts", autoDiscountH.Create)
		api.GET("/auto-discounts/:id", autoDiscountH.Show)
		api.PUT("/auto-discounts/:id", autoDiscountH.Update)
		api.DELETE("/auto-discounts/:id", autoDiscountH.Delete)

		dashboard := api.Group("/dashboard")
		dashboard.Use(middleware.RoleMiddleware("admin"))
		{
			dashboard.GET("/stats", dashboardH.Stats)
			dashboard.GET("/reports", dashboardH.Reports)
			dashboard.GET("/reports/export-excel", dashboardH.ExportExcel)
			dashboard.GET("/reports/export-pdf", dashboardH.ExportPDF)
		}

		users := api.Group("/users")
		users.Use(middleware.RoleMiddleware("admin"))
		{
			users.GET("", userH.List)
			users.POST("", userH.Create)
			users.GET("/:id", userH.Show)
			users.PUT("/:id", userH.Update)
			users.DELETE("/:id", userH.Delete)
			users.PATCH("/:id/toggle-active", userH.ToggleActive)
			users.POST("/:id/photo", userH.UploadPhoto)
		}

		api.GET("/notifications", notifH.Index)
		api.POST("/notifications/read", notifH.MarkAllRead)
		api.POST("/notifications/:id/read", notifH.MarkRead)

		promos := api.Group("/promos")
		{
			promos.GET("", promoH.Index)
			promos.GET("/:id", promoH.Show)
		}

		api.GET("/store/settings", storeSettingsH.Get)
		api.PUT("/store/settings", storeSettingsH.Update)
		api.POST("/store/settings/logo", storeSettingsH.UploadLogo)
		api.POST("/store/settings/footer-image", storeSettingsH.UploadFooterImage)

		api.GET("/customers", customerH.Index)
		api.POST("/customers", customerH.Create)
		api.GET("/customers/search", customerH.Search)
		api.GET("/customers/:id", customerH.Show)
		api.PUT("/customers/:id", customerH.Update)
		api.DELETE("/customers/:id", customerH.Delete)
	}

	promosAdmin := r.Group("/api/promos")
	promosAdmin.Use(middleware.AuthMiddleware(jwtSvc), middleware.RoleMiddleware("admin"))
	{
		promosAdmin.POST("", promoH.Create)
		promosAdmin.PUT("/:id", promoH.Update)
		promosAdmin.DELETE("/:id", promoH.Delete)
		promosAdmin.POST("/:id/upload", promoH.UploadImage)
		promosAdmin.DELETE("/:id/image", promoH.DeleteImage)
	}
}
