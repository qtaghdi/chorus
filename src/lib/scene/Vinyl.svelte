<script lang="ts">
    import { T, useTask } from '@threlte/core';
    import { useTexture } from '@threlte/extras';
    import { DoubleSide } from 'three';

    export let albumCover: string;

    let rotation = 0;

    useTask((delta) => {
        rotation += delta * 0.5;
    });

    const map = useTexture(albumCover);
</script>

<T.Group rotation.y={rotation} rotation.x={0.5}>
    <T.Mesh receiveShadow castShadow>
        <T.CylinderGeometry args={[3, 3, 0.1, 64]} />
        <T.MeshStandardMaterial
                color="#111111"
                roughness={0.1}
                metalness={0.5}
        />
    </T.Mesh>

    {#await map then value}
        <T.Mesh position.y={0.06} rotation.x={-Math.PI / 2}>
            <T.CircleGeometry args={[1.4, 64]} />
            <T.MeshBasicMaterial map={value} />
        </T.Mesh>

        <T.Mesh position.y={-0.06} rotation.x={Math.PI / 2}>
            <T.CircleGeometry args={[1.4, 64]} />
            <T.MeshBasicMaterial map={value} side={DoubleSide} />
        </T.Mesh>
    {/await}
</T.Group>