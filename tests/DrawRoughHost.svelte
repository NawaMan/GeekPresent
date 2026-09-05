<!-- DOM host for the rough option's INHERITANCE rules: a <Draw rough={1}>
     containing shapes that inherit it, override it, and opt back out. Each
     shape carries a data-testid so the test can look at one stroke group. -->
<script lang="ts">
	import Connector from '../src/lib/components/Connector.svelte';
	import Draw from '../src/lib/draw/Draw.svelte';
	import Ellipse from '../src/lib/draw/Ellipse.svelte';
	import Line from '../src/lib/draw/Line.svelte';
	import Rect from '../src/lib/draw/Rect.svelte';

	interface Props {
		/** The surface default under test. */
		surface?: boolean | number;
	}
	let { surface = 1 }: Props = $props();
</script>

<Draw title="rough inheritance" rough={surface}>
	<Line id="inherited" from={[0, 0]} to={[400, 0]} />
	<Line id="optedOut" from={[0, 50]} to={[400, 50]} rough={false} />
	<Line id="stronger" from={[0, 100]} to={[400, 100]} rough={2} />
	<Line id="seeded" from={[0, 150]} to={[400, 150]} seed={42} />
	<Rect id="box" x={0} y={200} width={200} height={100} />
	<Ellipse id="filled" x={0} y={350} width={200} height={100} fill="#3a6ea5" />
	<Ellipse id="flat" x={0} y={500} width={200} height={100} fill="#3a6ea5" fillStyle="solid" />
	<!-- Literal box endpoints, so the connector resolves without a Block registry. -->
	<Connector
		id="wire"
		from={{ x: 600, y: 0, width: 100, height: 60 }}
		to={{ x: 900, y: 200, width: 100, height: 60 }}
		arrow="end"
	/>
	<Connector
		id="wireCrisp"
		from={{ x: 600, y: 300, width: 100, height: 60 }}
		to={{ x: 900, y: 500, width: 100, height: 60 }}
		arrow="end"
		rough={false}
	/>
</Draw>
