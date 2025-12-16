/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from './User.js';
import { id } from './util/id.js';

@Entity('blocking')
@Index(['blockerId', 'blockeeId'], { unique: true })
export class MiBlocking {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'The blockee user ID.',
	})
	public blockeeId: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public blockee: MiUser | null;

	@Index()
	@Column({
		...id(),
		comment: 'The blocker user ID.',
	})
	public blockerId: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public blocker: MiUser | null;
}
