/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, PrimaryColumn, Index, Column } from 'typeorm';
import { id } from '../id.js';
import type { User } from './User.js';

@Entity()
export class Hashtag {
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
	public mentionedUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0,
	})
	public mentionedUsersCount: number;

	@Column({
		...id(),
		array: true,
	})
	public mentionedLocalUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0,
	})
	public mentionedLocalUsersCount: number;

	@Column({
		...id(),
		array: true,
	})
	public mentionedRemoteUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0,
	})
	public mentionedRemoteUsersCount: number;

	@Column({
		...id(),
		array: true,
	})
	public attachedUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0,
	})
	public attachedUsersCount: number;

	@Column({
		...id(),
		array: true,
	})
	public attachedLocalUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0,
	})
	public attachedLocalUsersCount: number;

	@Column({
		...id(),
		array: true,
	})
	public attachedRemoteUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0,
	})
	public attachedRemoteUsersCount: number;
}
