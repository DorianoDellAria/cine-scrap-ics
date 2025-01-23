package movie

import (
	"fmt"
	"testing"
)

func TestParseDuration(t *testing.T) {
	duration := "02H28"

	p := parseDuration(duration)

	fmt.Println(p)
}
