<script lang="ts">
	import { createShallowRoute } from '$lib/shallow-route.js';

	const shallow = createShallowRoute({
		name: 'post',
		loader(input: number) {
			return input;
		}
	});
</script>

<div class="flex gap-2">
	{#each { length: 10 } as _item, i}
		<a class="bg-neutral-50 px-4 py-2" href="/posts/{i}" use:shallow.link={i}> {i} </a>
	{/each}
</div>

{#if $shallow}
	<div>
		{$shallow.data}
	</div>
{/if}
