/**
 * useMovies Hook
 * Custom hook for fetching and managing movie data from TMDB
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Movie,
    MovieCredits,
    MovieDetails,
    PaginatedResponse,
    Video,
    getMovieCredits,
    getMovieDetails,
    getMovieVideos,
    getPopular,
    getSimilarMovies,
    getTopRated,
    getTrending,
    getUpcoming,
    searchMovies,
} from '../api/tmdb';
import { getHomeScreenData as getSupabaseHomeScreenData } from '../api/supabaseApi';
import type { HomeScreenData as SupabaseHomeScreenData } from '../types/database.types';
import { mapSupabaseMoviesToTmdb } from '../utils/movie';

// ============ Types ============

interface UseMoviesState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

interface UseMovieListState extends UseMoviesState<Movie[]> {
    loadMore: () => Promise<void>;
    hasMore: boolean;
    page: number;
}

interface UseSearchState extends UseMovieListState {
    search: (query: string) => Promise<void>;
    query: string;
    suggestions: Movie[];
}

// ============ Generic Fetch Hook ============

/**
 * Generic hook for fetching paginated movie lists
 */
export const useMovieList = (
    fetchFunction: (page: number) => Promise<PaginatedResponse<Movie>>,
    autoFetch: boolean = true
): UseMovieListState => {
    const [data, setData] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(autoFetch);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const isMounted = useRef(true);

    const fetchData = useCallback(async (pageNum: number, append: boolean = false) => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetchFunction(pageNum);

            if (isMounted.current) {
                setData(prev => append ? [...prev, ...response.results] : response.results);
                setHasMore(pageNum < response.total_pages);
                setPage(pageNum);
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
        setData([]);
        await fetchData(1);
    }, [fetchData]);

    const loadMore = useCallback(async () => {
        if (!loading && hasMore) {
            await fetchData(page + 1, true);
        }
    }, [loading, hasMore, page, fetchData]);

    useEffect(() => {
        isMounted.current = true;
        if (autoFetch) {
            fetchData(1);
        }
        return () => {
            isMounted.current = false;
        };
    }, [autoFetch, fetchData]);

    return { data, loading, error, refetch, loadMore, hasMore, page };
};

// ============ Specific Movie List Hooks ============

export const useTrendingMovies = (timeWindow: 'day' | 'week' = 'day') => {
    return useMovieList(useCallback((page: number) => getTrending(timeWindow, page), [timeWindow]));
};

export const usePopularMovies = () => useMovieList(getPopular);
export const useTopRatedMovies = () => useMovieList(getTopRated);
export const useUpcomingMovies = () => useMovieList(getUpcoming);

// ============ Movie Details Hook ============

interface MovieDetailsState {
    movie: MovieDetails | null;
    videos: Video[];
    credits: MovieCredits | null;
    similar: Movie[];
    loading: boolean;
    error: string | null;
    trailer: Video | null;
}

export const useMovieDetails = (movieId: number | null): MovieDetailsState & { refetch: () => Promise<void> } => {
    const [state, setState] = useState<MovieDetailsState>({
        movie: null,
        videos: [],
        credits: null,
        similar: [],
        loading: true,
        error: null,
        trailer: null,
    });

    const isMounted = useRef(true);

    const fetchDetails = useCallback(async () => {
        if (!movieId) {
            setState(prev => ({ ...prev, loading: false }));
            return;
        }

        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            const [movieData, videosData, creditsData, similarData] = await Promise.all([
                getMovieDetails(movieId),
                getMovieVideos(movieId),
                getMovieCredits(movieId),
                getSimilarMovies(movieId),
            ]);

            const trailer = videosData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube')
                || videosData.results.find(v => v.type === 'Trailer')
                || videosData.results[0]
                || null;

            if (isMounted.current) {
                setState({
                    movie: movieData,
                    videos: videosData.results,
                    credits: creditsData,
                    similar: similarData.results,
                    loading: false,
                    error: null,
                    trailer,
                });
            }
        } catch (err) {
            if (isMounted.current) {
                setState(prev => ({ ...prev, loading: false, error: 'Failed to load details' }));
            }
        }
    }, [movieId]);

    useEffect(() => {
        isMounted.current = true;
        fetchDetails();
        return () => { isMounted.current = false; };
    }, [fetchDetails]);

    return { ...state, refetch: fetchDetails };
};

// ============ Search Hook ============

export const useSearchMovies = (debounceMs: number = 300): UseSearchState => {
    const [data, setData] = useState<Movie[]>([]);
    const [suggestions, setSuggestions] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
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
                const response = await searchMovies(searchQuery, 1);
                if (isMounted.current) {
                    setData(response.results);
                    setSuggestions(response.results.slice(0, 5));
                    setPage(1);
                    setHasMore(1 < response.total_pages);
                }
            } catch (err) {
                if (isMounted.current) setError('Search failed');
            } finally {
                if (isMounted.current) setLoading(false);
            }
        }, debounceMs);
    }, [debounceMs]);

    const loadMore = useCallback(async () => {
        if (!loading && hasMore && query.trim()) {
            try {
                setLoading(true);
                const response = await searchMovies(query, page + 1);
                if (isMounted.current) {
                    setData(prev => [...prev, ...response.results]);
                    setPage(prev => prev + 1);
                    setHasMore(page + 1 < response.total_pages);
                }
            } catch (err) {
                if (isMounted.current) setError('Failed to load more');
            } finally {
                if (isMounted.current) setLoading(false);
            }
        }
    }, [loading, hasMore, query, page]);

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

    return { data, suggestions, loading, error, refetch, loadMore, hasMore, page, search, query };
};

// ============ Home Screen Data Hook ============

interface HomeScreenData {
    trending: Movie[];
    popular: Movie[];
    topRated: Movie[];
    upcoming: Movie[];
    heroMovie: Movie | null;
}

const mapSupabaseHomeToTmdb = (data: SupabaseHomeScreenData): HomeScreenData => {
    const trending = mapSupabaseMoviesToTmdb(data.trending);
    const popular = mapSupabaseMoviesToTmdb(data.popular);
    const topRated = mapSupabaseMoviesToTmdb(data.topRated);
    const upcoming = mapSupabaseMoviesToTmdb(data.newReleases);
    const heroMovie = trending[0] || popular[0] || upcoming[0] || null;

    return { trending, popular, topRated, upcoming, heroMovie };
};

export const useHomeData = (): UseHomeDataState => {
    const [data, setData] = useState<HomeScreenData>({
        trending: [],
        popular: [],
        topRated: [],
        upcoming: [],
        heroMovie: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    const fetchHomeData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [trendingRes, popularRes, topRatedRes, upcomingRes] =
                await Promise.all([
                    getTrending('day'),
                    getPopular(),
                    getTopRated(),
                    getUpcoming(),
                ]);

            if (isMounted.current) {
                setData({
                    trending: trendingRes.results,
                    popular: popularRes.results,
                    topRated: topRatedRes.results,
                    upcoming: upcomingRes.results,
                    heroMovie: trendingRes.results[0] || null,
                });
            }
        } catch (err) {
            try {
                const supabaseData = await getSupabaseHomeScreenData();
                if (isMounted.current) {
                    setData(mapSupabaseHomeToTmdb(supabaseData));
                }
            } catch (dbErr) {
                if (isMounted.current) setError('Failed to load home data');
            }
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        fetchHomeData();
        return () => { isMounted.current = false; };
    }, [fetchHomeData]);

    return { data, loading, error, refetch: fetchHomeData };
};

interface UseHomeDataState {
    data: HomeScreenData;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}
