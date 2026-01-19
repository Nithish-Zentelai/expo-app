/**
 * TMDB Image URL Utilities
 * Generates proper image URLs from TMDB image paths
 */

// Image sizes available from TMDB
export const IMAGE_SIZES = {
    poster: {
        small: 'w185',
        medium: 'w342',
        large: 'w500',
        original: 'original',
    },
    backdrop: {
        small: 'w300',
        medium: 'w780',
        large: 'w1280',
        original: 'original',
    },
    profile: {
        small: 'w45',
        medium: 'w185',
        large: 'h632',
        original: 'original',
    },
} as const;

// Base URL for TMDB images
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

/**
 * Get full TMDB image URL from partial path
 * @param path - The image path from TMDB API (e.g., "/abc123.jpg")
 * @param size - The desired image size
 * @returns Full URL to the image
 */
export const getImageUrl = (
    path: string | null | undefined,
    size: string = IMAGE_SIZES.poster.medium
): string | null => {
    if (!path) return null;
    // Support full URLs (for mock data)
    if (path.startsWith('http')) return path;
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};


/**
 * Get poster image URL
 * @param path - Poster path from TMDB
 * @param size - Size variant (small, medium, large, original)
 */
export const getPosterUrl = (
    path: string | null | undefined,
    size: keyof typeof IMAGE_SIZES.poster = 'medium'
): string | null => {
    return getImageUrl(path, IMAGE_SIZES.poster[size]);
};

/**
 * Get backdrop image URL
 * @param path - Backdrop path from TMDB
 * @param size - Size variant (small, medium, large, original)
 */
export const getBackdropUrl = (
    path: string | null | undefined,
    size: keyof typeof IMAGE_SIZES.backdrop = 'large'
): string | null => {
    return getImageUrl(path, IMAGE_SIZES.backdrop[size]);
};

/**
 * Get profile image URL
 * @param path - Profile image path from TMDB
 * @param size - Size variant (small, medium, large, original)
 */
export const getProfileUrl = (
    path: string | null | undefined,
    size: keyof typeof IMAGE_SIZES.profile = 'medium'
): string | null => {
    return getImageUrl(path, IMAGE_SIZES.profile[size]);
};

/**
 * Get YouTube thumbnail URL from video key
 * @param videoKey - YouTube video key
 * @param quality - Thumbnail quality (default, mqdefault, hqdefault, maxresdefault)
 */
export const getYouTubeThumbnail = (
    videoKey: string,
    quality: 'default' | 'mqdefault' | 'hqdefault' | 'maxresdefault' = 'hqdefault'
): string => {
    return `https://img.youtube.com/vi/${videoKey}/${quality}.jpg`;
};

/**
 * Get YouTube video URL
 * @param videoKey - YouTube video key
 */
export const getYouTubeUrl = (videoKey: string): string => {
    return `https://www.youtube.com/watch?v=${videoKey}`;
};

/**
 * Get YouTube embed URL
 * @param videoKey - YouTube video key
 */
export const getYouTubeEmbedUrl = (videoKey: string): string => {
    return `https://www.youtube.com/embed/${videoKey}?autoplay=1`;
};
