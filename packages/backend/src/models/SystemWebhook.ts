/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Serialized } from '@/types.js';
import { id } from './util/id.js';

export const systemWebhookEventTypes = [
	// ユーザからの通報を受けたとき
	'abuseReport',
] as const;
export type SystemWebhookEventType = typeof systemWebhookEventTypes[number];

@Entity('system_webhook')
export class MiSystemWebhook {
	@PrimaryColumn(id())
	public id: string;

	/**
	 * 有効かどうか.
	 */
	@Column('boolean', {
		default: true,
	})
	public isActive: boolean;

	/**
	 * 更新日時.
	 */
	@Column('timestamp with time zone', {})
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
