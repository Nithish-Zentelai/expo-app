/**
 * Supabase API Service
 * All database query functions for the Matrix app.
 * 
 * Features:
 * - Type-safe queries using Database types
 * - Error handling with graceful fallbacks
 * - Optimized queries for mobile performance
 */

import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Category, CategoryWithMovies, HomeScreenData, Movie } from '../types/database.types';

// ============ Configuration ============

const DEFAULT_PAGE_SIZE = 20;

// ============ Error Handling ============

/**
 * Wraps API calls with error handling and logging
 */
async function safeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    fallback: T,
    label: string
): Promise<T> {
    if (!isSupabaseConfigured()) {
        console.warn(`[MatrixFlix] Supabase not configured for ${label}`);
        return fallback;
    }

    try {
        console.log(`[MatrixFlix] Fetching ${label}...`);
        const { data, error } = await queryFn();

        if (error) {
            console.error(`[MatrixFlix] Error fetching ${label}:`, error.message);
            return fallback;
        }

        return data ?? fallback;
    } catch (err: any) {
        console.error(`[MatrixFlix] Exception in ${label}:`, err.message);
        return fallback;
    }
}

// ============ Movie Queries ============

/**
 * Fetch all movies with optional limit
 */
export const getMovies = async (limit: number = DEFAULT_PAGE_SIZE): Promise<Movie[]> => {
    return safeQuery(
        async () => {
            return await supabase
                .from('movies')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);
        },
        [],
        'Movies'
    );
};

/**
 * Fetch trending movies (is_trending = true)
 */
export const getTrendingMovies = async (limit: number = 10): Promise<Movie[]> => {
    return safeQuery(
        async () => {
            return await supabase
                .from('movies')
                .select('*')
                .eq('is_trending', true)
                .order('rating', { ascending: false })
                .limit(limit);
        },
        [],
        'Trending'
    );
};

/**
 * Fetch popular movies (is_popular = true)
 */
export const getPopularMovies = async (limit: number = DEFAULT_PAGE_SIZE): Promise<Movie[]> => {
    return safeQuery(
        async () => {
            return await supabase
                .from('movies')
                .select('*')
                .eq('is_popular', true)
                .order('rating', { ascending: false })
                .limit(limit);
        },
        [],
        'Popular'
    );
};

/**
 * Fetch new releases (is_new_release = true)
 */
export const getNewReleases = async (limit: number = DEFAULT_PAGE_SIZE): Promise<Movie[]> => {
    return safeQuery(
        async () => {
            return await supabase
                .from('movies')
                .select('*')
                .eq('is_new_release', true)
                .order('release_year', { ascending: false })
                .limit(limit);
        },
        [],
        'New Releases'
    );
};

/**
 * Fetch top rated movies (sorted by rating)
 */
export const getTopRatedMovies = async (limit: number = DEFAULT_PAGE_SIZE): Promise<Movie[]> => {
    return safeQuery(
        async () => {
            return await supabase
                .from('movies')
                .select('*')
                .order('rating', { ascending: false })
                .limit(limit);
        },
        [],
        'Top Rated'
    );
};

/**
 * Fetch a single movie by ID
 */
export const getMovieById = async (id: string): Promise<Movie | null> => {
    return safeQuery(
        async () => {
            return await supabase
                .from('movies')
                .select('*')
                .eq('id', id)
                .single();
        },
        null,
        `Movie-${id}`
    );
};

/**
 * Search movies by title
 */
export const searchMovies = async (query: string, limit: number = DEFAULT_PAGE_SIZE): Promise<Movie[]> => {
    if (!query.trim()) return [];

    return safeQuery(
        async () => {
            return await supabase
                .from('movies')
                .select('*')
                .ilike('title', `%${query}%`)
                .order('rating', { ascending: false })
                .limit(limit);
        },
        [],
        `Search-${query}`
    );
};

/**
 * Fetch movies similar to a given movie (same category or high rating)
 */
export const getSimilarMovies = async (movieId: string, limit: number = 10): Promise<Movie[]> => {
    // For now, return top-rated movies excluding the current one
    return safeQuery(
        async () => {
            return await supabase
                .from('movies')
                .select('*')
                .neq('id', movieId)
                .order('rating', { ascending: false })
                .limit(limit);
        },
        [],
        `Similar-${movieId}`
    );
};

// ============ Category Queries ============

/**
 * Fetch all categories ordered by display_order
 */
