<script lang="ts">
    import StudioSection from '$lib/components/section/Studio.svelte';
    import { goto } from '$app/navigation';

    /**
     * 서버 로드 함수(load function)로부터 전달받은 Props입니다.
     * +page.server.ts에서 페칭한 트랙 데이터를 포함하고 있습니다.
     * @property {{ track: any }} data
     */
    let { data } = $props();

    /**
     * 메인 검색 페이지로 돌아가는 핸들러입니다.
     * SvelteKit의 클라이언트 사이드 네비게이션을 사용하여 이동합니다.
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