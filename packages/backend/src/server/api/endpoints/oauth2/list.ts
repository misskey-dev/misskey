/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { MiOAuth2ServersRepository } from '@/models/_.js';

export const meta = {
	requireCredential: false,
	allowGet: true,

	tags: ['oauth2'],
} as const;

export const paramDef = {} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.oauth2ServersRepository)
		private oauth2ServersRepository: MiOAuth2ServersRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const res = await this.oauth2ServersRepository.find();

			return res.map(e => ({
				id: e.id,
				title: e.title,
			}));
		});
	}
}
