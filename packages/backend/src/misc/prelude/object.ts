/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function getObjKeys<T extends { [x: string]: unknown }>(obj: T): (keyof T)[] {
	return Object.keys(obj);
}
