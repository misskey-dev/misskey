/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// NIRAX --- A lightweight router

import { onMounted, shallowRef } from 'vue';
import { EventEmitter } from 'eventemitter3';
import type { Component, ShallowRef } from 'vue';

function safeURIDecode(str: string): string {
	try {
		return decodeURIComponent(str);
	} catch {
		return str;
	}
}

interface RouteDefBase {
	path: string;
	query?: Record<string, string>;
	loginRequired?: boolean;
	name?: string;
	hash?: string;
	children?: RouteDef[];
}

interface RouteDefWithComponent extends RouteDefBase {
	component: Component,
}

interface RouteDefWithRedirect extends RouteDefBase {
	redirect: string | ((props: Map<string, string | boolean>) => string);
}

export type RouteDef = RouteDefWithComponent | RouteDefWithRedirect;

export type RouterFlag = 'forcePage';

type ParsedPath = (string | {
	name: string;
	startsWith?: string;
	wildcard?: boolean;
	optional?: boolean;
})[];

export type RouterEvent = {
	change: (ctx: {
		beforePath: string;
		path: string;
		resolved: Resolved;
	}) => void;
	replace: (ctx: {
		path: string;
	}) => void;
	push: (ctx: {
		beforePath: string;
		path: string;
		route: RouteDef | null;
		props: Map<string, string> | null;
	}) => void;
	same: () => void;
};

export type Resolved = {
	route: RouteDef;
	props: Map<string, string | boolean>;
	child?: Resolved;
	redirected?: boolean;

	/** @internal */
	_parsedRoute: {
		fullPath: string;
		queryString: string | null;
		hash: string | null;
	};
};

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
		} else if (part.length !== 0) {
			res.push(part);
		}
	}

	return res;
}

export class Nirax<DEF extends RouteDef[]> extends EventEmitter<RouterEvent> {
	private routes: DEF;
	public current: Resolved;
	public currentRef: ShallowRef<Resolved>;
	public currentRoute: ShallowRef<RouteDef>;
	private currentPath: string;
	private isLoggedIn: boolean;
	private notFoundPageComponent: Component;
	private redirectCount = 0;

	public navHook: ((path: string, flag?: RouterFlag) => boolean) | null = null;

	constructor(routes: DEF, currentPath: Nirax<DEF>['currentPath'], isLoggedIn: boolean, notFoundPageComponent: Component) {
		super();

		this.routes = routes;
		this.current = this.resolve(currentPath)!;
		this.currentRef = shallowRef(this.current);
		this.currentRoute = shallowRef(this.current.route);
		this.currentPath = currentPath;
		this.isLoggedIn = isLoggedIn;
		this.notFoundPageComponent = notFoundPageComponent;
	}

	public init() {
		const res = this.navigate(this.currentPath, false);
		this.emit('replace', {
			path: res._parsedRoute.fullPath,
		});
	}

