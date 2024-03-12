import { goto, pushState } from '$app/navigation';
import { page } from '$app/stores';
import type { ActionReturn } from 'svelte/action';
import { derived, type Readable } from 'svelte/store';
import type { Page } from '@sveltejs/kit';

type MaybePromise<T> = T | Promise<T>;

export function createShallowRoute<Input = any, Data = any>({
	name,
	loader
}: {
	name: string;
	loader: (input: Input) => MaybePromise<null | undefined | Data>;
}) {
	const STATE_KEY = `shallow_${name}`;

	const store = derived<Readable<Page>, { data: Data; input: Input } | null>(page, ($page) => {
		const state = $page.state as Record<string, { data: Data; input: Input }>;
		return STATE_KEY in state ? state[STATE_KEY] : null;
	});

	async function load(url: string, input: Input) {
		const data = await loader(input);

		if (data == null) {
			await goto(url);
			return;
		}

		const state = {
			[STATE_KEY]: {
				data,
				input
			}
		};
		pushState(url, state);
	}

	function link(
		node: HTMLAnchorElement,
		input: Input
	): ActionReturn<
		Input,
		{
			'on:shallow'?: (e: CustomEvent<Input>) => void;
		}
	> {
		function handleClick(event: MouseEvent) {
			if (event.ctrlKey || event.shiftKey || event.metaKey) {
				return;
			}
			event.preventDefault();
			node.dispatchEvent(new CustomEvent('shallow', { detail: input }));
			load(node.href, input);
		}

		node.addEventListener('click', handleClick);

		return {
			update(newInput) {
				input = newInput;
			},
			destroy() {
				node.removeEventListener('click', handleClick);
			}
		};
	}

	return {
		link,
		load,
		...store
	};
}
