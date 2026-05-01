package api

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestMain(m *testing.M) {
	gin.SetMode(gin.TestMode)
	m.Run()
}

func TestBuildListSignature(t *testing.T) {
	cases := []struct {
		name  string
		input []Name
		want  string
	}{
		{"empty", []Name{}, ""},
		{"single", []Name{{ID: 7, Name: "Alice"}}, "7"},
		{"sorts by name then joins ids", []Name{
			{ID: 3, Name: "Charlie"},
			{ID: 1, Name: "Alice"},
			{ID: 2, Name: "Bob"},
		}, "1-2-3"},
		{"already sorted", []Name{
			{ID: 5, Name: "Andy"},
			{ID: 6, Name: "Beto"},
		}, "5-6"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := buildListSignature(tc.input)
			if got != tc.want {
				t.Errorf("got %q, want %q", got, tc.want)
			}
		})
	}
}

func TestBuildListSignature_DoesNotMutateInput(t *testing.T) {
	input := []Name{
		{ID: 3, Name: "Charlie"},
		{ID: 1, Name: "Alice"},
		{ID: 2, Name: "Bob"},
	}
	original := make([]Name, len(input))
	copy(original, input)

	buildListSignature(input)

	for i := range input {
		if input[i] != original[i] {
			t.Errorf("input was mutated at index %d: got %+v, want %+v", i, input[i], original[i])
		}
	}
}

func NewTestServer() (*Server, error) {
	server := &Server{}
	server.SetupRouter()

	return server, nil
}

func doRequest(t *testing.T, method, path, body string) *httptest.ResponseRecorder {
	t.Helper()

	server, err := NewTestServer()
	if err != nil {
		t.Errorf("expected SPA shell with #root in response body")
	}

	w := httptest.NewRecorder()
	var req *http.Request
	if body == "" {
		req = httptest.NewRequest(method, path, nil)
	} else {
		req = httptest.NewRequest(method, path, strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
	}
	server.router.ServeHTTP(w, req)
	return w
}

const badRequestBody = "Invalid request body"

func assertBadRequest(t *testing.T, w *httptest.ResponseRecorder) {
	t.Helper()
	if w.Code != http.StatusBadRequest {
		t.Errorf("got status %d, want 400; body=%q", w.Code, w.Body.String())
	}
	if got := w.Body.String(); got != badRequestBody {
		t.Errorf("got body %q, want %q", got, badRequestBody)
	}
}

func TestChooseHandler_RejectsBadInput(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"malformed json", "{not json"},
		{"missing names field", "{}"},
		{"empty names array", `{"names":[]}`},
		{"null names", `{"names":null}`},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			assertBadRequest(t, doRequest(t, http.MethodPost, "/api/choose", tc.body))
		})
	}
}

func TestAddNameHandler_RejectsBadInput(t *testing.T) {
	// TODO: Write this test again now that a password is required
	// cases := []struct {
	// 	name string
	// 	body string
	// }{
	// 	{"malformed json", "{nope"},
	// 	{"missing name field", "{}"},
	// 	{"empty name", `{"name":""}`},
	// 	{"whitespace only name", `{"name":"   "}`},
	// 	{"tabs and newlines only", `{"name":"\t\n "}`},
	// }
	// for _, tc := range cases {
	// 	t.Run(tc.name, func(t *testing.T) {
	// 		assertBadRequest(t, doRequest(t, http.MethodPost, "/api/add-name", tc.body))
	// 	})
	// }
}

func TestUpdateOrderHandler_RejectsBadInput(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"malformed json", "garbage"},
		{"missing names field", "{}"},
		{"empty names array", `{"names":[]}`},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			assertBadRequest(t, doRequest(t, http.MethodPut, "/api/update-order", tc.body))
		})
	}
}

func TestRouting_WrongMethod(t *testing.T) {
	cases := []struct {
		method string
		path   string
	}{
		{http.MethodGet, "/api/choose"},
		{http.MethodGet, "/api/add-name"},
		{http.MethodPost, "/api/update-order"},
		{http.MethodPost, "/api/names"},
	}
	for _, tc := range cases {
		t.Run(tc.method+" "+tc.path, func(t *testing.T) {
			w := doRequest(t, tc.method, tc.path, "")
			if w.Code != http.StatusNotFound {
				t.Errorf("got status %d, want 404", w.Code)
			}
		})
	}
}

func skipIfClientNotBuilt(t *testing.T) {
	t.Helper()
	if _, err := os.Stat("public/index.html"); err != nil {
		t.Skip("public/index.html missing — run `make client-build` to enable static file tests")
	}
}

func TestStaticFile_ServesIndex(t *testing.T) {
	skipIfClientNotBuilt(t)
	w := doRequest(t, http.MethodGet, "/", "")
	if w.Code != http.StatusOK {
		t.Fatalf("got status %d, want 200", w.Code)
	}
	if !bytes.Contains(w.Body.Bytes(), []byte(`id="root"`)) {
		t.Errorf("expected SPA shell with #root in response body")
	}
}

func TestStaticFile_ServesAsset(t *testing.T) {
	skipIfClientNotBuilt(t)
	matches, err := filepath.Glob("public/assets/*.js")
	if err != nil || len(matches) == 0 {
		t.Skip("no built JS assets in public/assets — run `make client-build`")
	}
	urlPath := "/assets/" + filepath.Base(matches[0])
	w := doRequest(t, http.MethodGet, urlPath, "")
	if w.Code != http.StatusOK {
		t.Fatalf("got status %d for %s, want 200", w.Code, urlPath)
	}
}

func TestStaticFile_UnknownPath404s(t *testing.T) {
	w := doRequest(t, http.MethodGet, "/does-not-exist.html", "")
	if w.Code != http.StatusNotFound {
		t.Errorf("got status %d, want 404", w.Code)
	}
}
