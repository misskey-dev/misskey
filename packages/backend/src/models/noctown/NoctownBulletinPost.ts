/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownBulletinBoard } from './NoctownBulletinBoard.js';
import { NoctownPlayer } from './NoctownPlayer.js';
import { NoctownItem } from './NoctownItem.js';

@Entity('noctown_bulletin_post')
@Index(['boardId', 'createdAt'])
@Index(['playerId'])
export class NoctownBulletinPost {
	@PrimaryColumn(id())
	public id: string;

	@Column({
		...id(),
		comment: 'Bulletin board ID',
	})
	public boardId: NoctownBulletinBoard['id'];

	@ManyToOne(() => NoctownBulletinBoard, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public board: NoctownBulletinBoard | null;

	@Column({
		...id(),
		comment: 'Author player ID',
	})
	public playerId: NoctownPlayer['id'];

	@ManyToOne(() => NoctownPlayer, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public player: NoctownPlayer | null;

	@Column('text', {
		comment: 'Post content',
	})
	public content: string;

	@Column({
		...id(),
		nullable: true,
		comment: 'Attached item ID (optional)',
	})
	public attachedItemId: NoctownItem['id'] | null;

	@ManyToOne(() => NoctownItem, {
		onDelete: 'SET NULL',
		nullable: true,
	})
	@JoinColumn()
	public attachedItem: NoctownItem | null;

	@Column('integer', {
		default: 0,
		comment: 'Like count',
	})
	public likeCount: number;

	@Column('boolean', {
		default: false,
		comment: 'Is pinned',
	})
	public isPinned: boolean;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'Expires at (optional)',
	})
	public expiresAt: Date | null;
}
