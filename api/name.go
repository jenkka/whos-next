package api

import (
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func (server *Server) stringsToNames(names []string) []Name {
	chosenNamesMap := make(map[string]struct{})
	for _, name := range names {
		chosenNamesMap[name] = struct{}{}
	}

	chosenNamesRecords := make([]Name, 0, len(names))
	for _, record := range server.getAllNameRecords() {
		if _, ok := chosenNamesMap[record.Name]; ok {
			chosenNamesRecords = append(chosenNamesRecords, record)
		}
	}

	return chosenNamesRecords
}

func (server *Server) getAllNameRecords() []Name {
	var results []Name
	err := server.supaclient.DB.From("names").Select("*").Execute(&results)
	if err != nil {
		panic(err)
	}
	return results
}

type Name struct {
	ID        int       `json:"id,omitempty"`
	Name      string    `json:"name" binding:"required"`
	CreatedAt time.Time `json:"created_at,omitzero"`
}

type NamesAPIResponse struct {
	Names []string `json:"names"`
}

func (server *Server) addNameHandler(c *gin.Context) {
	clientPass := c.GetHeader("X-Admin-Password")
	if clientPass == "" || clientPass != server.adminPassword {
		c.String(http.StatusUnauthorized, "Incorrect password")
		return
	}

	var newName Name
	if err := c.ShouldBindJSON(&newName); err != nil {
		c.String(http.StatusBadRequest, "Invalid request body")
		return
	}

	newName.Name = strings.TrimSpace(newName.Name)
	if newName.Name == "" {
		c.String(http.StatusBadRequest, "Invalid request body")
		return
	}

	var results []Name
	err := server.supaclient.DB.From("names").Upsert(newName).Execute(&results)
	if err != nil {
		log.Printf("Supabase error: %v", err)
		c.String(http.StatusInternalServerError, "Could not create name")
		return
	}

	c.JSON(http.StatusCreated, results[0])
}

func (server *Server) getNamesHandler(c *gin.Context) {
	nameRecords := server.getAllNameRecords()
	names := make([]string, 0, len(nameRecords))
	for _, record := range nameRecords {
		names = append(names, record.Name)
	}

	c.JSON(http.StatusOK, NamesAPIResponse{Names: names})
}
