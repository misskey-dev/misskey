/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// https://github.com/andreypopp/autobind-decorator

/**
 * Return a descriptor removing the value and returning a getter
 * The getter will return a .bind version of the function
 * and memoize the result against a symbol on the instance
 */
export function bindThis(target: any, key: string, descriptor: any) {
	let fn = descriptor.value;

	if (typeof fn !== 'function') {
		throw new TypeError(`@bindThis decorator can only be applied to methods not: ${typeof fn}`);
	}

	return {
		configurable: true,
		get() {
			// eslint-disable-next-line no-prototype-builtins
			if (this === target.prototype || this.hasOwnProperty(key) ||
        typeof fn !== 'function') {
				return fn;
			}

			const boundFn = fn.bind(this);
			Object.defineProperty(this, key, {
				configurable: true,
				get() {
					return boundFn;
				},
				set(value) {
					fn = value;
					delete this[key];
				},
			});
			return boundFn;
		},
		set(value: any) {
			fn = value;
		},
	};
}
