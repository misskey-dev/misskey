/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { deepClone } from './clone.js';
import type { Cloneable } from './clone.js';

function isPureObject(value: unknown): value is Record<string | number | symbol, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * valueにないキーをdefからもらう（再帰的）\
 * nullはそのまま、undefinedはdefの値
 **/
export function deepMerge<X extends Record<string | number | symbol, unknown>>(value: X, def: X): X {
	if (isPureObject(value) && isPureObject(def)) {
		const result = deepClone(value as Cloneable) as X;
		for (const [k, v] of Object.entries(def) as [keyof X, X[keyof X]][]) {
			if (!Object.prototype.hasOwnProperty.call(value, k) || value[k] === undefined) {
				result[k] = v;
			} else if (isPureObject(v) && isPureObject(result[k])) {
				const child = deepClone(result[k] as Cloneable) as X[keyof X] & Record<string | number | symbol, unknown>;
				result[k] = deepMerge<typeof v>(child, v);
			}
		}
		return result;
	}
	return value;
}
