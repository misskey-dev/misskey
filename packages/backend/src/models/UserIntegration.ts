/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiOAuth2Server } from './OAuth2Server.js';

@Entity('user_integration')
@Index(['userId', 'serverId'], { unique: true })
export class MiUserIntegration {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		comment: 'The updated date of the OAuth2Client.',
	})
	public updatedAt: Date;

	@Index()
	@Column(id())
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Index()
	@Column(id())
	public serverId: MiOAuth2Server['id'];

	@ManyToOne(type => MiOAuth2Server, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public server: MiOAuth2Server | null;

	@Column('varchar', {
		length: 256,
	})
	public serverUserId?: string;
}
