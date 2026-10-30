/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AccessTokensRepository } from '@/models/_.js';
import type { MiAccessToken } from '@/models/AccessToken.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

export const meta = {
	description: 'Revoke an access token of the authenticated user. Requires credential. When called with an access token (third-party app), only the token currently in use can be revoked.',

	// アクセストークン自身を失効させられるようにするため requireCredential は使わず、
	// 認証・権限チェックを実装内で行う (ApiCallService が requireCredential:true かつ kind なしの
	// エンドポイントへのトークン経由のリクエストを一律 PERMISSION_DENIED にするため)

	errors: {
		credentialRequired: {
			message: 'Credential required.',
			code: 'CREDENTIAL_REQUIRED',
			id: '6f1f0d3a-3d5b-4b1f-9c3e-2a6d1e5b8c47',
			httpStatusCode: 401,
		},
		permissionDenied: {
			message: 'Permission denied.',
			code: 'PERMISSION_DENIED',
			id: 'fc20d118-5705-4462-b6c5-2b5b43092cf3',
			httpStatusCode: 403,
		},
	},
} as const;

export const paramDef = {
	anyOf: [
		{
			type: 'object',
			properties: {
				tokenId: { type: 'string', format: 'misskey:id' },
			},
			required: ['tokenId'],
		},
		{
			type: 'object',
			properties: {
				token: { type: 'string', nullable: true },
			},
			required: ['token'],
		},
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,
	) {
		super(meta, paramDef, async (ps, me, token) => {
			if (me == null) {
				throw new ApiError(meta.errors.credentialRequired);
			}

			let target: MiAccessToken | null = null;
			if ('tokenId' in ps) {
				target = await this.accessTokensRepository.findOneBy({ id: ps.tokenId, userId: me.id });
			} else {
				if (ps.token == null || ps.token === '') return;
				target = await this.accessTokensRepository.findOneBy({ token: ps.token, userId: me.id });
			}

			if (target == null) return;

			// サードパーティアプリ (アクセストークン) からのリクエストでは、いま使われているトークン自身のみ失効できる
			if (token != null && token.id !== target.id) {
				throw new ApiError(meta.errors.permissionDenied);
			}

			await this.accessTokensRepository.delete({ id: target.id });
		});
	}
}
