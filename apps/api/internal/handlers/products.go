package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type Product struct {
	ID             int              `json:"id"`
	Name           string           `json:"name"`
	Slug           string           `json:"slug"`
	Description    string           `json:"description"`
	Price          float64          `json:"price"`
	CompareAtPrice *float64         `json:"compare_at_price,omitempty"`
	Featured       bool             `json:"featured"`
	Images         []ProductImage   `json:"images"`
	Categories     []CategorySimple `json:"categories"`
}

type ProductImage struct {
	ID        int    `json:"id"`
	URL       string `json:"url"`
	SortOrder int    `json:"sort_order"`
}

type CategorySimple struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

func (s *Server) ListProducts(c *gin.Context) {
	category := c.Query("category")
	sortParam := c.DefaultQuery("sort", "latest")
	featured := c.Query("featured")
	limitParam := c.Query("limit")

	query := strings.Builder{}
	query.WriteString("SELECT DISTINCT p.id, p.name, p.slug, IFNULL(p.description, ''), p.price, p.compare_at_price, p.featured ")
	query.WriteString("FROM products p ")

	args := make([]any, 0)
	if category != "" {
		query.WriteString("JOIN product_categories pc ON p.id = pc.product_id ")
		query.WriteString("JOIN categories c ON pc.category_id = c.id ")
	}

	query.WriteString("WHERE p.status = 'published' ")

	if featured != "" {
		query.WriteString("AND p.featured = ? ")
		args = append(args, featured == "true")
	}

	if category != "" {
		query.WriteString("AND c.slug = ? ")
		args = append(args, category)
	}

	switch sortParam {
	case "price_asc":
		query.WriteString("ORDER BY p.price ASC ")
	case "price_desc":
		query.WriteString("ORDER BY p.price DESC ")
	default:
		query.WriteString("ORDER BY p.created_at DESC ")
	}

	if limitParam != "" {
		if limit, err := strconv.Atoi(limitParam); err == nil && limit > 0 {
			query.WriteString("LIMIT ? ")
			args = append(args, limit)
		}
	}

	rows, err := s.DB.Query(query.String(), args...)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load products")
		return
	}
	defer rows.Close()

	products := make([]Product, 0)
	for rows.Next() {
		var product Product
		var compareAt sql.NullFloat64
		if err := rows.Scan(&product.ID, &product.Name, &product.Slug, &product.Description, &product.Price, &compareAt, &product.Featured); err != nil {
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

	if err := s.attachProductImages(products); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load product images")
		return
	}

	if err := s.attachProductCategories(products); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load product categories")
		return
	}

	respondOK(c, products)
}

func (s *Server) GetProduct(c *gin.Context) {
	slug := c.Param("slug")

	row := s.DB.QueryRow(`
    SELECT id, name, slug, IFNULL(description, ''), price, compare_at_price, featured
    FROM products
    WHERE slug = ? AND status = 'published'
    LIMIT 1
  `, slug)

	var product Product
	var compareAt sql.NullFloat64
	if err := row.Scan(&product.ID, &product.Name, &product.Slug, &product.Description, &product.Price, &compareAt, &product.Featured); err != nil {
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

	products := []Product{product}
	if err := s.attachProductImages(products); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load product images")
		return
	}
	if err := s.attachProductCategories(products); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load product categories")
		return
	}

	respondOK(c, products[0])
}

func (s *Server) attachProductImages(products []Product) error {
	ids := make([]string, 0, len(products))
	idMap := make(map[int]*Product, len(products))
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

func (s *Server) attachProductCategories(products []Product) error {
	ids := make([]string, 0, len(products))
	idMap := make(map[int]*Product, len(products))
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
