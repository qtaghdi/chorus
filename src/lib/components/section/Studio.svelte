<script lang="ts">
    import { Canvas } from '@threlte/core';
    import { T } from '@threlte/core';
    import { ContactShadows, Float } from '@threlte/extras';
    import Vinyl from '$lib/scene/Vinyl.svelte';
    import { createEventDispatcher, onMount } from 'svelte'; // onMount 추가
    import { fade, scale } from 'svelte/transition';
    import { WebGLRenderer } from 'three';

    export let track: any;
    const dispatch = createEventDispatcher();

    let isSaving = false;
    let isMounted = false; // 브라우저 로딩 완료 여부

    // ✅ 화면이 브라우저에 뜨면 그때 true로 변경
    onMount(() => {
        isMounted = true;
    });

    /**
     * 렌더러 생성 함수
     * preserveDrawingBuffer: true -> 이미지 저장 시 3D가 안 사라지게 함
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
     * 이미지 다운로드 함수 (동적 import 사용)
     */
    const downloadImage = async () => {
        const element = document.getElementById('capture-area');
        if (!element) return;

        isSaving = true;
        try {
            const { toPng } = await import('html-to-image');

            // 💡 3D 렌더링 타이밍 확보를 위해 약간의 지연 후 캡처
            await new Promise(resolve => setTimeout(resolve, 100));

            const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 3 });
            const link = document.createElement('a');
            link.download = `chorus_${track.title.replace(/\s+/g, '_')}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Download failed', err);
            alert('이미지 저장에 실패했습니다. 다시 시도해주세요.');
        } finally {
            isSaving = false;
        }
    };
</script>

<div class="flex flex-col items-center w-full h-[100dvh] pt-6 pb-10 relative z-20" in:fade>

    <div class="w-full max-w-sm flex justify-start px-6 mb-4 z-30">
        <button
                on:click={() => dispatch('back')}
                class="text-white/60 hover:text-white flex items-center gap-2 text-sm font-medium bg-black/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 transition-colors"
        >
            <span class="text-lg">←</span> 다시 검색하기
        </button>
    </div>

    <div class="flex-1 flex items-center justify-center w-full relative">
        <div
                id="capture-area"
                class="relative w-[85vw] max-w-[350px] aspect-[9/16] bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
                in:scale={{ duration: 400, start: 0.95 }}
        >
            {#key track.cover}
                <div class="absolute inset-0 bg-cover bg-center opacity-40 blur-3xl scale-125 saturate-200" style="background-image: url('{track.cover}');"></div>
            {/key}

            <div class="absolute inset-0 opacity-20 pointer-events-none" style="background-image: url('https://grainy-gradients.vercel.app/noise.svg');"></div>

            <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/90"></div>

            <div class="absolute inset-0 z-10">
                {#if isMounted}
                    <Canvas {createRenderer}>
                        <T.AmbientLight intensity={1.5} />
                        <T.DirectionalLight position={[5, 10, 5]} intensity={2} />
                        <T.PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />

                        <Float floatIntensity={0.5} rotationIntensity={0.2} speed={2}>
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

                <div class="flex items-center gap-3 mt-6 px-2">
                    <span class="text-[10px] text-white/50 font-mono">0:24</span>
                    <div class="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div class="w-1/3 h-full bg-green-400 rounded-full shadow-[0_0_10px_#4ade80]"></div>
                    </div>
                    <span class="text-[10px] text-white/50 font-mono">-2:10</span>
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
                on:click={downloadImage}
                disabled={isSaving}
                class="w-full max-w-[350px] bg-white text-black font-extrabold text-lg py-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
        >
            {isSaving ? '저장 중...' : '이미지로 저장하기'}
        </button>
    </div>
</div>