export const getCategories = async (): Promise<Category[]> => {
    return safeQuery(
        async () => {
            return await supabase
                .from('categories')
                .select('*')
                .order('display_order', { ascending: true });
        },
        [],
        'Categories'
    );
};

/**
 * Fetch a category with its movies
 */
export const getCategoryWithMovies = async (categoryId: string): Promise<CategoryWithMovies | null> => {
    // First get the category
    const category = await safeQuery(
        async () => {
            return await supabase
                .from('categories')
                .select('*')
                .eq('id', categoryId)
                .single();
        },
        null,
        `Category-${categoryId}`
    );

    if (!category) return null;

    // Then get movies in this category
    const movieIdsResult = await safeQuery(
        async () => {
            return await supabase
                .from('movie_categories')
                .select('movie_id')
                .eq('category_id', categoryId);
        },
        [] as { movie_id: string }[],
        `CategoryMovieIds-${categoryId}`
    );

    if (!movieIdsResult || movieIdsResult.length === 0) {
        return { ...(category as Category), movies: [] };
    }

    const movies = await safeQuery(
        async () => {
            return await supabase
                .from('movies')
                .select('*')
                .in('id', movieIdsResult.map((mc: { movie_id: string }) => mc.movie_id))
                .order('rating', { ascending: false });
        },
        [],
        `CategoryMovies-${categoryId}`
    );

    return { ...(category as Category), movies };
};

/**
 * Fetch categories associated with a movie
 */
export const getMovieCategories = async (movieId: string): Promise<Category[]> => {
    // Get category IDs for this movie
    const movieCategories = await safeQuery(
        async () => {
            return await supabase
                .from('movie_categories')
                .select('category_id')
                .eq('movie_id', movieId);
        },
        [] as { category_id: string }[],
        `MovieCategoryIds-${movieId}`
    );

    if (!movieCategories || movieCategories.length === 0) return [];

    // Get the actual categories
    return safeQuery(
        async () => {
            return await supabase
                .from('categories')
                .select('*')
                .in('id', movieCategories.map((mc) => mc.category_id))
                .order('display_order', { ascending: true });
        },
        [],
        `MovieCategoriesFor-${movieId}`
    );
};

/**
 * Fetch movies by category slug
 */
export const getMoviesByCategory = async (slug: string, limit: number = DEFAULT_PAGE_SIZE): Promise<Movie[]> => {
    // First get category ID from slug
    const category = await safeQuery(
        async () => {
            return await supabase
                .from('categories')
                .select('id')
                .eq('slug', slug)
                .single();
        },
        null as { id: string } | null,
        `CategoryBySlug-${slug}`
    );

    if (!category) return [];

    // Get movie IDs in this category
    const movieCategories = await safeQuery(
        async () => {
            return await supabase
                .from('movie_categories')
                .select('movie_id')
                .eq('category_id', category.id);
        },
        [] as { movie_id: string }[],
        `MovieCategories-${slug}`
    );

    if (!movieCategories || movieCategories.length === 0) return [];

    // Get the actual movies
    return safeQuery(
        async () => {
            return await supabase
                .from('movies')
                .select('*')
                .in('id', movieCategories.map((mc) => mc.movie_id))
                .order('rating', { ascending: false })
                .limit(limit);
        },
        [],
        `MoviesByCategory-${slug}`
    );
};

// ============ Aggregated Queries ============

/**
 * Fetch all data needed for the home screen in parallel
 * Optimized for mobile performance with concurrent requests
 */
export const getHomeScreenData = async (): Promise<HomeScreenData> => {
    const [trending, popular, newReleases, topRated] = await Promise.all([
        getTrendingMovies(10),
        getPopularMovies(20),
        getNewReleases(20),
        getTopRatedMovies(20),
    ]);

    return {
        trending,
        popular,
        newReleases,
        topRated,
        heroMovie: trending[0] || popular[0] || null,
    };
};

// ============ Export API Object ============

export const supabaseApi = {
    // Movies
    getMovies,
    getTrendingMovies,
    getPopularMovies,
    getNewReleases,
    getTopRatedMovies,
    getMovieById,
    getMovieCategories,
    searchMovies,
    getSimilarMovies,
    // Categories
    getCategories,
    getCategoryWithMovies,
    getMoviesByCategory,
    // Aggregated
    getHomeScreenData,
};

export default supabaseApi;
