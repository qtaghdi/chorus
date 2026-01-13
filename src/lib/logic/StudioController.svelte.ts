import { Spring } from 'svelte/motion';
import { WebGLRenderer } from 'three';

/**
 * @class StudioControllerSvelte
 * @description
 * Studio(재생 및 캡처) 화면의 핵심 비즈니스 로직을 담당하는 컨트롤러 클래스
 *
 * @remarks
 * - Web Audio API 기반 오디오 재생 및 주파수 분석
 * - Threlte/Three.js 기반 3D 비주얼라이저 제어
 * - 이미지 캡처 및 Web Share API 연동
 */
export class StudioControllerSvelte {
    /** @description 이미지 저장(다운로드) 진행 여부 */
    isSaving = $state(false);

    /** @description 오디오 재생 중 여부 */
    isPlaying = $state(false);

    /** @description 오디오 재생 진행률 (0 ~ 100) */
    progress = $state(0);

    /** @description 현재 재생 시간 문자열 (예: "1:23") */
    currentTimeStr = $state('0:00');

    /** @description 전체 재생 시간 문자열 (예: "3:45") */
    durationStr = $state('0:30');

    /** @description 앨범 커버에서 추출한 주요 색상 (RGB 문자열) */
    dominantColor = $state('50, 50, 50');

    /** @description 사용자가 입력한 커스텀 메시지 */
    customMessage = $state('');

    /** @description 저음역대(Bass) 파워 (0.0 ~ 1.0) */
    bassPower = $state(0);

    #track: any;
    #audio: HTMLAudioElement | null = null;
    #audioContext: AudioContext | null = null;
    #analyser: AnalyserNode | null = null;
    #dataArray: Uint8Array | null = null;
    #animationFrameId?: number;

    /**
     * @description
     * LP 회전 속도를 제어하는 스프링 모션 값
     *
     * @remarks
     * - 오디오 재생 상태에 따라 자연스러운 가속/감속 표현
     */
    rotationSpeed = new Spring(0, { stiffness: 0.05, damping: 0.2 });

    /**
     * @description
     * 오디오 비트에 반응하는 3D 오브젝트 스케일 모션
     */
    visualizerScale = new Spring(1, { stiffness: 0.2, damping: 0.5 });

    /**
     * @param track 재생할 트랙 정보 객체
     */
    constructor(track: any) {
        this.#track = track;
    }

    /**
     * @description
     * 컨트롤러 초기화 메서드
     *
     * @remarks
     * - 앨범 커버 색상 추출
     * - 오디오 엘리먼트 생성 및 자동 재생 시도
     */
    init(): void {
        if (this.#track.cover) {
            this.#extractColor(this.#track.cover);
        }
        this.#setupAudioElement();
    }

    /**
     * @description
     * 컨트롤러가 사용한 모든 리소스를 정리
     *
     * @remarks
     * - 컴포넌트 언마운트 시 반드시 호출되어야 함
     */
    cleanup(): void {
        if (this.#audio) {
            this.#audio.pause();
            this.#audio = null;
        }
        if (this.#audioContext) {
            this.#audioContext.close();
        }
        if (this.#animationFrameId) {
            cancelAnimationFrame(this.#animationFrameId);
        }
    }

    /**
     * @private
     * @description
     * 이미지 URL에서 주요 색상을 추출하여 `dominantColor`를 업데이트
     *
     * @param imgUrl 분석할 이미지 URL
     */
    #extractColor(imgUrl: string): void {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imgUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = 1;
            canvas.height = 1;
            ctx.drawImage(img, 0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            this.dominantColor = `${r}, ${g}, ${b}`;
        };
    }

