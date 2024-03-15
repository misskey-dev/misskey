/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, PrimaryColumn, Column, Index, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('app')
export class MiApp {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'The owner ID.',
	})
	public userId: MiUser['id'] | null;

	@ManyToOne(type => MiUser, {
		onDelete: 'SET NULL',
		nullable: true,
	})
	public user: MiUser | null;

	@Index()
	@Column('varchar', {
		length: 64,
		comment: 'The secret key of the App.',
	})
	public secret: string;

	@Column('varchar', {
		length: 128,
		comment: 'The name of the App.',
	})
	public name: string;

	@Column('varchar', {
		length: 512,
		comment: 'The description of the App.',
	})
	public description: string;

	@Column('varchar', {
		length: 64, array: true,
		comment: 'The permission of the App.',
	})
	public permission: string[];

	@Column('varchar', {
		length: 512, nullable: true,
		comment: 'The callbackUrl of the App.',
	})
	public callbackUrl: string | null;
}
