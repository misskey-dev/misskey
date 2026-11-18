/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { AccessTokensRepository, MiAccessToken, MiApp, MiUser } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { PushNotificationService } from '@/core/PushNotificationService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class AccessTokenService {
	constructor(
		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		private idService: IdService,
		private pushNotificationService: PushNotificationService,
		private notificationService: NotificationService,
	) {
	}

	@bindThis
	public async create(params: {
		userId: MiUser['id'];
		token: string;
		/** 省略時は token と同じ値 */
		hash?: string;
		appId?: MiApp['id'] | null;
		session?: string | null;
		name?: string | null;
		description?: string | null;
		iconUrl?: string | null;
		permission?: string[];
	}): Promise<MiAccessToken> {
		const now = new Date();

		const accessToken = {
			id: this.idService.gen(now.getTime()),
			lastUsedAt: now,
			userId: params.userId,
			token: params.token,
			hash: params.hash ?? params.token,
			appId: params.appId ?? null,
			session: params.session ?? null,
			name: params.name ?? null,
			description: params.description ?? null,
			iconUrl: params.iconUrl ?? null,
			permission: params.permission ?? [],
		} satisfies Partial<MiAccessToken>;

		await this.accessTokensRepository.insert(accessToken);

		this.notificationService.createNotification(params.userId, 'createToken', {});

		return {
			...accessToken,
			fetched: false,
			user: null,
			app: null,
		};
	}

	@bindThis
	public async delete(accessToken: Pick<MiAccessToken, 'id' | 'userId'>): Promise<void> {
		await this.accessTokensRepository.delete({ id: accessToken.id });

		// トークンに紐づくプッシュ通知の購読は外部キー (ON DELETE CASCADE) により併せて削除される
		this.pushNotificationService.refreshCache(accessToken.userId);
	}
}
