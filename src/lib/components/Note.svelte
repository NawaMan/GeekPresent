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
    width: calc(1920px - 30px);
    top: 1110px;
    padding: 15px;

    color: #000;
    background-color: beige;

    border: 1.5px solid #fff;
    border-radius: 7.5px;

    min-height: 225px;
    max-height: 225px;
    overflow-y: scroll;

    font-size: larger;
    font-family: ui-sans-serif, system-ui, Segoe UI, Helvetica, Apple Color Emoji, Arial, sans-serif, Segoe UI Emoji, Segoe UI Symbol;
}
</style>
