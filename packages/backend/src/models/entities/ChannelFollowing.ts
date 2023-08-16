/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from '../id.js';
import { User } from './User.js';
import { Channel } from './Channel.js';

@Entity()
@Index(['followerId', 'followeeId'], { unique: true })
export class ChannelFollowing {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the ChannelFollowing.',
	})
	public createdAt: Date;

	@Index()
	@Column({
		...id(),
		comment: 'The followee channel ID.',
	})
	public followeeId: Channel['id'];

	@ManyToOne(type => Channel, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public followee: Channel | null;

	@Index()
	@Column({
		...id(),
		comment: 'The follower user ID.',
	})
	public followerId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public follower: User | null;
}
