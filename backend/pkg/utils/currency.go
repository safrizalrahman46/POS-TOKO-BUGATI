package utils

import "fmt"

func FormatCurrency(amount int64) string {
	if amount < 0 {
		return "-Rp " + formatPositive(-amount)
	}
	return "Rp " + formatPositive(amount)
}

func formatPositive(amount int64) string {
	s := fmt.Sprintf("%d", amount)
	n := len(s)
	if n <= 3 {
		return s
	}
	var result []byte
	for i, c := range s {
		if i > 0 && (n-i)%3 == 0 {
			result = append(result, '.')
		}
		result = append(result, byte(c))
	}
	return string(result)
}
