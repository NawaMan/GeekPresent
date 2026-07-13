<!--
  The deck root (/<deck>/) holds no slide of its own — it just forwards to the
  first one. Every other sample deck does exactly this.
-->
<script>
	if (typeof window !== 'undefined') {
		window.location.href = (window.location.pathname + '/title.html').replaceAll('//', '/');
	}
</script>

<div>
	<h1>This page will be redirect. Click <a href="title.html">here</a> if it does not.</h1>
</div>
