/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { AbuseReportNotificationRecipientRepository, MiAbuseReportNotificationRecipient } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { Packed } from '@/misc/json-schema.js';
import { SystemWebhookEntityService } from '@/core/entities/SystemWebhookEntityService.js';

@Injectable()
export class AbuseReportNotificationRecipientEntityService {
	constructor(
		@Inject(DI.abuseReportNotificationRecipientRepository)
		private abuseReportNotificationRecipientRepository: AbuseReportNotificationRecipientRepository,
		private userEntityService: UserEntityService,
		private systemWebhookEntityService: SystemWebhookEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: MiAbuseReportNotificationRecipient['id'] | MiAbuseReportNotificationRecipient,
		opts?: {
			users: Map<string, Packed<'UserLite'>>,
			webhooks: Map<string, Packed<'SystemWebhook'>>,
		},
	): Promise<Packed<'AbuseReportNotificationRecipient'>> {
		const recipient = typeof src === 'object'
			? src
			: await this.abuseReportNotificationRecipientRepository.findOneByOrFail({ id: src });
		const user = recipient.userId
			? (opts?.users.get(recipient.userId) ?? await this.userEntityService.pack<'UserLite'>(recipient.userId))
			: undefined;
		const webhook = recipient.systemWebhookId
			? (opts?.webhooks.get(recipient.systemWebhookId) ?? await this.systemWebhookEntityService.pack(recipient.systemWebhookId))
			: undefined;

		return {
			id: recipient.id,
			isActive: recipient.isActive,
			updatedAt: recipient.updatedAt.toISOString(),
			name: recipient.name,
			method: recipient.method,
			userId: recipient.userId ?? undefined,
			user: user,
			systemWebhookId: recipient.systemWebhookId ?? undefined,
			systemWebhook: webhook,
		};
	}

	@bindThis
	public async packMany(
		src: MiAbuseReportNotificationRecipient['id'][] | MiAbuseReportNotificationRecipient[],
	): Promise<Packed<'AbuseReportNotificationRecipient'>[]> {
		const objs = src.filter((it): it is MiAbuseReportNotificationRecipient => typeof it === 'object');
		const ids = src.filter((it): it is MiAbuseReportNotificationRecipient['id'] => typeof it === 'string');
		if (ids.length > 0) {
			objs.push(
				...await this.abuseReportNotificationRecipientRepository.findBy({ id: In(ids) }),
			);
		}

		const userIds = objs.map(it => it.userId).filter(x => x != null);
		const users: Map<string, Packed<'UserLite'>> = (userIds.length > 0)
			? await this.userEntityService.packMany(userIds)
				.then(it => new Map(it.map(it => [it.id, it])))
			: new Map();

		const systemWebhookIds = objs.map(it => it.systemWebhookId).filter(x => x != null);
		const systemWebhooks: Map<string, Packed<'SystemWebhook'>> = (systemWebhookIds.length > 0)
			? await this.systemWebhookEntityService.packMany(systemWebhookIds)
				.then(it => new Map(it.map(it => [it.id, it])))
			: new Map();

		return Promise
			.all(
				objs.map(it => this.pack(it, { users: users, webhooks: systemWebhooks })),
			)
			.then(it => it.sort((a, b) => a.id.localeCompare(b.id)));
	}
}

