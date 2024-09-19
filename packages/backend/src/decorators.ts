/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// https://github.com/andreypopp/autobind-decorator

/**
 * Return a descriptor removing the value and returning a getter
 * The getter will return a .bind version of the function
 * and memoize the result against a symbol on the instance
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bindThis(target: any, key: string, descriptor: any) {
	const fn = descriptor.value;

	if (typeof fn !== 'function') {
		throw new TypeError(`@bindThis decorator can only be applied to methods not: ${typeof fn}`);
	}

	return {
		configurable: true,
		get() {
			// eslint-disable-next-line no-prototype-builtins
			if (this === target.prototype || this.hasOwnProperty(key)) {
				return fn;
			}

			const boundFn = fn.bind(this);
			Reflect.defineProperty(this, key, {
				value: boundFn,
				configurable: true,
				writable: true,
			});

			return boundFn;
		},
	};
}
