/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from './User.js';
import { id } from './util/id.js';

export const flashVisibility = ['public', 'private'] as const;
export type FlashVisibility = typeof flashVisibility[number];

@Entity('flash')
export class MiFlash {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The updated date of the Flash.',
	})
	public updatedAt: Date;

	@Column('varchar', {
		length: 256,
	})
	public title: string;

	@Column('varchar', {
		length: 1024,
	})
	public summary: string;

	@Index()
	@Column({
		...id(),
		comment: 'The ID of author.',
	})
	public userId: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column('varchar', {
		length: 65536,
	})
	public script: string;

	@Column('varchar', {
		length: 256, array: true, default: '{}',
	})
	public permissions: string[];

	@Column('integer', {
		default: 0,
	})
	public likedCount: number;

	/**
	 * public ... 公開
	 * private ... プロフィールには表示しない
	 */
	@Column('varchar', {
		length: 512, default: 'public',
	})
	public visibility: FlashVisibility;
}
