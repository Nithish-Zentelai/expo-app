/**
 * TMDB API Service (Enhanced Hybrid)
 * Primary: Real TMDB API
 * Fallback: Static Mock Data
 */

// ============ Configuration ============

// Use API key from environment (.env -> EXPO_PUBLIC_TMDB_API_KEY)
const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '';
const BASE_URL = 'https://api.themoviedb.org/3';

if (!API_KEY) {
    console.warn('[MatrixFlix] Missing EXPO_PUBLIC_TMDB_API_KEY in environment.');
}

// Helper function to build URLs with default params
const buildUrl = (endpoint: string, params?: Record<string, any>) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', API_KEY);
    url.searchParams.append('language', 'en-US');
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
        });
    }
    return url.toString();
};

// Fetch wrapper with timeout
const fetchWithTimeout = async (url: string, timeout = 5000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
};

// ============ Type Definitions ============

export interface Movie {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    popularity: number;
    adult: boolean;
    genre_ids: number[];
    original_language: string;
    video: boolean;
    name?: string; // TV Shows use 'name'
}

export interface MovieDetails extends Movie {
    budget: number;
    genres: Genre[];
    homepage: string | null;
    imdb_id: string | null;
    production_companies: ProductionCompany[];
    production_countries: ProductionCountry[];
    revenue: number;
    runtime: number | null;
    spoken_languages: SpokenLanguage[];
    status: string;
    tagline: string | null;
}

export interface Genre { id: number; name: string; }
export interface ProductionCompany { id: number; logo_path: string | null; name: string; origin_country: string; }
export interface ProductionCountry { iso_3166_1: string; name: string; }
export interface SpokenLanguage { english_name: string; iso_639_1: string; name: string; }
export interface Video { id: string; key: string; name: string; site: string; size: number; type: string; official: boolean; published_at: string; }
export interface Cast { id: number; name: string; character: string; profile_path: string | null; }
export interface Crew { id: number; name: string; job: string; department: string; }
export interface MovieCredits { cast: Cast[]; crew: Crew[]; }
export interface PaginatedResponse<T> { page: number; results: T[]; total_pages: number; total_results: number; }

// ============ Endpoints ============

export const getTrending = async (time: 'day' | 'week' = 'day', page = 1) =>
    fetchWithTimeout(buildUrl(`/trending/movie/${time}`, { page }));

export const getPopular = async (page = 1) =>
    fetchWithTimeout(buildUrl(`/movie/popular`, { page }));

export const getTopRated = async (page = 1) =>
    fetchWithTimeout(buildUrl(`/movie/top_rated`, { page }));

export const getUpcoming = async (page = 1) =>
    fetchWithTimeout(buildUrl(`/movie/upcoming`, { page }));

export const getMovieDetails = async (id: number) =>
    fetchWithTimeout(buildUrl(`/movie/${id}`));

export const getMovieVideos = async (id: number) =>
    fetchWithTimeout(buildUrl(`/movie/${id}/videos`));

export const getMovieCredits = async (id: number) =>
    fetchWithTimeout(buildUrl(`/movie/${id}/credits`));

export const getSimilarMovies = async (id: number, page = 1) =>
    fetchWithTimeout(buildUrl(`/movie/${id}/similar`, { page }));

export const searchMovies = async (query: string, page = 1) => {
    if (!query.trim()) return { page: 1, results: [], total_pages: 1, total_results: 0 };
    const data = await fetchWithTimeout(buildUrl(`/search/multi`, { query, page }));
    data.results = data.results
        .map((m: any) => ({ ...m, title: m.title || m.name }))
        .filter((m: any) => m.media_type !== 'person');
    return data;
};

export const getGenres = async () =>
    fetchWithTimeout(buildUrl(`/genre/movie/list`));

export const discoverByGenre = async (genreId: number, page = 1) =>
    fetchWithTimeout(buildUrl(`/discover/movie`, { with_genres: genreId, page }));

export const getRecommendations = async (id: number, page = 1) =>
    fetchWithTimeout(buildUrl(`/movie/${id}/recommendations`, { page }));

export const tmdbApi = {
    getTrending, getPopular, getTopRated, getUpcoming,
    getMovieDetails, getMovieVideos, getMovieCredits, getSimilarMovies, getRecommendations,
    searchMovies, getGenres, discoverByGenre,
};

export default tmdbApi;
