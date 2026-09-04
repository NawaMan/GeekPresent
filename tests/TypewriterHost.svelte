<script lang="ts">
	import { setMode } from '../src/lib/presentation';
	import Typewriter from '../src/lib/components/Typewriter.svelte';

	/** The artifact this typewriter finds itself in — a `text` one prints it whole. */
	export let mode: 'presentation' | 'text' = 'presentation';
	/** Everything else, forwarded verbatim. */
	export let props: Record<string, unknown> = {};

	setMode(mode);
</script>

<Typewriter {...props} />
