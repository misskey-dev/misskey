/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, PrimaryColumn, Index, Column } from 'typeorm';
import { id } from './util/id.js';
import type { MiUser } from './User.js';

@Entity('hashtag')
export class MiHashtag {
	@PrimaryColumn(id())
	public id: string;

	@Index({ unique: true })
	@Column('varchar', {
		length: 128,
	})
	public name: string;

	@Column({
		...id(),
		array: true,
	})
	public mentionedUserIds: MiUser['id'][];

	@Index()
	@Column('integer', {
		default: 0,
	})
	public mentionedUsersCount: number;

	@Column({
		...id(),
		array: true,
	})
	public mentionedLocalUserIds: MiUser['id'][];

	@Index()
	@Column('integer', {
		default: 0,
	})
	public mentionedLocalUsersCount: number;

	@Column({
		...id(),
		array: true,
	})
	public mentionedRemoteUserIds: MiUser['id'][];

	@Index()
	@Column('integer', {
		default: 0,
	})
	public mentionedRemoteUsersCount: number;

	@Column({
		...id(),
		array: true,
	})
	public attachedUserIds: MiUser['id'][];

	@Index()
	@Column('integer', {
		default: 0,
	})
	public attachedUsersCount: number;

	@Column({
		...id(),
		array: true,
	})
	public attachedLocalUserIds: MiUser['id'][];

	@Index()
	@Column('integer', {
		default: 0,
	})
	public attachedLocalUsersCount: number;

	@Column({
		...id(),
		array: true,
	})
	public attachedRemoteUserIds: MiUser['id'][];

	@Index()
	@Column('integer', {
		default: 0,
	})
	public attachedRemoteUsersCount: number;
}
