import type { Movie as TmdbMovie, MovieDetails, Genre } from '../api/tmdb';
import type { Category, Movie as SupabaseMovie } from '../types/database.types';

export type MovieWithSource = TmdbMovie & { source?: 'supabase'; sourceId?: string };

export const getMovieRouteId = (movie: MovieWithSource): string => {
  if (movie.source === 'supabase' && movie.sourceId) {
    return `db_${movie.sourceId}`;
  }
  return String(movie.id);
};

const toNumericId = (value: string): number => {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const mapCategoriesToGenres = (categories?: Category[]): Genre[] =>
  (categories ?? []).map((category) => ({
    id: toNumericId(category.id),
    name: category.name,
  }));

export const mapSupabaseMovieToTmdb = (movie: SupabaseMovie): MovieWithSource => ({
  id: toNumericId(movie.id),
  title: movie.title,
  original_title: movie.title,
  overview: movie.description ?? '',
  poster_path: movie.poster_url,
  backdrop_path: movie.backdrop_url,
  release_date: movie.release_year ? `${movie.release_year}-01-01` : '',
  vote_average: movie.rating ?? 0,
  vote_count: 0,
  popularity: movie.rating ?? 0,
  adult: false,
  genre_ids: [],
  original_language: 'en',
  video: false,
  source: 'supabase',
  sourceId: movie.id,
});

export const mapSupabaseMoviesToTmdb = (
  movies: SupabaseMovie[]
): MovieWithSource[] => movies.map(mapSupabaseMovieToTmdb);

export const mapSupabaseMovieToTmdbDetails = (
  movie: SupabaseMovie,
  categories?: Category[]
): MovieDetails & MovieWithSource => ({
  ...mapSupabaseMovieToTmdb(movie),
  budget: 0,
  genres: mapCategoriesToGenres(categories),
  homepage: null,
  imdb_id: null,
  production_companies: [],
  production_countries: [],
  revenue: 0,
  runtime: movie.duration ?? null,
  spoken_languages: [],
  status: 'Released',
  tagline: null,
});

