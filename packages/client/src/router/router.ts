import { EventEmitter } from 'eventemitter3';
import { Ref, Component, ref } from 'vue';

type RoutePathDef = (string | {
	name: string;
	startsWith?: string;
	wildcard?: boolean;
	optional?: boolean;
	default?: string;
})[];

type RouteDef = {
	path: RoutePathDef;
	component: Component;
};

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

		this.navigate(currentPath, true);
	}

	private resolve(path: string): { route: RouteDef; props: Map<string, string>; } | null {
		if (path[0] === '/') path = path.substring(1);

		for (const route of this.routes) {
			const parts = path.split('/');
			const props = new Map<string, string>();

			forEachRouteLoop:
			for (const p of route.path) {
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

						props.set(p.name, parts[0] ?? p.default);
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

	private navigate(path: string, initial = false) {
		const beforePath = this.currentPath;
		this.currentPath = path;

		const res = this.resolve(this.currentPath);

		if (res) {
			this.currentComponent = res.route.component;
			this.currentProps = res.props;
			this.currentRoute.value = res.route;

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

	public getCurrentKey() {
		return this.currentKey;
	}

	public push(path: string) {
		const beforePath = this.currentPath;
		this.currentKey = Date.now().toString();
		this.navigate(path);
		this.emit('push', {
			beforePath,
			path,
			route: this.currentRoute.value,
			props: this.currentProps,
			key: this.currentKey,
		});
	}

	public change(path: string, key?: string | null) {
		this.currentKey = key ?? Date.now().toString();
		this.navigate(path);
	}
}
