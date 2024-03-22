import { resolveRoute } from '$app/paths';

type RequiredKeys<T extends object> = keyof {
	// eslint-disable-next-line @typescript-eslint/ban-types
	[P in keyof T as {} extends Pick<T, P> ? never : P]: 1;
};

export type RoutesManifest = Record<string, Record<string, string>>;

export interface RouteBuilder<Routes extends RoutesManifest> {
	<RouteId extends keyof Routes>(
		options: {
			routeId: RouteId;
			query?: Record<string, string> | URLSearchParams;
			hash?: string;
		} & (RequiredKeys<Routes[RouteId]> extends never
			? { params?: Routes[RouteId] }
			: { params: Routes[RouteId] })
	): string;
}

export function createRouteBuilder<Routes extends RoutesManifest>(): RouteBuilder<Routes> {
	return (({ routeId, params = {}, query = {}, hash }: any) => {
		const path = resolveRoute(routeId, params).replace(/^\./, '');
		const search = new URLSearchParams(query).toString();

		return path + (search ? `?${search}` : '') + (hash ? `#${hash}` : '');
	}) as any;
}
