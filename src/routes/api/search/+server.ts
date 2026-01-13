import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * @description iTunes Search API를 통해 트랙을 검색하는 서버 사이드 GET 핸들러입니다.
 * * 클라이언트 사이드 페이지네이션(Client-side Pagination)을 지원하기 위해,
 * 요청 시 오프셋을 사용하지 않고 내부적으로 최대 허용치인 200개의 데이터를 한 번에 가져옵니다.
 * 이를 통해 클라이언트는 추가 네트워크 요청 없이 즉각적인 "더 보기" 기능을 구현할 수 있습니다.
 *
 * @param {Object} event - SvelteKit 요청 이벤트 객체
 * @param {URL} event.url - 요청 URL 객체. 쿼리 파라미터 'q'(검색어)를 포함합니다.
 * @returns {Promise<Response>}
 * - 성공 시: 포맷팅된 트랙 리스트(`Track[]`)를 담은 JSON 응답 (200 OK)
 * - 실패 시: 에러 메시지를 담은 JSON 응답 (400 Bad Request, 404 Not Found, 500 Internal Server Error)
 */
export const GET: RequestHandler = async ({ url }) => {
    const query = url.searchParams.get('q');

    /**
     * @constant {number} LIMIT
     * @description iTunes API에서 한 번에 가져올 최대 아이템 개수입니다.
     * 클라이언트에서 데이터를 잘라서 보여주기 위해(Slicing) 최대치인 200으로 고정합니다.
     */
    const LIMIT = 200;

    // 검색어 유효성 검사
    if (!query) {
        return json({ error: 'No query provided' }, { status: 400 });
    }

    try {
        /**
         * @description iTunes API 요청 URL 구성
         * - entity=song: 노래 검색으로 제한
         * - country=KR: 한국 스토어 기준
         * - limit=200: 최대 개수 요청
         */
        const apiUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=${LIMIT}&country=KR`;

        const res = await fetch(apiUrl, {
            headers: {
                // iTunes API의 403 Forbidden 에러 방지를 위한 User-Agent 설정
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!res.ok) {
            throw new Error(`iTunes API status: ${res.status}`);
        }

        const data = await res.json();

        // 검색 결과가 없는 경우 처리
        if (!data.results || data.resultCount === 0) {
            return json({ error: 'No track found' }, { status: 404 });
        }

        /**
         * @description 원본 API 응답 데이터를 클라이언트에서 사용하기 편한 구조로 매핑합니다.
         * 특히, 앨범 커버 이미지를 고해상도(1000x1000)로 변환하는 로직이 포함됩니다.
         */
        const tracks = (data.results || []).map((track: any) => {
            // 100x100 저화질 이미지를 1000x1000 고화질로 URL 변환
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