const ACCESS_TOKEN = process.env.EXPO_PUBLIC_TMDB_ACCESS_TOKEN;
const BASE_URL = process.env.EXPO_PUBLIC_TMDB_BASE_URL;
export const IMAGE_PATH = process.env.EXPO_PUBLIC_TMDB_IMAGE_BASE;

const fetchFromTMDB = async (endpoint, params = "") => {
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${ACCESS_TOKEN}`
        }
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}?language=en-US${params}`, options);
        return await response.json();
    } catch (error) {
        console.error("TMDB Fetch Error:", error);
        return null;
    }
};

export const getTrendingMovies = () => fetchFromTMDB("/trending/movie/day").then(res => res?.results || []);
export const getTrendingTV = () => fetchFromTMDB("/trending/tv/day").then(res => res?.results || []);
export const getDetails = (id, type = 'movie') => fetchFromTMDB(`/${type}/${id}`, "&append_to_response=credits,videos");

// Movie-specific endpoints
export const getNowPlayingMovies = () => fetchFromTMDB("/movie/now_playing").then(res => res?.results || []);
export const getTopRatedMovies = () => fetchFromTMDB("/movie/top_rated").then(res => res?.results || []);
export const getUpcomingMovies = () => fetchFromTMDB("/movie/upcoming").then(res => res?.results || []);

// TV-specific endpoints
export const getAiringTodayTV = () => fetchFromTMDB("/tv/airing_today").then(res => res?.results || []);
export const getPopularTV = () => fetchFromTMDB("/tv/popular").then(res => res?.results || []);
export const getTopRatedTV = () => fetchFromTMDB("/tv/top_rated").then(res => res?.results || []);

export const getCredits = (id, type) => fetchFromTMDB(`/${type}/${id}/credits`);
// New: Fetch specific season episodes
export const getSeasonDetails = (tvId, seasonNumber) =>
    fetchFromTMDB(`/tv/${tvId}/season/${seasonNumber}`);

// Search Movies, TV Shows, and People all at once
export const searchMulti = (query) =>
    fetchFromTMDB("/search/multi", `&query=${encodeURIComponent(query)}&include_adult=false`);