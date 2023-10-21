/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiChannel } from './Channel.js';

@Entity('channel_following')
@Index(['followerId', 'followeeId'], { unique: true })
export class MiChannelFollowing {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'The followee channel ID.',
	})
	public followeeId: MiChannel['id'];

	@ManyToOne(type => MiChannel, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public followee: MiChannel | null;

	@Index()
	@Column({
		...id(),
		comment: 'The follower user ID.',
	})
	public followerId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public follower: MiUser | null;
}
