<script lang="ts">
	import { page as pageStore } from '$app/stores';
	import type { Page } from '@sveltejs/kit';
	import { URL } from 'svelte/reactivity';
	import { get } from 'svelte/store';

	const current = get(pageStore);

	class PageState implements Page {
		data = $state(current.data);
		error = $state(current.error);
		form = $state(current.form);
		params = $state(current.params);
		route = $state(current.route);
		state = $state(current.state);
		status = $state(current.status);
		url = new URL(current.url);

		constructor() {
			pageStore.subscribe((page) => {
				this.data = page.data;
				this.error = page.error;
				this.form = page.form;
				this.params = page.params;
				this.route = page.route;
				this.state = page.state;
				this.status = page.status;
				this.url.href = page.url.href;
			});
		}
	}

	const page = new PageState();

	$inspect(page.url);
	$inspect(page.url.searchParams.get('a'));
	$inspect(page.url.searchParams.get('b'));
</script>

<form>
	<button name="a" value="a">A</button>
</form>

<form>
	<button name="b" value="b">B</button>
</form>
