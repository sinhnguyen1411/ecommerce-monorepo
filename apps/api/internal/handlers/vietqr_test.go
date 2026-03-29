package handlers

import "testing"

func TestBuildQuickLink(t *testing.T) {
	link, err := buildQuickLink("https://api.vietqr.io", "970436", "0123456", "f8QLOpm", "jpg", 150000, "TB1", "Tam Bo")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expected := "https://img.vietqr.io/image/970436-0123456-f8QLOpm.jpg?accountName=Tam+Bo&addInfo=TB1&amount=150000"
	if link != expected {
		t.Fatalf("expected %q got %q", expected, link)
	}
}

func TestBuildQuickLinkKeepsImageHost(t *testing.T) {
	link, err := buildQuickLink("https://img.vietqr.io", "970436", "0123456", "compact2", "png", 540000, "TB290326N0001", "Tam Bo")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expected := "https://img.vietqr.io/image/970436-0123456-compact2.png?accountName=Tam+Bo&addInfo=TB290326N0001&amount=540000"
	if link != expected {
		t.Fatalf("expected %q got %q", expected, link)
	}
}

func TestBuildTransferContent(t *testing.T) {
	content := buildTransferContent(" ORDER-123 ")
	if content != "ORDER-123" {
		t.Fatalf("expected trimmed content, got %q", content)
	}
	trimmed := buildTransferContent("ORDER-1234567890123456789012345")
	if len(trimmed) != 25 {
		t.Fatalf("expected length 25, got %d", len(trimmed))
	}
}

func TestMapVietQRBanks(t *testing.T) {
	banks := []vietqrBank{
		{Code: "VCB", ShortName: "Vietcombank", Name: "Vietcombank", Bin: "970436"},
	}
	mapped := mapVietQRBanks(banks)
	if mapped["vcb"] != 970436 {
		t.Fatalf("expected bin 970436 for vcb, got %d", mapped["vcb"])
	}
	if mapped["vietcombank"] != 970436 {
		t.Fatalf("expected bin 970436 for vietcombank, got %d", mapped["vietcombank"])
	}
}
