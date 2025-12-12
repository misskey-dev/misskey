/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiApp } from './App.js';
import { MiUser } from './User.js';
import { id } from './util/id.js';

@Entity('auth_session')
export class MiAuthSession {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('varchar', {
		length: 128,
	})
	public token: string;

	@Column({
		...id(),
		nullable: true,
	})
	public userId: MiUser['id'] | null;

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
		nullable: true,
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column(id())
	public appId: MiApp['id'];

	@ManyToOne(type => MiApp, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public app: MiApp | null;
}
