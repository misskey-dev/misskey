/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { Brackets, In, IsNull, Not } from 'typeorm';
import * as Redis from 'ioredis';
import sanitizeHtml from 'sanitize-html';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { GlobalEvents, GlobalEventService } from '@/core/GlobalEventService.js';
import type {
	AbuseReportNotificationRecipientRepository,
	MiAbuseReportNotificationRecipient,
	MiAbuseUserReport,
	MiMeta,
	MiUser,
} from '@/models/_.js';
import { EmailService } from '@/core/EmailService.js';
import { RoleService } from '@/core/RoleService.js';
import { RecipientMethod } from '@/models/AbuseReportNotificationRecipient.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { SystemWebhookService } from '@/core/SystemWebhookService.js';
import { IdService } from './IdService.js';

@Injectable()
export class AbuseReportNotificationService implements OnApplicationShutdown {
	constructor(
		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.abuseReportNotificationRecipientRepository)
		private abuseReportNotificationRecipientRepository: AbuseReportNotificationRecipientRepository,

		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,

		private idService: IdService,
		private roleService: RoleService,
		private systemWebhookService: SystemWebhookService,
		private emailService: EmailService,
		private moderationLogService: ModerationLogService,
		private globalEventService: GlobalEventService,
	) {
		this.redisForSub.on('message', this.onMessage);
	}

	/**
	 * 管理者用Redisイベントを用いて{@link abuseReports}の内容を管理者各位に通知する.
	 * 通知先ユーザは{@link getModeratorIds}の取得結果に依る.
	 *
	 * @see RoleService.getModeratorIds
	 * @see GlobalEventService.publishAdminStream
	 */
	@bindThis
	public async notifyAdminStream(abuseReports: MiAbuseUserReport[]) {
		if (abuseReports.length <= 0) {
			return;
		}

		const moderatorIds = await this.roleService.getModeratorIds(true, true);

		for (const moderatorId of moderatorIds) {
			for (const abuseReport of abuseReports) {
				this.globalEventService.publishAdminStream(
					moderatorId,
					'newAbuseUserReport',
					{
						id: abuseReport.id,
						targetUserId: abuseReport.targetUserId,
						reporterId: abuseReport.reporterId,
						comment: abuseReport.comment,
					},
				);
			}
		}
	}

	/**
	 * Mailを用いて{@link abuseReports}の内容を管理者各位に通知する.
	 * メールアドレスの送信先は以下の通り.
	 * - モデレータ権限所有者ユーザ(設定画面からメールアドレスの設定を行っているユーザに限る)
	 * - metaテーブルに設定されているメールアドレス
	 *
	 * @see EmailService.sendEmail
	 */
	@bindThis
	public async notifyMail(abuseReports: MiAbuseUserReport[]) {
		if (abuseReports.length <= 0) {
			return;
		}

		const recipientEMailAddresses = await this.fetchEMailRecipients().then(it => it
			.filter(it => it.isActive && it.userProfile?.emailVerified)
			.map(it => it.userProfile?.email)
			.filter(x => x != null),
		);

		recipientEMailAddresses.push(
			...(this.meta.email ? [this.meta.email] : []),
		);

		if (recipientEMailAddresses.length <= 0) {
			return;
		}

		for (const mailAddress of recipientEMailAddresses) {
			await Promise.all(
				abuseReports.map(it => {
					// TODO: 送信処理はJobQueue化したい
					return this.emailService.sendEmail(
						mailAddress,
						'New Abuse Report',
						sanitizeHtml(it.comment),
						sanitizeHtml(it.comment),
					);
				}),
			);
		}
	}

	/**
	 * SystemWebhookを用いて{@link abuseReports}の内容を管理者各位に通知する.
	 * ここではJobQueueへのエンキューのみを行うため、即時実行されない.
	 *
	 * @see SystemWebhookService.enqueueSystemWebhook
	 */
	@bindThis
	public async notifySystemWebhook(
		abuseReports: MiAbuseUserReport[],
		type: 'abuseReport' | 'abuseReportResolved',
	) {
		if (abuseReports.length <= 0) {
			return;
		}

		const recipientWebhookIds = await this.fetchWebhookRecipients()
			.then(it => it
				.filter(it => it.isActive && it.systemWebhookId && it.method === 'webhook')
				.map(it => it.systemWebhookId)
				.filter(x => x != null));
		for (const webhookId of recipientWebhookIds) {
			await Promise.all(
				abuseReports.map(it => {
					return this.systemWebhookService.enqueueSystemWebhook(
						webhookId,
						type,
						it,
					);
				}),
			);
		}
	}

	/**
	 * 通報の通知先一覧を取得する.
	 *
	 * @param {Object} [params] クエリの取得条件
	 * @param {Object} [params.method] 取得する通知先の通知方法
	 * @param {Object} [opts] 動作時の詳細なオプション
	 * @param {boolean} [opts.removeUnauthorized] 副作用としてモデレータ権限を持たない送信先ユーザをDBから削除するかどうか(default: true)
	 * @param {boolean} [opts.joinUser] 通知先のユーザ情報をJOINするかどうか(default: false)
	 * @param {boolean} [opts.joinSystemWebhook] 通知先のSystemWebhook情報をJOINするかどうか(default: false)
	 * @see removeUnauthorizedRecipientUsers
	 */
	@bindThis
	public async fetchRecipients(
		params?: {
			ids?: MiAbuseReportNotificationRecipient['id'][],
			method?: RecipientMethod[],
		},
		opts?: {
			removeUnauthorized?: boolean,
			joinUser?: boolean,
			joinSystemWebhook?: boolean,
		},
	): Promise<MiAbuseReportNotificationRecipient[]> {
		const query = this.abuseReportNotificationRecipientRepository.createQueryBuilder('recipient');

		if (opts?.joinUser) {
			query.innerJoinAndSelect('user', 'user', 'recipient.userId = user.id');
			query.innerJoinAndSelect('recipient.userProfile', 'userProfile');
		}

		if (opts?.joinSystemWebhook) {
			query.innerJoinAndSelect('recipient.systemWebhook', 'systemWebhook');
		}

		if (params?.ids) {
			query.andWhere({ id: In(params.ids) });
		}

		if (params?.method) {
			query.andWhere(new Brackets(qb => {
				if (params.method?.includes('email')) {
					qb.orWhere({ method: 'email', userId: Not(IsNull()) });
				}
				if (params.method?.includes('webhook')) {
					qb.orWhere({ method: 'webhook', userId: IsNull() });
				}
			}));
		}

		const recipients = await query.getMany();
		if (recipients.length <= 0) {
			return [];
		}

		// アサイン有効期限切れはイベントで拾えないので、このタイミングでチェック及び削除（オプション）
		return (opts?.removeUnauthorized ?? true)
			? await this.removeUnauthorizedRecipientUsers(recipients)
			: recipients;
	}

	/**
	 * EMailの通知先一覧を取得する.
	 * リレーション先の{@link MiUser}および{@link MiUserProfile}も同時に取得する.
	 *
	 * @param {Object} [opts]
	 * @param {boolean} [opts.removeUnauthorized] 副作用としてモデレータ権限を持たない送信先ユーザをDBから削除するかどうか(default: true)
	 * @see removeUnauthorizedRecipientUsers
	 */
	@bindThis
	public async fetchEMailRecipients(opts?: {
		removeUnauthorized?: boolean
	}): Promise<MiAbuseReportNotificationRecipient[]> {
		return this.fetchRecipients({ method: ['email'] }, { joinUser: true, ...opts });
	}

	/**
	 * Webhookの通知先一覧を取得する.
	 * リレーション先の{@link MiSystemWebhook}も同時に取得する.
	 */
	@bindThis
	public fetchWebhookRecipients(): Promise<MiAbuseReportNotificationRecipient[]> {
		return this.fetchRecipients({ method: ['webhook'] }, { joinSystemWebhook: true });
	}

	/**
	 * 通知先を作成する.
	 */
	@bindThis
	public async createRecipient(
		params: {
			isActive: MiAbuseReportNotificationRecipient['isActive'];
			name: MiAbuseReportNotificationRecipient['name'];
			method: MiAbuseReportNotificationRecipient['method'];
			userId: MiAbuseReportNotificationRecipient['userId'];
			systemWebhookId: MiAbuseReportNotificationRecipient['systemWebhookId'];
		},
		updater: MiUser,
	): Promise<MiAbuseReportNotificationRecipient> {
		const id = this.idService.gen();
		await this.abuseReportNotificationRecipientRepository.insert({
			...params,
			id,
		});

		const created = await this.abuseReportNotificationRecipientRepository.findOneByOrFail({ id: id });

		this.moderationLogService
			.log(updater, 'createAbuseReportNotificationRecipient', {
				recipientId: id,
				recipient: created,
			})
			.then();

		return created;
	}

	/**
	 * 通知先を更新する.
	 */
	@bindThis
	public async updateRecipient(
		params: {
			id: MiAbuseReportNotificationRecipient['id'];
			isActive: MiAbuseReportNotificationRecipient['isActive'];
			name: MiAbuseReportNotificationRecipient['name'];
			method: MiAbuseReportNotificationRecipient['method'];
			userId: MiAbuseReportNotificationRecipient['userId'];
			systemWebhookId: MiAbuseReportNotificationRecipient['systemWebhookId'];
		},
		updater: MiUser,
	): Promise<MiAbuseReportNotificationRecipient> {
		const beforeEntity = await this.abuseReportNotificationRecipientRepository.findOneByOrFail({ id: params.id });

		await this.abuseReportNotificationRecipientRepository.update(params.id, {
			isActive: params.isActive,
			updatedAt: new Date(),
			name: params.name,
			method: params.method,
			userId: params.userId,
			systemWebhookId: params.systemWebhookId,
		});

		const afterEntity = await this.abuseReportNotificationRecipientRepository.findOneByOrFail({ id: params.id });

		this.moderationLogService
			.log(updater, 'updateAbuseReportNotificationRecipient', {
				recipientId: params.id,
				before: beforeEntity,
				after: afterEntity,
			})
			.then();

		return afterEntity;
	}

	/**
	 * 通知先を削除する.
	 */
	@bindThis
	public async deleteRecipient(
		id: MiAbuseReportNotificationRecipient['id'],
		updater: MiUser,
	) {
		const entity = await this.abuseReportNotificationRecipientRepository.findBy({ id });

		await this.abuseReportNotificationRecipientRepository.delete(id);

		this.moderationLogService
			.log(updater, 'deleteAbuseReportNotificationRecipient', {
				recipientId: id,
				recipient: entity,
			})
			.then();
	}

	/**
	 * モデレータ権限を持たない(*1)通知先ユーザを削除する.
	 *
	 * *1: 以下の両方を満たすものの事を言う
	 * - 通知先にユーザIDが設定されている
	 * - 付与ロールにモデレータ権限がない or アサインの有効期限が切れている
	 *
	 * @param recipients 通知先一覧の配列
	 * @returns {@lisk recipients}からモデレータ権限を持たない通知先を削除した配列
	 */
	@bindThis
	private async removeUnauthorizedRecipientUsers(recipients: MiAbuseReportNotificationRecipient[]): Promise<MiAbuseReportNotificationRecipient[]> {
		const userRecipients = recipients.filter(it => it.userId !== null);
		const recipientUserIds = new Set(userRecipients.map(it => it.userId).filter(x => x != null));
		if (recipientUserIds.size <= 0) {
			// ユーザが通知先として設定されていない場合、この関数での処理を行うべきレコードが無い
			return recipients;
		}

		// モデレータ権限の有無で通知先設定を振り分ける
		const authorizedUserIds = await this.roleService.getModeratorIds(true, true);
		const authorizedUserRecipients = Array.of<MiAbuseReportNotificationRecipient>();
		const unauthorizedUserRecipients = Array.of<MiAbuseReportNotificationRecipient>();
		for (const recipient of userRecipients) {
			// eslint-disable-next-line
			if (authorizedUserIds.includes(recipient.userId!)) {
				authorizedUserRecipients.push(recipient);
			} else {
				unauthorizedUserRecipients.push(recipient);
			}
		}

		// モデレータ権限を持たない通知先をDBから削除する
		if (unauthorizedUserRecipients.length > 0) {
			await this.abuseReportNotificationRecipientRepository.delete(unauthorizedUserRecipients.map(it => it.id));
		}
		const nonUserRecipients = recipients.filter(it => it.userId === null);
		return [...nonUserRecipients, ...authorizedUserRecipients].sort((a, b) => a.id.localeCompare(b.id));
	}

	@bindThis
	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);
		if (obj.channel !== 'internal') {
			return;
		}

		const { type } = obj.message as GlobalEvents['internal']['payload'];
		switch (type) {
			case 'roleUpdated':
			case 'roleDeleted':
			case 'userRoleUnassigned': {
				// 場合によってはキャッシュ更新よりも先にここが呼ばれてしまう可能性があるのでnextTickで遅延実行
				process.nextTick(async () => {
					const recipients = await this.abuseReportNotificationRecipientRepository.findBy({
						userId: Not(IsNull()),
					});
					await this.removeUnauthorizedRecipientUsers(recipients);
				});
				break;
			}
			default: {
				break;
			}
		}
	}

	@bindThis
	public dispose(): void {
		this.redisForSub.off('message', this.onMessage);
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
