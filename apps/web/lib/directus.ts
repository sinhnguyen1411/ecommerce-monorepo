const DIRECTUS_URL = (process.env.NEXT_PUBLIC_DIRECTUS_URL || "http://localhost:8055").replace(
  /\/$/,
  ""
);
const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_DIRECTUS_PUBLIC_TOKEN;

type DirectusResponse<T> = {
  data: T;
};

export type ProductImage = {
  id: number;
  image: string;
  sort?: number | null;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  description?: string | null;
  featured?: boolean | null;
  status?: string | null;
  product_images?: ProductImage[];
};

export type Post = {
  id: number;
  title: string;
  slug: string;
  content?: string | null;
  cover_image?: string | null;
  status?: string | null;
  published_at?: string | null;
};

const productFields = [
  "id",
  "name",
  "slug",
  "price",
  "compare_at_price",
  "description",
  "featured",
  "status",
  "product_images.id",
  "product_images.image",
  "product_images.sort"
].join(",");

const postFields = [
  "id",
  "title",
  "slug",
  "content",
  "cover_image",
  "status",
  "published_at"
].join(",");

function buildHeaders() {
  if (!PUBLIC_TOKEN) {
    return {};
  }

  return {
    Authorization: `Bearer ${PUBLIC_TOKEN}`
  };
}

async function directusRequest<T>(
  path: string,
  params?: Record<string, string | number | boolean>
) {
  const url = new URL(path, DIRECTUS_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      url.searchParams.set(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    headers: buildHeaders(),
    next: {
      revalidate: 60
    }
  });

  if (!response.ok) {
    throw new Error(`Directus request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function buildAssetUrl(fileId?: string | null) {
  if (!fileId) {
    return "";
  }

  return `${DIRECTUS_URL}/assets/${fileId}`;
}

function sortImages(images?: ProductImage[]) {
  if (!images) {
    return [];
  }

  return [...images].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

export async function getFeaturedProducts() {
  const response = await directusRequest<DirectusResponse<Product[]>>(
    "/items/products",
    {
      fields: productFields,
      "filter[status][_eq]": "published",
      "filter[featured][_eq]": "true",
      sort: "-id",
      limit: 6
    }
  );

  return response.data.map((product) => ({
    ...product,
    product_images: sortImages(product.product_images)
  }));
}

export async function getProducts() {
  const response = await directusRequest<DirectusResponse<Product[]>>(
    "/items/products",
    {
      fields: productFields,
      "filter[status][_eq]": "published",
      sort: "-id",
      limit: 24
    }
  );

  return response.data.map((product) => ({
    ...product,
    product_images: sortImages(product.product_images)
  }));
}

export async function getProductBySlug(slug: string) {
  const response = await directusRequest<DirectusResponse<Product[]>>(
    "/items/products",
    {
      fields: productFields,
      "filter[status][_eq]": "published",
      "filter[slug][_eq]": slug,
      limit: 1
    }
  );

  const product = response.data[0];
  if (!product) {
    return null;
  }

  return {
    ...product,
    product_images: sortImages(product.product_images)
  };
}

export async function getLatestPosts() {
  const response = await directusRequest<DirectusResponse<Post[]>>(
    "/items/posts",
    {
      fields: postFields,
      "filter[status][_eq]": "published",
      sort: "-published_at",
      limit: 4
    }
  );

  return response.data;
}

export async function getPosts() {
  const response = await directusRequest<DirectusResponse<Post[]>>(
    "/items/posts",
    {
      fields: postFields,
      "filter[status][_eq]": "published",
      sort: "-published_at",
      limit: 20
    }
  );

  return response.data;
}

export async function getPostBySlug(slug: string) {
  const response = await directusRequest<DirectusResponse<Post[]>>(
    "/items/posts",
    {
      fields: postFields,
      "filter[status][_eq]": "published",
      "filter[slug][_eq]": slug,
      limit: 1
    }
  );

  return response.data[0] ?? null;
}
