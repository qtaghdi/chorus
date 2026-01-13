<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';

    // 에러 상태 코드와 메시지를 가져옵니다.
    // $page.error가 null일 수 있으므로 안전하게 접근합니다.
    let statusCode = $derived(page.status);
    let message = $derived(page.error?.message || '알 수 없는 오류가 발생했습니다.');

    const goHome = () => {
        goto('/');
    };
</script>

<div class="relative w-full h-dvh flex flex-col items-center justify-center overflow-hidden bg-black text-white">
    <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px] animate-pulse"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[120px]" style="animation-delay: -5s;"></div>

    <div class="relative z-10 flex flex-col items-center text-center px-6 max-w-md">
        <div class="mb-8 text-8xl opacity-80 animate-bounce">
            💿
        </div>

        <h1 class="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-br from-white to-white/40 mb-4 drop-shadow-lg">
            {statusCode}
        </h1>

        <p class="text-xl text-white/70 font-light mb-10 leading-relaxed">
            {message === 'Not Found' ? '요청하신 페이지를 찾을 수 없습니다.' : message}
            <br />
            <span class="text-sm text-white/40 mt-2 block">잠시 후 다시 시도하거나 홈으로 돌아가세요.</span>
        </p>

        <button
                onclick={goHome}
                class="px-8 py-3 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 hover:scale-105 active:scale-95 transition-all font-bold text-white backdrop-blur-md"
        >
            홈으로 돌아가기
        </button>
    </div>
</div>