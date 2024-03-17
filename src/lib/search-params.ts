import { building } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { derived, get, readable, type Updater, type Writable } from 'svelte/store';

const page_store = building
	? readable({
			url: new URL('http://localhost')
		})
	: page;

const searchParams = derived(page_store, ($page) => $page.url.searchParams);

type URLSearchParamsInit = string | Record<string, string> | URLSearchParams | string[][];
type GotoOptions = {
	replaceState?: boolean;
	noScroll?: boolean;
	keepFocus?: boolean;
	invalidateAll?: boolean;
};

export type SearchParamsTransform<T> = {
	decode: (searchParams: URLSearchParams) => T;
	encode: (value: T, searchParams: URLSearchParams) => URLSearchParamsInit;
};

export function useSearchParams<T = string | null>(options: {
	decode: (searchParams: URLSearchParams) => T;
	encode: (value: T, searchParams: URLSearchParams) => URLSearchParamsInit;
	sort?: boolean;
	options?: GotoOptions;
}): Writable<T> {
	const { subscribe } = derived(searchParams, options.decode);

	function set(value: T, gotoOptions?: GotoOptions) {
		const url = new URL(get(page).url);
		const prevUrl = url.toString();

		url.search = new URLSearchParams(options.encode(value, url.searchParams)).toString();
		options.sort !== false && url.searchParams.sort();

		if (prevUrl === url.toString()) {
			return;
		}

		goto(url, {
			keepFocus: true,
			noScroll: true,
			replaceState: true,
			...options.options,
			...gotoOptions
		});
	}

	function update(updater: Updater<T>, gotoOptions?: GotoOptions) {
		set(updater(get({ subscribe })), gotoOptions);
	}

	return {
		set,
		update,
		subscribe
	};
}

export type SearchParamTransform<T> = {
	decode: (value: string | null) => T;
	encode: (value: T) => string | null;
};

export function useSearchParam<T = string | null>(options: {
	key: string;
	options?: GotoOptions;
	transform?: SearchParamTransform<T>;
}) {
	return useSearchParams<T>({
		decode(searchParams) {
			const value = searchParams.get(options.key);
			return options.transform ? options.transform?.decode(value) : (value as T);
		},
		encode(value, searchParams) {
			const encoded = options.transform
				? options.transform?.encode(value as T)
				: (value as string | null);

			if (encoded === null) {
				searchParams.delete(options.key);
			} else {
				searchParams.set(options.key, encoded);
			}
			return searchParams;
		},
		options: options.options
	});
}

export function stringTransform(defaultValue: string): SearchParamTransform<string> {
	return {
		decode(value) {
			return value === null ? defaultValue : value;
		},
		encode(value) {
			if (value === defaultValue) {
				return null;
			}
			return value.toString();
		}
	};
}

export function numberTransform(defaultValue: number): SearchParamTransform<number> {
	return {
		decode(value) {
			try {
				return Number(value);
			} catch {
				return defaultValue;
			}
		},
		encode(value) {
			if (value === defaultValue) {
				return null;
			}
			return value.toString();
		}
	};
}

export function booleanTransform(): SearchParamTransform<boolean> {
	return {
		decode(value) {
			return value !== null;
		},
		encode(value) {
			return value ? '' : null;
		}
	};
}
