<script lang="ts">
    import { Canvas } from '@threlte/core';
    import { T } from '@threlte/core';
    import { ContactShadows, Float } from '@threlte/extras';
    import Vinyl from '$lib/scene/Vinyl.svelte';
    import { onMount, onDestroy } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { WebGLRenderer } from 'three';
    import { spring } from 'svelte/motion';

    /**
     * Component Properties
     */
    let { track, onback } = $props();

    let isSaving = $state(false);
    let isMounted = $state(false);

    // Audio related state
    let audio: HTMLAudioElement | null = null;
    let isPlaying = $state(false);
    let progress = $state(0);
    let currentTimeStr = $state("0:00");
    let durationStr = $state("0:30");
    let dominantColor = $state("50, 50, 50");

    // 🎵 Audio Visualizer State
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;
    let animationFrameId: number;

    // 🎛️ Bass Power (0.0 ~ 1.0) - 음악의 비트 강도
    let bassPower = $state(0);

    // 부드러운 움직임을 위한 Spring Motion
    const rotationSpeed = spring(0, { stiffness: 0.05, damping: 0.2 });
    const visualizerScale = spring(1, { stiffness: 0.2, damping: 0.5 });

    const triggerHaptic = () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    };

    /**
     * Web Audio API 설정 (비주얼라이저 핵심)
     * 브라우저 보안 정책상 사용자가 처음 클릭(Play)할 때 실행해야 함.
     */
    const setupAudioContext = () => {
        if (!audio || audioContext) return;

        try {
            // 1. 오디오 컨텍스트 생성
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioContext = new AudioContext();

            // 2. 오디오 소스 연결
            const source = audioContext.createMediaElementSource(audio);
            analyser = audioContext.createAnalyser();

            // 3. 분석기 설정 (FFT 사이즈: 정밀도)
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);

            // 4. 스피커로 출력 연결
            source.connect(analyser);
            analyser.connect(audioContext.destination);
        } catch (e) {
            console.warn("CORS or Audio Context Error: Visualizer disabled", e);
        }
    };

    /**
     * 실시간으로 주파수를 분석하여 bassPower를 업데이트하는 루프
     */
    const analyzeLoop = () => {
        if (!isPlaying || !analyser || !dataArray) return;

        // 현재 주파수 데이터 가져오기
        analyser.getByteFrequencyData(dataArray);

        // 저음역대 (배열의 앞부분) 평균 계산
        // 0~20번 인덱스 정도가 킥드럼/베이스 소리
        let sum = 0;
        const bassRange = 10;
        for (let i = 0; i < bassRange; i++) {
            sum += dataArray[i];
        }

        // 0 ~ 1 사이 값으로 정규화 (255는 최대 볼륨)
        const average = sum / bassRange;
        const normalized = average / 255;

        // 상태 업데이트 -> 3D 씬에 반영됨
        bassPower = normalized;

        // 스프링 애니메이션 업데이트 (비트에 맞춰 쿵쿵)
        visualizerScale.set(1 + normalized * 0.15); // 크기는 최대 1.15배까지

        animationFrameId = requestAnimationFrame(analyzeLoop);
    };

    const handleShare = async () => {
        triggerHaptic();
        const shareData = {
            title: 'CHORUS',
            text: `🎵 ${track.title} - ${track.artist}\n이 노래 어때요? 바이닐 카드로 확인해보세요.`,
            url: window.location.href
        };
        try {
            if (navigator.share && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('링크가 클립보드에 복사되었습니다! 🔗');
            }
        } catch (err) {
            console.log('Share canceled', err);
        }
    };

    const extractColor = (imgUrl: string) => {
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
            dominantColor = `${r}, ${g}, ${b}`;
        };
    };

    const formatTime = (seconds: number): string => {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    onMount(() => {
        isMounted = true;
        if (track.cover) extractColor(track.cover);

        if (track.audio) {
            audio = new Audio();
            audio.crossOrigin = "anonymous"; // ✅ 중요: 비주얼라이저를 위해 CORS 허용
            audio.src = track.audio;
            audio.volume = 0.5;

            audio.addEventListener('timeupdate', () => {
                if (!audio) return;
                const current = audio.currentTime;
                const duration = audio.duration || 30;
                progress = (current / duration) * 100;
                currentTimeStr = formatTime(current);
                durationStr = formatTime(duration);
            });

            audio.addEventListener('ended', () => {
                isPlaying = false;
                rotationSpeed.set(0);
                visualizerScale.set(1);
                bassPower = 0;
                progress = 0;
                currentTimeStr = "0:00";
                if (audio) audio.currentTime = 0;
                cancelAnimationFrame(animationFrameId);
            });

            // 자동 재생 시도
            audio.play().then(() => {
                isPlaying = true;
                rotationSpeed.set(2);
                setupAudioContext(); // 자동 재생 성공 시 컨텍스트 설정
                analyzeLoop();
            }).catch(e => {
                console.warn('Autoplay blocked', e);
                isPlaying = false;
            });
        }
    });

    onDestroy(() => {
        if (audio) {
            audio.pause();
            audio = null;
        }
        if (audioContext) {
            audioContext.close();
        }
        cancelAnimationFrame(animationFrameId);
    });

    const toggleAudio = () => {
        triggerHaptic();
        if (!audio) return;

        // 첫 클릭 시 오디오 컨텍스트가 없거나 멈춰있으면 시작
        if (!audioContext) setupAudioContext();
        if (audioContext?.state === 'suspended') audioContext.resume();

        if (isPlaying) {
            audio.pause();
            rotationSpeed.set(0);
            visualizerScale.set(1); // 멈추면 크기 원상복구
            bassPower = 0;
            cancelAnimationFrame(animationFrameId);
        } else {
            audio.play();
            rotationSpeed.set(2);
            analyzeLoop(); // 분석 루프 시작
        }
        isPlaying = !isPlaying;
    };

    const createRenderer = (canvas: HTMLCanvasElement) => {
        return new WebGLRenderer({
            canvas,
            preserveDrawingBuffer: true,
            alpha: true,
            antialias: true
        });
    };

    const downloadImage = async () => {
        triggerHaptic();
        const element = document.getElementById('capture-area');
        if (!element) return;
        isSaving = true;
        try {
            const { toPng } = await import('html-to-image');
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

    <div
            class="absolute inset-0 z-0 transition-colors duration-100 ease-linear"
            style="
                background: radial-gradient(circle at 50% 30%, rgba({dominantColor}, {0.6 + bassPower * 0.2}) 0%, rgba(0,0,0,0) 70%);
            "
    ></div>

    <div class="w-full max-w-sm flex justify-between items-center px-6 mb-4 z-30">
        <button
                onclick={() => { triggerHaptic(); onback(); }}
                class="text-white/60 hover:text-white flex items-center gap-2 text-sm font-medium bg-black/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 transition-colors active:scale-95"
        >
            <span class="text-lg">←</span> 목록
        </button>

        <button
                onclick={handleShare}
                class="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                aria-label="Share Link"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
        </button>
    </div>

    <div class="flex-1 flex items-center justify-center w-full relative z-30">
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
                        <T.AmbientLight intensity={1.5 + bassPower * 2} />
                        <T.DirectionalLight position={[5, 10, 5]} intensity={2 + bassPower} />

                        <T.PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />

                        <Float floatIntensity={0.5} rotationIntensity={0.2} speed={$rotationSpeed}>
                            <T.Group scale={$visualizerScale}>
                                {#key track.cover}
                                    <Vinyl albumCover={track.cover} />
                                {/key}
                            </T.Group>
                        </Float>

                        <ContactShadows opacity={0.5 + bassPower * 0.3} scale={10} blur={2.5} far={10} color="#000000" />
                    </Canvas>
                {/if}
            </div>

            <div class="absolute bottom-10 left-0 right-0 text-center z-20 px-6">
                <h1 class="text-3xl font-black text-white mb-2 leading-tight drop-shadow-xl line-clamp-2">{track.title}</h1>
                <p class="text-lg text-white/70 font-medium tracking-[0.2em] uppercase truncate">{track.artist}</p>

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
                            <div class="scale-110">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clip-rule="evenodd" /></svg>
                            </div>
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 ml-0.5"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" /></svg>
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