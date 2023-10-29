/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, JoinColumn, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

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

	@ManyToOne(type => MiUser, {
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
	public visibility: 'public' | 'private';
}
