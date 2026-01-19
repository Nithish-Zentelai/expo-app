/**
 * Database Type Definitions
 * TypeScript types matching the Supabase database schema.
 * These types ensure type-safety when querying the database.
 */

// ============ Database Schema Types ============

/**
 * Supabase Database type for type-safe queries
 */
export interface Database {
    public: {
        Tables: {
            movies: {
                Row: MovieRow;
                Insert: MovieInsert;
                Update: MovieUpdate;
            };
            categories: {
                Row: CategoryRow;
                Insert: CategoryInsert;
                Update: CategoryUpdate;
            };
            movie_categories: {
                Row: MovieCategoryRow;
                Insert: MovieCategoryInsert;
                Update: MovieCategoryUpdate;
            };
        };
    };
}

// ============ Movies Table ============

export interface MovieRow {
    id: string;
    title: string;
    description: string | null;
    poster_url: string | null;
    backdrop_url: string | null;
    release_year: number | null;
    rating: number;
    duration: number | null;
    is_trending: boolean;
    is_popular: boolean;
    is_new_release: boolean;
    created_at: string;
}

export interface MovieInsert {
    id?: string;
    title: string;
    description?: string | null;
    poster_url?: string | null;
    backdrop_url?: string | null;
    release_year?: number | null;
    rating?: number;
    duration?: number | null;
    is_trending?: boolean;
    is_popular?: boolean;
    is_new_release?: boolean;
    created_at?: string;
}

export interface MovieUpdate {
    id?: string;
    title?: string;
    description?: string | null;
    poster_url?: string | null;
    backdrop_url?: string | null;
    release_year?: number | null;
    rating?: number;
    duration?: number | null;
    is_trending?: boolean;
    is_popular?: boolean;
    is_new_release?: boolean;
    created_at?: string;
}

// ============ Categories Table ============

export interface CategoryRow {
    id: string;
    name: string;
    slug: string;
    display_order: number;
    created_at: string;
}

export interface CategoryInsert {
    id?: string;
    name: string;
    slug: string;
    display_order?: number;
    created_at?: string;
}

export interface CategoryUpdate {
    id?: string;
    name?: string;
    slug?: string;
    display_order?: number;
    created_at?: string;
}

// ============ Movie Categories Junction Table ============

export interface MovieCategoryRow {
    movie_id: string;
    category_id: string;
}

export interface MovieCategoryInsert {
    movie_id: string;
    category_id: string;
}

export interface MovieCategoryUpdate {
    movie_id?: string;
    category_id?: string;
}

// ============ Application Types ============

/**
 * Movie type used throughout the application
 * Matches MovieRow but with cleaner naming for app usage
 */
export interface Movie {
    id: string;
    title: string;
    description: string | null;
    poster_url: string | null;
    backdrop_url: string | null;
    release_year: number | null;
    rating: number;
    duration: number | null;
    is_trending: boolean;
    is_popular: boolean;
    is_new_release: boolean;
    created_at: string;
}

/**
 * Category with optional movies array
 */
export interface Category {
    id: string;
    name: string;
    slug: string;
    display_order: number;
    created_at: string;
}

/**
 * Category with its associated movies
 */
export interface CategoryWithMovies extends Category {
    movies: Movie[];
}

/**
 * Movie with its associated categories
 */
export interface MovieWithCategories extends Movie {
    categories: Category[];
}

// ============ API Response Types ============

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
}

/**
 * Paginated response for movie lists
 */
export interface PaginatedMovies {
    movies: Movie[];
    page: number;
    hasMore: boolean;
    totalCount: number;
}

// ============ Home Screen Data ============

/**
 * Aggregated data for the home screen
 */
export interface HomeScreenData {
    trending: Movie[];
    popular: Movie[];
    newReleases: Movie[];
    topRated: Movie[];
    heroMovie: Movie | null;
}
