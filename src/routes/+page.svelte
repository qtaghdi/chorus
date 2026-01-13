<script lang="ts">
    import SearchSection from '$lib/components/section/Search.svelte';
    import { goto } from '$app/navigation';

    /**
     * Handles the track selection event from the SearchSection.
     * Navigates to the dynamic track page (/track/[id]) instead of rendering locally.
     * This enables URL sharing and deep linking.
     * * @param {any} track - The selected track object containing the 'id'.
     */
    const handleSelect = (track: any) => {
        if (track.id) {
            goto(`/track/${track.id}`);
        }
    };
</script>

<div class="min-h-dvh bg-black text-white font-sans overflow-hidden relative flex flex-col">

    <div class="fixed inset-0 z-0 pointer-events-none">
        <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-green-500/30 rounded-full blur-[120px] animate-aurora"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-aurora" style="animation-delay: -5s;"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[100px]"></div>
    </div>

    <main class="flex-1 w-full h-full relative z-10 backdrop-blur-[1px]">
        <SearchSection onselect={handleSelect} />
    </main>

</div>