package utils

import "regexp"

func IsValidUsername(username string) bool {
	if len(username) < 3 || len(username) > 50 {
		return false
	}
	match, _ := regexp.MatchString("^[a-zA-Z0-9_]+$", username)
	return match
}

func IsValidRole(role string) bool {
	return role == "admin" || role == "kasir"
}

func IsValidPaymentMethod(method string) bool {
	return method == "cash" || method == "debit" || method == "qris"
}

func IsValidVoucherType(vType string) bool {
	return vType == "percent" || vType == "fixed"
}
