package movie

import (
	"fmt"
	"regexp"
	"strconv"
	"time"
)

type Movie struct {
	Title string
	Producer string
	Version string
	Country string
	Year string
	DayWithTime time.Time
	Duration time.Duration
}

func NewMovie(title string, day time.Time, start string, producer string, duration string, version string, country string, year string) *Movie {
	movie := &Movie{
		Title: title,
		Producer: producer,
		Version: version,
		Country: country,
		Year: year,
	}

	movie.DayWithTime = setTimeOfDay(day, start)
	movie.Duration = parseDuration(duration)
	return movie
}

func setTimeOfDay(day time.Time, start string) time.Time {
	re := regexp.MustCompile(`(\d+):(\d+)`)
	matches := re.FindStringSubmatch(start)
	if len(matches) != 3 {
		panic("invalid start format")
	}

	var hour int
	var minute int
	if _, err := fmt.Sscanf(matches[1], "%d", &hour); err != nil {
		panic(err)
	}
	if _, err := fmt.Sscanf(matches[2], "%d", &minute); err != nil {
		panic(err)
	}

	return time.Date(day.Year(), day.Month(), day.Day(), hour, minute, 0, 0, day.Location())
}

func parseDuration(duration string) time.Duration {
	re := regexp.MustCompile(`(\d+)[hH](\d*)`)
	matches := re.FindStringSubmatch(duration)

	hours := 1
	minutes := 0
	if len(matches) > 0 {
		hours, _ = strconv.Atoi(matches[1])
		if matches[2] != "" {
			minutes, _ = strconv.Atoi(matches[2])
		}
	}

	return time.Duration(hours) * time.Hour + time.Duration(minutes) * time.Minute
}
