import { derived, get, type Readable, type Updater, type Writable } from 'svelte/store';

export function debounced<S extends Readable<any>>(delay: number, store: S): S {
	let timerId: ReturnType<typeof setTimeout>;

	let initial = true;

	const { subscribe } = derived(store, (value, set) => {
		if (initial) {
			set(value);
			initial = false;
			return;
		}

		clearTimeout(timerId);
		timerId = setTimeout(() => {
			set(value);
		}, delay);
	});

	return {
		...store,
		subscribe
	};
}

export function debouncedWritable<T>(delay: number, store: Writable<T>): Writable<T> {
	let timerId: ReturnType<typeof setTimeout>;

	function set(value: T) {
		clearTimeout(timerId);
		timerId = setTimeout(() => {
			store.set(value);
		}, delay);
	}

	function update(updater: Updater<T>) {
		set(updater(get(store)));
	}

	return {
		...store,
		set,
		update
	};
}

export function throttled<S extends Readable<any>>(delay: number, store: S): S {
	let initial = true;
	let timerId: ReturnType<typeof setTimeout> | null = null;
	let newValue: any;

	const { subscribe } = derived(store, (value, set) => {
		if (initial) {
			set(value);
			initial = false;
			return;
		}

		newValue = value;

		if (!timerId) {
			timerId = setTimeout(() => {
				timerId = null;
				set(newValue);
			}, delay);
		}
	});

	return {
		...store,
		subscribe
	};
}

export function throttledWritable<T>(delay: number, store: Writable<T>): Writable<T> {
	let timerId: ReturnType<typeof setTimeout> | null = null;
	let newValue: T;

	function set(value: T) {
		newValue = value;

		if (!timerId) {
			timerId = setTimeout(() => {
				timerId = null;
				set(newValue);
			}, delay);
		}
	}

	function update(updater: Updater<T>) {
		set(updater(get(store)));
	}

	return {
		...store,
		set,
		update
	};
}
