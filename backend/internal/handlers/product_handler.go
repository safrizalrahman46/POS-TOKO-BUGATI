package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"pos-backend/internal/models"
	"pos-backend/internal/services"
	"pos-backend/pkg/utils"

	"github.com/gin-gonic/gin"
)

type ProductHandler struct {
	service *services.ProductService
}

func NewProductHandler(service *services.ProductService) *ProductHandler {
	return &ProductHandler{service: service}
}

func (h *ProductHandler) Index(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")

	var categoryID *uint
	if cid := c.Query("category_id"); cid != "" {
		val, err := strconv.ParseUint(cid, 10, 32)
		if err == nil {
			cidVal := uint(val)
			categoryID = &cidVal
		}
	}

	products, total, err := h.service.List(page, limit, search, categoryID)
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal mengambil data produk")
		return
	}

	utils.SuccessPaginated(c, products, total, page, limit)
}

func (h *ProductHandler) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	product, err := h.service.GetByID(uint(id))
	if err != nil {
		utils.Error(c, http.StatusNotFound, "Produk tidak ditemukan")
		return
	}

	utils.Success(c, product)
}

func (h *ProductHandler) Create(c *gin.Context) {
	var product models.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		utils.Error(c, http.StatusBadRequest, "Data tidak valid")
		return
	}

	if err := h.service.Create(&product); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Created(c, product)
}

func (h *ProductHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	var product models.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		utils.Error(c, http.StatusBadRequest, "Data tidak valid")
		return
	}

	product.ID = uint(id)
	if err := h.service.Update(&product); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, product)
}

func (h *ProductHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	if err := h.service.Delete(uint(id)); err != nil {
		utils.Error(c, http.StatusNotFound, err.Error())
		return
	}

	utils.Success(c, gin.H{"message": "Produk berhasil dihapus"})
}

func (h *ProductHandler) FindByBarcode(c *gin.Context) {
	barcode := c.Query("barcode")
	if barcode == "" {
		utils.Error(c, http.StatusBadRequest, "Barcode harus diisi")
		return
	}

	product, err := h.service.FindByBarcode(barcode)
	if err != nil {
		utils.Error(c, http.StatusNotFound, "Produk tidak ditemukan")
		return
	}

	utils.Success(c, product)
}

func (h *ProductHandler) Search(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		utils.Error(c, http.StatusBadRequest, "Kata kunci pencarian harus diisi")
		return
	}

	products, err := h.service.Search(query)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, products)
}

func (h *ProductHandler) UploadImage(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	file, err := c.FormFile("image")
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "Gambar harus diupload")
		return
	}

	ext := filepath.Ext(file.Filename)
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		utils.Error(c, http.StatusBadRequest, "Format gambar harus jpg/jpeg/png/webp")
		return
	}

	if file.Size > 5<<20 {
		utils.Error(c, http.StatusBadRequest, "Ukuran gambar maksimal 5MB")
		return
	}

	uploadDir := "uploads/products"
	os.MkdirAll(uploadDir, 0755)

	filename := fmt.Sprintf("%d-%d%s", id, time.Now().UnixMilli(), ext)
	filepath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, filepath); err != nil {
		utils.Error(c, http.StatusInternalServerError, "Gagal menyimpan gambar")
		return
	}

	imageURL := "/uploads/products/" + filename
	if err := h.service.UpdateImage(uint(id), imageURL); err != nil {
		utils.Error(c, http.StatusNotFound, err.Error())
		return
	}

	utils.Success(c, gin.H{"image": imageURL})
}

func (h *ProductHandler) DeleteImage(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	product, err := h.service.GetByID(uint(id))
	if err != nil {
		utils.Error(c, http.StatusNotFound, "Produk tidak ditemukan")
		return
	}

	if product.Image != "" {
		oldPath := "." + product.Image
		os.Remove(oldPath)
	}

	h.service.UpdateImage(uint(id), "")
	utils.Success(c, gin.H{"message": "Gambar berhasil dihapus"})
}

type stockUpdateInput struct {
	Quantity int `json:"quantity" binding:"required"`
}

func (h *ProductHandler) UpdateStock(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "ID tidak valid")
		return
	}

	var input stockUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Error(c, http.StatusBadRequest, "Jumlah stok harus diisi")
		return
	}

	if err := h.service.UpdateStock(uint(id), input.Quantity); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(c, gin.H{"message": "Stok berhasil diperbarui"})
}
