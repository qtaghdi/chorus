<script lang="ts">
    import { Canvas } from '@threlte/core';
    import { T } from '@threlte/core';
    import { ContactShadows, Float } from '@threlte/extras';
    import Vinyl from '$lib/scene/Vinyl.svelte';
    import { onMount, onDestroy } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { StudioControllerSvelte } from '$lib/logic/StudioController.svelte';

    /**
     * 컴포넌트 Props
     * @property {Track} track - 선택된 트랙 정보
     * @property {() => void} onback - 뒤로가기 콜백
     */
    let { track, onback } = $props();

    /**
     * 스튜디오 화면 전체 상태와 로직을 관리하는 컨트롤러
     */
    const controller = new StudioControllerSvelte(track);

    /**
     * 템플릿에서 반응형으로 사용하기 위해
     * controller 내부 store를 구조 분해
     */
    const { rotationSpeed, visualizerScale } = controller;

    /**
     * Canvas를 mount 이후에만 렌더링하기 위한 플래그
     */
    let isMounted = $state(false);

    /**
     * 컴포넌트 마운트 시
     * - 오디오 / 비주얼라이저 초기화
     */
    onMount(() => {
        isMounted = true;
        controller.init();
    });

    /**
     * 컴포넌트 언마운트 시
     * - 오디오 및 이벤트 리소스 정리
     */
    onDestroy(() => {
        controller.cleanup();
    });
</script>
<div class="flex flex-col items-center w-full h-dvh pt-6 pb-10 relative z-20" in:fade>

    <div
            class="absolute inset-0 z-0 transition-colors duration-100 ease-linear"
            style="background: radial-gradient(circle at 50% 30%, rgba({controller.dominantColor}, {0.6 + controller.bassPower * 0.2}) 0%, rgba(0,0,0,0) 70%);"
    ></div>

    <div class="w-full max-w-sm flex justify-between items-center px-6 mb-4 z-30">
        <button onclick={() => { controller.triggerHaptic(); onback(); }}
                class="text-white/60 hover:text-white flex items-center gap-2 text-sm font-medium bg-black/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 transition-colors active:scale-95">
            <span class="text-lg">←</span> 목록
        </button>
        <button onclick={() => controller.handleShare()}
                class="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                 stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"/>
            </svg>
        </button>
    </div>

    <div class="flex-1 flex items-center justify-center w-full relative z-30 pb-4">
        <div
                id="capture-area"
                class="relative w-[85vw] max-w-[350px] aspect-9/16 bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/10 flex flex-col"
                in:scale={{ duration: 400, start: 0.95 }}
        >
            {#key track.cover}
                <div class="absolute inset-0 bg-cover bg-center opacity-40 blur-3xl scale-125 saturate-200"
                     style="background-image: url('{track.cover}');"></div>
            {/key}
            <div class="absolute inset-0 opacity-20 pointer-events-none"
                 style="background-image: url('https://grainy-gradients.vercel.app/noise.svg');"></div>
            <div class="absolute inset-0 bg-linear-to-b from-transparent via-black/40 to-black/90"></div>

            <div class="relative w-full aspect-square z-10 mt-8">
                {#if isMounted}
                    <Canvas createRenderer={controller.createRenderer}>
                        <T.AmbientLight intensity={1.5 + controller.bassPower * 2}/>
                        <T.DirectionalLight position={[5, 10, 5]} intensity={2 + controller.bassPower}/>
                        <T.PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50}/>

                        <Float floatIntensity={0.5} rotationIntensity={0.2} speed={$rotationSpeed}>
                            <T.Group scale={$visualizerScale}>
                                {#key track.cover}
                                    <Vinyl albumCover={track.cover}/>
                                {/key}
                            </T.Group>
                        </Float>
                        <ContactShadows opacity={0.5 + controller.bassPower * 0.3} scale={10} blur={2.5} far={10} color="#000000"/>
                    </Canvas>
                {/if}
            </div>

            <div class="flex-1 flex flex-col justify-end z-20 px-6 pb-10 space-y-6">
                <div class="w-full">
                    <input
                            type="text"
                            bind:value={controller.customMessage}
                            placeholder={`${track.artist} - ${track.title}`}
                            class="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-center text-white placeholder-white/50 text-base focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all font-medium backdrop-blur-md"
                            maxlength="40"
                    />
                </div>

                <div class="space-y-4">
                    <div class="flex items-center gap-3">
                        <span class="text-[10px] text-white/60 font-mono w-8 text-right">{controller.currentTimeStr}</span>
                        <div class="flex-1 h-1 bg-white/20 rounded-full overflow-hidden relative">
                            <div class="absolute top-0 left-0 h-full bg-green-400 rounded-full shadow-[0_0_10px_#4ade80]"
                                 style="width: {controller.progress}%"></div>
                        </div>
                        <span class="text-[10px] text-white/60 font-mono w-8 text-left">{controller.durationStr}</span>
                    </div>

                    <div class="flex justify-center">
                        <button onclick={() => controller.toggleAudio()}
                                class="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95 text-white">
                            {#if controller.isPlaying}
                                <div class="scale-110">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                         class="w-6 h-6">
                                        <path fill-rule="evenodd"
                                              d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
                                              clip-rule="evenodd"/>
                                    </svg>
                                </div>
                            {:else}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                     class="w-6 h-6 ml-0.5">
                                    <path fill-rule="evenodd"
                                          d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                                          clip-rule="evenodd"/>
                                </svg>
                            {/if}
                        </button>
                    </div>
                </div>
            </div>

            <div class="absolute top-5 left-1/2 -translate-x-1/2 z-20">
                <div class="flex items-center gap-2 border border-white/20 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md">
                    <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span class="text-[10px] font-bold tracking-widest text-white/90 uppercase">Chorus Rec.</span>
                </div>
            </div>
        </div>
    </div>

    <div class="w-full flex justify-center pb-8 z-30 px-6">
        <button
                onclick={() => controller.downloadImage('capture-area')}
                disabled={controller.isSaving}
                class="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-white/10 text-white/90 font-bold text-base py-3 px-8 rounded-full shadow-lg hover:bg-white/10 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
            {#if controller.isSaving}
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                     viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                저장 중...
            {:else}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                     stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                </svg>
                이미지로 저장하기
            {/if}
        </button>
    </div>
</div>