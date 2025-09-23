/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, Column, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('chat_secret_settings')
@Unique(['user1Id', 'user2Id'])
export class MiChatSecretSettings {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		name: 'user1Id',
	})
	public user1Id: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'user1Id' })
	public user1: MiUser | null;

	@Index()
	@Column({
		...id(),
		name: 'user2Id',
	})
	public user2Id: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'user2Id' })
	public user2: MiUser | null;

	@Column('boolean', {
		default: false,
	})
	public isSecretMessageMode: boolean;
}

