<script lang="ts">
    import Box  from '$lib/components/Box.svelte';
    import Code from '$lib/components/Code.svelte';

    export let code:          string;
    export let language:      string = 'java';
    export let title:         string = '';
    export let expanded:      boolean = false;
    export let revealedLines: Array<number> = [1];

    // The box is 650px tall; the title bar (when present) takes 40px.
    $: editorHeight = title ? '610px' : '650px';
</script>

<Box bind:expanded={expanded} width={1000} height={650}>
    {#if title}
        <div class="code-title">{title}</div>
    {/if}
    <Code code={code} language={language} revealLines={revealedLines} width="1000px" height={editorHeight} />
</Box>

<style>
    .code-title {
        height: 40px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        padding: 0 0.8em;
        font-family: 'Fira Code', monospace;
        font-weight: bold;
        color: #fff;
        background: #1e1e1e;
        border-bottom: 1px solid #333;
    }
</style>
