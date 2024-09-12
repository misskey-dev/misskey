/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as Misskey from 'misskey-js';

export type FilteredEndpointsByResType<T extends Record<string, { req: unknown; res: unknown; }>, U> = {
  [P in keyof T]: T[P]['res'] extends U ? P : never
}[keyof T];

export type EndpointsWithArrayResponse = FilteredEndpointsByResType<Misskey.Endpoints, Array<unknown>>;

export type MisskeyAPIEntity<E extends EndpointsWithArrayResponse> = {
	id: string;
	createdAt: string;
	_shouldInsertAd_?: boolean;
} & Misskey.Endpoints[E]['res'][number];

export type MisskeyEntity = {
	id: string;
	createdAt: string;
	_shouldInsertAd_?: boolean;
	[x: string]: any;
};