	public resolve(path: string): Resolved | null {
		const fullPath = path;
		let queryString: string | null = null;
		let hash: string | null = null;
		if (path[0] === '/') path = path.substring(1);
		if (path.includes('#')) {
			hash = path.substring(path.indexOf('#') + 1);
			path = path.substring(0, path.indexOf('#'));
		}
		if (path.includes('?')) {
			queryString = path.substring(path.indexOf('?') + 1);
			path = path.substring(0, path.indexOf('?'));
		}

		const _parsedRoute = {
			fullPath,
			queryString,
			hash,
		};

		function check(routes: RouteDef[], _parts: string[]): Resolved | null {
			forEachRouteLoop:
			for (const route of routes) {
				let parts = [..._parts];
				const props = new Map<string, string>();

				pathMatchLoop:
				for (const p of parsePath(route.path)) {
					if (typeof p === 'string') {
						if (p === parts[0]) {
							parts.shift();
						} else {
							continue forEachRouteLoop;
						}
					} else {
						if (parts[0] == null && !p.optional) {
							continue forEachRouteLoop;
						}
						if (p.wildcard) {
							if (parts.length !== 0) {
								props.set(p.name, safeURIDecode(parts.join('/')));
								parts = [];
							}
							break pathMatchLoop;
						} else {
							if (p.startsWith) {
								if (parts[0] == null || !parts[0].startsWith(p.startsWith)) continue forEachRouteLoop;

								props.set(p.name, safeURIDecode(parts[0].substring(p.startsWith.length)));
								parts.shift();
							} else {
								if (parts[0]) {
									props.set(p.name, safeURIDecode(parts[0]));
								}
								parts.shift();
							}
						}
					}
				}

				if (parts.length === 0) {
					if (route.children) {
						const child = check(route.children, []);
						if (child) {
							return {
								route,
								props,
								child,
								_parsedRoute,
							};
						} else {
							continue forEachRouteLoop;
						}
					}

					if (route.hash != null && hash != null) {
						props.set(route.hash, safeURIDecode(hash));
					}

					if (route.query != null && queryString != null) {
						const queryObject = [...new URLSearchParams(queryString).entries()]
							.reduce((obj, entry) => ({ ...obj, [entry[0]]: entry[1] }), {});

						for (const q in route.query) {
							const as = route.query[q];
							if (queryObject[q]) {
								props.set(as, safeURIDecode(queryObject[q]));
							}
						}
					}

					return {
						route,
						props,
						_parsedRoute,
					};
				} else {
					if (route.children) {
						const child = check(route.children, parts);
						if (child) {
							return {
								route,
								props,
								child,
								_parsedRoute,
							};
						} else {
							continue forEachRouteLoop;
						}
					} else {
						continue forEachRouteLoop;
					}
				}
			}

			return null;
		}

		const _parts = path.split('/').filter(part => part.length !== 0);

		return check(this.routes, _parts);
	}

	private navigate(path: string, emitChange = true, _redirected = false): Resolved {
		const beforePath = this.currentPath;
		this.currentPath = path;

		const res = this.resolve(this.currentPath);

		if (res == null) {
			throw new Error('no route found for: ' + path);
		}

		if ('redirect' in res.route) {
			let redirectPath: string;
			if (typeof res.route.redirect === 'function') {
				redirectPath = res.route.redirect(res.props);
			} else {
				redirectPath = res.route.redirect + (res._parsedRoute.queryString ? '?' + res._parsedRoute.queryString : '') + (res._parsedRoute.hash ? '#' + res._parsedRoute.hash : '');
			}
			if (_DEV_) console.log('Redirecting to: ', redirectPath);
			if (_redirected && this.redirectCount++ > 10) {
				throw new Error('redirect loop detected');
			}
			return this.navigate(redirectPath, emitChange, true);
		}

		if (res.route.loginRequired && !this.isLoggedIn) {
			res.route.component = this.notFoundPageComponent;
			res.props.set('showLoginPopup', true);
		}

		this.current = res;
		this.currentRef.value = res;
		this.currentRoute.value = res.route;

		if (emitChange && res.route.path !== '/:(*)') {
			this.emit('change', {
				beforePath,
				path,
				resolved: res,
			});
		}

		this.redirectCount = 0;
		return {
			...res,
			redirected: _redirected,
		};
	}

	public getCurrentPath() {
		return this.currentPath;
	}

	public push(path: string, flag?: RouterFlag) {
		const beforePath = this.currentPath;
		if (path === beforePath) {
			this.emit('same');
			return;
		}
		if (this.navHook) {
			const cancel = this.navHook(path, flag);
			if (cancel) return;
		}
		const res = this.navigate(path);
		if (res.route.path === '/:(*)') {
			location.href = path;
		} else {
			this.emit('push', {
				beforePath,
				path: res._parsedRoute.fullPath,
				route: res.route,
				props: res.props,
			});
		}
	}

	public replace(path: string) {
		const res = this.navigate(path);
		this.emit('replace', {
			path: res._parsedRoute.fullPath,
		});
	}
}
