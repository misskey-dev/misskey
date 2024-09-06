/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';
import type { Schema } from '@/misc/json-schema.js';
import type { AccessTokensRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	requireCredential: true,

	secure: true,
} as const satisfies IEndpointMeta;

export const paramDef = {
	type: 'object',
	properties: {
		tokenId: { type: 'string', format: 'misskey:id' },
		token: { type: 'string', nullable: true },
	},
	anyOf: [
		{ required: ['tokenId'] },
		{ required: ['token'] },
	],
} as const satisfies Schema;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (ps.tokenId) {
				const tokenExist = await this.accessTokensRepository.exists({ where: { id: ps.tokenId } });

				if (tokenExist) {
					await this.accessTokensRepository.delete({
						id: ps.tokenId,
						userId: me.id,
					});
				}
			} else if (ps.token) {
				const tokenExist = await this.accessTokensRepository.exists({ where: { token: ps.token } });

				if (tokenExist) {
					await this.accessTokensRepository.delete({
						token: ps.token,
						userId: me.id,
					});
				}
			}
		});
	}
}
