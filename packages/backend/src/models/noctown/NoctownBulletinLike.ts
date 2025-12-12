/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownBulletinPost } from './NoctownBulletinPost.js';
import { NoctownPlayer } from './NoctownPlayer.js';

@Entity('noctown_bulletin_like')
@Index(['postId'])
@Index(['playerId'])
@Unique(['postId', 'playerId'])
export class NoctownBulletinLike {
	@PrimaryColumn(id())
	public id: string;

	@Column({
		...id(),
		comment: 'Post ID',
	})
	public postId: NoctownBulletinPost['id'];

	@ManyToOne(() => NoctownBulletinPost, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public post: NoctownBulletinPost | null;

	@Column({
		...id(),
		comment: 'Player ID who liked',
	})
	public playerId: NoctownPlayer['id'];

	@ManyToOne(() => NoctownPlayer, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public player: NoctownPlayer | null;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Liked timestamp',
	})
	public createdAt: Date;
}
