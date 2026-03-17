package handlers

import "testing"

func TestNormalizeAdminUIPreferencesDefaults(t *testing.T) {
	prefs := normalizeAdminUIPreferences(nil)
	if prefs.SidebarMode != "rail" {
		t.Fatalf("expected default sidebar mode rail, got %q", prefs.SidebarMode)
	}
	if prefs.Density != "compact" {
		t.Fatalf("expected default density compact, got %q", prefs.Density)
	}
	if len(prefs.OrdersColumn) == 0 {
		t.Fatal("expected default orders columns to be populated")
	}
}

func TestNormalizeAdminUIPreferencesSanitizesInput(t *testing.T) {
	input := &AdminUIPreferences{
		SidebarMode:  "FULL",
		Density:      "comfortable",
		OrdersColumn: []string{"payment_method", "unknown", "customer", "payment_method"},
	}

	prefs := normalizeAdminUIPreferences(input)
	if prefs.SidebarMode != "full" {
		t.Fatalf("expected sidebar mode full, got %q", prefs.SidebarMode)
	}
	if prefs.Density != "comfortable" {
		t.Fatalf("expected density comfortable, got %q", prefs.Density)
	}

	hasPaymentMethod := false
	hasCustomer := false
	for _, column := range prefs.OrdersColumn {
		if column == "payment_method" {
			hasPaymentMethod = true
		}
		if column == "customer" {
			hasCustomer = true
		}
	}
	if !hasPaymentMethod || !hasCustomer {
		t.Fatalf("expected sanitized columns to include payment_method and customer, got %+v", prefs.OrdersColumn)
	}
}

func TestNormalizeAdminOrdersColumnsKeepsEssentialColumns(t *testing.T) {
	columns := normalizeAdminOrdersColumns([]string{"payment_method"})
	essential := []string{"order", "customer", "total", "payment", "delivery", "actions"}
	for _, mustHave := range essential {
		found := false
		for _, column := range columns {
			if column == mustHave {
				found = true
				break
			}
		}
		if !found {
			t.Fatalf("expected essential column %q in %+v", mustHave, columns)
		}
	}
}
