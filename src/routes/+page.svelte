<script lang="ts">
    import SearchSection from '$lib/components/section/Search.svelte';
    import StudioSection from '$lib/components/section/Studio.svelte';

    /**
     * Stores the selected track information.
     * Null indicates the search view, while an object triggers the studio view.
     * @type {any | null}
     */
    let selectedTrack: any = null;

    /**
     * Updates the state when a user selects a track from the search results.
     * @param {CustomEvent} event
     */
    const handleSelect = (event: CustomEvent) => {
        selectedTrack = event.detail;
    };

    /**
     * Resets the state to return to the search view.
     */
    const handleBack = () => {
        selectedTrack = null;
    };
</script>

<div class="min-h-dvh bg-black text-white font-sans overflow-hidden relative flex flex-col">

    <div class="fixed inset-0 z-0 pointer-events-none">
        <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-green-500/30 rounded-full blur-[120px] animate-aurora"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-aurora" style="animation-delay: -5s;"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[100px]"></div>
    </div>

    <main class="flex-1 w-full h-full relative z-10 backdrop-blur-[1px]">
        {#if !selectedTrack}
            <SearchSection on:select={handleSelect} />
        {:else}
            <StudioSection track={selectedTrack} on:back={handleBack} />
        {/if}
    </main>

</div>