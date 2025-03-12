package main

import (
	"cine/movie"
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/PuerkitoBio/goquery"
	ics "github.com/arran4/golang-ical"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

func todayAtMidnight() time.Time {
	loc, err := time.LoadLocation("Europe/Brussels")
	if err != nil {
		panic(err)
	}

	now := time.Now().In(loc)
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	return today
}

func weeksDates(today time.Time, n int) []time.Time {
	dates := make([]time.Time, n)
	for i := 0; i < n; i++ {
		dates[i] = today.AddDate(0, 0, i)
	}
	return dates
}

func fetchPage(index int, date time.Time, wg *sync.WaitGroup, result []io.ReadCloser) {
	defer wg.Done()
	formatedDate := fmt.Sprintf("%d-%02d-%02d", date.Year(), date.Month(), date.Day())
	url := fmt.Sprintf("https://plaza-mons.be/films/%s", formatedDate)
	resp, err := http.Get(url)
	if err != nil {
		panic(err)
	}

	result[index] = resp.Body
}

func fetchPages(dates []time.Time) []io.ReadCloser {
	var wg sync.WaitGroup
	result := make([]io.ReadCloser, len(dates))
	for i, date := range dates {
		wg.Add(1)
		go fetchPage(i, date, &wg, result)
	}
	wg.Wait()
	return result
}

func parsePage(movies *[]movie.Movie, page io.ReadCloser, day time.Time) {
	defer page.Close()

	doc, err := goquery.NewDocumentFromReader(page)
	if err != nil {
		panic(err)
	}
	doc.Find("article.tribe-events-calendar-list__event").Each(func(i int, s *goquery.Selection) {
		title := SafeFindText(s, "a.tribe-events-calendar-list__event-title-link")
		start := SafeFindText(s, "span.tribe-event-date-start")
		producer := SafeFindText(s, "span.movie-producer")
		duration := SafeFindText(s, "div.movie-duration strong")
		version := SafeFindText(s, "div.movie-version strong")
		country := SafeFindText(s, "div.movie-country strong")
		year := SafeFindText(s, "div.movie-year strong")
		m := movie.NewMovie(title, day, start, producer, duration, version, country, year)
		*movies = append(*movies, *m)
	})
}

func generateCalendar(movies *[]movie.Movie) string {
	cal := ics.NewCalendar()
	for _, m := range *movies {
		event := cal.AddEvent(uuid.NewString())
		event.SetSummary(m.Title)
		event.SetStartAt(m.DayWithTime)
		event.SetDuration(m.Duration)
		event.SetLocation("Plaza Arthouse Cinema, Rue de Nimy 12, 7000 Mons, Belgique")
		event.SetDescription(fmt.Sprintf("Version: %s\nProducer: %s\nDuration: %s\nYear: %s\nCountry: %s", m.Version, m.Producer, m.Duration, m.Year, m.Country))
	}
	return cal.Serialize()
}

func handler() error {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		return err
	}
	s3Client := s3.NewFromConfig(cfg)
	today := todayAtMidnight()
	dates := weeksDates(today, 22)
	pages := fetchPages(dates)

	var movies []movie.Movie

	for i, date := range dates {
		parsePage(&movies, pages[i], date)
	}
	calendar := generateCalendar(&movies)

	uploader := manager.NewUploader(s3Client)
	fmt.Println(os.Getenv("BUCKET_NAME"))

	putObjectInput := &s3.PutObjectInput{
		Bucket: aws.String(os.Getenv("BUCKET_NAME")),
		Key:    aws.String("plaza.ics"),
		Body:   strings.NewReader(calendar),
	}

	_, err = uploader.Upload(context.TODO(), putObjectInput)
	if err != nil {
		return fmt.Errorf("error uploading file: %s", err)
	}

	fmt.Println("done")
	return nil
}

func main() {
	lambda.Start(handler)
}
