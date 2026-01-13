<script lang="ts">
    import StudioSection from '$lib/components/section/Studio.svelte';
    import { goto } from '$app/navigation';

    /**
     * Props received from the server load function.
     * Contains the track data fetched by +page.server.ts.
     * @property {{ track: any }} data
     */
    let { data } = $props();

    /**
     * Navigates the user back to the main search page.
     * Uses SvelteKit's client-side navigation.
     */
    const handleBack = () => {
        goto('/');
    };
</script>

<div class="fixed inset-0 z-0 pointer-events-none">
    <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-green-500/30 rounded-full blur-[120px] animate-aurora"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-aurora" style="animation-delay: -5s;"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[100px]"></div>
</div>

<main class="flex-1 w-full h-full relative z-10 backdrop-blur-[1px]">
    <StudioSection track={data.track} onback={handleBack} />
</main>