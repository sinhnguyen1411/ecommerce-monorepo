package main

import (
  "net/http"
  "os"

  "github.com/gin-gonic/gin"
)

func main() {
  router := gin.New()
  router.Use(gin.Recovery())

  router.GET("/healthz", func(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{
      "status": "ok",
    })
  })

  router.GET("/", func(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{
      "service": "api",
      "message": "ready for checkout services",
    })
  })

  port := os.Getenv("PORT")
  if port == "" {
    port = "8080"
  }

  _ = router.Run(":" + port)
}

