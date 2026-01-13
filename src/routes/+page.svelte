<script lang="ts">
    import SearchSection from '$lib/components/section/Search.svelte';
    import StudioSection from '$lib/components/section/Studio.svelte';

    /**
     * Holds the currently selected track data.
     * Uses Svelte 5 `$state` rune for reactivity.
     * If null, the SearchSection is displayed.
     * If populated, the StudioSection is displayed.
     * @type {any | null}
     */
    let selectedTrack: any = $state(null);

    /**
     * Callback function triggered when a track is selected in the SearchSection.
     * Updates the state to switch views to the StudioSection.
     * @param {any} track - The selected track data object.
     */
    const handleSelect = (track: any) => {
        selectedTrack = track;
    };

    /**
     * Callback function triggered when the back button is clicked in the StudioSection.
     * Resets the selectedTrack state to null to return to the search view.
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
            <SearchSection onselect={handleSelect} />
        {:else}
            <StudioSection track={selectedTrack} onback={handleBack} />
        {/if}
    </main>

</div>