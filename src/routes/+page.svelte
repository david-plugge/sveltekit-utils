<script lang="ts">
	import { useSearchParams, type SearchParamsTransform } from '$lib/search-params.js';
	import { debouncedWritable } from '$lib/stores.js';
	import * as v from 'valibot';

	function valibotQuerySchema<Schema extends Record<string, v.SchemaWithFallback>>(
		params: Schema
	): SearchParamsTransform<v.Output<v.ObjectSchema<Schema>>> {
		const schema = v.object(params);
		const defaults: Record<string, any> = v.parse(schema, {});

		return {
			decode(searchParams) {
				const params = Object.fromEntries(searchParams);
				return v.parse(schema, params);
			},
			encode(value) {
				const x: Record<string, any> = v.parse(schema, value);
				return Object.entries(x)
					.filter(([k, v]) => defaults[k] !== v)
					.map(([k, v]) => [k, v.toString()]);
			}
		};
	}

	const params = debouncedWritable(
		300,
		useSearchParams({
			...valibotQuerySchema({
				page: v.fallback(
					v.coerce(v.number([v.minValue(1)]), (v) => Number(v)),
					1
				),
				itemsPerPage: v.fallback(
					v.coerce(v.number([v.minValue(10), v.maxValue(50), v.multipleOf(10)]), (v) => Number(v)),
					20
				)
			})
		})
	);
</script>

<pre>{JSON.stringify($params, null, 2)}</pre>

<input type="number" bind:value={$params.page} />
<input type="number" bind:value={$params.itemsPerPage} step="10" />
