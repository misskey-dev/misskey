/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiChannel } from './Channel.js';
import { MiUser } from './User.js';
import { id } from './util/id.js';

@Entity('channel_favorite')
@Index(['userId', 'channelId'], { unique: true })
export class MiChannelFavorite {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
	})
	public channelId: MiChannel['id'];

	@ManyToOne(() => MiChannel, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public channel: MiChannel | null;

	@Index()
	@Column({
		...id(),
	})
	public userId: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;
}
