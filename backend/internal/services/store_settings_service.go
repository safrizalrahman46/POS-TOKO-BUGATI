package services

import (
	"errors"
	"pos-backend/internal/models"
	"pos-backend/internal/repository"
)

type StoreSettingsService struct {
	repo *repository.StoreSettingsRepository
}

func NewStoreSettingsService(repo *repository.StoreSettingsRepository) *StoreSettingsService {
	return &StoreSettingsService{repo: repo}
}

func (s *StoreSettingsService) Get() (*models.StoreSetting, error) {
	setting, err := s.repo.GetFirst()
	if err != nil {
		defaultSetting := &models.StoreSetting{
			StoreName:           "TOKO BUGATI",
			StoreAddress:        "Jl. Contoh No. 123, Kota",
			StorePhone:          "0812-3456-7890",
			ReceiptHeader:       "Terima kasih atas kunjungan Anda",
			ReceiptFooter:       "Barang yang sudah dibeli tidak dapat ditukar/kembali",
			ReceiptShowLogo:     true,
			ReceiptShowCustomer: true,
			ReceiptSize:         "80mm",
			ReceiptFooterType:   "text",
			TaxLabel:            "PPN 11%",
			TaxRate:             11,
			Currency:            "Rp",
		}
		if err := s.repo.Create(defaultSetting); err != nil {
			return nil, err
		}
		return defaultSetting, nil
	}
	return setting, nil
}

func (s *StoreSettingsService) Update(input *models.StoreSetting) (*models.StoreSetting, error) {
	setting, err := s.repo.GetFirst()
	if err != nil {
		return nil, errors.New("pengaturan toko belum tersedia")
	}

	setting.StoreName = input.StoreName
	setting.StoreAddress = input.StoreAddress
	setting.StorePhone = input.StorePhone
	setting.StoreEmail = input.StoreEmail
	setting.StoreWebsite = input.StoreWebsite
	setting.ReceiptHeader = input.ReceiptHeader
	setting.ReceiptFooter = input.ReceiptFooter
	setting.ReceiptShowLogo = input.ReceiptShowLogo
	setting.ReceiptShowCustomer = input.ReceiptShowCustomer
	setting.ReceiptSize = input.ReceiptSize
	setting.ReceiptFooterType = input.ReceiptFooterType
	setting.ReceiptFooterImage = input.ReceiptFooterImage
	setting.TaxLabel = input.TaxLabel
	setting.TaxRate = input.TaxRate
	setting.Currency = input.Currency

	if err := s.repo.Update(setting); err != nil {
		return nil, err
	}
	return setting, nil
}

func (s *StoreSettingsService) UpdateLogo(logoPath string) (*models.StoreSetting, error) {
	setting, err := s.repo.GetFirst()
	if err != nil {
		return nil, errors.New("pengaturan toko belum tersedia")
	}
	setting.Logo = logoPath
	if err := s.repo.Update(setting); err != nil {
		return nil, err
	}
	return setting, nil
}

func (s *StoreSettingsService) UpdateFooterImage(imagePath string) (*models.StoreSetting, error) {
	setting, err := s.repo.GetFirst()
	if err != nil {
		return nil, errors.New("pengaturan toko belum tersedia")
	}
	setting.ReceiptFooterImage = imagePath
	if err := s.repo.Update(setting); err != nil {
		return nil, err
	}
	return setting, nil
}
