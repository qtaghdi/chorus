import { Spring } from 'svelte/motion';
import { WebGLRenderer } from 'three';

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

    rotationSpeed = new Spring(0, { stiffness: 0.05, damping: 0.2 });
    visualizerScale = new Spring(1, { stiffness: 0.2, damping: 0.5 });

    constructor(track: any) {
        this.#track = track;
    }

    /**
     * @description
     * 컨트롤러 초기화 (❗ 자동 재생 없음)
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
}