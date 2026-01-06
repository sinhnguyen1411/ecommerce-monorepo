package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type AdminProduct struct {
	ID             int              `json:"id"`
	Name           string           `json:"name"`
	Slug           string           `json:"slug"`
	Description    string           `json:"description"`
	Price          float64          `json:"price"`
	CompareAtPrice *float64         `json:"compare_at_price,omitempty"`
	Featured       bool             `json:"featured"`
	Status         string           `json:"status"`
	Tags           string           `json:"tags"`
	SortOrder      int              `json:"sort_order"`
	Images         []ProductImage   `json:"images"`
	Categories     []CategorySimple `json:"categories"`
}

type AdminProductInput struct {
	Name           string   `json:"name"`
	Slug           string   `json:"slug"`
	Description    string   `json:"description"`
	Price          float64  `json:"price"`
	CompareAtPrice *float64 `json:"compare_at_price"`
	Featured       bool     `json:"featured"`
	Status         string   `json:"status"`
	Tags           string   `json:"tags"`
	SortOrder      int      `json:"sort_order"`
	CategoryIDs    []int    `json:"category_ids"`
}

type AdminProductImageInput struct {
	URL       string `json:"url"`
	SortOrder int    `json:"sort_order"`
}

func (s *Server) AdminListProducts(c *gin.Context) {
	rows, err := s.DB.Query(`
    SELECT id, name, slug, IFNULL(description, ''), price, compare_at_price, featured, status, IFNULL(tags, ''), sort_order
    FROM products
    ORDER BY sort_order DESC, created_at DESC
  `)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load products")
		return
	}
	defer rows.Close()

	products := make([]AdminProduct, 0)
	for rows.Next() {
		var product AdminProduct
		var compareAt sql.NullFloat64
		if err := rows.Scan(&product.ID, &product.Name, &product.Slug, &product.Description, &product.Price, &compareAt, &product.Featured, &product.Status, &product.Tags, &product.SortOrder); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to parse products")
			return
		}
		if compareAt.Valid {
			product.CompareAtPrice = &compareAt.Float64
		}
		products = append(products, product)
	}

	if len(products) == 0 {
		respondOK(c, products)
		return
	}

	if err := s.attachAdminProductImages(products); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load product images")
		return
	}
	if err := s.attachAdminProductCategories(products); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load product categories")
		return
	}

	respondOK(c, products)
}

