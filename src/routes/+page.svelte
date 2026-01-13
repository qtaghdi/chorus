<script lang="ts">
    import { Canvas } from '@threlte/core';
    import { T } from '@threlte/core';
    import { ContactShadows, Float } from '@threlte/extras';
    import Vinyl from '$lib/scene/Vinyl.svelte';

    import localCover from '$lib/assets/img.png';

    let track = {
        title: 'Super Shy',
        artist: 'NewJeans',
        cover: localCover
    };
</script>

<div class="min-h-screen bg-neutral-900 flex items-center justify-center p-4 font-sans">

    <div
            class="relative w-full max-w-[400px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl ring-8 ring-neutral-800"
            id="capture-area"
    >
        <div
                class="absolute inset-0 bg-cover bg-center opacity-50 blur-3xl scale-125 transition-all duration-700"
                style="background-image: url('{track.cover}');"
        ></div>

        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90"></div>

        <div class="absolute inset-0 z-10">
            <Canvas>
                <T.AmbientLight intensity={1.5}/>
                <T.DirectionalLight position={[5, 10, 5]} intensity={2}/>

                <T.PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50}/>

                <Float floatIntensity={0.5} rotationIntensity={0.2} speed={2}>
                    <Vinyl albumCover={track.cover}/>
                </Float>

                <ContactShadows opacity={0.6} scale={10} blur={2} far={10} color="#000000"/>
            </Canvas>
        </div>

        <div class="absolute bottom-12 left-0 right-0 text-center z-20 px-6">
            <h1 class="text-3xl font-bold text-white mb-2 tracking-tight drop-shadow-md">
                {track.title}
            </h1>
            <p class="text-lg text-white/80 font-medium tracking-widest uppercase">
                {track.artist}
            </p>

            <div class="w-full h-1 bg-white/20 mt-6 rounded-full overflow-hidden">
                <div class="w-1/3 h-full bg-green-500 rounded-full"></div>
            </div>
        </div>

        <div class="absolute top-6 left-6 z-20">
            <span class="text-white/90 font-bold text-sm tracking-widest border border-white/30 px-3 py-1 rounded-full backdrop-blur-md">
                CHORUS
            </span>
        </div>

    </div>
</div>