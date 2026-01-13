<script lang="ts">
    import {Canvas} from '@threlte/core';
    import {T} from '@threlte/core';
    import {ContactShadows, Float} from '@threlte/extras';
    import Vinyl from '$lib/scene/vinyl.svelte';
    import localCover from '$lib/assets/img.png';
    import ky from 'ky';

    type TrackInfo = {
        title: string;
        artist: string;
        cover: string;
        album?: string;
    };

    let track: TrackInfo = {
        title: 'Super Shy',
        artist: 'NewJeans',
        cover: localCover
    };

    let query = '';
    let isLoading = false;
    let searchResults: TrackInfo[] = [];
    let showResults = false;

    async function handleSearch() {
        if (!query) return;
        isLoading = true;
        showResults = true;

        try {
            const data = await ky.get('/api/search', {
                searchParams: {q: query}
            }).json<TrackInfo[]>();

            searchResults = data;

        } catch (error) {
            console.error('Network Error:', error);
            alert('노래를 찾을 수 없습니다.');
            searchResults = [];
        } finally {
            isLoading = false;
        }
    }

    function selectTrack(selectedTrack: TrackInfo) {
        track = selectedTrack;
        showResults = false;
        searchResults = [];
    }
</script>

<div class="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-4 font-sans gap-8"
     on:click={() => showResults = false}>

    <div class="relative w-full max-w-[400px] z-50 flex flex-col gap-2"
         on:click|stopPropagation={() => {}}>

        <div class="flex gap-2">
            <input
                    type="text"
                    bind:value={query}
                    placeholder="가수나 노래 제목 (예: 아이브)"
                    class="flex-1 bg-neutral-800 text-white px-4 py-3 rounded-xl border border-neutral-700 focus:outline-none focus:border-green-500 transition-colors placeholder:text-neutral-500"
                    on:keydown={(e) => e.key === 'Enter' && handleSearch()}
                    on:focus={() => { if(searchResults.length > 0) showResults = true; }}
            />
            <button
                    on:click={handleSearch}
                    disabled={isLoading}
                    class="bg-green-500 text-black font-bold px-6 py-3 rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
                {isLoading ? '...' : '검색'}
            </button>
        </div>

        {#if showResults && searchResults.length > 0}
            <div class="absolute top-full mt-2 left-0 right-0 bg-neutral-800 rounded-xl shadow-2xl border border-neutral-700 max-h-[300px] overflow-y-auto divide-y divide-neutral-700">
                {#each searchResults as result}
                    <button
                            class="w-full flex items-center gap-3 p-3 hover:bg-neutral-700 transition-colors text-left"
                            on:click={() => selectTrack(result)}
                    >
                        <img src={result.cover} alt="album" class="w-10 h-10 rounded-md object-cover bg-black"/>

                        <div class="flex-1 min-w-0">
                            <p class="text-white text-sm font-bold truncate">{result.title}</p>
                            <p class="text-neutral-400 text-xs truncate">{result.artist} • {result.album}</p>
                        </div>
                    </button>
                {/each}
            </div>
        {/if}
    </div>


    <div class="relative w-full max-w-[400px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl ring-8 ring-neutral-800"
         id="capture-area">
        {#key track.cover}
            <div class="absolute inset-0 bg-cover bg-center opacity-50 blur-3xl scale-125 transition-all duration-1000"
                 style="background-image: url('{track.cover}');"></div>
        {/key}
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90"></div>
        <div class="absolute inset-0 z-10">
            <Canvas>
                <T.AmbientLight intensity={1.5}/>
                <T.DirectionalLight position={[5, 10, 5]} intensity={2}/>
                <T.PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50}/>
                <Float floatIntensity={0.5} rotationIntensity={0.2} speed={2}>
                    {#key track.cover}
                        <Vinyl albumCover={track.cover}/>
                    {/key}
                </Float>
                <ContactShadows opacity={0.6} scale={10} blur={2} far={10} color="#000000"/>
            </Canvas>
        </div>
        <div class="absolute bottom-12 left-0 right-0 text-center z-20 px-6">
            <h1 class="text-3xl font-bold text-white mb-2 tracking-tight drop-shadow-md line-clamp-2">{track.title}</h1>
            <p class="text-lg text-white/80 font-medium tracking-widest uppercase truncate">{track.artist}</p>
            <div class="w-full h-1 bg-white/20 mt-6 rounded-full overflow-hidden">
                <div class="w-1/3 h-full bg-green-500 rounded-full"></div>
            </div>
        </div>
        <div class="absolute top-6 left-6 z-20">
            <span class="text-white/90 font-bold text-sm tracking-widest border border-white/30 px-3 py-1 rounded-full backdrop-blur-md">CHORUS</span>
        </div>
    </div>

</div>