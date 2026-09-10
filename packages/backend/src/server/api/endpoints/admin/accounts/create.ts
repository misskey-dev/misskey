/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { MiMeta, UsersRepository } from '@/models/_.js';
import { SignupService } from '@/core/SignupService.js';
import { RoleService } from '@/core/RoleService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { localUsernameSchema, passwordSchema } from '@/models/User.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { ApiError } from '@/server/api/error.js';
import * as mi from '@/misc/schema/index.js';
import {
	packedUserLiteSchema,
	packedUserDetailedNotMeOnlySchema,
	packedMeDetailedOnlySchema,
} from '@/models/schema/user.js';
import type { PackedMeDetailed } from '@/models/schema/user.js';

// legacy の `allOf: [{ ref: 'MeDetailed' }, { token }]` の inline パート
const createdAccountTokenSchema = v.object({
	token: v.string(),
});

export const meta = {
	tags: ['admin'],

	errors: {
		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '1fb7cb09-d46a-4fff-b8df-057708cce513',
		},

		wrongInitialPassword: {
			message: 'Initial password is incorrect.',
			code: 'INCORRECT_INITIAL_PASSWORD',
			id: '97147c55-1ae1-4f6f-91d6-e1c3e0e76d62',
		},
	},

	// NOTE: endpoint の res 側の allOf 合成には mi.composeEntity() (entity 登録が必須) が使えないので、
	// マージ済み object に allOfParts メタデータだけを直接載せて現行の `allOf` 出力を維持する
	// (MeDetailed = UserLite + UserDetailedNotMeOnly + MeDetailedOnly の合成)
	res: v.pipe(
		v.object({
			...packedUserLiteSchema.entries,
			...packedUserDetailedNotMeOnlySchema.entries,
			...packedMeDetailedOnlySchema.entries,
			...createdAccountTokenSchema.entries,
		}),
		mi.schemaMeta({ allOfParts: ['MeDetailed', createdAccountTokenSchema] }),
	),
} as const;

export const paramDef = v.object({
	username: localUsernameSchema,
	password: passwordSchema,
	setupPassword: v.nullish(v.string()),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private serverSettings: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
		private signupService: SignupService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, _me, token) => {
			const me = _me ? await this.usersRepository.findOneByOrFail({ id: _me.id }) : null;

			if (this.serverSettings.rootUserId == null && me == null && token == null) {
				// 初回セットアップの場合
				if (this.config.setupPassword != null) {
					// 初期パスワードが設定されている場合
					if (ps.setupPassword !== this.config.setupPassword) {
						// 初期パスワードが違う場合
						throw new ApiError(meta.errors.wrongInitialPassword);
					}
				} else if (ps.setupPassword != null && ps.setupPassword.trim() !== '') {
					// 初期パスワードが設定されていないのに初期パスワードが入力された場合
					throw new ApiError(meta.errors.wrongInitialPassword);
				}
			} else if (token !== null || !(await this.roleService.isAdministrator(me))) {
				// 初回セットアップではなく、管理者でない場合 or 外部トークンを使用している場合
				throw new ApiError(meta.errors.accessDenied);
			}

			const { account, secret } = await this.signupService.signup({
				username: ps.username,
				password: ps.password,
				ignorePreservedUsernames: true,
			});

			const res = await this.userEntityService.pack(account, account, {
				schema: 'MeDetailed',
				includeSecrets: true,
			}) as PackedMeDetailed & { token: string };

			res.token = secret;

			return res;
		});
	}
}
