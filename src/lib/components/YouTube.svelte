<script>
    // Pass the thumbnail and QR images as imported assets so they can live
    // next to the page that uses them (Vite resolves the import to a URL):
    //   import thumbnail from './my-video-TN.png';
    //   import qr        from './my-video-QR.png';
    export let thumbnail;
    export let qr;
    export let youtubeId;
    export let width = "600px";
    export let alt   = "";

    $: videoUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
</script>

<a href={videoUrl} target="_blank" style="--width: {width}">
    <div class="youtube">
        <img class="thumbnail" src={thumbnail} alt={alt} />
        <div class="qr-block">
            <span class="watch-id">?v={youtubeId}</span>
            <img class="qr" src={qr} alt={alt ? `${alt} QR code` : "QR code"} />
        </div>
    </div>
</a>

<style>
a {
    color: inherit;          /* use the slide's regular font color */
    text-decoration: none;
}
img {
    display: block;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 1em;
    border: 2px white solid;
    border-radius: 5px;
}
.youtube {
    position: relative;
    margin: auto;
    width: var(--width);
}
.thumbnail {
    width: 100%;
}
.qr-block {
    position: absolute;
    bottom: 10px;
    left: 10px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}
.watch-id {
    font-family: monospace;
    font-size: 14px;
    line-height: 1;
    margin-bottom: 4px;
}
.qr {
    width: 100px;
    margin-bottom: 0;
}
</style>
