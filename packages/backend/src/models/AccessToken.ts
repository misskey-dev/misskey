/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiApp } from './App.js';
import { MiUser } from './User.js';
import { id } from './util/id.js';

@Entity('access_token')
export class MiAccessToken {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		nullable: true,
	})
	public lastUsedAt: Date | null;

	@Index()
	@Column('varchar', {
		length: 128,
	})
	public token: string;

	@Index()
	@Column('varchar', {
		length: 128,
		nullable: true,
	})
	public session: string | null;

	@Index()
	@Column('varchar', {
		length: 128,
	})
	public hash: string;

	@Index()
	@Column(id())
	public userId: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column({
		...id(),
		nullable: true,
	})
	public appId: MiApp['id'] | null;

	@ManyToOne(() => MiApp, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public app: MiApp | null;

	@Column('varchar', {
		length: 128,
		nullable: true,
	})
	public name: string | null;

	@Column('varchar', {
		length: 512,
		nullable: true,
	})
	public description: string | null;

	@Column('varchar', {
		length: 512,
		nullable: true,
	})
	public iconUrl: string | null;

	@Column('varchar', {
		length: 64, array: true,
		default: '{}',
	})
	public permission: string[];

	@Column('boolean', {
		default: false,
	})
	public fetched: boolean;
}
