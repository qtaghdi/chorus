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
                color="#050505"
                roughness={0.2}
                metalness={0.5}
        />
    </T.Mesh>

    {#await map then value}
        <T.Mesh position.y={0.051} rotation.x={-Math.PI / 2}>
            <T.CircleGeometry args={[2.95, 64]} />
            <T.MeshStandardMaterial map={value} roughness={0.4} />
        </T.Mesh>

        <T.Mesh position.y={-0.051} rotation.x={Math.PI / 2}>
            <T.CircleGeometry args={[2.95, 64]} />
            <T.MeshStandardMaterial map={value} side={DoubleSide} roughness={0.4} />
        </T.Mesh>

        <T.Mesh position.y={0.052} rotation.x={-Math.PI / 2}>
            <T.CircleGeometry args={[0.12, 32]} />
            <T.MeshBasicMaterial color="#000000" />
        </T.Mesh>
        <T.Mesh position.y={-0.052} rotation.x={Math.PI / 2}>
            <T.CircleGeometry args={[0.12, 32]} />
            <T.MeshBasicMaterial color="#000000" />
        </T.Mesh>
    {/await}
</T.Group>