<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { SearchController, type Track } from '$lib/logic/SearchController.svelte';

    /**
     * 컴포넌트 Props
     * @property {(track: Track) => void} onselect - 트랙 선택 시 부모로 전달되는 콜백
     */
    let { onselect } = $props();

    /**
     * 검색 화면의 상태 및 로직을 담당하는 컨트롤러
     */
    const controller = new SearchController();

    /**
     * 트랙 선택 핸들러
     * - 햅틱 피드백 실행
     * - 부모 컴포넌트로 선택된 트랙 전달
     *
     * @param {Track} track - 선택된 트랙
     */
    const handleTrackSelect = (track: Track) => {
        controller.triggerHaptic();
        if (onselect) onselect(track);
    };
</script>

<div
        class="flex flex-col items-center w-full min-h-dvh max-w-lg mx-auto px-6 relative z-50 transition-all duration-700 ease-in-out"
        class:justify-center={!controller.isResultMode}
        class:justify-start={controller.isResultMode}
        class:pt-20={controller.isResultMode}
>

    {#if !controller.isResultMode}
        <div class="text-center mb-10" out:fly={{ y: -20, duration: 300 }}>
            <h1 class="text-6xl font-extrabold tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-2">
                CHORUS
            </h1>
            <p class="text-white/50 text-lg font-light tracking-widest uppercase">나만의 음악 취향 기록</p>
        </div>
    {/if}

    <div class="w-full relative group z-20 transition-all duration-500" class:mb-6={controller.isResultMode}>
        <div class="absolute -inset-0.5 bg-linear-to-r from-green-400 to-purple-500 rounded-full blur opacity-30 group-focus-within:opacity-100 transition duration-700"></div>

        <div class="relative flex items-center bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-2xl">
            {#if controller.isResultMode}
                <button
                        onclick={() => controller.clear()}
                        class="pl-4 pr-2 text-white/50 hover:text-white transition-colors"
                        in:fade
                >
                    ←
                </button>
            {/if}

            <input
                    type="text"
                    bind:value={controller.query}
                    placeholder="노래 제목이나 가수를 입력하세요"
                    class="flex-1 bg-transparent text-white px-4 py-4 text-lg font-medium focus:outline-none placeholder:text-white/30"
                    onkeydown={(e) => controller.handleKeydown(e)}
            />

            <button
                    onclick={() => controller.search()}
                    disabled={controller.isLoading}
                    class="mr-2 px-6 py-2 rounded-full bg-white text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
            >
                검색
            </button>
        </div>
    </div>

    {#if controller.isResultMode}
        <div class="w-full flex-1 min-h-0 overflow-y-auto scrollbar-hide pb-20 mask-image-gradient"
             in:fly={{ y: 20, duration: 500, delay: 200 }}>

            {#if controller.isLoading}
                <div class="space-y-3">
                    {#each Array(6) as _}
                        <div class="w-full flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md animate-pulse">
                            <div class="w-14 h-14 rounded-lg bg-white/10"></div>
                            <div class="flex-1 space-y-2">
                                <div class="h-4 bg-white/10 rounded w-3/4"></div>
                                <div class="h-3 bg-white/5 rounded w-1/2"></div>
                            </div>
                        </div>
                    {/each}
                </div>

            {:else}
                {#if controller.searchResults.length === 0}
                    <div class="text-center text-white/40 py-20 font-light flex flex-col items-center">
                        <span class="text-4xl mb-4">🤔</span>
                        <p>검색 결과가 없습니다.</p>
                    </div>
                {:else}
                    <div class="space-y-3">
                        {#each controller.searchResults as track}
                            <button
                                    class="w-full flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-[0.98] transition-all group backdrop-blur-md"
                                    onclick={() => handleTrackSelect(track)}
                            >
                                <img src={track.cover} alt="album art"
                                     class="w-14 h-14 rounded-lg shadow-lg object-cover bg-neutral-800"/>

                                <div class="flex-1 min-w-0 text-left">
                                    <h3 class="text-white font-bold text-lg leading-tight truncate group-hover:text-green-300 transition-colors">{track.title}</h3>
                                    <p class="text-white/50 text-sm truncate">{track.artist}</p>
                                </div>
                            </button>
                        {/each}
                    </div>
                {/if}
            {/if}
        </div>
    {/if}
</div>

<style>
    .mask-image-gradient {
        mask-image: linear-gradient(to bottom, black 95%, transparent 100%);
    }
</style>