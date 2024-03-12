import type { Action } from 'svelte/action';
import type { Readable } from 'svelte/store';

export function createActionStore<A extends Action<any, any, any>, S extends Readable<any>>(
	action: A,
	store: S
): A & S {
	const fn = action as A & S;

	return Object.assign(fn, store);
}
