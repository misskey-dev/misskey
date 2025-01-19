/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { Serialized } from '@/types.js';
import { id } from './util/id.js';

export const systemWebhookEventTypes = [
	// ユーザからの通報を受けたとき
	'abuseReport',
	// 通報を処理したとき
	'abuseReportResolved',
	// ユーザが作成された時
	'userCreated',
	// モデレータが一定期間不在である警告
	'inactiveModeratorsWarning',
	// モデレータが一定期間不在のためシステムにより招待制へと変更された
	'inactiveModeratorsInvitationOnlyChanged',
] as const;
export type SystemWebhookEventType = typeof systemWebhookEventTypes[number];

@Entity('system_webhook')
export class MiSystemWebhook {
	@PrimaryColumn(id())
	public id: string;

	/**
	 * 有効かどうか.
	 */
	@Index('IDX_system_webhook_isActive', { synchronize: false })
	@Column('boolean', {
		default: true,
	})
	public isActive: boolean;

	/**
	 * 更新日時.
	 */
	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
	})
	public updatedAt: Date;

	/**
	 * 最後に送信された日時.
	 */
	@Column('timestamp with time zone', {
		nullable: true,
	})
	public latestSentAt: Date | null;

	/**
	 * 最後に送信されたステータスコード
	 */
	@Column('integer', {
		nullable: true,
	})
	public latestStatus: number | null;

	/**
	 * 通知設定名.
	 */
	@Column('varchar', {
		length: 255,
	})
	public name: string;

	/**
	 * イベント種別.
	 */
	@Index('IDX_system_webhook_on', { synchronize: false })
	@Column('varchar', {
		length: 128,
		array: true,
		default: '{}',
	})
	public on: SystemWebhookEventType[];

	/**
	 * Webhook送信先のURL.
	 */
	@Column('varchar', {
		length: 1024,
	})
	public url: string;

	/**
	 * Webhook検証用の値.
	 */
	@Column('varchar', {
		length: 1024,
	})
	public secret: string;

	static deserialize(obj: Serialized<MiSystemWebhook>): MiSystemWebhook {
		return {
			...obj,
			updatedAt: new Date(obj.updatedAt),
			latestSentAt: obj.latestSentAt ? new Date(obj.latestSentAt) : null,
		};
	}
}
