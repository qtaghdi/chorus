<script lang="ts">
    import ky from 'ky';
    import {fade, fly} from 'svelte/transition';
    import {createEventDispatcher} from 'svelte';

    const dispatch = createEventDispatcher();

    /**
     * Stores the user's input string for the search query.
     * @type {string}
     */
    let query = '';

    /**
     * Indicates whether a network request is currently active.
     * Used to disable the search button and show loading state.
     * @type {boolean}
     */
    let isLoading = false;

    /**
     * Stores the array of track objects fetched from the API.
     * @type {any[]}
     */
    let searchResults: any[] = [];

    /**
     * Tracks if a search has been initiated at least once.
     * Controls the visibility of the result list container.
     * @type {boolean}
     */
    let hasSearched = false;

    /**
     * Executes the search operation.
     * 1. Validates input.
     * 2. Dismisses the mobile keyboard.
     * 3. Fetches data from the internal API.
     * 4. Updates the result state.
     */
    const handleSearch = async () => {
        if (!query) return;

        isLoading = true;
        hasSearched = true;

        // Dismiss mobile keyboard by removing focus from the active element
        const activeElement = document.activeElement as HTMLElement;
        activeElement?.blur();

        try {
            searchResults = await ky.get('/api/search', {
                searchParams: {q: query}
            }).json<any[]>();
        } catch (error) {
            console.error('API Request Failed', error);
            searchResults = [];
        } finally {
            isLoading = false;
        }
    };

    /**
     * Dispatches the 'select' event to the parent component with the chosen track data.
     * @param {any} track - The selected track object
     */
    const selectTrack = (track: any) => {
        dispatch('select', track);
    };
</script>

<div class="flex flex-col items-center justify-center w-full min-h-[90dvh] max-w-lg mx-auto px-6 relative" in:fade>

    <div class="text-center mb-10">
        <h1 class="text-6xl font-extrabold tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-2">
            CHORUS
        </h1>
        <p class="text-white/50 text-lg font-light tracking-widest uppercase">나만의 음악 취향 기록</p>
    </div>

    <div class="w-full relative group z-20 mb-8">
        <div class="absolute -inset-0.5 bg-linear-to-r from-green-400 to-purple-500 rounded-full blur opacity-30 group-focus-within:opacity-100 transition duration-700"></div>

        <div class="relative flex items-center bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-2xl">
            <input
                    type="text"
                    bind:value={query}
                    placeholder="노래 제목이나 가수를 입력하세요"
                    class="flex-1 bg-transparent text-white px-6 py-4 text-lg font-medium focus:outline-none placeholder:text-white/30"
                    on:keydown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
                    on:click={handleSearch}
                    disabled={isLoading}
                    class="mr-2 px-6 py-2 rounded-full bg-white text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
            >
                {isLoading ? '...' : '검색'}
            </button>
        </div>
    </div>

    {#if hasSearched}
        <div class="w-full flex-1 min-h-0 overflow-y-auto scrollbar-hide pb-20 mask-image-gradient"
             in:fly={{ y: 20, duration: 500 }}>
            {#if searchResults.length === 0 && !isLoading}
                <div class="text-center text-white/40 py-10 font-light">검색 결과가 없습니다.</div>
            {:else}
                <div class="space-y-3">
                    {#each searchResults as track}
                        <button
                                class="w-full flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-[0.98] transition-all group backdrop-blur-md"
                                on:click={() => selectTrack(track)}
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
        </div>
    {/if}
</div>

<style>
    .mask-image-gradient {
        mask-image: linear-gradient(to bottom, black 90%, transparent 100%);
    }
</style>