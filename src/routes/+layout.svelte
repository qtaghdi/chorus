<script lang="ts">
    import "./layout.css";
    import '../app.css';
    import { onNavigate } from '$app/navigation';
    import { navigating } from '$app/state';
    import NProgress from 'nprogress';
    import 'nprogress/nprogress.css';
    import type { Snippet } from 'svelte';

    let { children }: { children: Snippet } = $props();

    NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.2 });

    /**
     * 로딩 바 제어
     * navigating은 이제 스토어가 아니므로 $ 없이 접근합니다.
     * navigating.to 값이 있으면 이동 중인 상태입니다.
     */
    $effect(() => {
        if (navigating.to) {
            NProgress.start();
        } else {
            NProgress.done();
        }
    });

    /**
     * View Transitions API (부드러운 화면 전환)
     */
    onNavigate((navigation) => {
        if (!document.startViewTransition) return;

        return new Promise((resolve) => {
            document.startViewTransition(async () => {
                resolve();
                await navigation.complete;
            });
        });
    });
</script>

<style>
    :global(#nprogress .bar) {
        background: linear-gradient(to right, #4ade80, #a855f7) !important;
        height: 3px !important;
    }

    :global(#nprogress .peg) {
        box-shadow: 0 0 10px #a855f7, 0 0 5px #4ade80 !important;
    }
</style>

{@render children()}