import ky from 'ky';

/**
 * @description API에서 반환되는 단일 트랙 정보를 정의하는 인터페이스입니다.
 */
export interface Track {
    /** @description 트랙의 고유 식별자 */
    id: number;
    /** @description 노래 제목 */
    title: string;
    /** @description 아티스트 이름 */
    artist: string;
    /** @description 앨범 커버 이미지 URL */
    cover: string;
    /** @description 앨범 명 */
    album: string;
    /** @description 미리보기 오디오 URL (없는 경우도 있음) */
    audio?: string;
}

/**
 * @class SearchController
 * @description 검색 화면의 상태(State)와 비즈니스 로직(Action)을 분리하여 관리하는 클래스입니다.
 * UI 컴포넌트에서 이 클래스의 인스턴스를 생성하여 사용합니다.
 */
export class SearchController {
    // --- State (Runes) ---

    /**
     * @type {string}
     * @description 사용자가 입력한 검색어입니다. `$state` 룬을 사용하여 반응성을 가집니다.
     */
    query: string = $state('');

    /**
     * @type {boolean}
     * @description 네트워크 요청 진행 여부(로딩 상태)를 나타냅니다.
     */
    isLoading: boolean = $state(false);

    /**
     * @type {Track[]}
     * @description API 검색 결과로 반환된 트랙 리스트입니다.
     */
    searchResults: Track[] = $state<Track[]>([]);

    /**
     * @type {boolean}
     * @description 현재 화면 레이아웃 모드입니다.
     * - `false`: 초기 히어로(Hero) 모드 (중앙 정렬)
     * - `true`: 검색 결과 리스트 모드 (상단 정렬)
     */
    isResultMode: boolean = $state(false);

    // --- Actions ---

    /**
     * @method triggerHaptic
     * @description 모바일 기기에서 짧은 햅틱(진동) 피드백을 발생시킵니다.
     * `navigator.vibrate`를 지원하는 환경에서만 작동합니다.
     */
    triggerHaptic() {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    }

    /**
     * @method search
     * @description 사용자가 입력한 `query`를 바탕으로 API 검색을 수행합니다.
     * - 빈 문자열 입력 시 실행되지 않습니다.
     * - 모바일 UX를 위해 실행 시 가상 키보드를 닫습니다.
     * - `ky` 라이브러리를 사용하여 비동기 통신을 처리합니다.
     * @returns {Promise<void>}
     */
    async search(): Promise<void> {
        if (!this.query.trim()) return;

        this.triggerHaptic();
        this.isLoading = true;
        this.isResultMode = true;
        this.searchResults = [];

        // 모바일 UX 개선: 검색 시작 시 포커스를 해제하여 키보드를 내림
        const activeElement = document.activeElement as HTMLElement;
        activeElement?.blur();

        try {
            this.searchResults = await ky.get('/api/search', {
                searchParams: { q: this.query }
            }).json<Track[]>();
        } catch (error) {
            console.error('Search API Error:', error);
            this.searchResults = [];
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * @method clear
     * @description 검색 상태를 모두 초기화하고 초기 히어로 화면으로 돌아갑니다.
     */
    clear() {
        this.triggerHaptic();
        this.query = '';
        this.isResultMode = false;
        this.searchResults = [];
    }

    /**
     * @method handleKeydown
     * @description 검색 입력창의 키보드 이벤트를 처리합니다.
     * - `Enter` 키 입력 시 검색을 수행합니다.
     * - 한글 입력 시 IME 조합(Composition) 문제로 인해 이벤트가 중복 발생하는 것을 방지합니다.
     * @param {KeyboardEvent} e - 키보드 이벤트 객체
     */
    handleKeydown(e: KeyboardEvent) {
        // IME 입력 중(한글 조합 중)일 때는 이벤트를 무시하여 중복 실행 방지
        if (e.isComposing) return;

        if (e.key === 'Enter') {
            this.search();
        }
    }
}