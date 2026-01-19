/**
 * useCategories Hook
 * Custom hooks for fetching category data from Supabase.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getCategories, getCategoryWithMovies, getMoviesByCategory } from '../api/supabaseApi';
import { Category, CategoryWithMovies, Movie } from '../types/database.types';

// ============ Types ============

interface UseCategoriesState {
    data: Category[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

interface UseCategoryWithMoviesState {
    category: CategoryWithMovies | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

interface UseMoviesByCategoryState {
    movies: Movie[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

// ============ All Categories Hook ============

/**
 * Hook for fetching all categories
 */
export const useCategories = (): UseCategoriesState => {
    const [data, setData] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const categories = await getCategories();

            if (isMounted.current) {
                setData(categories);
            }
        } catch (err) {
            if (isMounted.current) {
                setError(err instanceof Error ? err.message : 'Failed to load categories');
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        fetchData();
        return () => {
            isMounted.current = false;
        };
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
};

// ============ Category With Movies Hook ============

/**
 * Hook for fetching a single category with its movies
 * @param categoryId - The UUID of the category to fetch
 */
export const useCategoryWithMovies = (categoryId: string | null): UseCategoryWithMoviesState => {
    const [category, setCategory] = useState<CategoryWithMovies | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    const fetchData = useCallback(async () => {
        if (!categoryId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await getCategoryWithMovies(categoryId);

            if (isMounted.current) {
                setCategory(data);
                if (!data) {
                    setError('Category not found');
                }
            }
        } catch (err) {
            if (isMounted.current) {
                setError('Failed to load category');
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [categoryId]);

    useEffect(() => {
        isMounted.current = true;
        fetchData();
        return () => {
            isMounted.current = false;
        };
    }, [fetchData]);

    return { category, loading, error, refetch: fetchData };
};

// ============ Movies By Category Slug Hook ============

/**
 * Hook for fetching movies by category slug
 * @param slug - The slug of the category
 * @param limit - Maximum number of movies to fetch
 */
export const useMoviesByCategory = (
    slug: string | null,
    limit: number = 20
): UseMoviesByCategoryState => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    const fetchData = useCallback(async () => {
        if (!slug) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await getMoviesByCategory(slug, limit);

            if (isMounted.current) {
                setMovies(data);
            }
        } catch (err) {
            if (isMounted.current) {
                setError('Failed to load movies');
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [slug, limit]);

    useEffect(() => {
        isMounted.current = true;
        fetchData();
        return () => {
            isMounted.current = false;
        };
    }, [fetchData]);

    return { movies, loading, error, refetch: fetchData };
};

export default useCategories;
