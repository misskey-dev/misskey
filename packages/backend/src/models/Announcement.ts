/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('announcement')
export class MiAnnouncement {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the Announcement.',
		default: () => 'CURRENT_TIMESTAMP',
	})
	public createdAt: Date;

	@Column('timestamp with time zone', {
		comment: 'The updated date of the Announcement.',
		nullable: true,
	})
	public updatedAt: Date | null;

	@Column('varchar', {
		length: 8192, nullable: false,
	})
	public text: string;

	@Column('varchar', {
		length: 256, nullable: false,
	})
	public title: string;

	@Column('varchar', {
		length: 1024, nullable: true,
	})
	public imageUrl: string | null;

	// info, warning, error, success
	@Column('varchar', {
		length: 256, nullable: false,
		default: 'info',
	})
	public icon: 'info' | 'warning' | 'error' | 'success';

	// normal ... お知らせページ掲載
	// banner ... お知らせページ掲載 + バナー表示
	// dialog ... お知らせページ掲載 + ダイアログ表示
	@Column('varchar', {
		length: 256, nullable: false,
		default: 'normal',
	})
	public display: 'normal' | 'banner' | 'dialog';

	@Column('boolean', {
		default: false,
	})
	public needConfirmationToRead: boolean;

	@Column('boolean', {
		default: false,
	})
	public needEnrollmentTutorialToRead: boolean;

	@Column('integer', {
		nullable: false,
		default: 0,
	})
	public closeDuration: number;

	@Index()
	@Column('boolean', {
		default: true,
	})
	public isActive: boolean;

	// UIに表示する際の並び順用(大きいほど先頭)
	@Index()
	@Column('integer', {
		nullable: false,
		default: 0,
	})
	public displayOrder: number;

	@Index()
	@Column('boolean', {
		default: false,
	})
	public forExistingUsers: boolean;

	@Index()
	@Column('boolean', {
		default: false,
	})
	public silence: boolean;

	@Index()
	@Column({
		...id(),
		nullable: true,
	})
	public userId: MiUser['id'] | null;

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	constructor(data: Partial<MiAnnouncement>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
