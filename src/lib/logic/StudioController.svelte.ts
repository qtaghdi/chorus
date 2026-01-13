import { spring } from 'svelte/motion';
import { WebGLRenderer } from 'three';

/**
 * @class StudioControllerSvelte
 * @description 스튜디오(재생 및 캡처) 화면의 핵심 비즈니스 로직을 담당하는 클래스입니다.
 * - 오디오 재생 및 Web Audio API를 통한 시각화(Visualizer) 데이터 처리
 * - 3D 모델(LP판)의 회전 및 스케일 애니메이션 제어
 * - 앨범 커버 색상 추출 및 이미지 캡처 기능
 */
export class StudioControllerSvelte {
    /** @description 이미지 저장(다운로드) 중 로딩 상태 */
    isSaving = $state(false);
    /** @description 오디오 재생 중 여부 */
    isPlaying = $state(false);
    /** @description 오디오 재생 진행률 (0 ~ 100) */
    progress = $state(0);
    /** @description 현재 재생 시간 문자열 (예: "1:23") */
    currentTimeStr = $state("0:00");
    /** @description 총 재생 시간 문자열 (예: "3:45") */
    durationStr = $state("0:30");
    /** @description 앨범 커버에서 추출한 주요 색상 (RGB 문자열, 예: "50, 50, 50") */
    dominantColor = $state("50, 50, 50");
    /** @description 사용자가 입력한 커스텀 메시지 */
    customMessage = $state("");
    /** @description 오디오 저음역대(Bass) 파워 수치 (0.0 ~ 1.0, Visualizer용) */
    bassPower = $state(0);

    #track: any;
    #audio: HTMLAudioElement | null = null;
    #audioContext: AudioContext | null = null;
    #analyser: AnalyserNode | null = null;
    #dataArray: Uint8Array | null = null;
    #animationFrameId: number | undefined;

    /** @description LP판 회전 속도를 제어하는 스프링 모션
     * - `stiffness`, `damping`을 통해 부드러운 가감속 효과 구현
     */
    rotationSpeed = spring(0, { stiffness: 0.05, damping: 0.2 });

    /** * @description 비트(Bass)에 반응하는 3D 오브젝트 스케일 모션
     */
    visualizerScale = spring(1, { stiffness: 0.2, damping: 0.5 });

    /**
     * @constructor
     * @param {any} track - 재생할 트랙 정보 객체
     */
    constructor(track: any) {
        this.#track = track;
    }

    /**
     * @method init
     * @description 컨트롤러 초기화 메서드입니다. 컴포넌트 마운트(`onMount`) 시 호출해야 합니다.
     * - 앨범 커버 색상 추출
     * - 오디오 엘리먼트 설정
     */
    init() {
        if (this.#track.cover) {
            this.#extractColor(this.#track.cover);
        }
        this.#setupAudioElement();
    }

    /**
     * @method cleanup
     * @description 리소스 정리 메서드입니다. 컴포넌트 언마운트(`onDestroy`) 시 호출해야 합니다.
     * - 오디오 정지, AudioContext 해제, 애니메이션 루프 취소
     */
    cleanup() {
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
     * @method #extractColor
     * @description 이미지 URL에서 주요 색상을 추출하여 `dominantColor` 상태를 업데이트합니다.
     * Canvas에 이미지를 1x1 픽셀로 그린 후 픽셀 데이터를 가져오는 방식을 사용합니다.
     * @param {string} imgUrl - 분석할 이미지 URL
     */
    #extractColor(imgUrl: string) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imgUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            canvas.width = 1; canvas.height = 1;
            ctx.drawImage(img, 0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            this.dominantColor = `${r}, ${g}, ${b}`;
        };
    }

