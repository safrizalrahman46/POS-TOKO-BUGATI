package services

import (
	"encoding/json"
	"errors"

	"pos-backend/internal/models"
	"pos-backend/internal/repository"

	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	userRepo *repository.UserRepository
}

func NewUserService(userRepo *repository.UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

func (s *UserService) List(page, limit int, search string) ([]models.User, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	return s.userRepo.List(page, limit, search)
}

func (s *UserService) GetByID(id uint) (*models.User, error) {
	if id == 0 {
		return nil, errors.New("ID tidak valid")
	}
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("pengguna tidak ditemukan")
	}
	return user, nil
}

func validRole(role string) bool {
	return role == "superadmin" || role == "admin" || role == "kasir"
}

func (s *UserService) Create(user *models.User) error {
	if user.Username == "" {
		return errors.New("username harus diisi")
	}
	if user.Password == "" {
		return errors.New("password harus diisi")
	}
	if user.FullName == "" {
		return errors.New("nama lengkap harus diisi")
	}
	if !validRole(user.Role) {
		return errors.New("role harus superadmin, admin, atau kasir")
	}

	existing, _ := s.userRepo.FindByUsername(user.Username)
	if existing != nil {
		return errors.New("username sudah digunakan")
	}

	bytes, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.PasswordHash = string(bytes)

	if user.Permissions == "" {
		perms, _ := json.Marshal(models.DefaultPermissions[user.Role])
		user.Permissions = string(perms)
	}

	return s.userRepo.Create(user)
}

func (s *UserService) Update(user *models.User) error {
	if user.ID == 0 {
		return errors.New("ID tidak valid")
	}

	existing, err := s.userRepo.FindByID(user.ID)
	if err != nil {
		return errors.New("pengguna tidak ditemukan")
	}

	if user.Username != "" && user.Username != existing.Username {
		duplicate, _ := s.userRepo.FindByUsername(user.Username)
		if duplicate != nil {
			return errors.New("username sudah digunakan")
		}
		existing.Username = user.Username
	}
	if user.FullName != "" {
		existing.FullName = user.FullName
	}
	if user.Role != "" {
		if !validRole(user.Role) {
			return errors.New("role harus superadmin, admin, atau kasir")
		}
		existing.Role = user.Role
		if user.Permissions == "" {
			perms, _ := json.Marshal(models.DefaultPermissions[user.Role])
			existing.Permissions = string(perms)
		}
	}
	if user.Permissions != "" {
		var p []string
		if err := json.Unmarshal([]byte(user.Permissions), &p); err != nil {
			return errors.New("format permissions tidak valid")
		}
		existing.Permissions = user.Permissions
	}
	existing.IsActive = user.IsActive

	if user.Password != "" {
		bytes, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		existing.PasswordHash = string(bytes)
	}

	return s.userRepo.Update(existing)
}

func (s *UserService) Delete(id uint) error {
	_, err := s.userRepo.FindByID(id)
	if err != nil {
		return errors.New("pengguna tidak ditemukan")
	}
	return s.userRepo.Delete(id)
}

func (s *UserService) UpdatePhoto(id uint, photoURL string) error {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return errors.New("pengguna tidak ditemukan")
	}
	user.Photo = photoURL
	return s.userRepo.Update(user)
}

func (s *UserService) ToggleActive(id uint) error {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return errors.New("pengguna tidak ditemukan")
	}
	user.IsActive = !user.IsActive
	return s.userRepo.Update(user)
}
