<script lang="ts">

    import { browser }    from '$app/environment';
    import { scaleMode }  from '$lib/stores/scaleMode';
    import { onMount }    from 'svelte';

    let isScaled = $scaleMode;

    onMount(() => {
        if (browser) {
            scaleMode.subscribe(value => {
                isScaled = value;
            });
        }
    });
</script>

<div class="note">
<slot></slot>
</div>

<style>
.note:not(.scale-mode) {
    position: absolute;
    display: block;
    width: calc(1280px - 20px);
    top: 740px;
    padding: 10px;

    color: #000;
    background-color: beige;

    border: 1px solid #fff;
    border-radius: 5px;

    min-height: 150px;
    max-height: 150px;
    overflow-y: scroll;

    font-size: larger;
    font-family: ui-sans-serif, system-ui, Segoe UI, Helvetica, Apple Color Emoji, Arial, sans-serif, Segoe UI Emoji, Segoe UI Symbol;
}
</style>
