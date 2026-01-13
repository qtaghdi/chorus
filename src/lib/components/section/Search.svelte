<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { SearchController, type Track } from '$lib/logic/SearchController.svelte';

    /**
     * @description
     * Search 화면 컴포넌트에 전달되는 Props
     *
     * @property onselect
     *  - 검색 결과에서 트랙을 선택했을 때 호출되는 콜백
     */
    let { onselect } = $props();

    /**
     * @description
     * 검색 화면의 상태 및 비즈니스 로직을 담당하는 컨트롤러
     */
    const controller = new SearchController();

    /**
     * @description
     * 검색 결과 트랙 선택 핸들러
     *
     * @param track 선택된 트랙 데이터
     */
    const handleTrackSelect = (track: Track) => {
        controller.triggerHaptic();
        onselect?.(track);
    };
</script>

<div
        class="flex flex-col items-center w-full min-h-dvh max-w-lg mx-auto px-6
           relative z-50 transition-all duration-700 ease-in-out"
        class:justify-center={!controller.isResultMode}
        class:justify-start={controller.isResultMode}
        class:pt-20={controller.isResultMode}
>
    {#if !controller.isResultMode}
        <div class="text-center mb-10" out:fly={{ y: -20, duration: 300 }}>
            <h1 class="text-6xl font-extrabold tracking-tighter text-white mb-2">
                CHORUS
            </h1>
            <p class="text-white/50 text-lg tracking-widest uppercase">
                나만의 음악 취향 기록
            </p>
        </div>
    {/if}

    <div class="w-full relative group z-20" class:mb-6={controller.isResultMode}>
        <div
                class="absolute -inset-0.5 rounded-full blur-md opacity-40
                   bg-linear-to-r from-indigo-900 via-purple-900 to-blue-900
                   pointer-events-none"
                aria-hidden="true"
        />

        <div
                class="relative flex items-center
                   bg-black/30 backdrop-blur-xl
                   rounded-full
                   border border-white/10
                   shadow-2xl
                   overflow-hidden"
        >
            {#if controller.isResultMode}
                <button
                        onclick={() => controller.clear()}
                        class="pl-4 pr-2 text-white/50 hover:text-white"
                >
                    ←
                </button>
            {/if}

            <input
                    type="text"
                    bind:value={controller.query}
                    placeholder="노래 제목이나 가수를 입력하세요"
                    class="flex-1 min-w-0 bg-transparent text-white
                       px-4 py-4 text-lg focus:outline-none
                       placeholder:text-white/30"
                    onkeydown={(e) => controller.handleKeydown(e)}
            />

            <button
                    onclick={() => controller.search()}
                    disabled={controller.isLoading}
                    class="shrink-0 mr-2 px-6 py-2 rounded-full
                       bg-white/10 text-white border border-white/10
                       font-bold text-sm hover:bg-white/20
                       active:scale-95 transition-all
                       disabled:opacity-50"
            >
                검색
            </button>
        </div>
    </div>

    {#if controller.isResultMode}
        <div
                class="w-full flex-1 min-h-0 overflow-y-auto
                   pb-20 mask-image-gradient"
                in:fly={{ y: 20, duration: 500, delay: 200 }}
        >
            {#if controller.isLoading && controller.searchResults.length === 0}
                <p class="text-white/40 text-center py-20">불러오는 중…</p>
            {:else}
                <div class="space-y-3">
                    {#each controller.searchResults as track (track.id)}
                        <button
                                class="w-full flex items-center gap-4 p-3
                                   rounded-2xl bg-white/5
                                   hover:bg-white/10
                                   transition-all"
                                onclick={() => handleTrackSelect(track)}
                        >
                            <img
                                    src={track.cover}
                                    alt="album art"
                                    class="w-14 h-14 rounded-lg object-cover"
                            />
                            <div class="flex-1 text-left">
                                <h3 class="text-white font-bold truncate">
                                    {track.title}
                                </h3>
                                <p class="text-white/50 text-sm truncate">
                                    {track.artist}
                                </p>
                            </div>
                        </button>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .mask-image-gradient {
        mask-image: linear-gradient(to bottom, black 95%, transparent);
    }
</style>