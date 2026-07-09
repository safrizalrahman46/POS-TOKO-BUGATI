package services

import (
	"bytes"
	"fmt"
	"pos-backend/internal/database"
	"pos-backend/internal/models"
	"pos-backend/internal/repository"
	"github.com/jung-kurt/gofpdf"
	"github.com/xuri/excelize/v2"
)

type ReportService struct {
	orderRepo   *repository.OrderRepository
	productRepo *repository.ProductRepository
}

func NewReportService(orderRepo *repository.OrderRepository) *ReportService {
	return &ReportService{orderRepo: orderRepo}
}

type ReportFilter struct {
	StartDate     string
	EndDate       string
	PaymentMethod string
	CashierID     string
}

type ReportSummary struct {
	TotalOrders     int64  `json:"total_orders"`
	TotalRevenue    int64  `json:"total_revenue"`
	TotalDiscount   int64  `json:"total_discount"`
	TotalTax        int64  `json:"total_tax"`
	AverageOrder    int64  `json:"average_order"`
	CashCount       int64  `json:"cash_count"`
	DebitCount      int64  `json:"debit_count"`
	QrisCount       int64  `json:"qris_count"`
}

type ReportResult struct {
	Orders  []models.Order `json:"orders"`
	Summary ReportSummary  `json:"summary"`
}

func (s *ReportService) GetReport(startDate, endDate, paymentMethod, cashierID string) (*ReportResult, error) {
	query := database.DB.Model(&models.Order{})
	if startDate != "" {
		query = query.Where("created_at >= ?", startDate+" 00:00:00")
	}
	if endDate != "" {
		query = query.Where("created_at <= ?", endDate+" 23:59:59")
	}
	if paymentMethod != "" {
		query = query.Where("payment_method = ?", paymentMethod)
	}
	if cashierID != "" {
		query = query.Where("cashier_id = ?", cashierID)
	}

	var orders []models.Order
	err := query.Preload("Items").Preload("Cashier").Order("id DESC").Find(&orders).Error
	if err != nil {
		return nil, err
	}

	summary := ReportSummary{}
	for _, o := range orders {
		summary.TotalOrders++
		summary.TotalRevenue += o.GrandTotal
		summary.TotalDiscount += o.DiscountTotal + o.VoucherDiscount
		summary.TotalTax += o.TaxTotal
		switch o.PaymentMethod {
		case "cash":
			summary.CashCount++
		case "debit":
			summary.DebitCount++
		case "qris":
			summary.QrisCount++
		}
	}
	if summary.TotalOrders > 0 {
		summary.AverageOrder = summary.TotalRevenue / summary.TotalOrders
	}

	return &ReportResult{Orders: orders, Summary: summary}, nil
}

