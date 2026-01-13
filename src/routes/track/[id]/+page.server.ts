import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Server-side load function for the track detail page.
 * Fetches specific track metadata using the iTunes Lookup API based on the route parameter 'id'.
 * * @param {Object} context - The SvelteKit load context.
 * @param {Object} context.params - Route parameters (contains 'id').
 * @param {Function} context.fetch - The fetch function (native or SvelteKit enhanced).
 * @returns {Promise<{ track: any }>} The formatted track data to be passed to the page component.
 * @throws {Error} 404 if track is not found, or 500 for server errors.
 */
export const load: PageServerLoad = async ({ params, fetch }) => {
    const { id } = params;

    if (!id) {
        throw error(400, 'Track ID is missing');
    }

    try {
        // Use iTunes Lookup API to find a specific song by ID
        const res = await fetch(`https://itunes.apple.com/lookup?id=${id}&country=KR`);

        if (!res.ok) {
            throw new Error(`iTunes Lookup API Error: ${res.status}`);
        }

        const data = await res.json();

        if (!data.results || data.results.length === 0) {
            throw error(404, 'Track not found');
        }

        const track = data.results[0];

        // Process high-resolution artwork
        let highResCover = track.artworkUrl100;
        if (highResCover) {
            highResCover = highResCover.replace(/\/\d+x\d+[^/]*\.jpg/, '/1000x1000bb.jpg');
        }

        // Return the structured track data
        return {
            track: {
                id: track.trackId,
                title: track.trackName,
                artist: track.artistName,
                cover: highResCover,
                album: track.collectionName,
                audio: track.previewUrl
            }
        };

    } catch (err: any) {
        console.error('Track Load Error:', err);
        // If it's already a SvelteKit error, rethrow it
        if (err?.status) throw err;
        throw error(500, 'Failed to load track data');
    }
};