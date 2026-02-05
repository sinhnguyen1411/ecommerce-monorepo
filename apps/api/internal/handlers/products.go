package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"
	"time"

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
	Tags           []string         `json:"tags,omitempty"`
	CreatedAt      *time.Time       `json:"created_at,omitempty"`
	UpdatedAt      *time.Time       `json:"updated_at,omitempty"`
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
	category := strings.TrimSpace(c.Query("category"))
	sortParam := strings.TrimSpace(c.Query("sort"))
	if sortParam == "" {
		sortParam = strings.TrimSpace(c.Query("sort_by"))
	}
	featured := strings.TrimSpace(c.Query("featured"))
	limitParam := strings.TrimSpace(c.Query("limit"))
	queryParam := strings.TrimSpace(c.Query("q"))
	priceMinParam := strings.TrimSpace(c.Query("price_min"))
	priceMaxParam := strings.TrimSpace(c.Query("price_max"))
	tagsParam := strings.TrimSpace(c.Query("tags"))

	query := strings.Builder{}
	query.WriteString("SELECT DISTINCT p.id, p.name, p.slug, IFNULL(p.description, ''), p.price, p.compare_at_price, p.featured, IFNULL(p.tags, ''), p.created_at, p.updated_at ")
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

	if queryParam != "" {
		like := "%" + queryParam + "%"
		query.WriteString("AND (p.name LIKE ? OR IFNULL(p.description, '') LIKE ? OR IFNULL(p.tags, '') LIKE ?) ")
		args = append(args, like, like, like)
	}

	if priceMinParam != "" {
		if minPrice, err := strconv.ParseFloat(priceMinParam, 64); err == nil {
			query.WriteString("AND p.price >= ? ")
			args = append(args, minPrice)
		}
	}

	if priceMaxParam != "" {
		if maxPrice, err := strconv.ParseFloat(priceMaxParam, 64); err == nil {
			query.WriteString("AND p.price <= ? ")
			args = append(args, maxPrice)
		}
	}

	if tagsParam != "" {
		rawTags := strings.Split(tagsParam, ",")
		tagConditions := make([]string, 0, len(rawTags))
		for _, raw := range rawTags {
			tag := strings.TrimSpace(raw)
			if tag == "" {
				continue
			}
			tagConditions = append(tagConditions, "IFNULL(p.tags, '') LIKE ?")
			args = append(args, "%"+tag+"%")
		}
		if len(tagConditions) > 0 {
			query.WriteString("AND (" + strings.Join(tagConditions, " OR ") + ") ")
		}
	}

	switch sortParam {
	case "price_asc", "price-ascending":
		query.WriteString("ORDER BY p.price ASC ")
	case "price_desc", "price-descending":
		query.WriteString("ORDER BY p.price DESC ")
	case "title-ascending", "title_asc":
		query.WriteString("ORDER BY p.name ASC ")
	case "title-descending", "title_desc":
		query.WriteString("ORDER BY p.name DESC ")
	case "created-ascending", "created_asc", "oldest":
		query.WriteString("ORDER BY p.created_at ASC ")
	case "created-descending", "created_desc", "latest", "newest":
		query.WriteString("ORDER BY p.created_at DESC ")
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
		var rawTags string
		var createdAt sql.NullTime
		var updatedAt sql.NullTime
		if err := rows.Scan(&product.ID, &product.Name, &product.Slug, &product.Description, &product.Price, &compareAt, &product.Featured, &rawTags, &createdAt, &updatedAt); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to parse products")
			return
		}
		if compareAt.Valid {
			product.CompareAtPrice = &compareAt.Float64
		}
		product.Tags = parseTags(rawTags)
		if createdAt.Valid {
			product.CreatedAt = &createdAt.Time
		}
		if updatedAt.Valid {
			product.UpdatedAt = &updatedAt.Time
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
    SELECT id, name, slug, IFNULL(description, ''), price, compare_at_price, featured, IFNULL(tags, ''), created_at, updated_at
    FROM products
    WHERE slug = ? AND status = 'published'
    LIMIT 1
  `, slug)

	var product Product
	var compareAt sql.NullFloat64
	var rawTags string
	var createdAt sql.NullTime
	var updatedAt sql.NullTime
	if err := row.Scan(&product.ID, &product.Name, &product.Slug, &product.Description, &product.Price, &compareAt, &product.Featured, &rawTags, &createdAt, &updatedAt); err != nil {
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
	product.Tags = parseTags(rawTags)
	if createdAt.Valid {
		product.CreatedAt = &createdAt.Time
	}
	if updatedAt.Valid {
		product.UpdatedAt = &updatedAt.Time
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

func parseTags(raw string) []string {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return nil
	}
	parts := strings.Split(trimmed, ",")
	tags := make([]string, 0, len(parts))
	for _, part := range parts {
		tag := strings.TrimSpace(part)
		if tag == "" {
			continue
		}
		tags = append(tags, tag)
	}
	return tags
}
