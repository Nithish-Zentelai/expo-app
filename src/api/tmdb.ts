/**
 * TMDB API Service (Enhanced Hybrid)
 * Primary: Real TMDB API
 * Fallback: Static Mock Data
 */

import axios from 'axios';

// ============ Configuration ============

// Use provided key or environment variable
const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || 'f31d36c9159f47d463d2f0919e23b20e';
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

// ============ Endpoints ============

export const getTrending = async (time: 'day' | 'week' = 'day', page = 1) =>
    (await api.get(`/trending/movie/${time}`, { params: { page } })).data;

export const getPopular = async (page = 1) =>
    (await api.get(`/movie/popular`, { params: { page } })).data;

export const getTopRated = async (page = 1) =>
    (await api.get(`/movie/top_rated`, { params: { page } })).data;

export const getUpcoming = async (page = 1) =>
    (await api.get(`/movie/upcoming`, { params: { page } })).data;

export const getMovieDetails = async (id: number) =>
    (await api.get(`/movie/${id}`)).data;

export const getMovieVideos = async (id: number) =>
    (await api.get(`/movie/${id}/videos`)).data;

export const getMovieCredits = async (id: number) =>
    (await api.get(`/movie/${id}/credits`)).data;

export const getSimilarMovies = async (id: number, page = 1) =>
    (await api.get(`/movie/${id}/similar`, { params: { page } })).data;

export const searchMovies = async (query: string, page = 1) => {
    if (!query.trim()) return { page: 1, results: [], total_pages: 1, total_results: 0 };
    const res = await api.get(`/search/multi`, { params: { query, page } });
    res.data.results = res.data.results
        .map((m: any) => ({ ...m, title: m.title || m.name }))
        .filter((m: any) => m.media_type !== 'person');
    return res.data;
};

export const getGenres = async () =>
    (await api.get(`/genre/movie/list`)).data;

export const discoverByGenre = async (genreId: number, page = 1) =>
    (await api.get(`/discover/movie`, { params: { with_genres: genreId, page } })).data;

export const getRecommendations = async (id: number, page = 1) =>
    (await api.get(`/movie/${id}/recommendations`, { params: { page } })).data;

export const tmdbApi = {
    getTrending, getPopular, getTopRated, getUpcoming,
    getMovieDetails, getMovieVideos, getMovieCredits, getSimilarMovies, getRecommendations,
    searchMovies, getGenres, discoverByGenre,
};

export default tmdbApi;