func (s *ReportService) ExportExcel(startDate, endDate, paymentMethod, cashierID string) ([]byte, error) {
	report, err := s.GetReport(startDate, endDate, paymentMethod, cashierID)
	if err != nil {
		return nil, err
	}

	f := excelize.NewFile()
	sheet := "Laporan Penjualan"
	f.SetSheetName("Sheet1", sheet)

	headers := []string{"No", "Invoice", "Tanggal", "Kasir", "Pelanggan", "Subtotal", "Diskon", "Voucher", "Pajak", "Total", "Metode", "Status"}
	for i, h := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheet, cell, h)
	}

	style, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 12, Color: "#FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"#4472C4"}},
	})
	f.SetCellStyle(sheet, "A1", fmt.Sprintf("%c1", 'A'+len(headers)-1), style)

	for i, o := range report.Orders {
		row := i + 2
		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), i+1)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), o.InvoiceNumber)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), o.CreatedAt.Format("2006-01-02 15:04"))
		cashierName := ""
		if o.Cashier.FullName != "" {
			cashierName = o.Cashier.FullName
		}
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), cashierName)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row), o.CustomerName)
		f.SetCellValue(sheet, fmt.Sprintf("F%d", row), o.Subtotal)
		f.SetCellValue(sheet, fmt.Sprintf("G%d", row), o.DiscountTotal)
		f.SetCellValue(sheet, fmt.Sprintf("H%d", row), o.VoucherDiscount)
		f.SetCellValue(sheet, fmt.Sprintf("I%d", row), o.TaxTotal)
		f.SetCellValue(sheet, fmt.Sprintf("J%d", row), o.GrandTotal)
		f.SetCellValue(sheet, fmt.Sprintf("K%d", row), o.PaymentMethod)
		f.SetCellValue(sheet, fmt.Sprintf("L%d", row), o.Status)
	}

	summaryRow := len(report.Orders) + 4
	f.SetCellValue(sheet, fmt.Sprintf("A%d", summaryRow), "Ringkasan")
	summaryStyle, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true, Size: 14}})
	f.SetCellStyle(sheet, fmt.Sprintf("A%d", summaryRow), fmt.Sprintf("A%d", summaryRow), summaryStyle)

	summaryLabels := []string{"Total Pesanan", "Total Pendapatan", "Total Diskon", "Total Pajak", "Rata-rata Pesanan"}
	summaryValues := []interface{}{
		report.Summary.TotalOrders,
		report.Summary.TotalRevenue,
		report.Summary.TotalDiscount,
		report.Summary.TotalTax,
		report.Summary.AverageOrder,
	}
	for i, label := range summaryLabels {
		r := summaryRow + 1 + i
		f.SetCellValue(sheet, fmt.Sprintf("A%d", r), label)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", r), summaryValues[i])
		labelStyle, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true}})
		f.SetCellStyle(sheet, fmt.Sprintf("A%d", r), fmt.Sprintf("A%d", r), labelStyle)
	}

	for i := 0; i < len(headers); i++ {
		colLetter := string(rune('A' + i))
		f.SetColWidth(sheet, colLetter, colLetter, 18)
	}

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func (s *ReportService) ExportPDF(startDate, endDate, paymentMethod, cashierID string) ([]byte, error) {
	report, err := s.GetReport(startDate, endDate, paymentMethod, cashierID)
	if err != nil {
		return nil, err
	}

	pdf := gofpdf.New("L", "mm", "A4", "")
	pdf.AddPage()

	pdf.SetFont("Arial", "B", 18)
	pdf.CellFormat(0, 15, "Laporan Penjualan", "", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "", 10)
	period := fmt.Sprintf("Periode: %s - %s", startDate, endDate)
	if startDate == "" && endDate == "" {
		period = "Semua Periode"
	}
	pdf.CellFormat(0, 8, period, "", 1, "L", false, 0, "")
	pdf.Ln(5)

	headers := []string{"No", "Invoice", "Tanggal", "Kasir", "Total", "Metode"}
	colWidths := []float64{10, 50, 40, 40, 40, 30}

	pdf.SetFont("Arial", "B", 9)
	pdf.SetFillColor(68, 114, 196)
	pdf.SetTextColor(255, 255, 255)
	for i, h := range headers {
		pdf.CellFormat(colWidths[i], 8, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(0)

	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Arial", "", 8)
	for i, o := range report.Orders {
		if pdf.GetY()+10 > 180 {
			pdf.AddPage()
			pdf.SetFont("Arial", "B", 9)
			pdf.SetFillColor(68, 114, 196)
			pdf.SetTextColor(255, 255, 255)
			for j, h := range headers {
				pdf.CellFormat(colWidths[j], 8, h, "1", 0, "C", true, 0, "")
			}
			pdf.Ln(0)
			pdf.SetTextColor(0, 0, 0)
			pdf.SetFont("Arial", "", 8)
		}

		fill := false
		if i%2 == 0 {
			pdf.SetFillColor(240, 240, 240)
			fill = true
		}

		cashierName := ""
		if o.Cashier.FullName != "" {
			cashierName = o.Cashier.FullName
		}
		row := []string{
			fmt.Sprintf("%d", i+1),
			o.InvoiceNumber,
			o.CreatedAt.Format("2006-01-02 15:04"),
			cashierName,
			fmt.Sprintf("Rp %d", o.GrandTotal),
			o.PaymentMethod,
		}
		for j, val := range row {
			align := "C"
			if j == 3 || j == 4 {
				align = "L"
			}
			pdf.CellFormat(colWidths[j], 7, val, "1", 0, align, fill, 0, "")
		}
		pdf.Ln(0)
	}

	pdf.Ln(10)
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(0, 10, "Ringkasan", "", 1, "L", false, 0, "")

	pdf.SetFont("Arial", "", 10)
	summaryLines := []string{
		fmt.Sprintf("Total Pesanan    : %d", report.Summary.TotalOrders),
		fmt.Sprintf("Total Pendapatan : Rp %d", report.Summary.TotalRevenue),
		fmt.Sprintf("Total Diskon     : Rp %d", report.Summary.TotalDiscount),
		fmt.Sprintf("Total Pajak      : Rp %d", report.Summary.TotalTax),
		fmt.Sprintf("Rata-rata Pesanan: Rp %d", report.Summary.AverageOrder),
		fmt.Sprintf("Tunai            : %d", report.Summary.CashCount),
		fmt.Sprintf("Debit            : %d", report.Summary.DebitCount),
		fmt.Sprintf("QRIS             : %d", report.Summary.QrisCount),
	}
	for _, line := range summaryLines {
		pdf.CellFormat(0, 8, line, "", 1, "L", false, 0, "")
	}

	var buf bytes.Buffer
	err = pdf.Output(&buf)
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
