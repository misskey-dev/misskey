/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, PrimaryColumn, Index, Column, ManyToOne, JoinColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiApp } from './App.js';

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
