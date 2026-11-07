/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

declare module '*/package.json' {
	interface IRepository {
		type: string;
		url: string;
	}

	export const name: string;
	export const version: string;
	export const repository: IRepository;
}
