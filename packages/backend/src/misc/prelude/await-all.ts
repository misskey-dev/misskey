/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type Promiseable<T> = {
	[K in keyof T]: Promise<T[K]> | T[K];
};

export async function awaitAll<T>(obj: Promiseable<T>): Promise<T> {
	const target = {} as T;
	const keys = Object.keys(obj) as unknown as (keyof T)[];
	const values = Object.values(obj) as any[];

	const resolvedValues = await Promise.all(values.map(value =>
		(!value || !value.constructor || value.constructor.name !== 'Object')
			? value
			: awaitAll(value),
	));

	for (let i = 0; i < keys.length; i++) {
		target[keys[i]] = resolvedValues[i];
	}

	return target;
}
