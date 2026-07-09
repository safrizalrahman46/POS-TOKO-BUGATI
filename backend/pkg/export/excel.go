package export

import (
	"fmt"
	"pos-backend/internal/models"

	"github.com/xuri/excelize/v2"
)

func GenerateExcel(orders []models.Order, startDate, endDate string) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	sheet := "Laporan Penjualan"
	f.SetSheetName("Sheet1", sheet)

	headers := []string{"Invoice", "Tanggal", "Kasir", "Customer", "Metode Bayar", "Subtotal", "Diskon", "Voucher", "PPN", "Total", "Status"}
	for i, h := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheet, cell, h)
	}
	style, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#E0E0E0"}, Pattern: 1},
	})
	f.SetCellStyle(sheet, "A1", fmt.Sprintf("%c1", 'A'+len(headers)-1), style)

	for i, order := range orders {
		row := i + 2
		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), order.InvoiceNumber)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), order.CreatedAt.Format("2006-01-02 15:04"))
		cashierName := ""
		if order.Cashier.ID != 0 {
			cashierName = order.Cashier.FullName
		}
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), cashierName)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), order.CustomerName)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row), order.PaymentMethod)
		f.SetCellValue(sheet, fmt.Sprintf("F%d", row), order.Subtotal)
		f.SetCellValue(sheet, fmt.Sprintf("G%d", row), order.DiscountTotal)
		f.SetCellValue(sheet, fmt.Sprintf("H%d", row), order.VoucherDiscount)
		f.SetCellValue(sheet, fmt.Sprintf("I%d", row), order.TaxTotal)
		f.SetCellValue(sheet, fmt.Sprintf("J%d", row), order.GrandTotal)
		f.SetCellValue(sheet, fmt.Sprintf("K%d", row), order.Status)
	}

	colWidths := []float64{20, 18, 15, 15, 12, 12, 10, 10, 10, 12, 10}
	for i, w := range colWidths {
		col := fmt.Sprintf("%c", 'A'+i)
		f.SetColWidth(sheet, col, col, w)
	}

	var buf []byte
	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
