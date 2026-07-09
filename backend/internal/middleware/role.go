package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RoleMiddleware(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "Role not found"})
			c.Abort()
			return
		}

		for _, role := range roles {
			if userRole == role {
				c.Next()
				return
			}
		}

		if userRole == "superadmin" {
			c.Next()
			return
		}

		c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "Access denied"})
		c.Abort()
	}
}
