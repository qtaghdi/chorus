import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Handles GET requests to search for tracks via the iTunes Search API.
 * This server-side endpoint acts as a proxy to avoid CORS issues and secret exposure (if any).
 * * @param {Object} event - The SvelteKit request event.
 * @param {URL} event.url - The URL object containing the search query parameter 'q'.
 * @returns {Promise<Response>} A JSON response containing the list of formatted track objects or an error message.
 */
export const GET: RequestHandler = async ({ url }) => {
    const query = url.searchParams.get('q');

    // Validate query parameter
    if (!query) {
        return json({ error: 'No query provided' }, { status: 400 });
    }

    try {
        // Construct iTunes API URL (Limit: 10, Country: KR)
        const apiUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10&country=KR`;

        // Fetch data from iTunes
        const res = await fetch(apiUrl, {
            headers: {
                // User-Agent is sometimes required to avoid 403 Forbidden from iTunes
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!res.ok) {
            throw new Error(`iTunes API status: ${res.status}`);
        }

        const data = await res.json();

        // Handle empty results
        if (!data.results || data.resultCount === 0) {
            return json({ error: 'No track found' }, { status: 404 });
        }

        // Map and format the results
        const tracks = data.results.map((track: any) => {
            // Convert artwork URL to high resolution (1000x1000)
            let highResCover = track.artworkUrl100;
            if (highResCover) {
                highResCover = highResCover.replace(/\/\d+x\d+[^/]*\.jpg/, '/1000x1000bb.jpg');
            }

            return {
                id: track.trackId,
                title: track.trackName,
                artist: track.artistName,
                cover: highResCover,
                album: track.collectionName,
                audio: track.previewUrl
            };
        });

        return json(tracks);

    } catch (error) {
        console.error('SERVER ERROR:', error);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
};