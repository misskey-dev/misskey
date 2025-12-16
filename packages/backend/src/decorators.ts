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
export function bindThis(target: any, key: string, descriptor: any) {
	const fn = descriptor.value;

	if (typeof fn !== 'function') {
		throw new TypeError(`@bindThis decorator can only be applied to methods not: ${typeof fn}`);
	}

	return {
		configurable: true,
		get() {
			if (this === target.prototype || Object.hasOwn(this, key)) {
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
