package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	supa "github.com/nedpals/supabase-go"
)

type Server struct {
	supaclient    *supa.Client
	router        *gin.Engine
	adminPassword string
}

type APIRequest struct {
	Names []string `json:"names" binding:"required,min=1"`
}

type APIResponse struct {
	ChosenName string `json:"chosenName"`
}

func NewServer(supaclient *supa.Client, adminPassword string) (*Server, error) {
	server := &Server{
		supaclient:    supaclient,
		adminPassword: adminPassword,
	}
	server.SetupRouter()

	return server, nil
}

func (server *Server) verifyPasswordHandler(c *gin.Context) {
	clientPass := c.GetHeader("X-Admin-Password")
	if clientPass != server.adminPassword {
		c.String(http.StatusUnauthorized, "Wrong password")
		return
	}
	c.Status(http.StatusOK)
}

func (server *Server) SetupRouter() *gin.Engine {
	router := gin.New()
	router.Use(gin.Recovery())

	api := router.Group("/api")
	{
		api.GET("/names", server.getNamesHandler)
		api.POST("/choose", server.chooseHandler)
		api.POST("/add-name", server.addNameHandler)
		api.PUT("/update-order", server.updateOrderHandler)
		api.POST("/verify-password", server.verifyPasswordHandler)
	}

	router.NoRoute(gin.WrapH(http.FileServer(http.Dir("./public"))))

	server.router = router

	return router
}

func (server *Server) Start(port string) error {
	return server.router.Run(":" + port)
}
