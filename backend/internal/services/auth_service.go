package services

import (
	"encoding/json"
	"errors"
	"pos-backend/internal/models"
	"pos-backend/internal/repository"
	"pos-backend/pkg/jwt"
)

type AuthService struct {
	userRepo *repository.UserRepository
	jwtSvc   *jwt.JWTService
}

func NewAuthService(userRepo *repository.UserRepository, jwtSvc *jwt.JWTService) *AuthService {
	return &AuthService{userRepo: userRepo, jwtSvc: jwtSvc}
}

type LoginResponse struct {
	Token       string `json:"token"`
	UserID      uint   `json:"user_id"`
	Username    string `json:"username"`
	FullName    string `json:"full_name"`
	Role        string `json:"role"`
	Permissions string `json:"permissions"`
	Photo       string `json:"photo"`
}

func (s *AuthService) ensurePermissions(user *models.User) string {
	if user.Permissions != "" {
		return user.Permissions
	}
	perms, ok := models.DefaultPermissions[user.Role]
	if !ok {
		perms = models.DefaultPermissions["kasir"]
	}
	b, _ := json.Marshal(perms)
	return string(b)
}

func (s *AuthService) Login(username, password string) (*LoginResponse, error) {
	user, err := s.userRepo.FindByUsername(username)
	if err != nil {
		return nil, errors.New("username atau password salah")
	}
	if !user.IsActive {
		return nil, errors.New("akun tidak aktif")
	}
	if !user.CheckPassword(password) {
		return nil, errors.New("username atau password salah")
	}
	token, err := s.jwtSvc.GenerateToken(user.ID, user.Role)
	if err != nil {
		return nil, errors.New("gagal membuat token")
	}
	return &LoginResponse{
		Token:       token,
		UserID:      user.ID,
		Username:    user.Username,
		FullName:    user.FullName,
		Role:        user.Role,
		Permissions: s.ensurePermissions(user),
		Photo:       user.Photo,
	}, nil
}

func (s *AuthService) Register(user *models.User) error {
	existing, _ := s.userRepo.FindByUsername(user.Username)
	if existing != nil {
		return errors.New("username sudah digunakan")
	}
	return s.userRepo.Create(user)
}

func (s *AuthService) GetProfile(userID uint) (*models.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}
	if user.Permissions == "" {
		user.Permissions = s.ensurePermissions(user)
	}
	return user, nil
}
