import { EventEmitter } from 'eventemitter3';
import { Ref, Component, ref } from 'vue';

type RouteDef = {
	path: string;
	component: Component;
	name?: string;
	globalCacheKey?: string;
};

type ParsedPath = (string | {
	name: string;
	startsWith?: string;
	wildcard?: boolean;
	optional?: boolean;
})[];

function parsePath(path: string): ParsedPath {
	const res = [] as ParsedPath;

	path = path.substring(1);

	for (const part of path.split('/')) {
		if (part.includes(':')) {
			const prefix = part.substring(0, part.indexOf(':'));
			const placeholder = part.substring(part.indexOf(':') + 1);
			const wildcard = placeholder.includes('(*)');
			const optional = placeholder.endsWith('?');
			res.push({
				name: placeholder.replace('(*)', '').replace('?', ''),
				startsWith: prefix !== '' ? prefix : undefined,
				wildcard,
				optional,
			});
		} else {
			res.push(part);
		}
	}

	return res;
}

export class Router extends EventEmitter<{
	change: (ctx: {
		beforePath: string;
		path: string;
		route: RouteDef | null;
		props: Map<string, string> | null;
		key: string;
	}) => void;
	push: (ctx: {
		beforePath: string;
		path: string;
		route: RouteDef | null;
		props: Map<string, string> | null;
		key: string;
	}) => void;
}> {
	private routes: RouteDef[];
	private currentPath: string;
	private currentComponent: Component | null = null;
	private currentProps: Map<string, string> | null = null;
	private currentKey = Date.now().toString();

	public currentRoute: Ref<RouteDef | null> = ref(null);

	constructor(routes: Router['routes'], currentPath: Router['currentPath']) {
		super();

		this.routes = routes;
		this.currentPath = currentPath;
		this.navigate(currentPath, null, true);
	}

	private resolve(path: string): { route: RouteDef; props: Map<string, string>; } | null {
		if (path[0] === '/') path = path.substring(1);

		for (const route of this.routes) {
			const parts = path.split('/');
			const props = new Map<string, string>();

			forEachRouteLoop:
			for (const p of parsePath(route.path)) {
				if (typeof p === 'string') {
					if (p === parts[0]) {
						parts.shift();
					} else {
						break forEachRouteLoop;
					}
				} else {
					if (parts[0] == null && !p.optional) {
						break forEachRouteLoop;
					}
					if (p.wildcard) {
						// TODO
					} else {
						if (p.startsWith && (parts[0] == null || !parts[0].startsWith(p.startsWith))) break forEachRouteLoop;

						props.set(p.name, parts[0]);
						parts.shift();
					}
				}
			}

			if (parts.length === 0) {
				return {
					route,
					props,
				};
			}
		}

		return null;
	}

	private navigate(path: string, key: string | null | undefined, initial = false) {
		const beforePath = this.currentPath;
		this.currentPath = path;

		const res = this.resolve(this.currentPath);

		if (res) {
			this.currentComponent = res.route.component;
			this.currentProps = res.props;
			this.currentRoute.value = res.route;
			this.currentKey = this.currentRoute.value.globalCacheKey ?? key ?? Date.now().toString();

			if (!initial) {
				this.emit('change', {
					beforePath,
					path,
					route: this.currentRoute.value,
					props: this.currentProps,
					key: this.currentKey,
				});
			}
		} else {
			// not found
		}
	}

	public getCurrentComponent() {
		return this.currentComponent;
	}

	public getCurrentProps() {
		return this.currentProps;
	}

	public getCurrentPath() {
		return this.currentPath;
	}

	public getCurrentKey() {
		return this.currentKey;
	}

	public push(path: string) {
		const beforePath = this.currentPath;
		this.navigate(path, null);
		this.emit('push', {
			beforePath,
			path,
			route: this.currentRoute.value,
			props: this.currentProps,
			key: this.currentKey,
		});
	}

	public change(path: string, key?: string | null) {
		this.navigate(path, key);
	}
}
