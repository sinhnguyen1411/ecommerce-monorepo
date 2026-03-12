package handlers

import "testing"

func TestBuildPostAuthRedirectTarget(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name               string
		baseURL            string
		nextPath           string
		onboardingRequired bool
		want               string
	}{
		{
			name:               "completed user keeps requested destination",
			baseURL:            "http://localhost:3000/",
			nextPath:           "/checkout",
			onboardingRequired: false,
			want:               "http://localhost:3000/checkout",
		},
		{
			name:               "incomplete user is sent to onboarding",
			baseURL:            "http://localhost:3000",
			nextPath:           "/checkout",
			onboardingRequired: true,
			want:               "http://localhost:3000/account?next=%2Fcheckout",
		},
		{
			name:               "invalid redirect falls back to account",
			baseURL:            "http://localhost:3000",
			nextPath:           "https://evil.example",
			onboardingRequired: true,
			want:               "http://localhost:3000/account",
		},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			got := buildPostAuthRedirectTarget(tc.baseURL, tc.nextPath, tc.onboardingRequired)
			if got != tc.want {
				t.Fatalf("expected %q, got %q", tc.want, got)
			}
		})
	}
}
