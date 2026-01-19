/**
 * useSupabaseMovies Hook
 * Custom hooks for fetching movie data from Supabase.
 * 
 * Features:
 * - Loading states
 * - Error handling
 * - Pull-to-refresh support
 * - Optimized for mobile performance
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    getHomeScreenData,
    getMovieById,
    getMovieCategories,
    getNewReleases,
    getPopularMovies,
    getSimilarMovies,
    getTopRatedMovies,
    getTrendingMovies,
    searchMovies,
} from '../api/supabaseApi';
import {
    HomeScreenData,
    Movie,
    MovieWithCategories
} from '../types/database.types';

// ============ Types ============

interface UseMoviesState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

interface UseMovieListState extends UseMoviesState<Movie[]> {
    data: Movie[];
}

interface UseSearchState extends UseMovieListState {
    search: (query: string) => Promise<void>;
    query: string;
    suggestions: Movie[];
}

// ============ Generic Movie List Hook ============

/**
 * Generic hook for fetching movie lists
 * @param fetchFunction - The async function that fetches movies
 * @param autoFetch - Whether to fetch on mount (default: true)
 */
export const useSupabaseMovieList = (
    fetchFunction: () => Promise<Movie[]>,
    autoFetch: boolean = true
): UseMovieListState => {
    const [data, setData] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(autoFetch);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const movies = await fetchFunction();

            if (isMounted.current) {
                setData(movies);
            }
        } catch (err) {
            if (isMounted.current) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [fetchFunction]);

    const refetch = useCallback(async () => {
        await fetchData();
    }, [fetchData]);

    useEffect(() => {
        isMounted.current = true;
        if (autoFetch) {
            fetchData();
        }
        return () => {
            isMounted.current = false;
        };
    }, [autoFetch, fetchData]);

    return { data, loading, error, refetch };
};

// ============ Specific Movie List Hooks ============

/**
 * Hook for fetching trending movies
 */
export const useSupabaseTrendingMovies = (limit: number = 10) => {
    return useSupabaseMovieList(useCallback(() => getTrendingMovies(limit), [limit]));
};

/**
 * Hook for fetching popular movies
 */
export const useSupabasePopularMovies = (limit: number = 20) => {
    return useSupabaseMovieList(useCallback(() => getPopularMovies(limit), [limit]));
};

/**
 * Hook for fetching new releases
 */
export const useSupabaseNewReleases = (limit: number = 20) => {
    return useSupabaseMovieList(useCallback(() => getNewReleases(limit), [limit]));
};

/**
 * Hook for fetching top rated movies
 */
export const useSupabaseTopRatedMovies = (limit: number = 20) => {
    return useSupabaseMovieList(useCallback(() => getTopRatedMovies(limit), [limit]));
};

// ============ Movie Details Hook ============

interface MovieDetailsState {
    movie: MovieWithCategories | null;
    similar: Movie[];
    loading: boolean;
    error: string | null;
}

/**
 * Hook for fetching a single movie's details
 * @param movieId - The UUID of the movie to fetch
 */
export const useSupabaseMovieDetails = (
    movieId: string | null
): MovieDetailsState & { refetch: () => Promise<void> } => {
    const [state, setState] = useState<MovieDetailsState>({
        movie: null,
        similar: [],
        loading: true,
        error: null,
    });

    const isMounted = useRef(true);

    const fetchDetails = useCallback(async () => {
        if (!movieId) {
            setState(prev => ({ ...prev, loading: false }));
            return;
        }

        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            // Fetch movie, categories, and similar movies in parallel
            const [movieData, categoryData, similarData] = await Promise.all([
                getMovieById(movieId),
                getMovieCategories(movieId),
                getSimilarMovies(movieId, 10),
            ]);

            if (isMounted.current) {
                if (movieData) {
                    setState({
                        movie: { ...movieData, categories: categoryData },
                        similar: similarData,
                        loading: false,
                        error: null,
                    });
                } else {
                    setState({
                        movie: null,
                        similar: [],
                        loading: false,
                        error: 'Movie not found',
                    });
                }
            }
        } catch (err) {
            if (isMounted.current) {
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: 'Failed to load movie details',
                }));
            }
        }
    }, [movieId]);

    useEffect(() => {
        isMounted.current = true;
        fetchDetails();
        return () => {
            isMounted.current = false;
        };
    }, [fetchDetails]);

    return { ...state, refetch: fetchDetails };
};

// ============ Search Hook ============

/**
 * Hook for searching movies with debounce
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 */
export const useSupabaseSearchMovies = (debounceMs: number = 300): UseSearchState => {
    const [data, setData] = useState<Movie[]>([]);
    const [suggestions, setSuggestions] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMounted = useRef(true);

    const search = useCallback(async (searchQuery: string) => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        setQuery(searchQuery);

        if (!searchQuery.trim()) {
            setData([]);
            setSuggestions([]);
            return;
        }

        debounceTimer.current = setTimeout(async () => {
            try {
                setLoading(true);
                const results = await searchMovies(searchQuery);

                if (isMounted.current) {
                    setData(results);
                    setSuggestions(results.slice(0, 5));
                }
            } catch (err) {
                if (isMounted.current) setError('Search failed');
            } finally {
                if (isMounted.current) setLoading(false);
            }
        }, debounceMs);
    }, [debounceMs]);

    const refetch = useCallback(async () => {
        if (query.trim()) await search(query);
    }, [query, search]);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, []);

    return { data, suggestions, loading, error, refetch, search, query };
};

// ============ Home Screen Data Hook ============

interface UseSupabaseHomeDataState {
    data: HomeScreenData;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Hook for fetching all home screen data in one call
 * Fetches trending, popular, new releases, and top rated movies in parallel
 */
export const useSupabaseHomeData = (): UseSupabaseHomeDataState => {
    const [data, setData] = useState<HomeScreenData>({
        trending: [],
        popular: [],
        newReleases: [],
        topRated: [],
        heroMovie: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    const fetchHomeData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const homeData = await getHomeScreenData();

            if (isMounted.current) {
                setData(homeData);
            }
        } catch (err) {
            if (isMounted.current) {
                setError('Failed to load home data');
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        fetchHomeData();
        return () => {
            isMounted.current = false;
        };
    }, [fetchHomeData]);

    return { data, loading, error, refetch: fetchHomeData };
};
