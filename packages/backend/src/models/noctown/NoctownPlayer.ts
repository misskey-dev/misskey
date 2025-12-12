/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../util/id.js';
import { MiUser } from '../User.js';

@Entity('noctown_player')
export class NoctownPlayer {
	@PrimaryColumn(id())
	public id: string;

	@Index({ unique: true })
	@Column({
		...id(),
		comment: 'Misskey user reference',
	})
	public userId: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column('real', {
		default: 0,
		comment: 'X coordinate',
	})
	public positionX: number;

	@Column('real', {
		default: 0,
		comment: 'Y coordinate (altitude)',
	})
	public positionY: number;

	@Column('real', {
		default: 0,
		comment: 'Z coordinate',
	})
	public positionZ: number;

	@Column('real', {
		default: 0,
		comment: 'Rotation in radians',
	})
	public rotation: number;

	@Column({
		...id(),
		nullable: true,
		comment: 'Equipped skin item ID',
	})
	public equippedSkinId: string | null;

	@Column({
		...id(),
		nullable: true,
		comment: 'Equipped agent ID',
	})
	public equippedAgentId: string | null;

	@Column('boolean', {
		default: false,
		comment: 'Online status',
	})
	public isOnline: boolean;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Last active timestamp',
	})
	public lastActiveAt: Date;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;
}
