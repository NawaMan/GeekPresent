<script lang="ts">
    import Box      from '$lib/components/Box.svelte';
    import JavaCode from '$lib/components/JavaCode.svelte';

    export let javaCode:      string;
    export let title:         string = '';
    export let expanded:      boolean = false;
    export let revealedLines: Array<number> = [1];
    export let fontSize:      number = 20;

    // The box is 975px tall; the title bar (when present) takes 60px.
    $: editorHeight = title ? '915px' : '975px';
</script>

<Box bind:expanded={expanded} width={1500} height={975}>
    {#if title}
        <div class="code-title">{title}</div>
    {/if}
    <JavaCode javaCode={javaCode} revealLines={revealedLines} width="1500px" height={editorHeight} {fontSize} />
</Box>

<style>
    .code-title {
        height: 60px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        padding: 0 0.8em;
        font-family: 'Fira Code', monospace;
        font-weight: bold;
        color: #fff;
        background: #1e1e1e;
        border-bottom: 1.5px solid #333;
    }
</style>
