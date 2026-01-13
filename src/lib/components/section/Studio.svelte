<script lang="ts">
    import { Canvas } from '@threlte/core';
    import { T } from '@threlte/core';
    import { ContactShadows, Float } from '@threlte/extras';
    import Vinyl from '$lib/scene/Vinyl.svelte';
    import { onMount, onDestroy } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { WebGLRenderer } from 'three';

    /**
     * Component Props Interface
     * @property {any} track - The selected track data (title, artist, cover, audio).
     * @property {() => void} onback - Callback function to return to search.
     */
    let { track, onback } = $props();

    let isSaving: boolean = $state(false);
    let isMounted: boolean = $state(false);

    // Audio related state
    let audio: HTMLAudioElement | null = null;
    let isPlaying: boolean = $state(false);
    let progress: number = $state(0);
    let currentTimeStr: string = $state("0:00");
    let durationStr: string = $state("0:30");

    /**
     * Formats seconds into MM:SS string.
     * @param {number} seconds - The time in seconds.
     * @returns {string} Formatted time string.
     */
    const formatTime = (seconds: number): string => {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    /**
     * Lifecycle hook: Runs when the component mounts.
     * Initializes Audio logic and sets up event listeners.
     */
    onMount(() => {
        isMounted = true;

        if (track.audio) {
            audio = new Audio(track.audio);
            audio.volume = 0.5;

            // Update progress bar and time text
            audio.addEventListener('timeupdate', () => {
                if (!audio) return;
                const current = audio.currentTime;
                const duration = audio.duration || 30;

                progress = (current / duration) * 100;
                currentTimeStr = formatTime(current);
                durationStr = formatTime(duration);
            });

            // Reset when audio ends
            audio.addEventListener('ended', () => {
                isPlaying = false;
                progress = 0;
                currentTimeStr = "0:00";
                if (audio) audio.currentTime = 0;
            });

            // Try autoplay
            audio.play().then(() => {
                isPlaying = true;
            }).catch(e => {
                console.warn('Autoplay blocked', e);
                isPlaying = false;
            });
        }
    });

    /**
     * Lifecycle hook: Runs when the component is destroyed.
     * Stops audio to prevent memory leaks.
     */
    onDestroy(() => {
        if (audio) {
            audio.pause();
            audio = null;
        }
    });

    /**
     * Toggles play/pause state.
     */
    const toggleAudio = () => {
        if (!audio) return;
        if (isPlaying) audio.pause();
        else audio.play();
        isPlaying = !isPlaying;
    };

    /**
     * Creates WebGLRenderer with preserveDrawingBuffer enabled for image capture.
     * @param {HTMLCanvasElement} canvas
     */
    const createRenderer = (canvas: HTMLCanvasElement) => {
        return new WebGLRenderer({
            canvas,
            preserveDrawingBuffer: true,
            alpha: true,
            antialias: true
        });
    };

    /**
     * Captures the DOM element and downloads it as an image.
     */
    const downloadImage = async () => {
        const element = document.getElementById('capture-area');
        if (!element) return;

        isSaving = true;
        try {
            const { toPng } = await import('html-to-image');
            // Slight delay to ensure rendering is complete
            await new Promise(resolve => setTimeout(resolve, 100));

            const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 3 });
            const link = document.createElement('a');
            link.download = `chorus_${track.title.replace(/\s+/g, '_')}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Download failed', err);
            alert('이미지 저장에 실패했습니다.');
        } finally {
            isSaving = false;
        }
    };
</script>

<div class="flex flex-col items-center w-full h-dvh pt-6 pb-10 relative z-20" in:fade>

    <div class="w-full max-w-sm flex justify-start px-6 mb-4 z-30">
        <button
                onclick={onback}
                class="text-white/60 hover:text-white flex items-center gap-2 text-sm font-medium bg-black/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 transition-colors"
        >
            <span class="text-lg">←</span> 다시 검색하기
        </button>
    </div>

    <div class="flex-1 flex items-center justify-center w-full relative">
        <div
                id="capture-area"
                class="relative w-[85vw] max-w-[350px] aspect-9/16 bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
                in:scale={{ duration: 400, start: 0.95 }}
        >
            {#key track.cover}
                <div class="absolute inset-0 bg-cover bg-center opacity-40 blur-3xl scale-125 saturate-200" style="background-image: url('{track.cover}');"></div>
            {/key}

            <div class="absolute inset-0 opacity-20 pointer-events-none" style="background-image: url('https://grainy-gradients.vercel.app/noise.svg');"></div>

            <div class="absolute inset-0 bg-linear-to-b from-transparent via-black/40 to-black/90"></div>

            <div class="absolute inset-0 z-10">
                {#if isMounted}
                    <Canvas {createRenderer}>
                        <T.AmbientLight intensity={1.5} />
                        <T.DirectionalLight position={[5, 10, 5]} intensity={2} />
                        <T.PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />

                        <Float floatIntensity={0.5} rotationIntensity={0.2} speed={isPlaying ? 2 : 0}>
                            {#key track.cover}
                                <Vinyl albumCover={track.cover} />
                            {/key}
                        </Float>
                        <ContactShadows opacity={0.5} scale={10} blur={2.5} far={10} color="#000000" />
                    </Canvas>
                {/if}
            </div>

            <div class="absolute bottom-10 left-0 right-0 text-center z-20 px-6">
                <h1 class="text-3xl font-black text-white mb-2 leading-tight drop-shadow-xl line-clamp-2">
                    {track.title}
                </h1>
                <p class="text-lg text-white/70 font-medium tracking-[0.2em] uppercase truncate">
                    {track.artist}
                </p>

                <div class="flex items-center gap-3 mt-8 px-2">
                    <span class="text-[10px] text-white/60 font-mono w-8 text-right">{currentTimeStr}</span>
                    <div class="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden relative">
                        <div
                                class="absolute top-0 left-0 h-full bg-green-400 rounded-full shadow-[0_0_10px_#4ade80] transition-all duration-100 ease-linear"
                                style="width: {progress}%"
                        ></div>
                    </div>
                    <span class="text-[10px] text-white/60 font-mono w-8 text-left">{durationStr}</span>
                </div>

                <div class="mt-4 flex justify-center">
                    <button
                            onclick={toggleAudio}
                            class="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95 text-white"
                    >
                        {#if isPlaying}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                                <path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clip-rule="evenodd" />
                            </svg>
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 ml-0.5">
                                <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
                            </svg>
                        {/if}
                    </button>
                </div>
            </div>

            <div class="absolute top-6 left-1/2 -translate-x-1/2 z-20">
                <div class="flex items-center gap-2 border border-white/20 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md">
                    <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span class="text-[10px] font-bold tracking-widest text-white/90 uppercase">Chorus Rec.</span>
                </div>
            </div>
        </div>
    </div>

    <div class="w-full flex flex-col items-center pb-8 z-30 px-6">
        <button
                onclick={downloadImage}
                disabled={isSaving}
                class="w-full max-w-[350px] bg-white text-black font-extrabold text-lg py-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
        >
            {isSaving ? '저장 중...' : '이미지로 저장하기'}
        </button>
    </div>
</div>