const axios = require('axios');

const TMDB_API_KEY = 'a888ef96';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function testApi() {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/trending/movie/week`, {
            params: { api_key: TMDB_API_KEY }
        });
        console.log('Success:', response.status);
    } catch (error) {
        console.error('Error Status:', error.response?.status);
        console.error('Error Data:', JSON.stringify(error.response?.data));
    }
}

testApi();
