/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('abuse_user_report')
export class MiAbuseUserReport {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column(id())
	public targetUserId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public targetUser: MiUser | null;

	@Index()
	@Column(id())
	public reporterId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public reporter: MiUser | null;

	@Column({
		...id(),
		nullable: true,
	})
	public assigneeId: MiUser['id'] | null;

	@ManyToOne(type => MiUser, {
		onDelete: 'SET NULL',
	})
	@JoinColumn()
	public assignee: MiUser | null;

	@Index()
	@Column('boolean', {
		default: false,
	})
	public resolved: boolean;

	/**
	 * リモートサーバーに転送したかどうか
	 */
	@Column('boolean', {
		default: false,
	})
	public forwarded: boolean;

	@Column('varchar', {
		length: 2048,
	})
	public comment: string;

	@Column('varchar', {
		length: 8192, default: '',
	})
	public moderationNote: string;

	/**
	 * accept 是認 ... 通報内容が正当であり、肯定的に対応された
	 * reject 否認 ... 通報内容が正当でなく、否定的に対応された
	 * null ... その他
	 */
	@Column('varchar', {
		length: 128, nullable: true,
	})
	public resolvedAs: 'accept' | 'reject' | null;

	//#region Denormalized fields
	@Index()
	@Column('varchar', {
		length: 128, nullable: true,
		comment: '[Denormalized]',
	})
	public targetUserHost: string | null;

	@Index()
	@Column('varchar', {
		length: 128, nullable: true,
		comment: '[Denormalized]',
	})
	public reporterHost: string | null;
	//#endregion
}
