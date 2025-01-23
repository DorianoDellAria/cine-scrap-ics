package main

import (
	"strings"

	"github.com/PuerkitoBio/goquery"
)

func SafeFindText(s *goquery.Selection, class string) string {
	element := s.Find(class)
	if element.Length() == 0 {
		return "?"
	}
	return strings.TrimSpace(element.Text())
}
