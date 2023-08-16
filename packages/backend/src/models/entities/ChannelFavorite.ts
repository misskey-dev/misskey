/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from '../id.js';
import { User } from './User.js';
import { Channel } from './Channel.js';

@Entity()
@Index(['userId', 'channelId'], { unique: true })
export class ChannelFavorite {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the ChannelFavorite.',
	})
	public createdAt: Date;

	@Index()
	@Column({
		...id(),
	})
	public channelId: Channel['id'];

	@ManyToOne(type => Channel, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public channel: Channel | null;

	@Index()
	@Column({
		...id(),
	})
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;
}
