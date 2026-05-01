package main

import (
	"fmt"
	"log"
	"os"
	"whos-next/api"

	"github.com/gin-gonic/gin"
	supa "github.com/nedpals/supabase-go"
)

type Store struct {
	supabase *supa.Client
}

func main() {
	supabaseURL := os.Getenv("SUPABASE_URL")
	if supabaseURL == "" {
		log.Fatal("SUPABASE_URL is not set")
	}
	supabaseKey := os.Getenv("SUPABASE_KEY")
	if supabaseKey == "" {
		log.Fatal("SUPABASE_KEY is not set")
	}
	supaclient := supa.CreateClient(supabaseURL, supabaseKey)

	adminPassword := os.Getenv("ADMIN_PASSWORD")
	if adminPassword == "" {
		log.Fatal("ADMIN_PASSWORD is not set")
	}

	gin.SetMode(gin.ReleaseMode)

	port, ok := os.LookupEnv("PORT")
	if !ok {
		port = "4000"
	}

	server, err := api.NewServer(supaclient, adminPassword)
	if err != nil {
		log.Fatal("Failed to create server:", err)
	}

	fmt.Printf("Starting server on port %s\n", port)
	err = server.Start(port)
	if err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
