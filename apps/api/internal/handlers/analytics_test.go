package handlers

import (
	"testing"
	"time"
)

func TestNormalizeAnalyticsPath(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name  string
		input string
		want  string
	}{
		{name: "home", input: "/", want: "/"},
		{name: "public collection", input: "/collections/all", want: "/collections/all"},
		{name: "absolute url", input: "https://tam-bo.vn/pages/about-us", want: "/pages/about-us"},
		{name: "admin excluded", input: "/admin/orders", want: ""},
		{name: "auth excluded", input: "/login?next=/collections/all", want: ""},
		{name: "checkout excluded", input: "/checkout", want: ""},
		{name: "api excluded", input: "/api/products", want: ""},
		{name: "invalid value", input: "collections/all", want: ""},
	}

	for _, testCase := range testCases {
		testCase := testCase
		t.Run(testCase.name, func(t *testing.T) {
			t.Parallel()
			got := normalizeAnalyticsPath(testCase.input)
			if got != testCase.want {
				t.Fatalf("normalizeAnalyticsPath(%q) = %q, want %q", testCase.input, got, testCase.want)
			}
		})
	}
}

func TestBuildDashboardBuckets(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, time.March, 16, 10, 0, 0, 0, analyticsBusinessLocation)

	dayBuckets, dayLabel, dayStart := buildDashboardBuckets(now, "day")
	if len(dayBuckets) != 30 {
		t.Fatalf("expected 30 day buckets, got %d", len(dayBuckets))
	}
	if dayLabel != "30 ngay gan nhat" {
		t.Fatalf("unexpected day label %q", dayLabel)
	}
	if got := dayStart.Format("2006-01-02"); got != "2026-02-15" {
		t.Fatalf("unexpected day start %q", got)
	}

	monthBuckets, monthLabel, monthStart := buildDashboardBuckets(now, "month")
	if len(monthBuckets) != 12 {
		t.Fatalf("expected 12 month buckets, got %d", len(monthBuckets))
	}
	if monthLabel != "12 thang gan nhat" {
		t.Fatalf("unexpected month label %q", monthLabel)
	}
	if got := monthStart.Format("2006-01-02"); got != "2025-04-01" {
		t.Fatalf("unexpected month start %q", got)
	}

	yearBuckets, yearLabel, yearStart := buildDashboardBuckets(now, "year")
	if len(yearBuckets) != 5 {
		t.Fatalf("expected 5 year buckets, got %d", len(yearBuckets))
	}
	if yearLabel != "5 nam gan nhat" {
		t.Fatalf("unexpected year label %q", yearLabel)
	}
	if got := yearStart.Format("2006-01-02"); got != "2022-01-01" {
		t.Fatalf("unexpected year start %q", got)
	}
}
