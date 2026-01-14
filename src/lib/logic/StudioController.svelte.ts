import {Spring} from 'svelte/motion';
import {WebGLRenderer} from 'three';

/**
 * @description
 * Studio 화면의 핵심 비즈니스 로직 컨트롤러
 *
 * @remarks
 * - 모바일 브라우저 오디오 정책을 고려하여
 *   재생은 반드시 사용자 제스처에서만 시작됨
 */
export class StudioControllerSvelte {
    isSaving = $state(false);
    isPlaying = $state(false);
    progress = $state(0);
    currentTimeStr = $state('0:00');
    durationStr = $state('0:00');
    dominantColor = $state('50, 50, 50');
    customMessage = $state('');
    bassPower = $state(0);

    #track: any;
    #audio: HTMLAudioElement | null = null;
    #audioContext: AudioContext | null = null;
    #analyser: AnalyserNode | null = null;
    #dataArray: Uint8Array<ArrayBuffer> | null = null;
    #animationFrameId?: number;

    rotationSpeed = new Spring(0, {stiffness: 0.05, damping: 0.2});
    visualizerScale = new Spring(1, {stiffness: 0.2, damping: 0.5});

    constructor(track: any) {
        this.#track = track;
    }

    /**
     * @description
     * 컨트롤러 초기화
     */
    init(): void {
        if (this.#track.cover) {
            this.#extractColor(this.#track.cover);
        }
        this.#setupAudioElement();
    }

    cleanup(): void {
        this.#audio?.pause();
        this.#audioContext?.close();
        if (this.#animationFrameId) cancelAnimationFrame(this.#animationFrameId);
    }

    #setupAudioElement(): void {
        if (!this.#track.audio) return;

        this.#audio = new Audio(this.#track.audio);
        this.#audio.crossOrigin = 'anonymous';
        this.#audio.volume = 0.5;

        this.#audio.addEventListener('timeupdate', () => {
            if (!this.#audio) return;
            this.progress =
                (this.#audio.currentTime / (this.#audio.duration || 30)) * 100;
            this.currentTimeStr = this.#formatTime(this.#audio.currentTime);
            this.durationStr = this.#formatTime(this.#audio.duration || 30);
        });

        this.#audio.addEventListener('ended', () => {
            this.#stopState();
        });
    }

    /**
     * @description
     * 재생 / 일시정지 토글 (모바일 대응 핵심)
     */
    toggleAudio(): void {
        this.triggerHaptic();
        if (!this.#audio) return;

        if (!this.#audioContext) {
            this.#setupAudioContext();
        }

        if (this.#audioContext?.state === 'suspended') {
            this.#audioContext.resume();
        }

        if (this.isPlaying) {
            this.#audio.pause();
            this.#stopState();
        } else {
            this.#audio.currentTime = 0;
            this.#audio.play().then(() => {
                this.isPlaying = true;
                this.rotationSpeed.target = 2;
                this.#analyzeLoop();
            });
        }
    }

    #setupAudioContext(): void {
        const AudioContext =
            window.AudioContext || (window as any).webkitAudioContext;

        this.#audioContext = new AudioContext();
        const source =
            this.#audioContext.createMediaElementSource(this.#audio!);

        this.#analyser = this.#audioContext.createAnalyser();
        this.#analyser.fftSize = 256;
        this.#dataArray = new Uint8Array(this.#analyser.frequencyBinCount);

        source.connect(this.#analyser);
        this.#analyser.connect(this.#audioContext.destination);
    }

    #analyzeLoop = (): void => {
        if (!this.isPlaying || !this.#analyser || !this.#dataArray) return;

        this.#analyser.getByteFrequencyData(this.#dataArray);

        let sum = 0;
        for (let i = 0; i < 10; i++) sum += this.#dataArray[i];

        const normalized = sum / 10 / 255;
        this.bassPower = normalized;
        this.visualizerScale.target = 1 + normalized * 0.15;

        this.#animationFrameId = requestAnimationFrame(this.#analyzeLoop);
    };

    #stopState(): void {
        this.isPlaying = false;
        this.rotationSpeed.target = 0;
        this.visualizerScale.target = 1;
        this.bassPower = 0;
        this.progress = 0;
    }

    triggerHaptic(): void {
        navigator.vibrate?.(10);
    }

    #extractColor(imgUrl: string): void {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imgUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            canvas.width = canvas.height = 1;
            ctx.drawImage(img, 0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            this.dominantColor = `${r}, ${g}, ${b}`;
        };
    }

    #formatTime(sec: number): string {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    createRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
        return new WebGLRenderer({
            canvas,
            preserveDrawingBuffer: true,
            alpha: true,
            antialias: true
        });
    }

    /**
     * @description
     * Web Share API를 사용하여 현재 트랙 정보를 공유합니다.
     *
     * @remarks
     * - Web Share API를 지원하는 브라우저에서는 네이티브 공유 UI 사용
     * - 지원하지 않는 경우 현재 URL을 클립보드에 복사
     *
     * @returns {Promise<void>}
     */
    async handleShare(): Promise<void> {
        this.triggerHaptic();

        const shareData = {
            title: 'CHORUS',
            text: `🎵 ${this.#track.title} - ${this.#track.artist}\n"${
                this.customMessage || '이 노래 같이 들을래?'
            }"`,
            url: window.location.href
        };

        try {
            if (navigator.share && navigator.canShare?.(shareData)) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('링크가 복사되었습니다!');
            }
        } catch (err) {
            console.warn('Share failed:', err);
        }
    }

    /**
     * @description
     * 현재 화면을 이미지로 저장
     *
     * - 데스크톱: 즉시 파일 다운로드
     * - 모바일: 새 탭에서 이미지 열기 (사용자가 직접 저장)
     */
    async downloadImage(elementId: string): Promise<void> {
        if (this.isSaving) return;

        this.triggerHaptic();
        this.isSaving = true;

        try {
            const element = document.getElementById(elementId);
            if (!element) return;

            const { toPng } = await import('html-to-image');

            // 렌더 안정화 (모바일 필수)
            await new Promise(resolve => setTimeout(resolve, 100));

            const dataUrl = await toPng(element, {
                cacheBust: true,
                pixelRatio: window.devicePixelRatio || 2
            });

            const isMobile =
                /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile) {
                /**
                 * 모바일:
                 * - 새 탭에서 이미지 표시
                 * - 사용자가 길게 눌러 저장
                 */
                const win = window.open();
                if (win) {
                    win.document.write(
                        `<img src="${dataUrl}" style="width:100%;height:auto;" />`
                    );
                } else {
                    alert('이미지를 길게 눌러 저장해주세요.');
                }
            } else {
                /**
                 * 데스크톱:
                 * - 즉시 다운로드
                 */
                const link = document.createElement('a');
                link.download = `chorus_${this.#track.title}.png`;
                link.href = dataUrl;
                link.click();
            }
        } catch (err) {
            console.error('Image save failed', err);
            alert('이미지 저장에 실패했습니다.');
        } finally {
            this.isSaving = false;
        }
    }
}

