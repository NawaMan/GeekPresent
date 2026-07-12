<script lang="ts">
    import Box  from '$lib/components/Box.svelte';
    import Code from '$lib/components/Code.svelte';

    export let code:          string;
    export let language:      string = 'java';
    export let title:         string = '';
    export let expanded:      boolean = false;
    export let revealedLines: Array<number> = [1];
    export let fontSize:      number = 20;

    /** Inline style for the root element, applied last so it wins. */
    export let style: string = '';
    /** DOM id for the root element. */
    export let id: string = '';
    /** Extra class(es) for the root element. NOTE: a slide's own style block is scoped, so a
        class defined there will NOT match — use global CSS (global.css / roles.css / a
        :global(...) block) or a utility class. See AGENTS.md. */
    let klass: string = '';
    export { klass as class };

    // The box is 975px tall; the title bar (when present) takes 60px.
    $: editorHeight = title ? '915px' : '975px';
</script>

<Box {style} {id} class={klass} bind:expanded={expanded} width={1500} height={975}>
    {#if title}
        <div class="code-title">{title}</div>
    {/if}
    <Code code={code} language={language} revealLines={revealedLines} width="1500px" height={editorHeight} {fontSize} />
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
        color: var(--code-title-fg, #FFFFFF);
        background: var(--code-title-bg, #1E1E1E);
        border-bottom: 1.5px solid var(--code-title-border, #333333);
    }
</style>
