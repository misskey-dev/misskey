/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiSystemWebhook } from '@/models/SystemWebhook.js';
import { MiUserProfile } from '@/models/UserProfile.js';
import { id } from './util/id.js';
import { MiUser } from './User.js';

/**
 * 通報受信時に通知を送信する方法.
 */
export type RecipientMethod = 'email' | 'webhook';

@Entity('abuse_report_notification_recipient')
export class MiAbuseReportNotificationRecipient {
	@PrimaryColumn(id())
	public id: string;

	/**
	 * 有効かどうか.
	 */
	@Index()
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
	 * 通知設定名.
	 */
	@Column('varchar', {
		length: 255,
	})
	public name: string;

	/**
	 * 通知方法.
	 */
	@Index()
	@Column('varchar', {
		length: 64,
	})
	public method: RecipientMethod;

	/**
	 * 通知先のユーザID.
	 */
	@Index()
	@Column({
		...id(),
		nullable: true,
	})
	public userId: MiUser['id'] | null;

	/**
	 * 通知先のユーザ.
	 */
	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'userId', referencedColumnName: 'id', foreignKeyConstraintName: 'FK_abuse_report_notification_recipient_userId1' })
	public user: MiUser | null;

	/**
	 * 通知先のユーザプロフィール.
	 */
	@ManyToOne(type => MiUserProfile, {})
	@JoinColumn({ name: 'userId', referencedColumnName: 'userId', foreignKeyConstraintName: 'FK_abuse_report_notification_recipient_userId2' })
	public userProfile: MiUserProfile | null;

	/**
	 * 通知先のシステムWebhookId.
	 */
	@Index()
	@Column({
		...id(),
		nullable: true,
	})
	public systemWebhookId: string | null;

	/**
	 * 通知先のシステムWebhook.
	 */
	@ManyToOne(type => MiSystemWebhook, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public systemWebhook: MiSystemWebhook | null;
}
