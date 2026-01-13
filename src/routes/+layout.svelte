<script lang="ts">
	import './layout.css';
    import "../app.css";
	import favicon from '$lib/assets/favicon.svg';
    import {inject} from "@vercel/analytics";
    import {dev} from "$app/environment";

	let { children } = $props();

    inject({ mode: dev ? 'development' : 'production' });
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
