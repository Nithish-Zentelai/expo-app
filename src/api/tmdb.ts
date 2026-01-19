/**
 * TMDB API Service (Enhanced Hybrid)
 * Primary: Real TMDB API
 * Fallback: Static Mock Data
 */

import axios from 'axios';
import {
    ALL_CONTENT,
    getMockMovieDetails,
    MOCK_CREDITS,
    MOCK_GENRES,
    MOCK_MOVIES,
    MOCK_MY_LIST,
    MOCK_TV_SHOWS,
    MOCK_VIDEOS
} from './mockData';

// ============ Configuration ============

// Use provided key or environment variable
const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '5a2c019593f0756cdd691da44658808655a061a7';
const BASE_URL = 'https://api.themoviedb.org/3';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 5000, // 5 second timeout
    params: {
        api_key: API_KEY,
        language: 'en-US',
    }
});

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

// ============ Safety Wrapper ============

/**
 * Executes an API call. If it fails, logs the error and returns mock data.
 */
async function apiSafeFetch<T>(fetcher: () => Promise<T>, fallback: T, label: string): Promise<T> {
    try {
        console.log(`[MatrixFlix] Fetching ${label}...`);
        return await fetcher();
    } catch (error: any) {
        console.warn(`[MatrixFlix] API Failure on ${label}. Falling back to static data. Reason:`, error.message);
        // Add a tiny artificial delay to maintain UX consistency during fallback
        await new Promise(r => setTimeout(r, 200));
        return fallback;
    }
}

// ============ Endpoints ============

export const getTrending = async (time: 'day' | 'week' = 'week', page = 1) =>
    apiSafeFetch(
        async () => (await api.get(`/trending/movie/${time}`, { params: { page } })).data,
        { page: 1, results: ALL_CONTENT, total_pages: 1, total_results: ALL_CONTENT.length },
        'Trending'
    );

export const getPopular = async (page = 1) =>
    apiSafeFetch(
        async () => (await api.get(`/movie/popular`, { params: { page } })).data,
        { page: 1, results: [...MOCK_MOVIES].reverse(), total_pages: 1, total_results: MOCK_MOVIES.length },
        'Popular'
    );

export const getTopRated = async (page = 1) =>
    apiSafeFetch(
        async () => (await api.get(`/movie/top_rated`, { params: { page } })).data,
        { page: 1, results: [...MOCK_MOVIES].sort((a, b) => b.vote_average - a.vote_average), total_pages: 1, total_results: MOCK_MOVIES.length },
        'Top Rated'
    );

export const getUpcoming = async (page = 1) =>
    apiSafeFetch(
        async () => (await api.get(`/movie/upcoming`, { params: { page } })).data,
        { page: 1, results: MOCK_MOVIES.slice(0, 4), total_pages: 1, total_results: 4 },
        'Upcoming'
    );

export const getNowPlaying = async (page = 1) =>
    apiSafeFetch(
        async () => (await api.get(`/movie/now_playing`, { params: { page } })).data,
        { page: 1, results: MOCK_MOVIES.slice(4, 8), total_pages: 1, total_results: 4 },
        'Now Playing'
    );

export const getTvShows = async (page = 1) =>
    apiSafeFetch(
        async () => {
            const res = await api.get(`/tv/popular`, { params: { page } });
            // Consistent mapping for TV 'name' to 'title'
            res.data.results = res.data.results.map((m: any) => ({ ...m, title: m.name || m.title }));
            return res.data;
        },
        { page: 1, results: MOCK_TV_SHOWS, total_pages: 1, total_results: MOCK_TV_SHOWS.length },
        'TV Shows'
    );

export const getMyList = async () => ({
    page: 1,
    results: MOCK_MY_LIST,
    total_pages: 1,
    total_results: MOCK_MY_LIST.length
});

export const getMovieDetails = async (id: number) =>
    apiSafeFetch(
        async () => (await api.get(`/movie/${id}`)).data,
        getMockMovieDetails(id),
        `Details-${id}`
    );

export const getMovieVideos = async (id: number) =>
    apiSafeFetch(
        async () => (await api.get(`/movie/${id}/videos`)).data,
        { results: MOCK_VIDEOS },
        `Videos-${id}`
    );

export const getMovieCredits = async (id: number) =>
    apiSafeFetch(
        async () => (await api.get(`/movie/${id}/credits`)).data,
        MOCK_CREDITS,
        `Credits-${id}`
    );

export const getSimilarMovies = async (id: number, page = 1) =>
    apiSafeFetch(
        async () => (await api.get(`/movie/${id}/similar`, { params: { page } })).data,
        { page: 1, results: ALL_CONTENT.filter(m => m.id !== id), total_pages: 1, total_results: 0 },
        `Similar-${id}`
    );

export const searchMovies = async (query: string, page = 1) => {
    if (!query.trim()) return { page: 1, results: [], total_pages: 1, total_results: 0 };
    return apiSafeFetch(
        async () => {
            const res = await api.get(`/search/multi`, { params: { query, page } });
            res.data.results = res.data.results
                .map((m: any) => ({ ...m, title: m.title || m.name }))
                .filter((m: any) => m.media_type !== 'person');
            return res.data;
        },
        { page: 1, results: ALL_CONTENT.filter(m => m.title.toLowerCase().includes(query.toLowerCase())), total_pages: 1, total_results: 0 },
        `Search-${query}`
    );
};

export const getGenres = async () =>
    apiSafeFetch(
        async () => (await api.get(`/genre/movie/list`)).data,
        { genres: MOCK_GENRES },
        'Genres'
    );

export const discoverByGenre = async (genreId: number, page = 1) =>
    apiSafeFetch(
        async () => (await api.get(`/discover/movie`, { params: { with_genres: genreId, page } })).data,
        { page: 1, results: ALL_CONTENT.filter(m => m.genre_ids.includes(genreId)), total_pages: 1, total_results: 0 },
        'Discover'
    );

export const getRecommendations = async (id: number, page = 1) =>
    apiSafeFetch(
        async () => (await api.get(`/movie/${id}/recommendations`, { params: { page } })).data,
        { page: 1, results: ALL_CONTENT.filter(m => m.id !== id), total_pages: 1, total_results: 0 },
        'Recommendations'
    );

export const tmdbApi = {
    getTrending, getPopular, getTopRated, getUpcoming, getNowPlaying, getTvShows, getMyList,
    getMovieDetails, getMovieVideos, getMovieCredits, getSimilarMovies, getRecommendations,
    searchMovies, getGenres, discoverByGenre,
};

export default tmdbApi;
