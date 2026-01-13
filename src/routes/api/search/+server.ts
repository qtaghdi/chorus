import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Handles GET requests to search for tracks via iTunes API.
 * Returns a list of tracks with high-resolution cover art and audio previews.
 * * @param {Object} event - The SvelteKit request event.
 * @param {URL} event.url - The URL object containing search parameters.
 * @returns {Promise<Response>} JSON response containing track data or error message.
 */
export const GET: RequestHandler = async ({ url }: { url: URL; }): Promise<Response> => {
    const query = url.searchParams.get('q');
    if (!query) return json({ error: 'No query provided' }, { status: 400 });

    try {
        const apiUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10&country=KR`;

        const res = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!res.ok) throw new Error(`iTunes API status: ${res.status}`);

        const data = await res.json();

        if (!data.results || data.resultCount === 0) {
            return json({ error: 'No track found' }, { status: 404 });
        }

        const tracks = data.results.map((track: any) => {
            let highResCover = track.artworkUrl100;
            if (highResCover) {
                highResCover = highResCover.replace(/\/\d+x\d+[^/]*\.jpg/, '/1000x1000bb.jpg');
            }

            return {
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