    /**
     * @private
     * @description 초 단위 시간을 "분:초" 형식 문자열로 변환
     */
    #formatTime(seconds: number): string {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * @private
     * @description
     * HTMLAudioElement를 생성하고 재생 이벤트를 바인딩
     *
     * @remarks
     * - 최초 호출 시 자동 재생을 시도
     * - 성공 시 Visualizer 분석 루프 시작
     */
    #setupAudioElement(): void {
        if (!this.#track.audio) return;

        this.#audio = new Audio();
        this.#audio.crossOrigin = 'anonymous';
        this.#audio.src = this.#track.audio;
        this.#audio.volume = 0.5;

        this.#audio.addEventListener('timeupdate', () => {
            if (!this.#audio) return;
            this.progress = (this.#audio.currentTime / (this.#audio.duration || 30)) * 100;
            this.currentTimeStr = this.#formatTime(this.#audio.currentTime);
            this.durationStr = this.#formatTime(this.#audio.duration || 30);
        });

        this.#audio.addEventListener('ended', () => {
            this.#stopState();
        });

        this.#audio.play().then(() => {
            this.isPlaying = true;
            this.rotationSpeed.target = 2;
            this.#setupAudioContext();
            this.#analyzeLoop();
        }).catch(() => {
            this.isPlaying = false;
        });
    }

    /**
     * @private
     * @description
     * Web Audio API 컨텍스트 및 AnalyserNode 설정
     */
    #setupAudioContext(): void {
        if (!this.#audio || this.#audioContext) return;

        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            this.#audioContext = new AudioContext();
            const source = this.#audioContext.createMediaElementSource(this.#audio);
            this.#analyser = this.#audioContext.createAnalyser();
            this.#analyser.fftSize = 256;
            this.#dataArray = new Uint8Array(this.#analyser.frequencyBinCount);
            source.connect(this.#analyser);
            this.#analyser.connect(this.#audioContext.destination);
        } catch (e) {
            console.warn('Visualizer Error:', e);
        }
    }

    /**
     * @private
     * @description
     * 오디오 주파수 데이터를 실시간 분석하는 루프
     *
     * @remarks
     * - 저음역대 에너지를 기반으로 시각 효과 업데이트
     */
    #analyzeLoop = (): void => {
        if (!this.isPlaying || !this.#analyser || !this.#dataArray) return;

        this.#analyser.getByteFrequencyData(this.#dataArray);

        let sum = 0;
        const bassRange = 10;
        for (let i = 0; i < bassRange; i++) sum += this.#dataArray[i];

        const normalized = (sum / bassRange) / 255;
        this.bassPower = normalized;
        this.visualizerScale.target = 1 + normalized * 0.15;

        this.#animationFrameId = requestAnimationFrame(this.#analyzeLoop);
    };

    /**
     * @private
     * @description
     * 오디오 정지 시 모든 관련 상태를 초기화
     */
    #stopState(): void {
        this.isPlaying = false;
        this.rotationSpeed.target = 0;
        this.visualizerScale.target = 1;
        this.bassPower = 0;
        this.progress = 0;
        if (this.#audio) this.#audio.currentTime = 0;
        if (this.#animationFrameId) cancelAnimationFrame(this.#animationFrameId);
    }

    /**
     * @description
     * 오디오 재생 / 일시정지 토글
     */
    toggleAudio(): void {
        this.triggerHaptic();
        if (!this.#audio) return;

        if (!this.#audioContext) this.#setupAudioContext();
        if (this.#audioContext?.state === 'suspended') this.#audioContext.resume();

        if (this.isPlaying) {
            this.#audio.pause();
            this.#stopState();
        } else {
            this.#audio.play();
            this.rotationSpeed.target = 2;
            this.#analyzeLoop();
        }
        this.isPlaying = !this.isPlaying;
    }

    /**
     * @description 햅틱 피드백 실행
     */
    triggerHaptic(): void {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    }

    /**
     * @description
     * Web Share API를 통해 트랙 정보를 공유
     *
     * @returns {Promise<void>}
     */
    async handleShare(): Promise<void> {
        this.triggerHaptic();

        const shareData = {
            title: 'CHORUS',
            text: `🎵 ${this.#track.title} - ${this.#track.artist}\n"${this.customMessage || '이 노래 같이 들을래?'}"`,
            url: window.location.href
        };

        try {
            if (navigator.share && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('링크가 복사되었습니다!');
            }
        } catch (err) {
            console.log('Share error', err);
        }
    }

    /**
     * @description
     * 지정된 DOM 요소를 PNG 이미지로 캡처하여 다운로드
     *
     * @param elementId 캡처할 요소의 ID
     * @returns {Promise<void>}
     */
    async downloadImage(elementId: string): Promise<void> {
        this.triggerHaptic();

        const element = document.getElementById(elementId);
        if (!element) return;

        this.isSaving = true;

        try {
            const { toPng } = await import('html-to-image');
            await new Promise(resolve => setTimeout(resolve, 100));

            const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `chorus_${this.#track.title}.png`;
            link.href = dataUrl;
            link.click();
        } catch {
            alert('저장 실패');
        } finally {
            this.isSaving = false;
        }
    }

    /**
     * @description
     * Threlte `<Canvas>`에 전달할 WebGLRenderer 생성
     *
     * @param canvas Canvas 엘리먼트
     * @returns WebGLRenderer
     */
    createRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
        return new WebGLRenderer({
            canvas,
            preserveDrawingBuffer: true,
            alpha: true,
            antialias: true
        });
    }
}