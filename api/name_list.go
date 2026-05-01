package api

import (
	"sort"
	"strconv"
	"strings"
	"time"
)

type NameList struct {
	ID                 int       `json:"id,omitempty"`
	CreatedAt          time.Time `json:"created_at,omitzero"`
	CanonicalSignature string    `json:"canonical_signature"`
}

func buildListSignature(namesRecords []Name) string {
	sorted := make([]Name, len(namesRecords))
	copy(sorted, namesRecords)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Name < sorted[j].Name
	})
	ids := make([]string, len(sorted))
	for i, record := range sorted {
		ids[i] = strconv.Itoa(record.ID)
	}
	return strings.Join(ids, "-")
}