func (s *Server) AdminCreateProduct(c *gin.Context) {
	var input AdminProductInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid product payload")
		return
	}

	if strings.TrimSpace(input.Name) == "" || strings.TrimSpace(input.Slug) == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Name and slug are required")
		return
	}

	status := input.Status
	if status == "" {
		status = "published"
	}

	result, err := s.DB.Exec(`
    INSERT INTO products (name, slug, description, price, compare_at_price, featured, status, tags, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, input.Name, input.Slug, input.Description, input.Price, input.CompareAtPrice, input.Featured, status, input.Tags, input.SortOrder)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to create product")
		return
	}

	productID, _ := result.LastInsertId()
	if err := s.replaceProductCategories(int(productID), input.CategoryIDs); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to save categories")
		return
	}

	s.adminGetProductByID(c, int(productID))
}

func (s *Server) AdminGetProduct(c *gin.Context) {
	parsed, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_product", "Invalid product ID")
		return
	}
	s.adminGetProductByID(c, parsed)
}

func (s *Server) adminGetProductByID(c *gin.Context, id int) {
	row := s.DB.QueryRow(`
    SELECT id, name, slug, IFNULL(description, ''), price, compare_at_price, featured, status, IFNULL(tags, ''), sort_order
    FROM products
    WHERE id = ?
  `, id)
	var product AdminProduct
	var compareAt sql.NullFloat64
	if err := row.Scan(&product.ID, &product.Name, &product.Slug, &product.Description, &product.Price, &compareAt, &product.Featured, &product.Status, &product.Tags, &product.SortOrder); err != nil {
		if err == sql.ErrNoRows {
			respondError(c, http.StatusNotFound, "not_found", "Product not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load product")
		return
	}
	if compareAt.Valid {
		product.CompareAtPrice = &compareAt.Float64
	}

	products := []Product{{
		ID:          product.ID,
		Name:        product.Name,
		Slug:        product.Slug,
		Description: product.Description,
		Price:       product.Price,
		Featured:    product.Featured,
		Images:      nil,
		Categories:  nil,
	}}

	if err := s.attachProductImages(products); err == nil {
		product.Images = products[0].Images
	}
	if err := s.attachProductCategories(products); err == nil {
		product.Categories = products[0].Categories
	}

	respondOK(c, product)
}

func (s *Server) AdminUpdateProduct(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_product", "Invalid product ID")
		return
	}

	var input AdminProductInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid product payload")
		return
	}

	status := input.Status
	if status == "" {
		status = "published"
	}

	_, err = s.DB.Exec(`
    UPDATE products
    SET name = ?, slug = ?, description = ?, price = ?, compare_at_price = ?, featured = ?, status = ?, tags = ?, sort_order = ?
    WHERE id = ?
  `, input.Name, input.Slug, input.Description, input.Price, input.CompareAtPrice, input.Featured, status, input.Tags, input.SortOrder, id)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update product")
		return
	}

	if err := s.replaceProductCategories(id, input.CategoryIDs); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update categories")
		return
	}

	s.adminGetProductByID(c, id)
}

func (s *Server) AdminDeleteProduct(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_product", "Invalid product ID")
		return
	}

	if _, err := s.DB.Exec(`DELETE FROM products WHERE id = ?`, id); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to delete product")
		return
	}

	respondOK(c, gin.H{"deleted": true})
}

func (s *Server) AdminAddProductImage(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_product", "Invalid product ID")
		return
	}

	var input AdminProductImageInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid image payload")
		return
	}
	if strings.TrimSpace(input.URL) == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Image URL is required")
		return
	}

	_, err = s.DB.Exec(`INSERT INTO product_images (product_id, url, sort_order) VALUES (?, ?, ?)`, id, input.URL, input.SortOrder)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to add image")
		return
	}

	s.adminGetProductByID(c, id)
}

func (s *Server) replaceProductCategories(productID int, categoryIDs []int) error {
	if _, err := s.DB.Exec(`DELETE FROM product_categories WHERE product_id = ?`, productID); err != nil {
		return err
	}
	for _, categoryID := range categoryIDs {
		if _, err := s.DB.Exec(`INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)`, productID, categoryID); err != nil {
			return err
		}
	}
	return nil
}

func toProductList(adminProducts []AdminProduct) []Product {
	products := make([]Product, 0, len(adminProducts))
	for _, item := range adminProducts {
		products = append(products, Product{
			ID:          item.ID,
			Name:        item.Name,
			Slug:        item.Slug,
			Description: item.Description,
			Price:       item.Price,
			Featured:    item.Featured,
			Images:      item.Images,
			Categories:  item.Categories,
		})
	}
	return products
}

func (s *Server) attachAdminProductImages(products []AdminProduct) error {
	ids := make([]string, 0, len(products))
	idMap := make(map[int]*AdminProduct, len(products))
	for i := range products {
		product := &products[i]
		ids = append(ids, strconv.Itoa(product.ID))
		idMap[product.ID] = product
	}

	query := "SELECT id, product_id, url, sort_order FROM product_images WHERE product_id IN (" + strings.Join(ids, ",") + ") ORDER BY sort_order ASC"
	rows, err := s.DB.Query(query)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var image ProductImage
		var productID int
		if err := rows.Scan(&image.ID, &productID, &image.URL, &image.SortOrder); err != nil {
			return err
		}
		image.URL = s.buildAssetURL(image.URL)
		if product, ok := idMap[productID]; ok {
			product.Images = append(product.Images, image)
		}
	}

	return nil
}

func (s *Server) attachAdminProductCategories(products []AdminProduct) error {
	ids := make([]string, 0, len(products))
	idMap := make(map[int]*AdminProduct, len(products))
	for i := range products {
		product := &products[i]
		ids = append(ids, strconv.Itoa(product.ID))
		idMap[product.ID] = product
	}

	query := `
    SELECT pc.product_id, c.id, c.name, c.slug
    FROM product_categories pc
    JOIN categories c ON pc.category_id = c.id
    WHERE pc.product_id IN (` + strings.Join(ids, ",") + `)
    ORDER BY c.sort_order ASC
  `

	rows, err := s.DB.Query(query)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var productID int
		var category CategorySimple
		if err := rows.Scan(&productID, &category.ID, &category.Name, &category.Slug); err != nil {
			return err
		}
		if product, ok := idMap[productID]; ok {
			product.Categories = append(product.Categories, category)
		}
	}

	return nil
}
