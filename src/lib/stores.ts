import { tick } from 'svelte';
import {
	derived,
	get,
	type Readable,
	type StartStopNotifier,
	type Updater,
	type Writable
} from 'svelte/store';

export function writableState<T>(initial_value: T, start?: StartStopNotifier<T>) {
	let value = $state(initial_value);

	let subscribers = 0;
	let stop: (() => void) | null = null;

	return {
		set value(newValue) {
			value = newValue;
		},
		get value() {
			if ($effect.active()) {
				$effect(() => {
					if (subscribers++ === 0) {
						stop =
							start?.(
								(newValue) => (value = newValue),
								(fn) => (value = fn(value))
							) ?? null;
					}

					return () => {
						tick().then(() => {
							if (--subscribers === 0) {
								stop?.();
								stop = null;
							}
						});
					};
				});
			}

			return value;
		}
	};
}

export function readableState<T>(initial_value: T, start?: StartStopNotifier<T>) {
	const store = writableState(initial_value, start);

	return {
		get value() {
			return store.value;
		}
	};
}

export function statify<T>(store: Readable<T>) {
	let value = $state(get(store));

	let subscribers = 0;
	let stop: (() => void) | null = null;

	return {
		get value() {
			if ($effect.active()) {
				$effect(() => {
					if (subscribers++ === 0) {
						stop = store.subscribe((val) => {
							value = val;
						});
					}

					return () => {
						tick().then(() => {
							if (--subscribers === 0) {
								stop?.();
								stop = null;
							}
						});
					};
				});
			}

			return value;
		}
	};
}

export function debounced<S extends Readable<any>>(delay: number, store: S): S {
	let timerId: ReturnType<typeof setTimeout>;

	let initial = true;

	const { subscribe } = derived(store, (value: any, set: (value: any) => void) => {
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

	const { subscribe } = derived(store, (value: any, set: (value: any) => void) => {
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

export function derivedWritable<In, Out>(
	store: Writable<In>,
	options: {
		read: (value: In) => Out;
		write: (value: Out, other: In) => In;
	}
): Writable<Out> {
	const { subscribe } = derived(store, options.read);

	const set = (value: Out) => {
		store.set(options.write(value, get(store)));
	};
	const update = (updater: Updater<Out>) => {
		set(updater(get({ subscribe })));
	};

	return {
		subscribe,
		set,
		update
	};
}

export function derivedWritableProperty<T extends Record<string, any>, Key extends keyof T>(
	store: Writable<T>,
	key: Key
): Writable<T[Key]> {
	return derivedWritable(store, {
		read(value) {
			return value[key];
		},
		write(value, other) {
			other[key] = value;
			return other;
		}
	});
}
