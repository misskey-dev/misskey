/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

/**
 * Noqestion ミュートユーザーエンティティ
 * - 質問箱における個別のミュート設定
 * - Misskey標準のミュート機能とは別に管理
 */
@Entity('noq_muted_user')
@Index(['userId', 'mutedUserId'], { unique: true })
export class NoqMutedUser {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: '設定者ID',
	})
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Index()
	@Column({
		...id(),
		comment: 'ミュート対象ユーザーID',
	})
	public mutedUserId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public mutedUser: MiUser | null;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: '作成日時',
	})
	public createdAt: Date;

	constructor(data: Partial<NoqMutedUser>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