    /**
     * @private
     * @method #formatTime
     * @description 초(seconds) 단위의 시간을 "분:초" 형식의 문자열로 변환합니다.
     * @param {number} seconds
     * @returns {string} (예: "1:05")
     */
    #formatTime(seconds: number): string {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * @private
     * @method #setupAudioElement
     * @description HTMLAudioElement를 생성하고 `timeupdate`, `ended` 이벤트를 바인딩합니다.
     * 초기 실행 시 자동 재생을 시도합니다.
     */
    #setupAudioElement() {
        if (!this.#track.audio) return;

        this.#audio = new Audio();
        this.#audio.crossOrigin = "anonymous";
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

        // 자동 재생 시도
        this.#audio.play().then(() => {
            this.isPlaying = true;
            this.rotationSpeed.set(2);
            this.#setupAudioContext();
            this.#analyzeLoop();
        }).catch(() => {
            this.isPlaying = false;
        });
    }

    /**
     * @private
     * @method #setupAudioContext
     * @description Web Audio API를 사용하여 오디오 시각화(Visualizer)를 위한 컨텍스트와 AnalyserNode를 설정합니다.
     * 브라우저 보안 정책상 사용자 인터랙션 이후에 활성화될 수 있습니다.
     */
    #setupAudioContext() {
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
            console.warn("Visualizer Error:", e);
        }
    }

    /**
     * @private
     * @method #analyzeLoop
     * @description `requestAnimationFrame`을 사용하여 오디오 주파수 데이터를 실시간으로 분석합니다.
     * 저음역대(Bass) 데이터를 추출하여 `bassPower` 및 `visualizerScale` 상태를 업데이트합니다.
     */
    #analyzeLoop = () => {
        if (!this.isPlaying || !this.#analyser || !this.#dataArray) return;
        this.#analyser.getByteFrequencyData(this.#dataArray);

        let sum = 0;
        const bassRange = 10; // 저음역대 범위 설정
        for (let i = 0; i < bassRange; i++) sum += this.#dataArray[i];

        const normalized = (sum / bassRange) / 255; // 0.0 ~ 1.0 정규화
        this.bassPower = normalized;
        this.visualizerScale.set(1 + normalized * 0.15); // 비트에 따른 스케일 펌핑

        this.#animationFrameId = requestAnimationFrame(this.#analyzeLoop);
    };

    /**
     * @private
     * @method #stopState
     * @description 오디오 정지 시 관련된 모든 상태(애니메이션, 진행률 등)를 리셋합니다.
     */
    #stopState() {
        this.isPlaying = false;
        this.rotationSpeed.set(0);
        this.visualizerScale.set(1);
        this.bassPower = 0;
        this.progress = 0;
        if (this.#audio) this.#audio.currentTime = 0;
        if (this.#animationFrameId) cancelAnimationFrame(this.#animationFrameId);
    }

    /**
     * @method toggleAudio
     * @description 오디오 재생/일시정지를 토글합니다.
     * AudioContext가 suspended 상태라면 resume을 시도합니다.
     */
    toggleAudio() {
        this.triggerHaptic();
        if (!this.#audio) return;
        if (!this.#audioContext) this.#setupAudioContext();
        if (this.#audioContext?.state === 'suspended') this.#audioContext.resume();

        if (this.isPlaying) {
            this.#audio.pause();
            this.#stopState(); // 완전 정지 로직 (일시정지 후 유지하려면 이 부분 수정 필요)
        } else {
            this.#audio.play();
            this.rotationSpeed.set(2);
            this.#analyzeLoop();
        }
        this.isPlaying = !this.isPlaying;
    }

    /**
     * @method triggerHaptic
     * @description 햅틱 피드백을 발생시킵니다.
     */
    triggerHaptic() {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    }

    /**
     * @method handleShare
     * @description Web Share API를 사용하여 현재 페이지 URL과 메시지를 공유합니다.
     * API를 지원하지 않는 경우 클립보드에 링크를 복사합니다.
     */
    async handleShare() {
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
     * @method downloadImage
     * @description 지정된 HTML 요소를 이미지(PNG)로 변환하여 다운로드합니다.
     * `html-to-image` 라이브러리를 동적 import하여 사용합니다.
     * @param {string} elementId - 캡처할 DOM 요소의 ID
     */
    async downloadImage(elementId: string) {
        this.triggerHaptic();
        const element = document.getElementById(elementId);
        if (!element) return;
        this.isSaving = true;

        try {
            const { toPng } = await import('html-to-image');
            // DOM 렌더링 확보를 위한 지연
            await new Promise(resolve => setTimeout(resolve, 100));

            const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `chorus_${this.#track.title}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            alert('저장 실패');
        } finally {
            this.isSaving = false;
        }
    }

    /**
     * @method createRenderer
     * @description Threlte/Three.js `<Canvas>` 컴포넌트에 전달할 커스텀 WebGLRenderer를 생성합니다.
     * 이미지 캡처를 위해 `preserveDrawingBuffer: true` 옵션이 설정되어 있습니다.
     * @param {HTMLCanvasElement} canvas
     * @returns {WebGLRenderer}
     */
    createRenderer(canvas: HTMLCanvasElement) {
        return new WebGLRenderer({
            canvas,
            preserveDrawingBuffer: true, // 이미지 캡처(toDataURL)를 위해 필수
            alpha: true,
            antialias: true
        });
    }
}