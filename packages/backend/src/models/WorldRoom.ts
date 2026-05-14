/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, JoinColumn, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

export const worldRoomVisibility = ['public', 'private'] as const;
export type WorldRoomVisibility = typeof worldRoomVisibility[number];

@Entity('world_room')
export class MiWorldRoom {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
	})
	public updatedAt: Date;

	@Column('varchar', {
		length: 256,
	})
	public name: string;

	@Column('varchar', {
		length: 1024,
	})
	public description: string;

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

	@Column('integer', {
		default: 0,
	})
	public likedCount: number;

	@Column('varchar', {
		length: 128, default: 'public',
	})
	public visibility: WorldRoomVisibility;

	@Column('jsonb', {
		default: {},
	})
	public def: Record<string, any>;

	constructor(data: Partial<MiWorldRoom>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
