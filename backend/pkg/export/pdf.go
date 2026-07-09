package export

import (
	"fmt"
	"pos-backend/internal/models"

	"github.com/jung-kurt/gofpdf"
)

func GeneratePDF(orders []models.Order, startDate, endDate string) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(190, 10, "Laporan Penjualan")
	pdf.Ln(8)
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(190, 6, fmt.Sprintf("Periode: %s - %s", startDate, endDate))
	pdf.Ln(10)

	headers := []string{"Invoice", "Tanggal", "Kasir", "Total", "Status"}
	colWidths := []float64{45, 40, 35, 35, 25}
	pdf.SetFont("Arial", "B", 8)
	for i, h := range headers {
		pdf.Cell(colWidths[i], 8, h)
	}
	pdf.Ln(-1)

	pdf.SetFont("Arial", "", 8)
	for _, order := range orders {
		cashierName := ""
		if order.Cashier.ID != 0 {
			cashierName = order.Cashier.FullName
		}
		row := []string{
			order.InvoiceNumber,
			order.CreatedAt.Format("2006-01-02"),
			cashierName,
			fmt.Sprintf("%d", order.GrandTotal),
			order.Status,
		}
		for i, val := range row {
			pdf.Cell(colWidths[i], 7, val)
		}
		pdf.Ln(-1)
	}

	var buf []byte
	var err error
	buf, err = pdf.Output()
	if err != nil {
		return nil, err
	}
	return buf, nil
}
