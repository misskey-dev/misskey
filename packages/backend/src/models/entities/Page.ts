/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, JoinColumn, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { id } from '../id.js';
import { User } from './User.js';
import { DriveFile } from './DriveFile.js';

@Entity()
@Index(['userId', 'name'], { unique: true })
export class Page {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the Page.',
	})
	public createdAt: Date;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The updated date of the Page.',
	})
	public updatedAt: Date;

	@Column('varchar', {
		length: 256,
	})
	public title: string;

	@Index()
	@Column('varchar', {
		length: 256,
	})
	public name: string;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public summary: string | null;

	@Column('boolean')
	public alignCenter: boolean;

	@Column('boolean', {
		default: false,
	})
	public hideTitleWhenPinned: boolean;

	@Column('varchar', {
		length: 32,
	})
	public font: string;

	@Index()
	@Column({
		...id(),
		comment: 'The ID of author.',
	})
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

	@Column({
		...id(),
		nullable: true,
	})
	public eyeCatchingImageId: DriveFile['id'] | null;

	@ManyToOne(type => DriveFile, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public eyeCatchingImage: DriveFile | null;

	@Column('jsonb', {
		default: [],
	})
	public content: Record<string, any>[];

	@Column('jsonb', {
		default: [],
	})
	public variables: Record<string, any>[];

	@Column('varchar', {
		length: 16384,
		default: '',
	})
	public script: string;

	/**
	 * public ... 公開
	 * followers ... フォロワーのみ
	 * specified ... visibleUserIds で指定したユーザーのみ
	 */
	@Column('enum', { enum: ['public', 'followers', 'specified'] })
	public visibility: 'public' | 'followers' | 'specified';

	@Index()
	@Column({
		...id(),
		array: true, default: '{}',
	})
	public visibleUserIds: User['id'][];

	@Column('integer', {
		default: 0,
	})
	public likedCount: number;

	constructor(data: Partial<Page>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
