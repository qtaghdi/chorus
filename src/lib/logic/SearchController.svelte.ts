import ky from 'ky';

/**
 * @description
 * 검색 결과로 사용되는 트랙 데이터 모델
 */
export interface Track {
    /**
     * @description 트랙 고유 식별자
     */
    id: number;

    /**
     * @description 곡 제목
     */
    title: string;

    /**
     * @description 아티스트 이름
     */
    artist: string;

    /**
     * @description 앨범 커버 이미지 URL
     */
    cover: string;

    /**
     * @description 앨범 이름
     */
    album: string;

    /**
     * @description 미리 듣기 또는 재생용 오디오 URL
     * @remarks 일부 트랙에서는 제공되지 않을 수 있음
     */
    audio?: string;
}

/**
 * @description
 * 검색 화면의 상태 및 비즈니스 로직을 담당하는 컨트롤러
 *
 * @remarks
 * - 검색 요청은 최초 1회만 네트워크로 수행
 * - 이후 페이징은 클라이언트 메모리에서 처리
 * - UI 컴포넌트는 이 컨트롤러의 상태만 소비함
 */
export class SearchController {
    /**
     * @description 현재 입력된 검색어
     */
    query = $state('');

    /**
     * @description 검색 API 요청 진행 여부
     */
    isLoading = $state(false);

    /**
     * @description 현재 화면에 렌더링 중인 검색 결과 목록
     */
    searchResults = $state<Track[]>([]);

    /**
     * @description 검색 결과 화면 모드 여부
     * @remarks false일 경우 랜딩/입력 화면 상태
     */
    isResultMode = $state(false);

    /**
     * @description 추가로 로드할 검색 결과가 남아있는지 여부
     */
    hasMore = $state(true);

    /**
     * @description
     * 검색 API를 통해 한 번에 받아온 전체 트랙 목록
     *
     * @remarks
     * - 최초 검색 시 전체를 메모리에 저장
     * - 이후 "더 보기"는 이 배열을 기준으로 slice 처리
     */
    allFetchedTracks: Track[] = [];

    /**
     * @description 현재 화면에 노출된 트랙 개수
     */
    currentDisplayCount = $state(0);

    /**
     * @description 한 번에 화면에 추가로 노출할 트랙 개수
     */
    readonly PAGE_SIZE = 20;

    /**
     * @description
     * 햅틱 피드백을 트리거하여 사용자 인터랙션을 보조
     */
    triggerHaptic() {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    }

    /**
     * @description
     * 검색어를 기반으로 트랙 검색을 수행
     *
     * @remarks
     * - 검색어가 비어있을 경우 실행되지 않음
     * - 검색 결과는 한 번에 모두 받아온 뒤 내부 페이징 처리
     * - 검색 시작 시 기존 상태는 초기화됨
     */
    async search() {
        if (!this.query.trim()) return;

        this.triggerHaptic();
        this.isLoading = true;
        this.isResultMode = true;

        this.searchResults = [];
        this.allFetchedTracks = [];
        this.currentDisplayCount = 0;
        this.hasMore = true;

        const activeElement = document.activeElement as HTMLElement;
        activeElement?.blur();

        try {
            const tracks = await ky
                .get('/api/search', {
                    searchParams: { q: this.query }
                })
                .json<Track[]>();

            this.allFetchedTracks = tracks;
            this.#sliceNextPage();
        } catch (error) {
            console.error('Search API Error:', error);
            this.searchResults = [];
            this.hasMore = false;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * @description
     * 다음 페이지의 검색 결과를 화면에 추가
     *
     * @remarks
     * - 네트워크 요청 없이 메모리에서 slice 처리
     * - hasMore가 false일 경우 동작하지 않음
     */
    loadMore() {
        if (!this.hasMore) return;
        this.triggerHaptic();
        this.#sliceNextPage();
    }

    /**
     * @description
     * 전체 검색 결과 배열에서 다음 페이지 분량을 잘라
     * 화면에 노출할 목록에 병합하는 내부 로직
     */
    #sliceNextPage() {
        const start = this.currentDisplayCount;
        const end = start + this.PAGE_SIZE;

        const nextBatch = this.allFetchedTracks.slice(start, end);
        this.searchResults = [...this.searchResults, ...nextBatch];

        this.currentDisplayCount += nextBatch.length;

        if (this.currentDisplayCount >= this.allFetchedTracks.length) {
            this.hasMore = false;
        }
    }

    /**
     * @description
     * 검색 상태를 초기화하고 초기 화면으로 복귀
     */
    clear() {
        this.triggerHaptic();
        this.query = '';
        this.isResultMode = false;
        this.searchResults = [];
        this.allFetchedTracks = [];
        this.hasMore = true;
    }

    /**
     * @description
     * 검색 input의 키보드 이벤트 처리
     *
     * @remarks
     * - 한글 조합 중 입력은 무시
     * - Enter 키 입력 시 검색 실행
     *
     * @param e 키보드 이벤트 객체
     */
    handleKeydown(e: KeyboardEvent) {
        if (e.isComposing) return;
        if (e.key === 'Enter') {
            this.search();
        }
    }
}